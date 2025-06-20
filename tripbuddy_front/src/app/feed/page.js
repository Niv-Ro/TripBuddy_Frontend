"use client"
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext"; // נייבא את ה-hook של המשתמש
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";

export default function Feed() {
    const [searchTerm, setSearchTerm] = useState('');
    const [allPosts, setAllPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // FIX 1: קבלת פרטי המשתמש המחובר מה-Context
    const { user, mongoUser } = useAuth();

    const fetchPosts = () => {
        setIsLoading(true);
        axios.get('http://localhost:5000/api/posts')
            .then(res => {
                setAllPosts(res.data);
            })
            .catch(err => console.error("Failed to fetch posts:", err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostCreated = () => {
        setIsCreateModalOpen(false);
        fetchPosts(); // רענון הפיד
    };

    // FIX 1: הוספת פונקציות לטיפול בלייק ומחיקה, בדיוק כמו ב-Profile
    const handleUpdatePost = (updatedPost) => {
        setAllPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await axios.delete(`http://localhost:5000/api/posts/${postId}`);
                setAllPosts(prev => prev.filter(p => p._id !== postId));
            } catch (error) {
                console.error("Failed to delete post", error);
            }
        }
    };

    const filteredPosts = allPosts.filter(post =>
        post.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="d-flex flex-column" style={{ height: '100vh' }}>
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

            {/* Main Content */}
            <div className="flex-grow-1 overflow-y-auto p-4 bg-light">
                {isLoading ? (
                    <p>Loading posts...</p>
                ) : filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <PostCard
                            key={post._id}
                            post={post}
                            // FIX 1: העברת ה-props החסרים ל-PostCard
                            currentUserMongoId={mongoUser?._id}
                            onUpdate={handleUpdatePost}
                            onDelete={handleDeletePost}
                        />
                    ))
                ) : (
                    <p className="text-muted text-center mt-4">No posts found.</p>
                )}
            </div>

            {/* Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>&times;</button>
                        <CreatePost onPostCreated={handlePostCreated} />
                    </div>
                </div>
            )}
        </div>
    )
}
