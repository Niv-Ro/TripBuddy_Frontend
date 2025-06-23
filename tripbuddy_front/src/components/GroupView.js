"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import UserSearch from './UserSearch';
import useCountries from '@/hooks/useCountries';

export default function GroupView({ groupId, onBack, onNavigateToProfile }) {
    const { mongoUser } = useAuth();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const fetchGroupData = useCallback(() => {
        if (!groupId) return;
        setIsLoading(true);
        const fetchGroupDetails = axios.get(`http://localhost:5000/api/groups/${groupId}`);
        const fetchGroupPosts = axios.get(`http://localhost:5000/api/posts/group/${groupId}`);
        Promise.all([fetchGroupDetails, fetchGroupPosts])
            .then(([groupRes, postsRes]) => {
                setGroup(groupRes.data);
                setPosts(postsRes.data);
            })
            .catch(err => { console.error("Failed to load group data", err); setGroup(null); })
            .finally(() => setIsLoading(false));
    }, [groupId]);

    useEffect(() => { fetchGroupData(); }, [fetchGroupData]);

    const handlePostCreated = () => { setIsCreateModalOpen(false); fetchGroupData(); };
    const handleUpdatePost = (updatedPost) => { setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p)); };
    const handleDeletePost = async (postId) => {
        if (window.confirm("Are you sure?")) {
            await axios.delete(`http://localhost:5000/api/posts/${postId}`);
            fetchGroupData();
        }
    };
    const handleInviteUser = async (userToInvite) => {
        if (!mongoUser || !group) return;
        try {
            await axios.post(`http://localhost:5000/api/groups/${group._id}/invite`, { adminId: mongoUser._id, inviteeId: userToInvite._id });
            alert(`${userToInvite.fullName} has been invited.`);
            setIsInviting(false);
        } catch (error) { alert(error.response?.data?.message || "Could not invite user."); }
    };
    const handleRequestToJoin = async () => {
        if (!mongoUser || !group) return;
        setIsJoining(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/groups/${group._id}/request-join`, { userId: mongoUser._id });
            alert(res.data.message);
            fetchGroupData();
        } catch(error) {
            alert(error.response?.data?.message || "Could not process your request.");
        } finally {
            setIsJoining(false);
        }
    };
    const handleRemoveMember = async (memberIdToRemove) => {
        if (!mongoUser || !window.confirm("Are you sure you want to remove this member?")) return;
        try {
            await axios.post(`http://localhost:5000/api/groups/${group._id}/remove-member`, { adminId: mongoUser._id, memberToRemoveId: memberIdToRemove });
            fetchGroupData();
        } catch (error) { alert(error.response?.data?.message || "Could not remove member."); }
    };
    const handleRespondToRequest = async (requesterId, response) => {
        if (!mongoUser) return;
        try {
            await axios.post(`http://localhost:5000/api/groups/${group._id}/respond-request`, { adminId: mongoUser._id, requesterId: requesterId, response: response });
            fetchGroupData();
        } catch (error) { alert(error.response?.data?.message || "Action failed."); }
    };
    const handleDeleteGroup = async () => {
        if (!mongoUser || !group || !isAdmin) return;
        const confirmMessage = `Are you sure you want to delete "${group.name}"?\nThis action is permanent.`;
        if (!window.confirm(confirmMessage)) return;
        setIsDeleting(true);
        try {
            await axios.delete(`http://localhost:5000/api/groups/${group._id}`, { data: { adminId: mongoUser._id } });
            alert("Group deleted successfully.");
            onBack();
        } catch (error) { alert(error.response?.data?.message || "Could not delete group."); } finally { setIsDeleting(false); }
    };
    const handleLeaveGroup = async () => {
        if (!mongoUser || !group) return;

        let confirmMessage;
        if (isAdmin) {
            const otherMembers = approvedMembers.filter(m => m.user._id !== mongoUser._id);
            if (otherMembers.length === 0) {
                confirmMessage = "You are the only member in this group. Leaving will delete the group permanently. Are you sure?";
            } else {
                confirmMessage = "As the admin, a new admin will be automatically assigned when you leave. Are you sure?";
            }
        } else {
            confirmMessage = "Are you sure you want to leave this group?";
        }

        if (!window.confirm(confirmMessage)) return;
        setIsLeaving(true);
        try {
            await axios.post(`http://localhost:5000/api/groups/${group._id}/leave`, { userId: mongoUser._id });
            alert("You have successfully left the group.");
            onBack();
        } catch (error) { alert(error.response?.data?.message || "Could not leave group."); } finally { setIsLeaving(false); }
    };

    const approvedMembers = useMemo(() => group?.members.filter(m => m.status === 'approved') || [], [group]);
    const pendingJoinRequests = useMemo(() => group?.members.filter(m => m.status === 'pending_approval') || [], [group]);
    const isAdmin = useMemo(() => mongoUser && group && group.admin?._id === mongoUser._id, [group, mongoUser]);
    const isMember = useMemo(() => mongoUser && approvedMembers.some(member => member.user?._id === mongoUser._id), [approvedMembers, mongoUser]);
    const hasPendingRequest = useMemo(() => mongoUser && group && group.members.some(m => m.user?._id === mongoUser._id && m.status === 'pending_approval'), [group, mongoUser]);

    const canViewContent = isMember || (group && !group.isPrivate);

    if (isLoading) return <p className="text-center p-5">Loading group...</p>;
    if (!group) return <div className="text-center p-5"><h4>Group Not Found</h4><button className="btn btn-secondary" onClick={onBack}>← Back</button></div>;

    return (
        <div>
            <nav className="bg-light border-bottom p-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <button className="btn btn-secondary me-3" onClick={onBack}>←</button>
                    <div>
                        <h3 className="mb-1">{group.name}</h3>
                        <p className="mb-0 text-muted small">{group.description}</p>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    {/* Show leave button for all members (including admin) */}
                    {isMember && <button className="btn btn-warning" onClick={handleLeaveGroup} disabled={isLeaving}>{isLeaving ? "Leaving..." : "Leave Group"}</button>}
                    {isAdmin && <button className="btn btn-outline-primary" onClick={() => setIsInviting(prev => !prev)} disabled={isDeleting || isLeaving}>{isInviting ? 'Cancel Invite' : 'Invite'}</button>}
                    {isAdmin && <button className="btn btn-danger" onClick={handleDeleteGroup} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Group'}</button>}
                </div>
            </nav>

            <div className="container-fluid py-4">
                <div className="row">
                    <div className="col-md-8">
                        {/* UserSearch component displayed above the "Group Feed" header when inviting */}
                        {isInviting && isAdmin && (
                            <div className="mb-4">
                                <UserSearch
                                    onUserSelect={handleInviteUser}
                                    existingMemberIds={group.members.map(m => m.user._id)}
                                />
                            </div>
                        )}

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="mb-0">Group Feed</h4>
                            {isMember ? (<button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ New Post</button>)
                                : (canViewContent && !hasPendingRequest && <button className="btn btn-success" onClick={handleRequestToJoin} disabled={isJoining}>{isJoining ? "Joining..." : "Join Group"}</button>)}
                        </div>
                        <hr />

                        {canViewContent ? (
                            posts.length > 0 ? (
                                posts.map(post => <PostCard key={post._id} post={post} onUpdate={handleUpdatePost} onDelete={handleDeletePost} onNavigateToProfile={onNavigateToProfile} currentUserMongoId={mongoUser?._id} />)
                            ) : (<p>This group has no posts yet.</p>)
                        ) : (
                            <div className="text-center p-5">
                                <h4>This is a private group.</h4>
                                <p>You must be a member to see the content.</p>
                                {hasPendingRequest ? (<button className="btn btn-secondary" disabled>Join Request Sent</button>)
                                    : (<button className="btn btn-primary" onClick={handleRequestToJoin} disabled={isJoining}>{isJoining ? "Sending Request..." : "Request to Join"}</button>)}
                            </div>
                        )}
                    </div>
                    <div className="col-md-4">
                        {isAdmin && pendingJoinRequests.length > 0 && (
                            <div className="card mb-3">
                                <div className="card-header bg-warning">Pending Join Requests</div>
                                <ul className="list-group list-group-flush">
                                    {pendingJoinRequests.map(({ user }) => (
                                        user && (<li key={user._id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>{user.fullName}</span>
                                            <div>
                                                <button className="btn btn-sm btn-success me-1 py-0 px-2" onClick={() => handleRespondToRequest(user._id, 'approve')}>✓</button>
                                                <button className="btn btn-sm btn-danger py-0 px-2" onClick={() => handleRespondToRequest(user._id, 'decline')}>X</button>
                                            </div>
                                        </li>)
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="card">
                            <div className="card-header">{approvedMembers.length} Members</div>
                            <ul className="list-group list-group-flush">
                                {approvedMembers.map(({ user }) => (
                                    user && (<li key={user._id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>{user.fullName} {group.admin._id === user._id && <span className="badge bg-primary ms-2">Admin</span>}</span>
                                        {isAdmin && user._id !== group.admin._id && (<button className="btn btn-sm btn-outline-danger py-0" onClick={() => handleRemoveMember(user._id)}>Remove</button>)}
                                    </li>)
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {isCreateModalOpen && (<div className="modal-overlay"><div className="modal-content"><button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>&times;</button><CreatePost onPostCreated={handlePostCreated} groupId={groupId} /></div></div>)}
        </div>
    );
}