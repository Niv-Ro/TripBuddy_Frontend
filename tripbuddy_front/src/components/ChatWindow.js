"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

// רכיב נפרד להצגת הודעה בודדת, כדי לנהל את הלוגיקה שלה
function MessageBubble({ msg, isOwnMessage, onEdit, onDelete }) {
    const [isHovered, setIsHovered] = useState(false);
    const canPerformActions = () => {
        if (!isOwnMessage) return false;
        const timeDiff = (new Date() - new Date(msg.createdAt)) / 60000; // הפרש בדקות
        return timeDiff <= 5;
    };

    return (
        <div
            className={`d-flex mb-2 ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`p-2 rounded shadow-sm position-relative ${isOwnMessage ? 'bg-primary text-white' : 'bg-white'}`} style={{ maxWidth: '70%' }}>
                {!isOwnMessage && <strong className="d-block small">{msg.sender.fullName}</strong>}
                <div className="mb-0">{msg.content}</div>

                {isHovered && canPerformActions() && (
                    <div className="dropdown position-absolute top-0 end-0 m-1">
                        <button className="btn btn-sm btn-light py-0 px-1 opacity-75" type="button" data-bs-toggle="dropdown">
                            ⋮
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li><button className="dropdown-item" onClick={() => onEdit(msg)}>Edit</button></li>
                            <li><button className="dropdown-item text-danger" onClick={() => onDelete(msg._id)}>Delete</button></li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

// רכיב נפרד למודאל העריכה
function EditMessageModal({ message, onSave, onCancel }) {
    const [text, setText] = useState(message.content);
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h5>Edit Message</h5>
                <textarea className="form-control" rows="3" value={text} onChange={e => setText(e.target.value)} />
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => onSave(message._id, text)}>Save</button>
                </div>
            </div>
        </div>
    );
}

function ChatWindow({ chat, socket, onBack }) {
    const { mongoUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingMessage, setEditingMessage] = useState(null); // State למודאל העריכה

    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!chat?._id) return;
        setIsLoading(true);
        axios.get(`http://localhost:5000/api/messages/${chat._id}`)
            .then(res => setMessages(res.data))
            .catch(err => console.error("Failed to fetch messages", err))
            .finally(() => setIsLoading(false));
    }, [chat]);

    useEffect(() => {
        if (!socket || !chat?._id) return;
        socket.emit('join chat', chat._id);
        const messageReceivedHandler = (newMessage) => {
            if (newMessage.chat?._id === chat._id) {
                setMessages(prev => [...prev, newMessage]);
            }
        };
        const messageUpdatedHandler = (updatedMessage) => {
            if (updatedMessage.chat?._id === chat._id) {
                setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
            }
        };
        const messageDeletedHandler = (deletedMessage) => {
            if (deletedMessage.chatId === chat._id) {
                setMessages(prev => prev.filter(m => m._id !== deletedMessage.messageId));
            }
        };
        socket.on('message received', messageReceivedHandler);
        socket.on('message updated', messageUpdatedHandler);
        socket.on('message deleted', messageDeletedHandler);
        return () => {
            socket.off('message received', messageReceivedHandler);
            socket.off('message updated', messageUpdatedHandler);
            socket.off('message deleted', messageDeletedHandler);
        };
    }, [chat?._id, socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, searchTerm]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !mongoUser || !socket) return;
        const tempId = Date.now().toString();
        const optimisticMessage = { _id: tempId, sender: { _id: mongoUser._id, fullName: mongoUser.fullName }, content: newMessage, chat: { _id: chat._id }};
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage("");
        try {
            const { data: savedMessage } = await axios.post('http://localhost:5000/api/messages', { content: newMessage, chatId: chat._id, senderId: mongoUser._id });
            socket.emit('new message', savedMessage);
            setMessages(prev => prev.map(msg => msg._id === tempId ? savedMessage : msg));
        } catch (error) {
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
        }
    };

    const handleUpdateMessage = async (messageId, newContent) => {
        try {
            const { data: updatedMessage } = await axios.put(`http://localhost:5000/api/messages/${messageId}`, { content: newContent, userId: mongoUser._id });
            socket.emit('update message', updatedMessage);
            setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
            setEditingMessage(null);
        } catch(error) {
            alert(error.response?.data?.message || "Failed to edit message.");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`http://localhost:5000/api/messages/${messageId}`, { data: { userId: mongoUser._id } });
            socket.emit('delete message', { messageId, chatId: chat._id });
            setMessages(prev => prev.filter(m => m._id !== messageId));
        } catch(error) {
            alert(error.response?.data?.message || "Failed to delete message.");
        }
    };

    const getChatName = (chat) => { /* ... ללא שינוי ... */ };

    const filteredMessages = useMemo(() => {
        if (!searchTerm) return messages;
        return messages.filter(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [messages, searchTerm]);

    return (
        <div className="d-flex flex-column h-100">
            <div className="p-3 border-bottom d-flex align-items-center bg-white gap-3">
                <button className="btn btn-light" onClick={onBack}>←</button>
                <h5 className="mb-0 me-auto">{getChatName(chat)}</h5>
                <input type="text" className="form-control form-control-sm w-50" placeholder="Search in conversation..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: '#f0f2f5' }}>
                {isLoading ? <p>Loading messages...</p> : filteredMessages.map(msg => (
                    <MessageBubble key={msg._id} msg={msg} isOwnMessage={msg.sender?._id === mongoUser?._id} onEdit={setEditingMessage} onDelete={handleDeleteMessage} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 border-top bg-white d-flex">
                <input type="text" className="form-control" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} autoComplete="off" />
                <button className="btn btn-primary ms-2" type="submit" disabled={!newMessage.trim()}>Send</button>
            </form>
            {editingMessage && <EditMessageModal message={editingMessage} onSave={handleUpdateMessage} onCancel={() => setEditingMessage(null)} />}
        </div>
    );
}

export default ChatWindow;