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

    const GroupCard = ({ group }) => {
        const groupCountries = (group.countries || []).map(code => allCountries.find(c => c.code3 === code)).filter(Boolean);

        return (
            <div className="col-lg-3 col-md-6 col-sm-12 mb-4">
                <div className="card h-100 shadow-sm hover-shadow" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => onViewGroup(group._id)}>
                    {/* Group Image */}
                    <div style={{ height: '200px', overflow: 'hidden' }}>
                        <img
                            src={group.imageUrl || '/default-group-image.jpg'}
                            alt={group.name}
                            className="card-img-top"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x200/e9ecef/6c757d?text=Group+Image';
                            }}
                        />
                    </div>

                    <div className="card-body d-flex flex-column">
                        {/* Group Header */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="card-title mb-0" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{group.name}</h5>
                            <div className="d-flex align-items-center gap-2">
                                <span className={`badge ${group.isPrivate ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: '0.75rem' }}>
                                    {group.isPrivate ? 'Private' : 'Public'}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="card-text text-muted mb-2" style={{
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {group.description || 'No description available'}
                        </p>

                        {/* Admin Info */}
                        <small className="text-muted mb-2">
                            <strong>Admin:</strong> {group.admin?.fullName || 'N/A'}
                        </small>

                        {/* Countries */}
                        {groupCountries.length > 0 && (
                            <div className="mb-2">
                                <div className="d-flex flex-wrap gap-1">
                                    {groupCountries.slice(0, 3).map(country => (
                                        <span key={country.code} className="badge bg-light text-dark fw-normal border" style={{ fontSize: '0.7rem' }}>
                                            <img src={country.flag} alt={country.name} style={{ width: '12px', height: '9px', marginRight: '3px' }} />
                                            {country.name}
                                        </span>
                                    ))}
                                    {groupCountries.length > 3 && (
                                        <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                                            +{groupCountries.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Members Count - Push to bottom */}
                        <div className="mt-auto pt-2">
                            <small className="text-muted">
                                <i className="fas fa-users me-1"></i>
                                {(group.members || []).length} member{(group.members || []).length !== 1 ? 's' : ''}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        );
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
                        {isLoading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading your groups...</p>
                            </div>
                        ) : (
                            <>
                                {/* Pending Invitations */}
                                {pendingInvites.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="mb-3">Pending Invitations</h4>
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

                                {/* My Groups Cards */}
                                <h4 className="mb-4">My Groups</h4>
                                {approvedGroups.length > 0 ? (
                                    <div className="row">
                                        {approvedGroups.map(group => (
                                            <GroupCard key={group._id} group={group} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-5 bg-light rounded">
                                        <i className="fas fa-users fa-3x text-muted mb-3"></i>
                                        <h5 className="text-muted">No Groups Yet</h5>
                                        <p className="text-muted">You are not a member of any group yet. Create one or search for existing groups to join!</p>
                                        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>Create Your First Group</button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
                {viewMode === 'search' && (
                    <GroupSearch onViewGroup={onViewGroup} />
                )}
            </div>

            {isCreateOpen && <CreateGroupModal onClose={() => setIsCreateOpen(false)} onGroupCreated={fetchData} />}

            <style jsx>{`
                .hover-shadow:hover {
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
                    transform: translateY(-2px);
                }

                .card {
                    transition: all 0.3s ease;
                    border: 1px solid #e3e6f0;
                }

                .card:hover {
                    border-color: #5a5c69;
                }
            `}</style>
        </div>
    );
}