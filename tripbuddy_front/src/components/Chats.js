"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from 'axios';
import NewChat from './NewChat';
import ChatWindow from "./ChatWindow";
import io from 'socket.io-client';

const ENDPOINT = "http://localhost:5000";

function Chats() {
    // --- State Management ---
    const { mongoUser, loading } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [view, setView] = useState('list'); // 'list', 'new', 'chat'
    const [isComponentLoading, setIsComponentLoading] = useState(true);
    const socketRef = useRef();

    // --- Data Fetching ---
    const fetchChats = useCallback(() => {
        if (mongoUser) {
            setIsComponentLoading(true);
            axios.get(`http://localhost:5000/api/chats/my-chats/${mongoUser._id}`)
                .then(res => {
                    // מיין את השיחות לפי העדכון האחרון שלהן
                    const sortedChats = res.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    setConversations(sortedChats);
                })
                .catch(err => console.error("Failed to fetch conversations", err))
                .finally(() => setIsComponentLoading(false));
        } else {
            setConversations([]);
            setIsComponentLoading(false);
        }
    }, [mongoUser]);

    // --- Effects ---

    // useEffect ראשון: אחראי לטעינת רשימת הצ'אטים הראשונית
    useEffect(() => {
        if (!loading) {
            fetchChats();
        }
    }, [mongoUser, loading, fetchChats]);

    // useEffect שני: אחראי על ניהול התקשורת בזמן אמת עם Socket.io
    useEffect(() => {
        if (!mongoUser) return;

        socketRef.current = io(ENDPOINT);
        const socket = socketRef.current;

        socket.emit('setup', mongoUser._id);

        const handleNewMessage = (newMessageReceived) => {
            const chatExists = conversations.some(c => c._id === newMessageReceived.chat._id);
            if (!chatExists) {
                // אם מתקבלת הודעה מצ'אט חדש, טען מחדש את כל הרשימה
                fetchChats();
            } else {
                // אם הצ'אט קיים, עדכן אותו ברשימה והקפץ אותו למעלה
                setConversations(prev => {
                    const updatedConversations = prev.map(convo =>
                        convo._id === newMessageReceived.chat._id
                            ? { ...convo, latestMessage: newMessageReceived, updatedAt: newMessageReceived.updatedAt }
                            : convo
                    );
                    return updatedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                });
            }
        };

        socket.on('message received', handleNewMessage);

        return () => {
            socket.off('message received', handleNewMessage);
            socket.disconnect();
        };
    }, [mongoUser, conversations, fetchChats]);

    // --- Helper Functions & Render Logic ---

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
                socket={socketRef.current} // הוסף את השורה הזו
                onBack={() => { setView('list'); setActiveChat(null); }}
            />;
        }
        return <div className="p-5 text-center text-muted">Select a conversation or create a new one.</div>;
    };

    if (loading) {
        return <p className="p-5 text-center">Authenticating...</p>
    }

    return (
        <div className="d-flex" style={{ height: 'calc(100vh - 60px)' }}>
            <aside className="border-end d-flex flex-column" style={{ width: '350px', flexShrink: 0 }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Chats</h4>
                    <button className="btn btn-primary btn-sm" onClick={() => { setView('new'); setActiveChat(null); }}>+ New Chat</button>
                </div>
                <div className="flex-grow-1 overflow-auto">
                    {isComponentLoading ? <p className="p-3">Loading...</p> : (
                        <div className="list-group list-group-flush">
                            {conversations.map(chat => (
                                <button key={chat._id} type="button"
                                        className={`list-group-item list-group-item-action text-start ${activeChat?._id === chat._id ? 'active' : ''}`}
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
            </aside>
            <main className="flex-grow-1 bg-light">
                {renderMainContent()}
            </main>
        </div>
    );
}

export default Chats;