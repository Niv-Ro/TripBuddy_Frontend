"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

// 🔥 הסרנו את io מה-import ואת ENDPOINT. הרכיב כבר לא מנהל חיבור.

function ChatWindow({ chat, socket, onBack }) { // 🔥 קבלת ה-socket כ-prop
    const { mongoUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef(null);

    // טעינת היסטוריית ההודעות
    useEffect(() => {
        if (!chat?._id) return;
        setIsLoading(true);
        axios.get(`http://localhost:5000/api/messages/${chat._id}`)
            .then(res => setMessages(res.data))
            .catch(err => console.error("Failed to fetch messages", err))
            .finally(() => setIsLoading(false));
    }, [chat]);

    // ניהול הצטרפות לחדר והאזנה להודעות
    useEffect(() => {
        // ודא שה-socket והצ'אט קיימים לפני השימוש בהם
        if (!socket || !chat?._id) return;

        // הצטרפות לחדר של הצ'אט הספציפי
        socket.emit('join chat', chat._id);

        const handleNewMessage = (newMessageReceived) => {
            // המאזין הזה מטפל רק בעדכון ההודעות של הצ'אט הפתוח
            if (newMessageReceived.chat._id === chat._id) {
                setMessages(prevMessages => [...prevMessages, newMessageReceived]);
            }
        };

        socket.on('message received', handleNewMessage);

        // פונקציית ניקוי מסירה רק את המאזין של הרכיב הזה
        return () => {
            socket.off('message received', handleNewMessage);
        };
    }, [chat, socket]); // ה-useEffect תלוי כעת ב-socket שהועבר כ-prop

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !mongoUser || !socket) return;

        try {
            const messageData = {
                content: newMessage,
                chatId: chat._id,
                senderId: mongoUser._id,
            };
            setNewMessage("");

            const { data: savedMessage } = await axios.post('http://localhost:5000/api/messages', messageData);

            // השתמש ב-socket שהועבר כדי לשדר את ההודעה
            socket.emit('new message', savedMessage);
            setMessages(prev => [...prev, savedMessage]);
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

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
                <input type="text" className="form-control" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} autoComplete="off" />
                <button className="btn btn-primary ms-2" type="submit">Send</button>
            </form>
        </div>
    );
}

export default ChatWindow;