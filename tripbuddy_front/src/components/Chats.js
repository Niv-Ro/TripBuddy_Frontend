"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from 'axios';
import NewChat from './NewChat';
import ChatWindow from "./ChatWindow";
import ChatSearch from './ChatSearch';
import io from 'socket.io-client';

const ENDPOINT = "http://localhost:5000";

function Chats() {
    const { mongoUser, loading } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [view, setView] = useState('list'); // 'list', 'new', 'chat', 'browse'
    const [isComponentLoading, setIsComponentLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(null);
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

    const getOtherUser = (chat) => {
        if (!mongoUser || !chat.members) return null;
        return chat.members.find(m => m.user?._id !== mongoUser._id)?.user;
    };

    const getChatName = (chat) => {
        if (chat.isGroupChat) return chat.name;
        const otherUser = getOtherUser(chat);
        return otherUser?.fullName || "Chat";
    };

    const handleChatCreated = (newChat) => {
        if (!conversations.some(c => c._id === newChat._id)) {
            setConversations(prev => [newChat, ...prev]);
        }
        setActiveChat(newChat);
        setView('chat');
    };

    const handleDeleteChat = async (chatId, chatName) => {
        if (!mongoUser || !window.confirm(`Are you sure you want to delete your chat with "${chatName}"?`)) return;
        setIsDeleting(chatId);
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
            setIsDeleting(null);
        }
    };

    const canDeleteChat = (chat) => !chat.isGroupChat;

    const filteredConversations = useMemo(() => {
        if (!searchTerm) return conversations;
        return conversations.filter(chat =>
            getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [conversations, searchTerm, mongoUser]);

    const handleChatUpdate = (updatedChat) => {
        setConversations(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
        setActiveChat(updatedChat);
    };

    const handleBrowseChatSelect = (selectedChat) => {
        // Check if this chat is already in user's conversations
        const existingChat = conversations.find(c => c._id === selectedChat._id);
        if (existingChat) {
            setActiveChat(existingChat);
        } else {
            // Add to conversations if it's a new chat the user joined
            setConversations(prev => [selectedChat, ...prev]);
            setActiveChat(selectedChat);
        }
        setView('chat');
    };

    const handleBackFromBrowse = () => {
        setView('list');
        // Refresh conversations in case user joined new chats
        fetchChats();
    };

    const renderMainContent = () => {
        if (view === 'new') {
            return <NewChat onChatCreated={handleChatCreated} />;
        }
        if (view === 'browse') {
            return (
                <ChatSearch
                    onChatSelect={handleBrowseChatSelect}
                    onBack={handleBackFromBrowse}
                    myChats={conversations}
                />
            );
        }
        if (view === 'chat' && activeChat) {
            return <ChatWindow
                chat={activeChat}
                socket={socketRef.current}
                onBack={() => { setView('list'); setActiveChat(null); }}
                onChatUpdate={handleChatUpdate}
            />;
        }
        return <div className="p-5 text-center text-muted d-flex align-items-center justify-content-center h-100">Select a conversation or start a new one.</div>;
    };

    if (loading) return <p className="p-5 text-center">Authenticating...</p>;

    return (
        <div className="d-flex" style={{ height: '100vh' }}>
            <div className="border-end d-flex flex-column bg-white" style={{ width: '350px', flexShrink: 0 }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Chats</h4>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => { setView('browse'); setActiveChat(null); }}
                            title="Find and join new chats"
                        >
                            <i className="bi bi-search me-1"></i>
                            Find Chats
                        </button>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => { setView('new'); setActiveChat(null); }}
                        >
                            + New
                        </button>
                    </div>
                </div>
                <div className="p-3 border-bottom">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-grow-1 overflow-auto">
                    {isComponentLoading ? <p className="p-3 text-muted">Loading...</p> : (
                        <>
                            {filteredConversations.length === 0 && !isComponentLoading ? (
                                <div className="p-4 text-center text-muted">
                                    {searchTerm ? (
                                        <div>
                                            <i className="bi bi-search display-6 d-block mb-2"></i>
                                            <p className="mb-2">No chats found</p>
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => { setView('browse'); setActiveChat(null); }}
                                            >
                                                Find Chats
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <i className="bi bi-chat-dots display-6 d-block mb-2"></i>
                                            <p className="mb-2">No chats yet</p>
                                            <div className="d-flex flex-column gap-2">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => { setView('new'); setActiveChat(null); }}
                                                >
                                                    Start New Chat
                                                </button>
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => { setView('browse'); setActiveChat(null); }}
                                                >
                                                    Find Chats
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {filteredConversations.map(chat => {
                                        const otherUser = !chat.isGroupChat ? getOtherUser(chat) : null;
                                        return (
                                            <div key={chat._id} className={`list-group-item p-0 ${activeChat?._id === chat._id ? 'active' : ''}`}>
                                                <div className="d-flex align-items-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-link text-start p-3 flex-grow-1 text-decoration-none border-0"
                                                        style={{ color: 'inherit' }}
                                                        onClick={() => { setActiveChat(chat); setView('chat'); }}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            {chat.isGroupChat ? (
                                                                <div className="chat-avatar bg-secondary text-white">👥</div>
                                                            ) : (
                                                                <img
                                                                    src={otherUser?.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                                                                    alt={otherUser?.fullName}
                                                                    className="chat-avatar"
                                                                />
                                                            )}
                                                            <div className="ms-3">
                                                                <h6 className="mb-1 text-truncate">{getChatName(chat)}</h6>
                                                                {chat.latestMessage ? (
                                                                    <small className="text-muted text-truncate d-block">
                                                                        {chat.latestMessage.sender?.fullName}: {chat.latestMessage.content}
                                                                    </small>
                                                                ) : (
                                                                    <small className="text-muted fst-italic">No messages yet</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                    {canDeleteChat(chat) && (
                                                        <button
                                                            className="btn btn-outline-danger btn-sm me-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteChat(chat._id, getChatName(chat));
                                                            }}
                                                            disabled={isDeleting === chat._id}
                                                            title="Delete chat"
                                                        >
                                                            {isDeleting === chat._id ? (
                                                                <span className="spinner-border spinner-border-sm"></span>
                                                            ) : (
                                                                <i>X</i>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
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

export default Chats;