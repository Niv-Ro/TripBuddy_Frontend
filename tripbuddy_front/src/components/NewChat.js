"use client";
import React, { useState } from "react";
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import UserSearch from './UserSearch';

function NewChat({ onChatCreated }) {
    const { mongoUser } = useAuth();
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateChat = async () => {
        if (!selectedUser || !mongoUser) {
            alert("Please select a user and be logged in.");
            return;
        }
        setIsLoading(true);
        try {
            // 🔥 שינוי: שולחים גם את ה-ID שלנו וגם את ID המטרה
            const { data } = await axios.post('http://localhost:5000/api/chats', {
                currentUserId: mongoUser._id,
                targetUserId: selectedUser._id
            });
            onChatCreated(data);
        } catch (error) {
            console.error("Failed to create chat", error);
            alert("Error creating chat.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h4 className="mb-3">Start a New Conversation</h4>
            <UserSearch
                title="Search for a user to start a chat"
                onUserSelect={setSelectedUser}
            />
            {selectedUser && (
                <div className="alert alert-info my-3">
                    Selected user: <strong>{selectedUser.fullName}</strong>
                </div>
            )}
            <button
                className="btn btn-success mt-3"
                onClick={handleCreateChat}
                disabled={!selectedUser || isLoading}
            >
                {isLoading ? 'Starting...' : `Start Chat with ${selectedUser?.fullName || ''}`}
            </button>
        </div>
    );
}

export default NewChat;