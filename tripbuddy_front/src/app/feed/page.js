"use client"
import React, {useEffect, useState, useCallback, useMemo} from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";

export default function Feed({ onNavigateToProfile }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allPosts, setAllPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('all');

    const { mongoUser } = useAuth();
    const allCountries = useCountries();

    const fetchPosts = useCallback(() => {
        if (!mongoUser) return;
        setIsLoading(true);
        axios.get(`http://localhost:5000/api/posts/feed/${mongoUser._id}`)
            .then(res => { setAllPosts(res.data); })
            .catch(err => { console.error("Failed to fetch posts:", err); })
            .finally(() => { setIsLoading(false); });
    }, [mongoUser]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePostCreated = () => {
        setIsCreateModalOpen(false);
        fetchPosts();
    };

    const handleUpdatePost = (updatedPost) => {
        setAllPosts(prevPosts =>
            prevPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
        );
    };

    // Simplified delete handler - PostCard now handles Firebase Storage deletion
    const handleDeletePost = (postId) => {
        // Just remove from the UI - PostCard already deleted from database and Firebase
        setAllPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
    };

    const filteredPosts = useMemo(() => {
        return allPosts
            .filter(post => {
                // שלב 1: סינון לפי מדינה
                if (selectedCountry === 'all') {
                    return true; // אם לא נבחרה מדינה, הצג הכל
                }
                // בדוק אם קוד המדינה שנבחרה כלול במערך המדינות המתויגות של הפוסט
                return post.taggedCountries?.includes(selectedCountry);
            })
            .filter(post => {
                // שלב 2: סינון לפי מונח חיפוש (כמו קודם)
                return post.text.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [allPosts, selectedCountry, searchTerm]);

    const filterOptions = useMemo(() => {
        if (!mongoUser || !allCountries.length) return [];
        return mongoUser.wishlistCountries?.map(code =>
            allCountries.find(c => c.code3 === code)
        ).filter(Boolean); // סנן החוצה תוצאות ריקות
    }, [mongoUser, allCountries]);

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

                <select
                    className="form-select w-auto"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                >
                    <option value="all">All Wishlist Countries</option>
                    {filterOptions.map(country => (
                        <option key={country.code3} value={country.code3}>
                            {country.name}
                        </option>
                    ))}
                </select>

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