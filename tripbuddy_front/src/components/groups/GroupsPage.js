"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import useCountries from '@/hooks/useCountries';

import CreateGroupModal from './CreateGroupModal';
import GroupSearch from './GroupSearch';
import PendingInvitations from './PendingInvitations';
import GroupList from './GroupList';

export default function GroupsPage({ onViewGroup }) {
    const { mongoUser } = useAuth();
    const allCountries = useCountries();
    const [approvedGroups, setApprovedGroups] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewMode, setViewMode] = useState('my_groups');

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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInvitationResponse = async (groupId, response) => {
        try {
            await axios.post(`http://localhost:5000/api/groups/${groupId}/invitations/respond`, { userId: mongoUser._id, response });
            fetchData();
        } catch (error) {
            console.error("Failed to respond to invitation", error);
        }
    };

    const renderMyGroupsView = () => (
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
        </>
    );

    return (
        <div>
            <nav className="bg-white border-bottom shadow-sm p-3 d-flex justify-content-between align-items-center">
                <div>
                    <button className={`btn me-2 ${viewMode === 'my_groups' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setViewMode('my_groups')}>My Groups</button>
                    <button className={`btn ${viewMode === 'search' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setViewMode('search')}>Find Groups</button>
                </div>
                <button className="btn btn-success" onClick={() => setIsCreateOpen(true)}>+ Create New Group</button>
            </nav>
            <div className="p-4">
                {viewMode === 'my_groups' && renderMyGroupsView()}
                {viewMode === 'search' && (<GroupSearch onViewGroup={onViewGroup} />)}
            </div>
            {isCreateOpen && <CreateGroupModal onClose={() => setIsCreateOpen(false)} onGroupCreated={fetchData} />}
        </div>
    );
}