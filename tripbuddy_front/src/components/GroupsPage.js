"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import CreateGroupModal from './CreateGroupModal';
import GroupSearch from './GroupSearch';
import useCountries from '@/hooks/useCountries';

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
                {viewMode === 'my_groups' && (
                    <>
                        {isLoading ? <p>Loading...</p> : (
                            <>
                                {pendingInvites.length > 0 && (
                                    <div className="mb-4">
                                        <h4>Pending Invitations</h4>
                                        {pendingInvites.map(group => (
                                            <div key={group._id} className="card mb-2">
                                                <div className="card-body d-flex justify-content-between align-items-center">
                                                    <span>You were invited to join <strong>{group.name}</strong> by {group.admin?.fullName}</span>
                                                    <div>
                                                        <button className="btn btn-success btn-sm me-2" onClick={() => handleInvitationResponse(group._id, 'accept')}>Accept</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleInvitationResponse(group._id, 'decline')}>Decline</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <h4>My Groups</h4>
                                <div className="list-group">
                                    {approvedGroups.length > 0 ? approvedGroups.map(group => {
                                        const groupCountries = (group.countries || []).map(code => allCountries.find(c => c.code3 === code)).filter(Boolean);
                                        return (
                                            <button key={group._id} type="button" className="list-group-item list-group-item-action" onClick={() => onViewGroup(group._id)}>
                                                <div className="d-flex w-100 justify-content-between">
                                                    <h5 className="mb-1">{group.name}</h5>
                                                    <small>{(group.members || []).length} members</small>
                                                </div>
                                                <p className="mb-1 text-muted">{group.description}</p>

                                                {/* ✅ הצגת שם מנהל הקבוצה */}
                                                <small className="text-muted d-block mb-2">Admin: <strong>{group.admin?.fullName || 'N/A'}</strong></small>

                                                {/* ✅ הצגת המדינות המתויגות */}
                                                {groupCountries.length > 0 && (
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {groupCountries.map(country => (
                                                            <span key={country.code} className="badge bg-light text-dark fw-normal border">
                                                                <img src={country.flag} alt={country.name} style={{ width: '16px', height: '12px', marginRight: '5px' }} />
                                                                {country.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    }) : <p>You are not a member of any group yet.</p>}
                                </div>
                            </>
                        )}
                    </>
                )}
                {viewMode === 'search' && (
                    <GroupSearch onViewGroup={onViewGroup} />
                )}
            </div>
            {isCreateOpen && <CreateGroupModal onClose={() => setIsCreateOpen(false)} onGroupCreated={fetchData} />}
        </div>
    );
}