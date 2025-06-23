"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from 'axios';
import io from 'socket.io-client';

import ChatSidebar from '../chat/ChatSidebar';
import NewChat from '../chat/NewChat';
import ChatWindow from "../chat/ChatWindow";
import ChatSearch from '../chat/ChatSearch';

const ENDPOINT = "http://localhost:5000";

export default function ChatPage() {
    const { mongoUser, loading } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [view, setView] = useState('list'); // 'list', 'new', 'chat', 'browse'
    const [isComponentLoading, setIsComponentLoading] = useState(true);
    const [isDeletingId, setIsDeletingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const socketRef = useRef(null);

    const fetchChats = useCallback(() => {
        if (mongoUser) {
            setIsComponentLoading(true);
            axios.get(`http://localhost:5000/api/chats/my-chats/${mongoUser._id}`)
                .then(res => {
                    const sortedChats = res.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    setConversations(sortedChats);
                })
                .catch(err => console.error("Failed to fetch conversations", err))
                .finally(() => setIsComponentLoading(false));
        }
    }, [mongoUser]);

    useEffect(() => {
        if (!loading && mongoUser) {
            fetchChats();
        }
    }, [loading, mongoUser, fetchChats]);

    useEffect(() => {
        if (!mongoUser) return;
        if (!socketRef.current) {
            socketRef.current = io(ENDPOINT);
            socketRef.current.emit('setup', mongoUser._id);
        }
        const socket = socketRef.current;
        const handleUpdateList = (newMessageReceived) => {
            setConversations(prev => {
                const chatExists = prev.some(c => c._id === newMessageReceived.chat._id);
                if (!chatExists) {
                    fetchChats();
                    return prev;
                }
                const updatedConversations = prev.map(convo =>
                    convo._id === newMessageReceived.chat._id
                        ? { ...convo, latestMessage: newMessageReceived, updatedAt: newMessageReceived.updatedAt }
                        : convo
                );
                return updatedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            });
        };
        socket.on('update conversation list', handleUpdateList);
        return () => {
            socket.off('update conversation list', handleUpdateList);
        };
    }, [mongoUser, fetchChats]);

    const getOtherUser = useCallback((chat) => {
        if (!mongoUser || !chat.members) return null;
        return chat.members.find(m => m.user?._id !== mongoUser._id)?.user;
    }, [mongoUser]);

    const getChatName = useCallback((chat) => {
        if (chat.isGroupChat) return chat.name;
        const otherUser = getOtherUser(chat);
        return otherUser?.fullName || "Chat";
    }, [getOtherUser]);

    const handleChatCreated = (newChat) => {
        if (!conversations.some(c => c._id === newChat._id)) {
            setConversations(prev => [newChat, ...prev]);
        }
        setActiveChat(newChat);
        setView('chat');
    };

    const handleDeleteChat = async (chatId, chatName) => {
        if (!mongoUser || !window.confirm(`Are you sure you want to delete your chat with "${chatName}"?`)) return;
        setIsDeletingId(chatId);
        try {
            await axios.delete(`http://localhost:5000/api/chats/${chatId}`, { data: { userId: mongoUser._id } });
            setConversations(prev => prev.filter(chat => chat._id !== chatId));
            if (activeChat?._id === chatId) {
                setActiveChat(null);
                setView('list');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete chat.');
        } finally {
            setIsDeletingId(null);
        }
    };

    const canDeleteChat = (chat) => !chat.isGroupChat;

    const displayConversations = useMemo(() => {
        const filtered = searchTerm
            ? conversations.filter(chat => getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase()))
            : conversations;

        return filtered.map(chat => {
            const otherUser = !chat.isGroupChat ? getOtherUser(chat) : null;
            return {
                id: chat._id,
                displayName: getChatName(chat),
                displayImageUrl: otherUser?.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg',
                latestMessageText: chat.latestMessage
                    ? `${chat.latestMessage.sender?.fullName}: ${chat.latestMessage.content}`
                    : "No messages yet",
                isGroupChat: chat.isGroupChat,
                canDelete: canDeleteChat(chat),
                originalChat: chat
            };
        });
    }, [conversations, searchTerm, getChatName, getOtherUser]);

    const handleChatUpdate = (updatedChat) => {
        setConversations(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
        setActiveChat(updatedChat);
    };

    const handleBrowseChatSelect = (selectedChat) => {
        const existingChat = conversations.find(c => c._id === selectedChat._id);
        if (existingChat) {
            setActiveChat(existingChat);
        } else {
            setConversations(prev => [selectedChat, ...prev]);
            setActiveChat(selectedChat);
        }
        setView('chat');
    };

    const renderMainContent = () => {
        switch (view) {
            case 'new':
                return <NewChat onChatCreated={handleChatCreated} />;
            case 'browse':
                return <ChatSearch onChatSelect={handleBrowseChatSelect} onBack={() => { setView('list'); fetchChats(); }} myChats={conversations} />;
            case 'chat':
                if (activeChat) {
                    return <ChatWindow chat={activeChat} socket={socketRef.current} onBack={() => { setView('list'); setActiveChat(null); }} onChatUpdate={handleChatUpdate} />;
                }
            // Fall-through to default for the placeholder
            default:
                return (
                    <div className="p-5 text-center text-muted d-flex align-items-center justify-content-center h-100">
                        Select a conversation or start a new one.
                    </div>
                );
        }
    };

    if (loading) return <p className="p-5 text-center">Authenticating...</p>;

    return (
        <div className="d-flex" style={{ height: '100vh' }}>
            <ChatSidebar
                isLoading={isComponentLoading}
                conversations={displayConversations}
                activeChatId={activeChat?._id}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onNewChat={() => { setView('new'); setActiveChat(null); }}
                onFindChats={() => { setView('browse'); setActiveChat(null); }}
                onSelectChat={(chat) => { setActiveChat(chat); setView('chat'); }}
                onDeleteChat={handleDeleteChat}
                isDeletingId={isDeletingId}
            />

            <main className="flex-grow-1 bg-light">
                {renderMainContent()}
            </main>

            <style jsx>{`
                .chat-avatar {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    object-fit: cover;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
            `}</style>
        </div>
    );
}