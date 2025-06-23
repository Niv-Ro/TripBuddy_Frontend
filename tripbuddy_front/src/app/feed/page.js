"use client"
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries";
import CreatePost from "@/components/post/CreatePost";
import PostCard from "@/components/post/PostCard";

export default function Feed({ onNavigateToProfile }) {
    // Raw input array of post objects fetched from the server. Default as empty array
    const [allPosts, setAllPosts] = useState([]);
    // Manages the loading spinner.
    const [isLoading, setIsLoading] = useState(true);
    // Boolean flag of visibility of the Create Post modal.
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // State for infinite scroll.
    const [page, setPage] = useState(1); // Tracks the current page number to fetch. Starts at page 1
    const [hasMore, setHasMore] = useState(true); // A flag from the server indicating if more posts are available
    const [isLoadingMore, setIsLoadingMore] = useState(false); // Manages the loading indicator at the bottom of the feed

    // For client-side filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('all');

    // Gets the logged-in user's data from the global context.
    const { mongoUser } = useAuth();
    // Gets the master list of all countries from a custom hook.
    const allCountries = useCountries();

    // Core function for fetching posts from the backend.
    const fetchPosts = useCallback((pageToFetch, countryCode = selectedCountry) => {
        // Don't make a request if the user ID isn't available yet
        if (!mongoUser?._id) return;

        // Differentiates between the initial load to other requests, when client requests continue for the already loaded posts
        if (pageToFetch === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        // Build the request parameters
        const params = {
            page: pageToFetch,
            limit: 10
        };

        // Add country filter if selected
        if (countryCode && countryCode !== 'all') {
            params.countryCode = countryCode;
        }

        axios.get(`http://localhost:5000/api/posts/feed/${mongoUser._id}`, { params })
            .then(res => {
                // If it's the first page, replace all posts. Otherwise, append the new posts to the existing list.
                setAllPosts(prev => pageToFetch === 1 ? res.data.posts : [...prev, ...res.data.posts]);
                // Update the hasMore flag based on the server's response.
                setHasMore(res.data.hasMore);
            })
            .catch(err => {
                console.error("Failed to fetch posts:", err);
                setHasMore(false); // Stop trying to fetch more if an error occurs.
            })
            .finally(() => {
                // Always reset loading states after the request is complete.
                setIsLoading(false);
                setIsLoadingMore(false);
            });
    }, [mongoUser?._id, selectedCountry]); // The function will only be recreated if the logged-in user or selected country changes.

    // Reset and fetch posts when country selection changes
    useEffect(() => {
        if (mongoUser?._id) {
            setAllPosts([]); // Clear previous results.
            setPage(1);     // Reset to page 1.
            setHasMore(true);
            fetchPosts(1, selectedCountry);
        }
    }, [selectedCountry, mongoUser?._id, fetchPosts]); // The dependency array now includes `selectedCountry`.

    // This block sets up the IntersectionObserver for infinite scrolling.
    const observer = useRef(); // useRef holds the observer instance so it persists across renders.
    const lastPostRef = useCallback(node => {
        // If we are already fetching more data, do nothing.
        if (isLoadingMore) return;
        // Before creating a new observer, disconnect the previous one to prevent observing multiple elements.
        if (observer.current) observer.current.disconnect();

        // Create a new IntersectionObserver. The callback inside executes when visibility changes
        observer.current = new IntersectionObserver(entries => {
            // isIntersecting is true when the element enters the viewport
            if (entries[0].isIntersecting && hasMore) {
                // If the last post is visible and there are more posts, fetch the next page
                setPage(prevPage => prevPage + 1);
            }
        });

        // If the node (the DOM element) exists, tell the observer to start watching it.
        if (node) observer.current.observe(node);
    }, [isLoadingMore, hasMore]);

    // This effect fetches the next page when the page state is incremented by the observer.
    useEffect(() => {
        if (page > 1) {
            fetchPosts(page);
        }
    }, [page, fetchPosts]); // This runs every time the page number changes.

    // Resets the feed after a new post is created.
    const handlePostCreated = () => {
        setIsCreateModalOpen(false);
        setSearchTerm('');
        setSelectedCountry('all');
        setAllPosts([]);
        setPage(1);
        setHasMore(true);
        fetchPosts(1, 'all');
    };

    // Updates a single post in the local state optimistically (without a full refetch).
    const handleUpdatePost = (updatedPost) => {
        setAllPosts(prevPosts =>
            prevPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
        );
    };

    // Deletes a post from the server and removes it from the local state.
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

    // Client-side filtering for search term only (country filtering is now server-side)
    const filteredPosts = useMemo(() => {
        if (!Array.isArray(allPosts)) return [];
        if (!searchTerm) {
            return allPosts;
        }
        return allPosts.filter(post => {
            return post.text.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [allPosts, searchTerm]);

    // Creates the list of options for the country filter dropdown.
    const filterOptions = useMemo(() => {
        if (!mongoUser || !allCountries.length) return [];
        // It uses the wishlistCountries from the user object to build the options.
        return (mongoUser.wishlistCountries || []).map(code =>
            allCountries.find(c => c.code3 === code)
        ).filter(Boolean);
    }, [mongoUser, allCountries]);

    return (
        <div className="d-flex flex-column" style={{ height: '100%' }}>
            {/* The top navigation bar with search and filter controls. */}
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

            {/* The main scrollable content area. */}
            <div className="flex-grow-1 overflow-y-auto p-4 bg-light">
                {/* Conditional rendering: shows loading spinner, posts, or a "not found" message. */}
                {isLoading ? (
                    <p className="text-center text-muted">Loading posts...</p>
                ) : filteredPosts.length > 0 ? (
                    // Maps over the filtered posts to render a PostCard for each one.
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
                        // The 'ref' is attached ONLY to the very last post in the list to trigger infinite scroll.
                        if (filteredPosts.length === index + 1) {
                            return <div ref={lastPostRef} key={post._id}>{postCard}</div>;
                        } else {
                            return <div key={post._id}>{postCard}</div>;
                        }
                    })
                ) : (
                    <p className="text-muted text-center mt-4">No posts found for the selected filters.</p>
                )}

                {/* Shows a loading indicator at the bottom while fetching more posts. */}
                {isLoadingMore && <p className="text-center text-muted py-3">Loading more posts...</p>}

                {/* Shows a message when the user has reached the end of the feed. */}
                {!isLoading && !hasMore && filteredPosts.length > 0 &&
                    <p className="text-center text-muted mt-4">You've reached the end!</p>
                }
            </div>

            {/* The modal for creating a new post is rendered conditionally. */}
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