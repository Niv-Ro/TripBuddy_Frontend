"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import CreatePost from '../post/CreatePost';
import UserSearch from './UserSearch';
import GroupHeader from './GroupHeader';
import GroupFeed from './GroupFeed';
import GroupMembersPanel from './GroupMembersPanel';

export default function GroupView({ groupId, onBack, onNavigateToProfile }) {
    const { mongoUser } = useAuth();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false); // הוספנו את זה בתיקון קודם

    const fetchGroupData = useCallback(() => {
        if (!groupId) return;
        setIsLoading(true);
        Promise.all([
            axios.get(`http://localhost:5000/api/groups/${groupId}`),
            axios.get(`http://localhost:5000/api/posts/group/${groupId}`)
        ]).then(([groupRes, postsRes]) => {
            setGroup(groupRes.data);
            setPosts(postsRes.data);
        }).catch(err => {
            console.error("Failed to load group data", err);
            setGroup(null);
        }).finally(() => setIsLoading(false));
    }, [groupId]);

    useEffect(() => { fetchGroupData(); }, [fetchGroupData]);

    const handlePostCreated = () => { setIsCreateModalOpen(false); fetchGroupData(); };
    const handleUpdatePost = (updatedPost) => setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    const handleDeletePost = async (postId) => { if (window.confirm("Delete this post?")) { await axios.delete(`http://localhost:5000/api/posts/${postId}`); fetchGroupData(); } };
    const handleInviteUser = async (userToInvite) => {
        if (!mongoUser || !group) return;
        try {
            await axios.post(`http://localhost:5000/api/groups/${group._id}/invite`, { adminId: mongoUser._id, inviteeId: userToInvite._id });
            alert(`${userToInvite.fullName} has been invited.`);
            setIsInviting(false);
            fetchGroupData();
        } catch (error) { alert(error.response?.data?.message || "Could not invite user."); }
    };
    const handleRemoveMember = async (memberIdToRemove) => {
        if (!mongoUser || !window.confirm("Are you sure?")) return;
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
        const confirmMessage = `Are you sure you want to delete "${group.name}"?\nThis action is permanent and cannot be undone.`;
        if (!window.confirm(confirmMessage)) return;
        setIsDeleting(true);
        try {
            await axios.delete(`http://localhost:5000/api/groups/${group._id}`, { data: { adminId: mongoUser._id } });
            alert('Group deleted successfully.');
            onBack();
        } catch (error) {
            console.error('Error deleting group:', error);
            alert(error.response?.data?.message || 'Failed to delete group.');
        } finally {
            setIsDeleting(false);
        }
    };
    const handleJoinRequest = async () => {
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
    const handleLeaveGroup = async () => { /* ... לוגיקת עזיבת קבוצה ... */ };

    const approvedMembers = useMemo(() => group?.members.filter(m => m.status === 'approved') || [], [group]);
    const pendingJoinRequests = useMemo(() => group?.members.filter(m => m.status === 'pending_approval') || [], [group]);
    const isAdmin = useMemo(() => mongoUser && group && group.admin?._id === mongoUser._id, [group, mongoUser]);
    const isMember = useMemo(() => mongoUser && approvedMembers.some(member => member.user?._id === mongoUser._id), [approvedMembers, mongoUser]);
    const hasPendingRequest = useMemo(() => mongoUser && group?.members.some(m => m.user?._id === mongoUser._id && m.status === 'pending_approval'), [group, mongoUser]);
    const canViewContent = isMember || (group && group.isPrivate === false);

    if (isLoading) return <p className="text-center p-5">Loading group...</p>;
    if (!group) return ( <div className="text-center p-5"><h4>Group Not Found</h4><button className="btn btn-secondary" onClick={onBack}>← Back</button></div> );

    return (
        <div>
            <GroupHeader
                group={group}
                isAdmin={isAdmin}
                isMember={isMember}
                onBack={onBack}
                onInvite={() => setIsInviting(prev => !prev)}
                onDelete={handleDeleteGroup}
                onLeave={handleLeaveGroup}
                isDeleting={isDeleting}
                isLeaving={isLeaving}
                isInviting={isInviting}
            />

            {isInviting && isAdmin && (
                <div className="p-3 bg-light border-bottom">
                    <UserSearch onUserSelect={handleInviteUser} existingMemberIds={group.members.map(m => m.user._id)} onCancel={() => setIsInviting(false)} title="Search for a user to invite" />
                </div>
            )}

            <div className="container-fluid py-4">
                <div className="row">
                    <div className="col-md-8">
                        {canViewContent ? (
                            <GroupFeed
                                posts={posts}
                                isMember={isMember}
                                isJoining={isJoining}
                                onNewPost={() => setIsCreateModalOpen(true)}
                                onJoin={handleJoinRequest}
                                currentUserMongoId={mongoUser?._id}
                                onUpdatePost={handleUpdatePost}
                                onDeletePost={handleDeletePost}
                                onNavigateToProfile={onNavigateToProfile}
                            />
                        ) : (
                            <div className="text-center p-5 bg-light rounded shadow-sm">
                                <h4>This is a private group.</h4>
                                <p className="text-muted">You must be a member to see its content.</p>
                                {hasPendingRequest ?
                                    (<button className="btn btn-secondary" disabled>Join Request Sent</button>) :
                                    (<button className="btn btn-primary" onClick={handleJoinRequest} disabled={isJoining}>{isJoining ? "Sending..." : "Request to Join"}</button>)
                                }
                            </div>
                        )}
                    </div>
                    <div className="col-md-4">
                        <GroupMembersPanel
                            isAdmin={isAdmin}
                            isMember={isMember}
                            members={approvedMembers}
                            pendingRequests={pendingJoinRequests}
                            onRespondToRequest={handleRespondToRequest}
                            onRemoveMember={handleRemoveMember}
                            adminId={group.admin._id}
                        />
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>&times;</button>
                        <CreatePost onPostCreated={handlePostCreated} groupId={groupId} />
                    </div>
                </div>
            )}
        </div>
    );
}