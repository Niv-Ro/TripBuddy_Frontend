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
    const [activeChat, setActiveChat] = useState(null); // currently selected chat to display
    const [view, setView] = useState('list'); //which screen to show: 'list', 'new', 'chat', 'browse'
    const [isComponentLoading, setIsComponentLoading] = useState(true);
    const [isDeletingId, setIsDeletingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const socketRef = useRef(null); //stores the real-time connection

    const fetchChats = useCallback(() => {
        if (mongoUser) {
            setIsComponentLoading(true);
            axios.get(`http://localhost:5000/api/chats/my-chats/${mongoUser._id}`)
                //res.data contains all chats from the server
                //when we sort we are taking each 2 chats and compare them
                //each chat will be turned from date into time stamp in order to subtract
                .then(res => {
                    const sortedChats = res.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    setConversations(sortedChats);
                })
                .catch(err => console.error("Failed to fetch conversations", err))
                .finally(() => setIsComponentLoading(false));
        }
    }, [mongoUser]);

    //Loads chats when component not loading and user is authenticated
    useEffect(() => {
        if (!loading && mongoUser) {
            fetchChats();
        }
    }, [loading, mongoUser, fetchChats]);

    useEffect(() => {
        if (!mongoUser) return;
        if (!socketRef.current) {
            socketRef.current = io(ENDPOINT); //Connects to server for real-time updates
            socketRef.current.emit('setup', mongoUser._id); //Tells server which user is online
        }
        const socket = socketRef.current;


        const handleUpdateList = (newMessageReceived) => {
            setConversations(prev => {
                // When someone sends a message if it's a new chat, fetches all chats
                //.some: Returns true if it finds a match, returns false if no match is found
                //Stops checking as soon as it finds the first match
                const chatExists = prev.some(c => c._id === newMessageReceived.chat._id);
                if (!chatExists) {
                    fetchChats();
                    return prev;
                }
                // If it's an existing chat, updates that chat's latest message
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

    //Gets the other person in a 1-on-1 chat
    const getOtherUser = useCallback((chat) => {
        if (!mongoUser || !chat.members) return null;
        return chat.members.find(m => m.user?._id !== mongoUser._id)?.user;
    }, [mongoUser]);

    //Return the correct name of the chat
    //if it's a group chat it will return the group chat name
    //if it's a 1 on 1 chat it will return the name of the other user.
    const getChatName = useCallback((chat) => {
        if (chat.isGroupChat) return chat.name;
        const otherUser = getOtherUser(chat);
        return otherUser?.fullName || "Chat";
    }, [getOtherUser]);

    // When new chat is created: adds it to the list
    const handleChatCreated = (newChat) => {
        //checks every chat id to see if already exists
        // if not exists add to the list
        if (!conversations.some(c => c._id === newChat._id)) {
            setConversations(prev => [newChat, ...prev]);
        }
        setActiveChat(newChat);
        setView('chat');
    };

    //
    const handleDeleteChat = async (chatId, chatName) => {
        if (!mongoUser || !window.confirm(`Are you sure you want to delete your chat with "${chatName}"?`)) return;
        setIsDeletingId(chatId);
        try {
            await axios.delete(`http://localhost:5000/api/chats/${chatId}`, { data: { userId: mongoUser._id } });
            // Removes chat from list
            setConversations(prev => prev.filter(chat => chat._id !== chatId));
            // If deleted chat was active (inside the chat screen), goes back to list view
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
    // Only allows deleting 1-on-1 chats, not group chats
    const canDeleteChat = (chat) => !chat.isGroupChat;

    const displayConversations = useMemo(() => {
        // Shows only chats matching search
        const filtered = searchTerm
            ? conversations.filter(chat => getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase()))
            : conversations;

        return filtered.map(chat => {
            //gets other users name when it is not group chat
            const otherUser = !chat.isGroupChat ? getOtherUser(chat) : null;
            return {
                id: chat._id,
                displayName: getChatName(chat),
                // Gets profile image, if user use its profile picture and if group use the url img
                displayImageUrl: otherUser?.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg',
                latestMessageText: chat.latestMessage
                    ? `${chat.latestMessage.sender?.fullName}: ${chat.latestMessage.content}`
                    : "No messages yet",
                isGroupChat: chat.isGroupChat,
                // Determines if chat can be deleted
                canDelete: canDeleteChat(chat),
                originalChat: chat
            };
        });
    }, [conversations, searchTerm, getChatName, getOtherUser]);

    // Updates a specific chat in the list and sets it as active
    const handleChatUpdate = (updatedChat) => {
        setConversations(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
        setActiveChat(updatedChat);
    };

    // When user selects a chat from browse/search
    const handleBrowseChatSelect = (selectedChat) => {
        const existingChat = conversations.find(c => c._id === selectedChat._id);
        // If chat already exists in list, just select it
        // If new chat, add it to list and select it
        if (existingChat) {
            setActiveChat(existingChat);
        } else {
            setConversations(prev => [selectedChat, ...prev]);
            setActiveChat(selectedChat);
        }
        setView('chat');
    };

    // Shows different components based on current view
    const renderMainContent = () => {
        switch (view) {
            //New chat creation interface
            case 'new':
                return <NewChat onChatCreated={handleChatCreated} />;
            // Search for existing chats/users
            // When user clicks "Back" in ChatSearch, Goes back to the main chat list view
            // Refreshes the chat list (in case anything changed)
            case 'browse':
                return <ChatSearch onChatSelect={handleBrowseChatSelect} onBack={() => { setView('list'); fetchChats(); }} myChats={conversations} />;
            // Active chat conversation window
            // When user clicks "Back" in ChatWindow, Goes back to the main chat list view
            // Clears the currently active chat
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

        </div>
    );
}