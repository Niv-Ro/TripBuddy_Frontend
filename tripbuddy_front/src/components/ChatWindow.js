"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';

const ENDPOINT = "http://localhost:5000";

function ChatWindow({ chat, onBack }) {
    const { mongoUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    // Load message history
    useEffect(() => {
        if (!chat?._id) return;
        setIsLoading(true);
        axios.get(`http://localhost:5000/api/messages/${chat._id}`)
            .then(res => setMessages(res.data))
            .catch(err => console.error("Failed to fetch messages", err))
            .finally(() => setIsLoading(false));
    }, [chat]);

    // Socket connection management
    useEffect(() => {
        if (!mongoUser || !chat?._id) return;

        socketRef.current = io(ENDPOINT);
        const socket = socketRef.current;

        socket.emit('setup', mongoUser._id);
        socket.emit('join chat', chat._id);

        const handleNewMessage = (newMessageReceived) => {
            if (newMessageReceived.chat._id === chat._id) {
                setMessages(prevMessages => [...prevMessages, newMessageReceived]);
            }
        };

        socket.on('message received', handleNewMessage);

        // Important cleanup function
        return () => {
            if (socketRef.current) {
                socketRef.current.off('message received', handleNewMessage);
                socketRef.current.disconnect();
            }
        };
    }, [chat._id, mongoUser]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !mongoUser) return;

        const socket = socketRef.current;
        if (!socket) {
            console.error("Socket not connected");
            return;
        }

        try {
            const messageData = {
                content: newMessage,
                chatId: chat._id,
                senderId: mongoUser._id,
            };
            setNewMessage("");

            const { data: savedMessage } = await axios.post('http://localhost:5000/api/messages', messageData);

            socket.emit('new message', savedMessage);
            setMessages(prev => [...prev, savedMessage]);
        } catch (error) {
            console.error("Failed to send message", error);
            // Restore the message if sending failed
            setNewMessage(newMessage);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getChatName = (chat) => {
        if (!mongoUser || !chat?.members) return "Chat";
        if (chat.isGroupChat) return chat.name;
        const otherUser = chat.members.find(m => m.user?._id !== mongoUser._id);
        return otherUser?.user?.fullName || "Chat";
    };

    return (
        <div className="d-flex flex-column h-100">
            <div className="p-3 border-bottom d-flex align-items-center bg-white">
                <button className="btn btn-light me-3" onClick={onBack}>←</button>
                <h5 className="mb-0">{getChatName(chat)}</h5>
            </div>
            <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: '#f0f2f5' }}>
                {isLoading ? <p>Loading messages...</p> : messages.map(msg => (
                    <div key={msg._id} className={`d-flex mb-2 ${msg.sender?._id === mongoUser?._id ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div className={`p-2 rounded shadow-sm ${msg.sender?._id === mongoUser?._id ? 'bg-primary text-white' : 'bg-white'}`} style={{ maxWidth: '70%' }}>
                            {msg.sender?._id !== mongoUser?._id && <strong className="d-block small">{msg.sender.fullName}</strong>}
                            <div className="mb-0">{msg.content}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 border-top bg-white d-flex">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    autoComplete="off"
                />
                <button className="btn btn-primary ms-2" type="submit" disabled={!newMessage.trim()}>Send</button>
            </form>
        </div>
    );
}

export default ChatWindow;