"use client"
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";

export default function Feed({ onNavigateToProfile, onNavigateToCountry }) {
    const [allPosts, setAllPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // State for pagination
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('all');

    const { mongoUser } = useAuth();
    const allCountries = useCountries();

    const fetchPosts = useCallback((pageToFetch) => {
        if (!mongoUser) return;

        if (pageToFetch === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        axios.get(`http://localhost:5000/api/posts/feed/${mongoUser._id}`, {
            params: { page: pageToFetch, limit: 10 }
        })
            .then(res => {
                setAllPosts(prev => pageToFetch === 1 ? res.data.posts : [...prev, ...res.data.posts]);
                setHasMore(res.data.hasMore);
            })
            .catch(err => {
                console.error("Failed to fetch posts:", err);
                setHasMore(false); // Stop trying to fetch if there's an error
            })
            .finally(() => {
                setIsLoading(false);
                setIsLoadingMore(false);
            });
    }, [mongoUser]);

    // Effect for the initial data load
    useEffect(() => {
        setAllPosts([]);
        setPage(1);
        setHasMore(true);
        fetchPosts(1);
    }, [fetchPosts]);

    // Intersection Observer logic for infinite scroll
    const observer = useRef();
    const lastPostRef = useCallback(node => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingMore, hasMore]);

    // Effect to fetch more posts when page number changes
    useEffect(() => {
        if (page > 1) {
            fetchPosts(page);
        }
    }, [page, fetchPosts]);

    const handlePostCreated = () => {
        setIsCreateModalOpen(false);
        setSearchTerm('');
        setSelectedCountry('all');
        setAllPosts([]);
        setPage(1);
        setHasMore(true);
        fetchPosts(1);
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

    const filteredPosts = useMemo(() => {
        return allPosts
            .filter(post => {
                if (selectedCountry === 'all') {
                    return true;
                }
                return post.taggedCountries?.includes(selectedCountry);
            })
            .filter(post => {
                return post.text.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [allPosts, selectedCountry, searchTerm]);

    const filterOptions = useMemo(() => {
        if (!mongoUser || !allCountries.length) return [];
        return mongoUser.wishlistCountries?.map(code =>
            allCountries.find(c => c.code3 === code)
        ).filter(Boolean);
    }, [mongoUser, allCountries]);

    return (
        <div className="d-flex flex-column" style={{ height: '100%' }}>
            <nav className="bg-white border-bottom shadow-sm p-3 d-flex align-items-center flex-shrink-0 gap-3">
                <h2 className="me-3 mb-0">Feed</h2>
                <input
                    type="text"
                    placeholder="Search posts..."
                    className="form-control w-auto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="form-select w-auto"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                >
                    <option value="all">All Posts</option>
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

            <div className="flex-grow-1 overflow-y-auto p-4 bg-light">
                {isLoading ? (
                    <p className="text-center text-muted">Loading posts...</p>
                ) : filteredPosts.length > 0 ? (
                    filteredPosts.map((post, index) => {
                        if (filteredPosts.length === index + 1) {
                            return (
                                <div ref={lastPostRef} key={post._id}>
                                    <PostCard
                                        post={post}
                                        currentUserMongoId={mongoUser?._id}
                                        onUpdate={handleUpdatePost}
                                        onDelete={handleDeletePost}
                                        onNavigateToProfile={onNavigateToProfile}
                                        onNavigateToCountry={onNavigateToCountry}
                                    />
                                </div>
                            );
                        } else {
                            return (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    currentUserMongoId={mongoUser?._id}
                                    onUpdate={handleUpdatePost}
                                    onDelete={handleDeletePost}
                                    onNavigateToProfile={onNavigateToProfile}
                                    onNavigateToCountry={onNavigateToCountry}
                                />
                            );
                        }
                    })
                ) : (
                    <p className="text-muted text-center mt-4">No posts found for the selected filters.</p>
                )}

                {isLoadingMore && <p className="text-center text-muted py-3">Loading more posts...</p>}

                {!isLoading && !hasMore && filteredPosts.length > 0 &&
                    <p className="text-center text-muted mt-4">You've reached the end!</p>
                }
            </div>

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