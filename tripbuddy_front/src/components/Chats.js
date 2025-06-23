"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from 'axios';
import NewChat from './NewChat';
import ChatWindow from "./ChatWindow";
import io from 'socket.io-client';

const ENDPOINT = "http://localhost:5000";

function Chats() {
    const { mongoUser, loading } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [view, setView] = useState('list');
    const [isComponentLoading, setIsComponentLoading] = useState(true);
    const socketRef = useRef(null);

    const fetchChats = useCallback(() => {
        if (mongoUser) {
            setIsComponentLoading(true);
            // ✅ התיקון: הוספת הכתובת המלאה של השרת
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

    const getChatName = (chat) => {
        if (!mongoUser || !chat.members) return "Chat";
        if (chat.isGroupChat) return chat.name;
        const otherUser = chat.members.find(m => m.user?._id !== mongoUser._id);
        return otherUser?.user?.fullName || "Chat";
    };

    const handleChatCreated = (newChat) => {
        if (!conversations.some(c => c._id === newChat._id)) {
            setConversations(prev => [newChat, ...prev]);
        }
        setActiveChat(newChat);
        setView('chat');
    };

    const renderMainContent = () => {
        if (view === 'new') {
            return <NewChat onChatCreated={handleChatCreated} />;
        }
        if (view === 'chat' && activeChat) {
            return <ChatWindow
                chat={activeChat}
                socket={socketRef.current}
                onBack={() => { setView('list'); setActiveChat(null); }}
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
                    <button className="btn btn-primary btn-sm" onClick={() => { setView('new'); setActiveChat(null); }}>+ New Chat</button>
                </div>
                <div className="flex-grow-1 overflow-auto">
                    {isComponentLoading ? <p className="p-3 text-muted">Loading chats...</p> : (
                        <div className="list-group list-group-flush">
                            {conversations.map(chat => (
                                <button key={chat._id} type="button"
                                        className={`list-group-item list-group-item-action text-start p-3 ${activeChat?._id === chat._id ? 'active' : ''}`}
                                        onClick={() => { setActiveChat(chat); setView('chat'); }}>
                                    <h6 className="mb-1 text-truncate">{getChatName(chat)}</h6>
                                    {chat.latestMessage ?
                                        <small className="text-muted text-truncate d-block">{chat.latestMessage.content}</small>
                                        : <small className="text-muted fst-italic">No messages yet</small>
                                    }
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <main className="flex-grow-1 bg-light">
                {renderMainContent()}
            </main>
        </div>
    );
}

export default Chats;