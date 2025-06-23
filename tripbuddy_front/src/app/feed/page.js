"use client"
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries";
import CreatePost from "@/components/post/CreatePost";
import PostCard from "@/components/post/PostCard";

export default function Feed({ onNavigateToProfile }) {
    const [allPosts, setAllPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('all');

    const { mongoUser } = useAuth();
    const allCountries = useCountries();

    //fetching posts.
    const fetchPosts = useCallback((pageToFetch) => {
        if (!mongoUser?._id) return;

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
                setHasMore(false);
            })
            .finally(() => {
                setIsLoading(false);
                setIsLoadingMore(false);
            });
    }, [mongoUser?._id]);

    //Resets all data and loads first page of posts when component loads or when user changes.
    useEffect(() => {
        if (mongoUser?._id) {
            setAllPosts([]);
            setPage(1);
            setHasMore(true);
            fetchPosts(1);
        }
    }, [mongoUser?._id]);


    //watches when the last post becomes visible and there are more posts, loads next page, this creates infinite scrolling.
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

    //If page number increases, fetch that page
    useEffect(() => {
        if (page > 1) {
            fetchPosts(page);
        }
    }, [page]);

    //when a new post is created, closes the 'create post popup', resets all filters and reloads the feed.
    const handlePostCreated = () => {
        setIsCreateModalOpen(false);
        setSearchTerm('');
        setSelectedCountry('all');
        setAllPosts([]);
        setPage(1);
        setHasMore(true);
        fetchPosts(1);
    };

    //Updates a specific post in the list.
    const handleUpdatePost = (updatedPost) => {
        setAllPosts(prevPosts =>
            prevPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
        );
    };

    //Makes API call to delete post and removes post from the display list.
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

    //First filters by selected country, filters by search term, returns the filtered list of posts.
    const filteredPosts = useMemo(() => {
        if (!Array.isArray(allPosts)) return [];

        return allPosts
            .filter(post => {
                if (selectedCountry === 'all') return true;
                return post.taggedCountries?.includes(selectedCountry);
            })
            .filter(post => {
                if (!searchTerm) return true;
                return post.text.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [allPosts, selectedCountry, searchTerm]);

    //Gets countries from user's wishlist, these become options in the country filter dropdown
    const filterOptions = useMemo(() => {
        if (!mongoUser || !allCountries.length) return [];
        return (mongoUser.wishlistCountries || []).map(code =>
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

            <div className="flex-grow-1 overflow-y-auto p-4 bg-light">
                {isLoading ? (
                    <p className="text-center text-muted">Loading posts...</p>
                ) : filteredPosts.length > 0 ? (
                    filteredPosts.map((post, index) => {
                        const postCard = (
                            <PostCard
                                post={post}
                                currentUserMongoId={mongoUser?._id}
                                onUpdate={handleUpdatePost}
                                onDelete={handleDeletePost}
                                onNavigateToProfile={onNavigateToProfile}
                            />
                        );
                        if (filteredPosts.length === index + 1) {
                            return <div ref={lastPostRef} key={post._id}>{postCard}</div>;
                        } else {
                            return <div key={post._id}>{postCard}</div>;
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