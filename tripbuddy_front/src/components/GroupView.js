// src/components/GroupView.js
"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import PostCard from './PostCard';
import UserSearch from './UserSearch';

export default function GroupView({ groupId, onBack, onNavigateToProfile }) {
    const { mongoUser } = useAuth();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteMessage, setInviteMessage] = useState('');

    const fetchGroupData = () => {
        const fetchGroupDetails = axios.get(`http://localhost:5000/api/groups/${groupId}`);
        const fetchGroupPosts = axios.get(`http://localhost:5000/api/posts/group/${groupId}`);

        Promise.all([fetchGroupDetails, fetchGroupPosts])
            .then(([groupRes, postsRes]) => {
                setGroup(groupRes.data);
                setPosts(postsRes.data);
            })
            .catch(err => console.error("Failed to load group data", err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (groupId) {
            setIsLoading(true);
            fetchGroupData();
        }
    }, [groupId]);

    const handleInviteUser = async (userToInvite) => {
        setInviteMessage('');
        try {
            await axios.post(`http://localhost:5000/api/groups/${groupId}/invite`, {
                adminId: mongoUser._id,
                inviteeId: userToInvite._id
            });
            setInviteMessage(`Invitation sent to ${userToInvite.fullName}.`);
            setIsInviting(false);
        } catch (err) {
            console.error("Failed to send invitation", err);
            const errorMessage = err.response?.data?.message || "Failed to send invitation.";
            setInviteMessage(errorMessage);
        }
    };

    const handleRemoveMember = async (memberIdToRemove) => {
        if (window.confirm("Are you sure you want to remove this member?")) {
            try {
                await axios.post(`http://localhost:5000/api/groups/${groupId}/remove-member`, {
                    adminId: mongoUser._id,
                    memberToRemoveId: memberIdToRemove
                });
                fetchGroupData();
            } catch (err) {
                console.error("Failed to remove member", err);
                alert("Failed to remove member.");
            }
        }
    };

    if (isLoading) return <p className="text-center p-5">Loading group...</p>;
    if (!group) return <p className="text-center p-5">Group not found or you do not have access.</p>;

    const approvedMembers = group?.members.filter(m => m.status === 'approved') || [];
    const isMember = approvedMembers.some(member => member.user._id === mongoUser?._id);

    // 🔥 שינוי 1: בדיקה משופרת שמוודאת שהכפתור תמיד יופיע למנהל הקבוצה
    const isAdmin = group.admin && (group.admin._id || group.admin).toString() === mongoUser?._id;

    const memberIds = group.members.map(m => m.user._id);

    return (
        <div>
            <nav className="bg-light border-bottom p-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <button className="btn btn-secondary me-3" onClick={onBack}>← Back</button>
                    <div>
                        <h3 className="mb-0">{group.name}</h3>
                        <p className="mb-0 text-muted">{group.description}</p>
                    </div>
                </div>
                {/* הכפתור משתמש בבדיקת isAdmin המשופרת */}
                {isAdmin && <button className="btn btn-outline-primary" onClick={() => setIsInviting(!isInviting)}>Invite Member</button>}
            </nav>

            {inviteMessage && <div className="alert alert-info m-3" role="alert">{inviteMessage}</div>}

            {isMember ? (
                <div className="container py-4">
                    <div className="row">
                        <div className="col-md-8">
                            <h4>Group Feed</h4>
                            <hr/>
                            {posts.length > 0 ? (
                                posts.map(post => <PostCard key={post._id} post={post} onNavigateToProfile={onNavigateToProfile} />)
                            ) : (
                                <p>No posts in this group yet.</p>
                            )}
                        </div>

                        {/* 🔥 שינוי 2: רכיב החיפוש עבר לכאן */}
                        <div className="col-md-4">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <span>{approvedMembers.length} Members</span>
                                </div>

                                {/* חיפוש המשתמשים יופיע כאן כאשר isInviting=true */}
                                {isAdmin && isInviting && (
                                    <div className="p-2 border-bottom">
                                        <UserSearch
                                            existingMemberIds={memberIds}
                                            onSelectUser={handleInviteUser}
                                            onCancel={() => setIsInviting(false)}
                                        />
                                    </div>
                                )}

                                <ul className="list-group list-group-flush">
                                    {approvedMembers.map(({ user }) => (
                                        <li key={user._id} className="list-group-item d-flex justify-content-between align-items-center">
                                            {user.fullName}
                                            {isAdmin && user._id !== (group.admin._id || group.admin).toString() && (
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveMember(user._id)}>Remove</button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center p-5">
                    <h4>This is a private group.</h4>
                    <p>Join the group to see posts and discussions.</p>
                    <button className="btn btn-primary">Request to Join</button>
                </div>
            )}
        </div>
    );
}