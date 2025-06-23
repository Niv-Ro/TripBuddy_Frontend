"use client";
import React, { useState } from "react";
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import UserSearch from '../groups/UserSearch';

function NewChat({ onChatCreated }) {
    const { mongoUser } = useAuth();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [groupName, setGroupName] = useState('');

    const handleUserSelect = (user) => {
        // מנע הוספה של משתמש שכבר קיים ברשימה
        if (!selectedUsers.some(u => u._id === user._id)) {
            setSelectedUsers(prev => [...prev, user]);
        }
    };

    const handleRemoveUser = (userId) => {
        setSelectedUsers(prev => prev.filter(u => u._id !== userId));
    };

    const handleCreateChat = async () => {
        if (!mongoUser) return;
        setIsLoading(true);

        try {
            if (selectedUsers.length === 1) {
                // יצירת צ'אט פרטי
                const { data } = await axios.post('http://localhost:5000/api/chats', {
                    currentUserId: mongoUser._id,
                    targetUserId: selectedUsers[0]._id
                });
                onChatCreated(data);
            } else {
                // יצירת צ'אט קבוצתי
                if (!groupName.trim()) {
                    alert("Please provide a name for the group chat.");
                    setIsLoading(false);
                    return;
                }
                const memberIds = selectedUsers.map(u => u._id);
                const { data } = await axios.post('http://localhost:5000/api/chats/group', {
                    name: groupName,
                    members: memberIds,
                    adminId: mongoUser._id
                });
                onChatCreated(data);
            }
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

            {/* אם נבחרו יותר ממשתמש אחד, הצג שדה לשם הקבוצה */}
            {selectedUsers.length > 1 && (
                <div className="mb-3">
                    <label className="form-label">Group Chat Name</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter a name for your group..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                </div>
            )}

            {/* הצגת המשתמשים שנבחרו */}
            {selectedUsers.length > 0 && (
                <div className="mb-3">
                    <p>Selected:</p>
                    <div className="d-flex flex-wrap gap-2">
                        {selectedUsers.map(user => (
                            <span key={user._id} className="badge bg-primary d-flex align-items-center">
                                {user.fullName}
                                <button type="button" className="btn-close btn-close-white ms-2" onClick={() => handleRemoveUser(user._id)}></button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <UserSearch
                title="Search for users to chat with"
                onUserSelect={handleUserSelect}
                existingMemberIds={selectedUsers.map(u => u._id)}
            />

            <button
                className="btn btn-success mt-3"
                onClick={handleCreateChat}
                disabled={selectedUsers.length === 0 || isLoading}
            >
                {isLoading ? 'Starting...' : (selectedUsers.length > 1 ? 'Create Group Chat' : 'Start Chat')}
            </button>
        </div>
    );
}

export default NewChat;