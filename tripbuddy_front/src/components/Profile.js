'use client';

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries.js";
import PostCard from "@/components/PostCard";
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


// This component now receives the specific userId and the navigation function as props
export default function Profile({ userId, onNavigateToProfile }) {
    const { mongoUser, user } = useAuth(); // Logged-in user from context
    const allCountries = useCountries();

    // State for the data of the profile being viewed
    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    // State for managing country lists (only for our own profile)
    const [visitedCountries, setVisitedCountries] = useState([]);
    const [wishlistCountries, setWishlistCountries] = useState([]);
    const [addingToList, setAddingToList] = useState(null);
    const initialLoad = useRef(true);

    // This check is the single source of truth for edit/delete permissions
    const isOwnProfile = mongoUser?._id === userId;

    // State for Follow button
    const [followersCount, setFollowersCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);

    // Effect 1: Fetches the viewed profile's data
    useEffect(() => {
        setIsClient(true);
        if (!userId) {
            setLoading(false);
            return;
        }

        axios.get(`http://localhost:5000/api/users/id/${userId}`)
            .then(res => {
                const userData = res.data;
                setProfileData(userData);

                // ✅ FIX: Added logic to set the follow status and count
                if (userData.followers && mongoUser) {
                    setFollowersCount(userData.followers.length);
                    // Check if the logged-in user's ID is in the followers list
                    setIsFollowing(userData.followers.some(follower => follower._id === mongoUser._id));
                }

                // If it's our own profile, initialize the editable state lists from the fetched data
                if (isOwnProfile && allCountries.length > 0) {
                    setVisitedCountries(userData.visitedCountries?.map(code => allCountries.find(c => c.code3 === code)).filter(Boolean) || []);
                    setWishlistCountries(userData.wishlistCountries?.map(code => allCountries.find(c => c.code3 === code)).filter(Boolean) || []);
                }

                return axios.get(`http://localhost:5000/api/posts/user/${userId}`);
            })
            .then(postRes => {
                setUserPosts(postRes.data);
            })
            .catch(err => {
                console.error("Failed to load profile data for user:", userId, err);
                setProfileData({ error: true });
            })
            .finally(() => {
                setLoading(false);
                setTimeout(() => { initialLoad.current = false; }, 500);
            });
    }, [userId, allCountries, isOwnProfile, mongoUser]); // ✅ FIX: Added mongoUser to dependency array

    // Effect 2: Automatically saves the lists to the DB ONLY if it's our own profile and the lists change
    useEffect(() => {
        if (!isOwnProfile || initialLoad.current || !user?.email) return;

        const visitedCca3 = visitedCountries.map(c => c.code3);
        const wishlistCca3 = wishlistCountries.map(c => c.code3);
        const visitedCcn3 = visitedCountries.map(c => c.name);
        const wishlistCcn3 = wishlistCountries.map(c => c.name);

        axios.put(`http://localhost:5000/api/users/${user.email}/country-lists`, {
            visited: visitedCca3,
            wishlist: wishlistCca3,
            visitedCcn3: visitedCcn3,
            wishlistCcn3: wishlistCcn3,
        })
            .then(() => console.log("Profile lists saved successfully."))
            .catch(err => console.error("Failed to save lists", err));

    }, [visitedCountries, wishlistCountries, isOwnProfile, user]);

    // Handler Functions
    const handleAddCountry = (country) => {
        if (!isOwnProfile || !addingToList) return;
        const setList = addingToList === 'visited' ? setVisitedCountries : setWishlistCountries;
        const list = addingToList === 'visited' ? visitedCountries : wishlistCountries;
        if (!list.some(c => c.code === country.code)) {
            setList(prev => [...prev, country]);
        }
        setAddingToList(null);
    };

    const handleRemoveCountry = (countryCode, listType) => {
        if (!isOwnProfile) return;
        const setList = listType === 'visited' ? setVisitedCountries : setWishlistCountries;
        setList(prev => prev.filter(c => c.code !== countryCode));
    };

    const handleDeletePost = async (postId) => {
        if (isOwnProfile && window.confirm("Are you sure you want to delete this post?")) {
            await axios.delete(`http://localhost:5000/api/posts/${postId}`);
            setUserPosts(prev => prev.filter(p => p._id !== postId));
        }
    };

    const handleUpdatePost = (updatedPost) => {
        setUserPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    };

    const handleFollowToggle = async () => {
        if (!mongoUser) {
            alert("You must be logged in to follow users.");
            return;
        }
        try {
            await axios.post(
                `http://localhost:5000/api/users/${userId}/follow`,
                { loggedInUserId: mongoUser._id }
            );
            // Update the UI instantly for better user experience
            setIsFollowing(prev => !prev);
            setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);

        } catch (error) {
            console.error("Failed to toggle follow", error);
            alert("Something went wrong.");
        }
    };

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

    if (loading) return <ProfileSkeleton />;
    if (!profileData || profileData.error) return <div className="p-4 text-danger">Profile not found.</div>;

    const finalVisited = isOwnProfile ? visitedCountries : (profileData.visitedCountries?.map(c => allCountries.find(ac => ac.code3 === c)).filter(Boolean) || []);
    const finalWishlist = isOwnProfile ? wishlistCountries : (profileData.wishlistCountries?.map(c => allCountries.find(ac => ac.code3 === c)).filter(Boolean) || []);

    return (
        <div>
            {/* Section 1: Main Profile Header */}
            <nav className="navbar navbar-light border-bottom py-3 px-4">
                <div className="d-flex align-items-center w-100">
                    <div style={{ width: 200, height: 200, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                        <img src={profileData.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: "cover" }} />
                    </div>
                    {/* ✅ FIX: Added Follower count and Follow button */}
                    <div className="ms-4">
                        <h1 className="py-2 mb-1">{profileData.fullName}</h1>
                        <h5 className="mb-2 text-muted">{followersCount} Followers</h5>

                        {/* The button will only show on other users' profiles */}
                        {!isOwnProfile && mongoUser && (
                            <button
                                className={`btn mb-2 ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={handleFollowToggle}
                            >
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                        )}

                        <h5 className="mb-1">Country: {profileData.countryOrigin}</h5>
                        <h5 className="mb-1">Gender: {profileData.gender}</h5>
                        <h5 className="mb-0">Age: {isClient ? getAge(profileData.birthDate) : '...'}</h5>
                    </div>
                </div>
            </nav>

            {/* Section 2: Country Lists */}
            <div className="p-3 border-bottom">
                <CountryList title="Countries Visited" countries={finalVisited} isOwnProfile={isOwnProfile} onAddRequest={() => setAddingToList('visited')} onRemove={handleRemoveCountry} />
                <CountryList title="My Wishlist" countries={finalWishlist} isOwnProfile={isOwnProfile} onAddRequest={() => setAddingToList('wishlist')} onRemove={handleRemoveCountry} />
            </div>

            {/* Section 3: Search UI (only appears on our own profile) */}
            {isOwnProfile && addingToList && (
                <CountrySearch
                    allCountries={allCountries}
                    existingCodes={addingToList === 'visited' ? finalVisited.map(c => c.code) : finalWishlist.map(c => c.code)}
                    onSelectCountry={handleAddCountry}
                    onCancel={() => setAddingToList(null)}
                />
            )}

            {/* Section 4: User's Posts */}
            <div className="p-4">
                <h3 className="mb-3">Posts by {profileData.fullName}</h3>
                {userPosts.map(post => (
                    <PostCard
                        key={post._id}
                        post={post}
                        currentUserMongoId={mongoUser?._id}
                        onUpdate={handleUpdatePost}
                        onDelete={handleDeletePost}
                        onNavigateToProfile={onNavigateToProfile}
                    />
                ))}
            </div>
        </div>
    );
}