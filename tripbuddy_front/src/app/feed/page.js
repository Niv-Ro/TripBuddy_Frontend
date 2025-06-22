"use client"
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";

export default function Feed({ onNavigateToProfile }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allPosts, setAllPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { mongoUser } = useAuth();

    // ✅ FIX: הוצאנו את פונקציית fetchPosts מחוץ ל-useEffect
    // כדי שרכיבים אחרים (כמו useEffect וה-handlers) יוכלו לגשת אליה.
    // עטפנו אותה ב-useCallback כדי למנוע יצירה מחדש שלה בכל רינדור.
    const fetchPosts = useCallback(() => {
        if (!mongoUser) return; // אל תביא פוסטים אם המשתמש עדיין לא זוהה

        setIsLoading(true);
        axios.get(`http://localhost:5000/api/posts/feed/${mongoUser._id}`)
            .then(res => {
                setAllPosts(res.data);
            })
            .catch(err => {
                console.error("Failed to fetch posts:", err);
            })
            .finally(() => {
                setIsLoading(false);
            });
        // ❌ FIX: הסרנו את הקריאה הרקורסיבית fetchPosts() שהייתה כאן וגרמה ללולאה אינסופית
    }, [mongoUser]); // התלות היא ב-mongoUser, הפונקציה תיווצר מחדש רק אם הוא משתנה

    // ✅ FIX: איחדנו את שני ה-useEffect לאחד שאחראי על טעינת הנתונים
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]); // קרא ל-fetchPosts כשהרכיב עולה לראשונה, או כשהפונקציה עצמה משתנה (כלומר כש-mongoUser משתנה)


    const handlePostCreated = () => {
        setIsCreateModalOpen(false);
        fetchPosts(); // עכשיו הקריאה הזו תעבוד כי הפונקציה מוצהרת מחוץ ל-useEffect
    };

    const handleUpdatePost = (updatedPost) => {
        setAllPosts(prevPosts =>
            prevPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
        );
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await axios.delete(`http://localhost:5000/api/posts/${postId}`);
                setAllPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
            } catch (error) {
                console.error("Failed to delete post", error);
                alert("Could not delete post.");
            }
        }
    };

    const filteredPosts = allPosts.filter(post =>
        post.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="d-flex flex-column" style={{ height: '100%' }}>
            {/* Top Bar */}
            <nav className="bg-white border-bottom shadow-sm p-3 d-flex align-items-center flex-shrink-0">
                <h2 className="me-4 mb-0">Feed</h2>
                <input
                    type="text"
                    placeholder="Search posts..."
                    className="form-control w-50 mx-auto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="ms-auto">
                    <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                        + New post
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex-grow-1 overflow-y-auto p-4 bg-light">
                {isLoading ? (
                    <p className="text-center text-muted">Loading posts...</p>
                ) : filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <PostCard
                            key={post._id}
                            post={post}
                            currentUserMongoId={mongoUser?._id}
                            onUpdate={handleUpdatePost}
                            onDelete={handleDeletePost}
                            onNavigateToProfile={onNavigateToProfile}
                        />
                    ))
                ) : (
                    <p className="text-muted text-center mt-4">No posts found.</p>
                )}
            </div>

            {/* Modal for Creating a New Post */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>&times;</button>
                        <CreatePost onPostCreated={handlePostCreated} />
                    </div>
                </div>
            )}
        </div>
    );
}