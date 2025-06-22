"use client"
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";

// The component now accepts 'onNavigateToProfile' as a prop from its parent
export default function Feed({ onNavigateToProfile }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allPosts, setAllPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { mongoUser } = useAuth();

    // Fetches all posts from the server
    const fetchPosts = () => {
        setIsLoading(true);
        axios.get('http://localhost:5000/api/posts')
            .then(res => {
                setAllPosts(res.data);
            })
            .catch(err => {
                console.error("Failed to fetch posts:", err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    // Fetch posts when the component mounts
    useEffect(() => {
        fetchPosts();
    }, []);

    // This function runs after a new post is successfully created
    const handlePostCreated = () => {
        setIsCreateModalOpen(false); // Close the modal
        fetchPosts();                // Refresh the feed
    };

    // Function to update a single post in the list (e.g., after a like)
    const handleUpdatePost = (updatedPost) => {
        setAllPosts(prevPosts =>
            prevPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
        );
    };

    // Function to remove a post from the list after deletion
    const handleDeletePost = async (postId) => {
        // We only show the confirmation here, the actual check if the user is the owner is in PostCard
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

    // Filter posts based on the search term
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
                            // Pass the navigation function down to the PostCard
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
