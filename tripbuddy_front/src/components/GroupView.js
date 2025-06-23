// src/components/GroupView.js
"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import PostCard from './PostCard';

// הרכיב מקבל את groupId ואת פונקציית הניווט אחורה
export default function GroupView({ groupId, onBack, onNavigateToProfile }) {
    const { mongoUser } = useAuth();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (groupId) {
            setIsLoading(true);
            // נבצע את שתי קריאות ה-API במקביל לשיפור הביצועים
            const fetchGroupDetails = axios.get(`http://localhost:5000/api/groups/${groupId}`);
            const fetchGroupPosts = axios.get(`http://localhost:5000/api/posts/group/${groupId}`);

            Promise.all([fetchGroupDetails, fetchGroupPosts])
                .then(([groupRes, postsRes]) => {
                    setGroup(groupRes.data);
                    setPosts(postsRes.data);
                })
                .catch(err => {
                    console.error("Failed to load group data", err);
                    // אפשר להציג הודעת שגיאה למשתמש
                })
                .finally(() => setIsLoading(false));
        }
    }, [groupId]);

    const approvedMembers = group?.members.filter(m => m.status === 'approved') || [];

    if (isLoading) return <p className="text-center p-5">Loading group...</p>;
    // כאן צריך להוסיף בדיקה אם המשתמש המחובר הוא חבר בקבוצה לפני הצגת התוכן
    if (!group) return <p className="text-center p-5">Group not found or you do not have access.</p>;

    const isMember = approvedMembers.some(member => member.user._id === mongoUser?._id);
    const isAdmin = group.admin._id === mongoUser?._id;

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
                {/* כאן נוכל להוסיף כפתור "הזמן חבר" למנהל */}
                {isAdmin && <button className="btn btn-outline-primary">Invite Member</button>}
            </nav>

            {/* רק חברים יכולים לראות את תוכן הקבוצה */}
            {isMember ? (
                <div className="container py-4">
                    <div className="row">
                        {/* עמודה ראשית לפוסטים */}
                        <div className="col-md-8">
                            <h4>Group Feed</h4>
                            {/* כאן יכול להיות כפתור ליצירת פוסט חדש שיהיה משויך לקבוצה */}
                            <hr/>
                            {posts.length > 0 ? (
                                posts.map(post => <PostCard key={post._id} post={post} onNavigateToProfile={onNavigateToProfile} />)
                            ) : (
                                <p>No posts in this group yet.</p>
                            )}
                        </div>
                        {/* סרגל צד עם חברי הקבוצה */}
                        <div className="col-md-4">
                            <div className="card">
                                <div className="card-header">{approvedMembers.length} Members</div>
                                <ul className="list-group list-group-flush">
                                    {approvedMembers.map(({ user }) => (
                                        <li key={user._id} className="list-group-item d-flex justify-content-between align-items-center">
                                            {user.fullName}
                                            {/* מנהל יכול להסיר חברים */}
                                            {isAdmin && user._id !== group.admin._id && (
                                                <button className="btn btn-sm btn-outline-danger">Remove</button>
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
                    {/* כאן יהיה כפתור "בקש להצטרף" */}
                    <button className="btn btn-primary">Request to Join</button>
                </div>
            )}
        </div>
    );
}