'use client';

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useParams } from 'next/navigation'; // 🔥 FIX 1: Import the correct hook
import useCountries from "@/hooks/useCountries.js";
import PostCard from "@/components/PostCard";
import CountryList from "@/components/CountryList"; // Ensure path is correct
import CountrySearch from "@/components/CountrySearch"; // Ensure path is correct
import '@/styles/Style.css';

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

// This component no longer receives 'params' in the function signature
export default function UserProfilePage() {
    // 🔥 FIX 1: Get params using the hook inside the component
    const params = useParams();
    const userId = params.userId;

    const { mongoUser, user } = useAuth();
    const allCountries = useCountries();

    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    const [visitedCountries, setVisitedCountries] = useState([]);
    const [wishlistCountries, setWishlistCountries] = useState([]);
    const [addingToList, setAddingToList] = useState(null);
    const initialLoad = useRef(true);

    const isOwnProfile = mongoUser?._id === userId;

    useEffect(() => {
        setIsClient(true);
        if (!userId) return;

        axios.get(`http://localhost:5000/api/users/id/${userId}`)
            .then(res => {
                const userData = res.data;
                setProfileData(userData);

                if (isOwnProfile && allCountries.length > 0) {
                    setVisitedCountries(userData.visitedCountries?.map(code => allCountries.find(c => c.code3 === code)).filter(Boolean) || []);
                    setWishlistCountries(userData.wishlistCountries?.map(code => allCountries.find(c => c.code3 === code)).filter(Boolean) || []);
                }

                return axios.get(`http://localhost:5000/api/posts/user/${userId}`);
            })
            .then(postRes => setUserPosts(postRes.data))
            .catch(err => {
                console.error("Failed to load profile for user ID:", userId, err);
                setProfileData({ error: true });
            })
            .finally(() => { setLoading(false); initialLoad.current = false; });
    }, [userId, allCountries, isOwnProfile]);

    useEffect(() => {
        if (!isOwnProfile || initialLoad.current || !user?.email) return;
        axios.put(`http://localhost:5000/api/users/${user.email}/country-lists`, {
            visited: visitedCountries.map(c => c.code3),
            wishlist: wishlistCountries.map(c => c.code3)
        }).catch(err => console.error("Failed to save lists", err));
    }, [visitedCountries, wishlistCountries, isOwnProfile, user]);

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
    const handleDeletePost = async (postId) => { if (isOwnProfile) { /* ... delete logic ... */ } };
    const handleUpdatePost = (updatedPost) => { setUserPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p)); };
    function getAge(dateString) { if (!dateString) return ''; const today = new Date(); const birthDate = new Date(dateString); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; } return age; }

    if (loading) return <ProfileSkeleton />;
    if (!profileData || profileData.error) return <div className="p-4 text-danger">Profile not found.</div>;

    const finalVisited = isOwnProfile ? visitedCountries : (profileData.visitedCountries?.map(c => allCountries.find(ac => ac.code3 === c)).filter(Boolean) || []);
    const finalWishlist = isOwnProfile ? wishlistCountries : (profileData.wishlistCountries?.map(c => allCountries.find(ac => ac.code3 === c)).filter(Boolean) || []);

    return (
        <div>
            <nav className="navbar navbar-light border-bottom py-3 px-4">
                <div className="d-flex align-items-center w-100">
                    <div style={{ width: 200, height: 200, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                        <img src={profileData.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: "cover" }} />
                    </div>
                    <div className="ms-4">
                        <h1 className="py-2 mb-1">{profileData.fullName}</h1>
                        {/* 🔥 FIX 2: Correctly display age for any profile */}
                        <h5 className="mb-0">Age: {isClient ? getAge(profileData.birthDate) : '...'}</h5>
                    </div>
                </div>
            </nav>

            <div className="p-3 border-bottom">
                <CountryList title="Countries Visited" countries={finalVisited} isOwnProfile={isOwnProfile} onAddRequest={() => setAddingToList('visited')} onRemove={handleRemoveCountry} />
                <CountryList title="My Wishlist" countries={finalWishlist} isOwnProfile={isOwnProfile} onAddRequest={() => setAddingToList('wishlist')} onRemove={handleRemoveCountry} />
            </div>

            {isOwnProfile && addingToList && ( <CountrySearch allCountries={allCountries} existingCodes={[]} onSelectCountry={handleAddCountry} onCancel={() => setAddingToList(null)} /> )}

            <div className="p-4">
                <h3 className="mb-3">Posts by {profileData.fullName}</h3>
                {userPosts.map(post => ( <PostCard key={post._id} post={post} currentUserMongoId={mongoUser?._id} onUpdate={handleUpdatePost} onDelete={handleDeletePost} /> ))}
            </div>
        </div>
    );
}
