"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import useCountries from '@/hooks/useCountries';

import CreateGroupModal from './CreateGroupModal';
import GroupSearch from './GroupSearch';
import PendingInvitations from './PendingInvitations';
import GroupList from './GroupList';

// Main container for the "Groups" feature.
export default function GroupsPage({ onViewGroup }) {
    const { mongoUser } = useAuth();
    const allCountries = useCountries();

    // State for user's groups and invitations.
    const [approvedGroups, setApprovedGroups] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);

    // State to control the UI.
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewMode, setViewMode] = useState('my_groups'); // Controls which view is shown: 'my_groups' or 'search'.

    // Fetches the user's groups and pending invitations from the server.
    // Wrapped in useCallback to prevent re-creation on every render.
    const fetchData = useCallback(() => {
        if (mongoUser) {
            setIsLoading(true);
            axios.get(`http://localhost:5000/api/groups/my-groups/${mongoUser._id}`)
                .then(res => {
                    setApprovedGroups(res.data.approvedGroups);
                    setPendingInvites(res.data.pendingInvites);
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));
        }
    }, [mongoUser]);

    // Triggers the initial data fetch when the component mounts.
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handles the user's response (accept/decline) to a group invitation.
    const handleInvitationResponse = async (groupId, response) => {
        try {
            await axios.post(`http://localhost:5000/api/groups/${groupId}/invitations/respond`, { userId: mongoUser._id, response });
            fetchData(); // Refreshes the lists after the action.
        } catch (error) {
            console.error("Failed to respond to invitation", error);
        }
    };


    return (
        <div>
            {/* The top navigation bar with buttons to toggle the view mode (groups/search) */}
            <nav className="bg-white border-bottom shadow-sm p-3 d-flex justify-content-between align-items-center">
                <div>
                    <button className={`btn me-2 ${viewMode === 'my_groups' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setViewMode('my_groups')}>My Groups</button>
                    <button className={`btn ${viewMode === 'search' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setViewMode('search')}>Find Groups</button>
                </div>
                <button className="btn btn-success" onClick={() => setIsCreateOpen(true)}>+ Create New Group</button>
            </nav>
            {/* Conditional rendering based on the viewMode state. */}
            <div className="p-4">
                {viewMode === 'my_groups'
                    &&
                    <>
                        {isLoading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                                <p className="mt-2">Loading your groups...</p>
                            </div>
                        ) : (
                            <>
                                <PendingInvitations invites={pendingInvites} onResponse={handleInvitationResponse} />
                                <h4 className="mb-4">My Groups</h4>
                                <GroupList groups={approvedGroups} onViewGroup={onViewGroup} allCountries={allCountries} />
                            </>
                        )}
                    </>}

                {viewMode === 'search'
                    &&
                    (<GroupSearch onViewGroup={onViewGroup} />)}
            </div>
            {/* The modal for creating a new group is rendered conditionally. */}
            {isCreateOpen && <CreateGroupModal onClose={() => setIsCreateOpen(false)} onGroupCreated={fetchData} />}
        </div>
    );
}