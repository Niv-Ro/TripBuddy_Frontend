"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import useCountries from '@/hooks/useCountries';
import PostCard from './PostCard';
import CreatePost from './CreatePost'; // נייבא את רכיב יצירת הפוסט

export default function GroupView({ groupId, onBack, onNavigateToProfile }) {
    const { mongoUser } = useAuth();
    const allCountries = useCountries();

    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchGroupData = () => {
        if (groupId) {
            setIsLoading(true);
            const fetchGroupDetails = axios.get(`http://localhost:5000/api/groups/${groupId}`);
            const fetchGroupPosts = axios.get(`http://localhost:5000/api/posts/group/${groupId}`);

            Promise.all([fetchGroupDetails, fetchGroupPosts])
                .then(([groupRes, postsRes]) => {
                    setGroup(groupRes.data);
                    setPosts(postsRes.data);
                })
                .catch(err => {
                    console.error("Failed to load group data", err);
                    setGroup(null); // במקרה של שגיאה, אפס את נתוני הקבוצה
                })
                .finally(() => setIsLoading(false));
        }
    };

    useEffect(fetchGroupData, [groupId]);

    const handlePostCreated = () => {
        setIsCreateModalOpen(false);
        fetchGroupData(); // רענן את נתוני הקבוצה והפוסטים שלה
    };

    // חישוב המדינות, החברים, וההרשאות באמצעות useMemo לשיפור ביצועים
    const taggedCountryObjects = useMemo(() => {
        if (!group || !allCountries.length) return [];
        // הוספנו הגנה (|| []) למקרה שלקבוצות ישנות אין מערך מדינות
        return (group.countries || []).map(code => allCountries.find(c => c.code3 === code)).filter(Boolean);
    }, [group, allCountries]);

    const approvedMembers = useMemo(() => group?.members.filter(m => m.status === 'approved') || [], [group]);
    const isMember = useMemo(() => approvedMembers.some(member => member.user?._id === mongoUser?._id), [approvedMembers, mongoUser]);
    const isAdmin = useMemo(() => group?.admin?._id === mongoUser?._id, [group, mongoUser]);

    if (isLoading) return <p className="text-center p-5">Loading group...</p>;

    if (!group) return (
        <div className="text-center p-5">
            <h4>Group Not Found</h4>
            <p>This group may not exist or you may not have permission to view it.</p>
            <button className="btn btn-secondary" onClick={onBack}>← Back to Groups</button>
        </div>
    );

    return (
        <div>
            {/* כותרת העמוד */}
            <nav className="bg-light border-bottom p-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <button className="btn btn-secondary me-3" onClick={onBack}>←</button>
                    <div>
                        <h3 className="mb-1">{group.name}</h3>
                        <p className="mb-2 text-muted small">{group.description}</p>
                        {taggedCountryObjects.length > 0 && (
                            <div className="d-flex flex-wrap gap-1">
                                {taggedCountryObjects.map(country => (
                                    <span key={country.code} className="badge bg-white text-dark fw-normal border">
                                        <img src={country.flag} alt={country.name} style={{ width: '16px', height: '12px', marginRight: '5px' }} />
                                        {country.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {isAdmin && <button className="btn btn-outline-primary btn-sm">Invite Member</button>}
            </nav>

            {/* תוכן העמוד - מוצג רק לחברי קבוצה */}
            {isMember ? (
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-md-8">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="mb-0">Group Feed</h4>
                                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ New Post in Group</button>
                            </div>
                            <hr/>
                            {posts.length > 0 ? (
                                posts.map(post => <PostCard key={post._id} post={post} onNavigateToProfile={onNavigateToProfile} />)
                            ) : (
                                <p className="text-muted mt-4">This group has no posts yet. Be the first to contribute!</p>
                            )}
                        </div>
                        <div className="col-md-4">
                            <div className="card">
                                <div className="card-header">{approvedMembers.length} Members</div>
                                <ul className="list-group list-group-flush">
                                    {approvedMembers.map(({ user }) => (
                                        <li key={user._id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>{user.fullName} {group.admin._id === user._id && '(Admin)'}</span>
                                            {isAdmin && user._id !== group.admin._id && (
                                                <button className="btn btn-sm btn-outline-danger py-0">Remove</button>
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