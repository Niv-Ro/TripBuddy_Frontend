"use client";
import React, { useState } from "react";
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import UserSearch from '../groups/UserSearch';

//onChatCreated - callback function that receives the newly created chat and typically switches the view to that chat
function NewChat({ onChatCreated }) {
    const { mongoUser } = useAuth();
    const [selectedUsers, setSelectedUsers] = useState([]); // array of users selected to include in the chat
    const [isLoading, setIsLoading] = useState(false);
    const [groupName, setGroupName] = useState('');

    //select users to add section
    const handleUserSelect = (user) => {
        // prevent re adding user to the list
        if (!selectedUsers.some(u => u._id === user._id)) {
            setSelectedUsers(prev => [...prev, user]);
        }
    };

    // remove user from adding list
    const handleRemoveUser = (userId) => {
        setSelectedUsers(prev => prev.filter(u => u._id !== userId));
    };

    //Main Chat Creation Logic
    const handleCreateChat = async () => {
        if (!mongoUser) return;
        setIsLoading(true);

        try {
            //if only one user has been selected - 1 on 1 chat
            //api call to add new 1 on 1 chat
            if (selectedUsers.length === 1) {
                const { data } = await axios.post('http://localhost:5000/api/chats', {
                    currentUserId: mongoUser._id,
                    targetUserId: selectedUsers[0]._id
                });
                onChatCreated(data);
            } else {
                // if more users has been selected - group chat
                //must provide a name for group chats "!groupName.trim()"
                if (!groupName.trim()) {
                    alert("Please provide a name for the group chat.");
                    setIsLoading(false);
                    return;
                }
                //Extracts member IDs from selected users to add
                //Sets current user as admin
                //api call to add new group chat
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
            {/* if the is more than one user selected show the group name input label */}
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
            {/* presenting the selected user list */}
            {selectedUsers.length > 0 && (
                <div className="mb-3">
                    <p>Selected:</p>
                    <div className="d-flex flex-wrap gap-2">
                        {/*present each selected user it's name and "x" to remove from list*/}
                        {selectedUsers.map(user => (
                            <span key={user._id} className="badge bg-primary d-flex align-items-center">
                                {user.fullName}
                                <button type="button" className="btn-close btn-close-white ms-2" onClick={() => handleRemoveUser(user._id)}></button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* user search section */}
            <UserSearch
                title="Search for users to chat with"
                onUserSelect={handleUserSelect}
                existingMemberIds={selectedUsers.map(u => u._id)}
                displayMode="list"
            />

            {/*stat chat button */}
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