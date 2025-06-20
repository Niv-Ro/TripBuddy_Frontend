'use client';

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries.js";
import PostCard from "@/components/PostCard";
// Import helper components and styles
import CountryList from "./CountryList";
import CountrySearch from "./CountrySearch";
import '../styles/Style.css';

// A simple Skeleton component for a better loading experience
const ProfileSkeleton = () => (
    <div className="p-4 opacity-50" style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        <div className="navbar navbar-light border-bottom py-3 px-4">
            <div className="d-flex align-items-center w-100">
                <div style={{ width: 200, height: 200, borderRadius: "50%", backgroundColor: '#e0e0e0' }} />
                <div className="ms-4">
                    <div style={{ width: 250, height: 36, backgroundColor: '#e0e0e0', borderRadius: '4px', marginBottom: '0.75rem' }} />
                    <div style={{ width: 150, height: 20, backgroundColor: '#e0e0e0', borderRadius: '4px', marginBottom: '0.5rem' }} />
                    <div style={{ width: 120, height: 20, backgroundColor: '#e0e0e0', borderRadius: '4px' }} />
                </div>
            </div>
        </div>
    </div>
);


export default function Profile() {
    // --- State and Hooks ---
    const [data, setData] = useState(null);
    const { user } = useAuth();
    const allCountries = useCountries();
    const [visitedCountries, setVisitedCountries] = useState([]);
    const [wishlistCountries, setWishlistCountries] = useState([]);
    const [addingToList, setAddingToList] = useState(null); // Determines which list to add to: 'visited' | 'wishlist'
    const [searchQuery, setSearchQuery] = useState('');
    const [isClient, setIsClient] = useState(false);
    const initialLoad = useRef(true);
    const [userPosts, setUserPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);

    // --- Effects ---
    // Effect 1: Fetches initial profile data and populates the country lists from the DB
    useEffect(() => {
        if (!user?.email || allCountries.length === 0) return;

        axios.get(`http://localhost:5000/api/users/${user.email}`)
            .then(res => {
                const userData = res.data;
                setData(userData);

                if (userData?._id) {
                    console.log(userData._id);
                    axios.get(`http://localhost:5000/api/posts/user/${userData._id}`)
                        .then(postRes => {
                            setUserPosts(postRes.data);
                        })
                        .catch(postErr =>console.error("Failed to fetch user posts", postErr))
                        .finally(() => setPostsLoading(false));
                } else {
                    setPostsLoading(false);
                }

                if (userData?.visitedCountries) {
                    const initialVisited = allCountries.filter(c => userData.visitedCountries.includes(c.code3));
                    setVisitedCountries(initialVisited);
                }
                if (userData?.wishlistCountries) {
                    const initialWishlist = allCountries.filter(c => userData.wishlistCountries.includes(c.code3));
                    setWishlistCountries(initialWishlist);
                }
            })
            .catch(err => {
                console.error("Failed to fetch user data:", err);
                setData({ error: "User not found" });
            })
            .finally(() => {
                initialLoad.current = false;
            });
    }, [user, allCountries]);

    // Effect 2: Automatically saves the lists to the DB whenever they change
    useEffect(() => {
        if (initialLoad.current || !user?.email) return;

        const visitedCodes = visitedCountries.map(c => c.code3);
        const wishlistCodes = wishlistCountries.map(c => c.code3);

        console.log('SAVING TO DB:', { visited: visitedCodes, wishlist: wishlistCodes }); // For debugging

        axios.put(`http://localhost:5000/api/users/${user.email}/country-lists`, {
            visited: visitedCodes,
            wishlist: wishlistCodes
        })
            .then(res => console.log('Lists saved successfully!'))
            .catch(err => console.error('Failed to save lists:', err));

    }, [visitedCountries, wishlistCountries, user]);

    // Effect 3: Solves Hydration errors for client-side calculations
    useEffect(() => {
        setIsClient(true);
    }, []);

    // --- Handler Functions ---
    const handleAddCountry = (country) => {
        if (!addingToList) return;

        const targetList = addingToList === 'visited' ? visitedCountries : wishlistCountries;
        const setTargetList = addingToList === 'visited' ? setVisitedCountries : setWishlistCountries;

        // Add country only if it's not already in the target list
        if (!targetList.some(c => c.code === country.code)) {
            setTargetList(prev => [...prev, country]);
        }

        setAddingToList(null); // Close search UI
        setSearchQuery('');
    };

    const handleRemoveCountry = (countryCode, listType) => {
        const setList = listType === 'visited' ? setVisitedCountries : setWishlistCountries;
        setList(prev => prev.filter(c => c.code !== countryCode));
    };

    // --- Helper Functions ---
    function getAge(dateString) {
        if (!dateString) return '';
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    // Filter countries for search results, excluding only those in the target list
    const filteredCountries = searchQuery
        ? allCountries.filter(country => {
            const targetList = addingToList === 'visited' ? visitedCountries : wishlistCountries;
            const isInTargetList = targetList.some(sc => sc.code === country.code);
            return country.name.toLowerCase().includes(searchQuery.toLowerCase()) && !isInTargetList;
        })
        : [];

    // --- Loading and Error States ---
    if (!data) return <ProfileSkeleton />;
    if (data.error) return <div className="p-4 text-danger">{data.error}</div>;


    // פונקציה חדשה למחיקת פוסט
    const handleDeletePost = async (postId) => {
        if (window.confirm("Are you sure?")) {
            try {
                await axios.delete(`http://localhost:5000/api/posts/${postId}`);
                setUserPosts(prev => prev.filter(p => p._id !== postId));
            } catch (error) {
                console.error("Failed to delete post", error);
            }
        }
    };

    // פונקציה לעדכון פוסט ברשימה (למשל, אחרי לייק)
    const handleUpdatePost = (updatedPost) => {
        setUserPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    };

    // --- JSX Rendering ---
    return (
        <div>
            {/* ==================================================================== */}
            {/* Section 1: Main Profile Header (RESTORED AND COMPLETE)             */}
            {/* ==================================================================== */}
            <nav className="navbar navbar-light border-bottom py-3 px-4">
                <div className="d-flex align-items-center items-center  w-100 ">
                    <div className="shadow-2xl border-1 border-opacity-10"
                         style={{width: 200, height: 200, borderRadius: "50%", overflow: "hidden", flexShrink: 0}}
                    >
                        <img
                            src={data.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                            alt="Profile"
                            style={{width: '100%', height: '100%', objectFit: "cover"}}
                        />
                    </div>
                    <div className="ms-4">
                        <h1 className="py-2 mb-1">{data.fullName}</h1>
                        <h5 className="mb-1">Country: {data.countryOrigin}</h5>
                        <h5 className="mb-1">Gender: {data.gender}</h5>
                        <h5 className="mb-0">
                            Age: {isClient ? getAge(data.birthDate) : '...'}
                        </h5>
                    </div>
                    <div className="ms-4">
                        <h4>About me</h4>
                    </div>
                </div>
            </nav>

            {/* ==================================================================== */}
            {/* Section 2: Reusable Country List Components                      */}
            {/* ==================================================================== */}
            <div className="p-3 border-bottom">
                <CountryList
                    title="Countries I've Visited"
                    countries={visitedCountries}
                    onAddRequest={() => setAddingToList('visited')}
                    onRemove={(code) => handleRemoveCountry(code, 'visited')}
                />

                <CountryList
                    title="My Wishlist"
                    countries={wishlistCountries}
                    onAddRequest={() => setAddingToList('wishlist')}
                    onRemove={(code) => handleRemoveCountry(code, 'wishlist')}
                />
            </div>

            {/* ==================================================================== */}
            {/* Section 3: Conditionally Rendered Search Component                 */}
            {/* ==================================================================== */}
            {addingToList && (
                <CountrySearch
                    allCountries={allCountries}
                    existingCodes={addingToList === 'visited'
                        ? visitedCountries.map(c => c.code)
                        : wishlistCountries.map(c => c.code)}
                    onSelectCountry={handleAddCountry} // The add function now knows which list to use via 'addingToList' state
                    onCancel={() => setAddingToList(null)}
                />
            )}
            <div className="p-4">
                <h3 className="mb-3">My Posts</h3>
                {userPosts.length > 0 ? (
                    userPosts.map(post => (
                        <PostCard
                            key={post._id}
                            post={post}
                            // העברת ה-ID של המשתמש ממונגו כדי לדעת אם הוא עשה לייק
                            currentUserMongoId={data?._id}
                            onUpdate={handleUpdatePost}
                            onDelete={handleDeletePost}
                        />
                    ))
                ) : (
                    <p className="text-muted">You haven't posted anything yet.</p>
                )}
            </div>
        </div>
    );
}