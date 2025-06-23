// src/components/GroupView.js
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import PostCard from './PostCard';
import UserSearch from './UserSearch';
import CreatePost from './CreatePost';

export default function GroupView({ groupId, onBack, onNavigateToProfile }) {
    const { mongoUser } = useAuth();

    // State for data
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);

    // State for UI control
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [message, setMessage] = useState('');

    const fetchGroupData = useCallback(() => {
        if (!groupId) return;
        // איפוס המצב לפני טעינה מחדש
        setIsLoading(true);
        const fetchGroupDetails = axios.get(`http://localhost:5000/api/groups/${groupId}`);
        const fetchGroupPosts = axios.get(`http://localhost:5000/api/posts/group/${groupId}`);

        Promise.all([fetchGroupDetails, fetchGroupPosts])
            .then(([groupRes, postsRes]) => {
                setGroup(groupRes.data);
                setPosts(postsRes.data);
            })
            .catch(err => console.error("Failed to load group data", err))
            .finally(() => setIsLoading(false));
    }, [groupId]);

    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 4000); // Clear message after 4 seconds
    };

    // --- Action Handlers ---

    const handlePostCreated = () => {
        setIsCreatePostOpen(false);
        fetchGroupData(); // Refresh posts and group data
    };

    // 🔥 הוספת פונקציות למחיקה ועריכה של פוסטים
    const handleDeletePost = async (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await axios.delete(`http://localhost:5000/api/posts/${postId}`);
                // הסר את הפוסט מהמצב המקומי כדי שהמחיקה תהיה מיידית
                setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
            } catch (error) {
                console.error("Failed to delete post", error);
                alert("Could not delete the post.");
            }
        }
    };

    const handleUpdatePost = (updatedPost) => {
        // עדכן את הפוסט הספציפי במערך הפוסטים
        setPosts(prevPosts =>
            prevPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
        );
    };


    // ... שאר הפונקציות (invite, remove, request, respond) נשארות זהות ...
    const handleInviteUser = async (userToInvite) => {
        try {
            await axios.post(`http://localhost:5000/api/groups/${groupId}/invite`, {
                adminId: mongoUser._id,
                inviteeId: userToInvite._id
            });
            showMessage(`Invitation sent to ${userToInvite.fullName}.`);
            setIsInviting(false);
        } catch (err) {
            showMessage(err.response?.data?.message || "Failed to send invitation.");
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
                alert("Failed to remove member.");
            }
        }
    };

    const handleRequestToJoin = async () => {
        try {
            await axios.post(`http://localhost:5000/api/groups/${groupId}/request-join`, { userId: mongoUser._id });
            showMessage("Your request to join has been sent.");
            fetchGroupData();
        } catch (err) {
            showMessage(err.response?.data?.message || "Failed to send request.");
        }
    };

    const handleRespondToRequest = async (requesterId, response) => {
        try {
            await axios.post(`http://localhost:5000/api/groups/${groupId}/respond-request`, {
                adminId: mongoUser._id,
                requesterId,
                response
            });
            fetchGroupData();
        } catch (err) {
            alert('Failed to respond to request.');
        }
    };


    // --- Derived State ---
    const isMember = group?.members.some(m => m.user?._id === mongoUser?._id && m.status === 'approved');
    const hasPendingStatus = group?.members.some(m => m.user?._id === mongoUser?._id && m.status !== 'approved');
    const isAdmin = group?.admin && (group.admin._id || group.admin).toString() === mongoUser?._id;
    const approvedMembers = group?.members.filter(m => m.status === 'approved') || [];
    const pendingRequests = group?.members.filter(m => m.status === 'pending_approval') || [];


    if (isLoading) return <p className="text-center p-5">Loading group...</p>;
    if (!group) return <p className="text-center p-5">Group not found.</p>;

    return (
        <div>
            {/* Top Navigation */}
            <nav className="bg-light border-bottom p-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <button className="btn btn-secondary me-3" onClick={onBack}>← Back</button>
                    <div>
                        <h3 className="mb-0">{group.name}</h3>
                        <p className="mb-0 text-muted">{group.description}</p>
                    </div>
                </div>
                {isAdmin && <button className="btn btn-outline-primary" onClick={() => setIsInviting(!isInviting)}>Invite</button>}
            </nav>

            {message && <div className="alert alert-info m-3">{message}</div>}

            {/* Main Content */}
            {isMember ? (
                <div className="container py-4">
                    <div className="row">
                        <div className="col-md-8">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="mb-0">Group Feed</h4>
                                <button className="btn btn-success" onClick={() => setIsCreatePostOpen(true)}>+ New Post</button>
                            </div>
                            <hr/>
                            {posts.length > 0 ? posts.map(post => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    currentUserMongoId={mongoUser?._id}
                                    onUpdate={handleUpdatePost}      // 🔥 העברת הפונקציה לעריכה
                                    onDelete={handleDeletePost}      // 🔥 העברת הפונקציה למחיקה
                                    onNavigateToProfile={onNavigateToProfile}
                                />
                            )) : <p>No posts in this group yet.</p>}
                        </div>
                        <div className="col-md-4">
                            <div className="card">
                                {isAdmin && isInviting && (
                                    <div className="p-2 border-bottom"><UserSearch existingMemberIds={group.members.map(m => m.user?._id)} onSelectUser={handleInviteUser} onCancel={() => setIsInviting(false)} /></div>
                                )}
                                {isAdmin && pendingRequests.length > 0 && (
                                    <div className="p-3 border-bottom">
                                        <h6 className="card-title">Pending Requests ({pendingRequests.length})</h6>
                                        {pendingRequests.map(({ user }) => (
                                            <div key={user._id} className="d-flex justify-content-between align-items-center mb-2">
                                                <span>{user.fullName}</span>
                                                <div>
                                                    <button className="btn btn-sm btn-success me-1" onClick={() => handleRespondToRequest(user._id, 'approve')}>Approve</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleRespondToRequest(user._id, 'decline')}>Decline</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="card-header">{approvedMembers.length} Members</div>
                                <ul className="list-group list-group-flush">
                                    {approvedMembers.map(({ user }) => (
                                        <li key={user?._id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>
                                                {user?.fullName || 'User not found'}
                                                {/* 🔥 הוספת תג "Admin" ליד שם המנהל */}
                                                {(user?._id === (group.admin._id || group.admin).toString()) && (
                                                    <span className="badge bg-primary rounded-pill ms-2">Admin</span>
                                                )}
                                            </span>
                                            {isAdmin && user?._id !== (group.admin._id || group.admin).toString() && (
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
                    {hasPendingStatus ? (
                        <p className="text-success">Your membership request is pending.</p>
                    ) : (
                        <>
                            <p>Join the group to see posts and discussions.</p>
                            <button className="btn btn-primary" onClick={handleRequestToJoin}>Request to Join</button>
                        </>
                    )}
                </div>
            )}

            {/* Modal for Creating a New Post */}
            {isCreatePostOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close-btn" onClick={() => setIsCreatePostOpen(false)}>&times;</button>
                        <CreatePost onPostCreated={handlePostCreated} groupId={groupId} />
                    </div>
                </div>
            )}
        </div>
    );
}