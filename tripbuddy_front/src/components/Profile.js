'use client';

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries.js";
import PostCard from "@/components/PostCard";
import CountryList from "./CountryList";
import CountrySearch from "./CountrySearch";
import '../styles/Style.css';
import { storage } from "@/services/fireBase.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import FollowListModal from './FollowListModal';

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

export default function Profile({ userId, onNavigateToProfile }) {
    const { mongoUser, refetchMongoUser } = useAuth();
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
    const [isFollowing, setIsFollowing] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [bioInput, setBioInput] = useState('');
    const [profileImageInput, setProfileImageInput] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', list: [] });

    const fetchProfileData = useCallback(() => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        axios.get(`http://localhost:5000/api/users/id/${userId}`)
            .then(res => {
                const userData = res.data;
                setProfileData(userData);
                if (mongoUser && userData.followers) {
                    setIsFollowing(userData.followers.some(follower => follower._id === mongoUser._id));
                }
                if (isOwnProfile && allCountries.length > 0) {
                    setVisitedCountries(userData.visitedCountries?.map(code => allCountries.find(c => c.code3 === code)).filter(Boolean) || []);
                    setWishlistCountries(userData.wishlistCountries?.map(code => allCountries.find(c => c.code3 === code)).filter(Boolean) || []);
                }
                return axios.get(`http://localhost:5000/api/posts/user/${userId}`);
            })
            .then(postRes => { setUserPosts(postRes.data); })
            .catch(err => { setProfileData({ error: true }); })
            .finally(() => { setLoading(false); });
    }, [userId, mongoUser, isOwnProfile, allCountries]);

    useEffect(() => {
        setIsClient(true);
        fetchProfileData();
        const timer = setTimeout(() => { initialLoad.current = false; }, 1000);
        return () => clearTimeout(timer);
    }, [userId, fetchProfileData]);

    useEffect(() => {
        if (!isOwnProfile || initialLoad.current || !mongoUser?._id) return;
        const visitedCca3 = visitedCountries.map(c => c.code3);
        const wishlistCca3 = wishlistCountries.map(c => c.code3);
        axios.put(`http://localhost:5000/api/users/${mongoUser._id}/country-lists`, {
            visited: visitedCca3,
            wishlist: wishlistCca3,
        }).then(() => {
            refetchMongoUser();
        }).catch(err => console.error("Failed to save lists", err));
    }, [visitedCountries, wishlistCountries, isOwnProfile, mongoUser, refetchMongoUser]);

    const handleAddCountry = (country) => {
        if (!isOwnProfile || !addingToList) return;
        const list = addingToList === 'visited' ? visitedCountries : wishlistCountries;
        const setList = addingToList === 'visited' ? setVisitedCountries : setWishlistCountries;
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
        if (isOwnProfile && window.confirm("Are you sure?")) {
            await axios.delete(`http://localhost:5000/api/posts/${postId}`);
            setUserPosts(prev => prev.filter(p => p._id !== postId));
        }
    };

    const handleUpdatePost = (updatedPost) => {
        setUserPosts(prev => prev.map(p => (p._id === updatedPost._id ? updatedPost : p)));
    };

    const handleFollowToggle = async () => {
        if (!mongoUser) return;
        try {
            await axios.post(`http://localhost:5000/api/users/${userId}/follow`, { loggedInUserId: mongoUser._id });
            await refetchMongoUser();
            fetchProfileData();
        } catch (error) { console.error("Failed to toggle follow", error); }
    };

    const handleEditProfileSave = async () => {
        setIsSaving(true);
        try {
            let profileImageUrl = profileData.profileImageUrl;
            if (profileImageInput) {
                if (profileImageUrl && profileImageUrl.includes("firebase")) {
                    try { await deleteObject(ref(storage, profileImageUrl)); } catch (err) { console.warn("Could not delete old image:", err.message); }
                }
                const imageRef = ref(storage, `profileImages/${mongoUser._id}_${Date.now()}`);
                await uploadBytes(imageRef, profileImageInput);
                profileImageUrl = await getDownloadURL(imageRef);
            }
            await axios.put(`http://localhost:5000/api/users/${userId}/bio`, { bio: bioInput, profileImageUrl });
            await refetchMongoUser();
            fetchProfileData();
            setIsEditingProfile(false);
        } catch (err) { alert('Failed to update profile'); }
        setIsSaving(false);
    };

    const openFollowModal = (type) => {
        if (type === 'followers' && profileData?.followers) {
            setModalData({ title: 'Followers', list: profileData.followers });
            setIsModalOpen(true);
        } else if (type === 'following' && profileData?.following) {
            setModalData({ title: 'Following', list: profileData.following });
            setIsModalOpen(true);
        }
    };

    const handleUnfollowFromModal = async (userIdToUnfollow) => {
        try {
            await axios.post(`http://localhost:5000/api/users/${userIdToUnfollow}/follow`, { loggedInUserId: mongoUser._id });
            await refetchMongoUser();
            setModalData(prev => ({ ...prev, list: prev.list.filter(user => user._id !== userIdToUnfollow) }));
            fetchProfileData();
        } catch (error) { console.error("Failed to unfollow from modal", error); }
    };

    function getAge(dateString) { if (!dateString) return ''; const today = new Date(); const birthDate = new Date(dateString); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; } return age; }

    if (loading) return <ProfileSkeleton />;
    if (!profileData || profileData.error) return <div className="p-4 text-danger">Profile not found.</div>;

    const finalVisited = isOwnProfile ? visitedCountries : (profileData.visitedCountries?.map(c => allCountries.find(ac => ac.code3 === c)).filter(Boolean) || []);
    const finalWishlist = isOwnProfile ? wishlistCountries : (profileData.wishlistCountries?.map(c => allCountries.find(ac => ac.code3 === c)).filter(Boolean) || []);

    return (
        <div>
            <nav className="navbar navbar-light border-bottom py-3 px-4">
                <div className="d-flex align-items-start w-100 position-relative">
                    <div style={{width: 200, height: 200, borderRadius: "50%", overflow: "hidden", flexShrink: 0}}>
                        <img src={profileData.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'} alt="Profile" style={{width: '100%', height: '100%', objectFit: "cover"}} />
                    </div>
                    <div className="ms-4 flex-grow-1">
                        <div className="d-flex align-items-center mb-2" style={{gap: 16}}>
                            <h1 className="mb-0" style={{fontSize: '2.1rem',color: 'black',textShadow: '0 0 3px #000000'}}>{profileData.fullName}</h1>
                            {!isOwnProfile && mongoUser && (<button className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} ms-3`} onClick={handleFollowToggle}>{isFollowing ? 'Unfollow' : 'Follow'}</button>)}
                        </div>
                        <div className="d-flex align-items-center" style={{gap: '1.5rem', cursor: 'pointer'}}>
                            <span className="text-muted" onClick={() => openFollowModal('followers')}><strong>{profileData.followers?.length || 0}</strong> Followers</span>
                            <span className="text-muted" onClick={() => openFollowModal('following')}><strong>{profileData.following?.length || 0}</strong> Following</span>
                        </div>
                        <div className="d-flex flex-wrap mt-2" style={{gap: '1.5rem'}}>
                            <span><b>Country:</b> {profileData.countryOrigin}</span>
                            <span><b>Gender:</b> {profileData.gender}</span>
                            <span><b>Age:</b> {isClient ? getAge(profileData.birthDate) : '...'}</span>
                        </div>
                        <h5 className="fw-bold mb-2 my-2">Bio</h5>
                        <div className="border rounded bg-light p-2" style={{ minHeight: 60, maxHeight: 100, maxWidth: 400, overflowY: 'auto' }}>
                            <p style={{whiteSpace: 'pre-line', marginBottom: 0}}>{profileData.bio || (isOwnProfile ? "Add something about yourself..." : "No bio yet.")}</p>
                        </div>
                    </div>
                    {isOwnProfile && (<div style={{position: "absolute", top: 0, right: 0}}><button className="btn btn-outline-primary" onClick={() => { setBioInput(profileData.bio || ''); setProfileImageInput(null); setIsEditingProfile(true); }}>Edit Profile</button></div>)}
                </div>
            </nav>

            <div className="p-3 border-bottom">
                {/* ✅ התיקון: העבר את המשתנים הנכונים לרכיב */}
                <CountryList title="Countries Visited" countries={finalVisited} isOwnProfile={isOwnProfile} onAddRequest={() => setAddingToList('visited')} onRemove={handleRemoveCountry}/>
                <CountryList title="My Wishlist" countries={finalWishlist} isOwnProfile={isOwnProfile} onAddRequest={() => setAddingToList('wishlist')} onRemove={handleRemoveCountry}/>
            </div>

            {isOwnProfile && addingToList && ( <CountrySearch allCountries={allCountries} existingCodes={addingToList === 'visited' ? visitedCountries.map(c => c.code) : wishlistCountries.map(c => c.code)} onSelectCountry={handleAddCountry} onCancel={() => setAddingToList(null)}/>)}

            <div className="p-4">
                <h3 className="mb-3">Posts by {profileData.fullName}</h3>
                {userPosts.map(post => ( <PostCard key={post._id} post={post} currentUserMongoId={mongoUser?._id} onUpdate={handleUpdatePost} onDelete={handleDeletePost} onNavigateToProfile={onNavigateToProfile}/>))}
            </div>

            {isOwnProfile && isEditingProfile && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close-btn" onClick={() => setIsEditingProfile(false)}>&times;</button>
                        <h5>Edit Profile</h5>
                        <label className="form-label mt-3">Bio</label>
                        <textarea className="form-control mb-3" rows="3" value={bioInput} onChange={e => setBioInput(e.target.value)} />
                        <label className="form-label">Profile Picture</label>
                        <input type="file" className="form-control mb-3" accept="image/*" onChange={e => setProfileImageInput(e.target.files[0])} />
                        <button className="btn btn-primary" onClick={handleEditProfileSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                    </div>
                </div>
            )}

            <FollowListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalData.title}
                list={modalData.list}
                isOwnProfile={isOwnProfile}
                onUnfollow={handleUnfollowFromModal}
                onNavigateToProfile={onNavigateToProfile}
                currentUserId={mongoUser?._id}
            />
        </div>
    );
}