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
    const socketRef = useRef();

    // Move fetchChats outside useEffect so it can be reused
    const fetchChats = useCallback(() => {
        if (mongoUser) {
            setIsComponentLoading(true);
            axios.get(`http://localhost:5000/api/chats/my-chats/${mongoUser._id}`)
                .then(res => {
                    setConversations(res.data);
                })
                .catch(err => console.error("Failed to fetch conversations", err))
                .finally(() => setIsComponentLoading(false));
        } else {
            setIsComponentLoading(false);
        }
    }, [mongoUser]);

    // Initial fetch of chats
    useEffect(() => {
        if (!loading) {
            fetchChats();
        }
    }, [loading, fetchChats]);

    // Socket setup
    useEffect(() => {
        if (!mongoUser) return;

        socketRef.current = io(ENDPOINT);
        const socket = socketRef.current;

        socket.emit('setup', mongoUser._id);

        const handleNewMessage = (newMessageReceived) => {
            // Check if the chat of the new message already exists in the list
            const chatExists = conversations.some(c => c._id === newMessageReceived.chat._id);
            if (!chatExists) {
                // If not, this is a new chat! Reload the list
                fetchChats();
            } else {
                // If the chat exists, update its latest message and sort order
                setConversations(prev => {
                    const updatedConversations = prev.map(convo => {
                        if (convo._id === newMessageReceived.chat._id) {
                            return {
                                ...convo,
                                latestMessage: newMessageReceived,
                                updatedAt: newMessageReceived.updatedAt
                            };
                        }
                        return convo;
                    });
                    // Sort again so the updated chat jumps to the top
                    return updatedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                });
            }
        };

        socket.on('message received', handleNewMessage);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('message received', handleNewMessage);
                socketRef.current.disconnect();
            }
        };
    }, [mongoUser, fetchChats]); // Remove conversations from dependencies to avoid infinite loops

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
            return <ChatWindow chat={activeChat} onBack={() => setActiveChat(null)} />;
        }
        return <div className="p-5 text-center text-muted">Select a conversation to start chatting.</div>;
    };

    if (loading) return <p className="p-5 text-center">Authenticating...</p>;

    return (
        <div className="d-flex" style={{ height: 'calc(100vh - 60px)' }}>
            <div className="border-end d-flex flex-column" style={{ width: '350px' }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Chats</h4>
                    <button className="btn btn-primary btn-sm" onClick={() => { setView('new'); setActiveChat(null); }}>+ New Chat</button>
                </div>
                <div className="flex-grow-1 overflow-auto">
                    {isComponentLoading ? <p className="p-3">Loading chats...</p> : (
                        <div className="list-group list-group-flush">
                            {conversations.map(chat => (
                                <button key={chat._id} type="button"
                                        className={`list-group-item list-group-item-action text-start ${activeChat?._id === chat._id ? 'active' : ''}`}
                                        onClick={() => { setActiveChat(chat); setView('chat'); }}>
                                    <div className="d-flex w-100 justify-content-between">
                                        <h6 className="mb-1">{getChatName(chat)}</h6>
                                    </div>
                                    <small className="text-muted">{chat.latestMessage?.content || 'No messages yet'}</small>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-grow-1 bg-light">
                {renderMainContent()}
            </div>
        </div>
    );
}

export default Chats;