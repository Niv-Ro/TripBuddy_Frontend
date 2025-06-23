'use client';

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries.js";
import { storage } from "@/services/fireBase.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useFileProcessor } from "@/hooks/useFileProcessor"; // ✅ 1. ייבוא ה-Hook

import FollowListModal from './FollowListModal';
import ProfileHeader from "./ProfileHeader";
import ProfileCountryLists from "./ProfileCountryLists";
import UserPostFeed from "./UserPostFeed";
import DangerZone from "./DangerZone";
import EditProfileModal from "./EditProfileModal";
import StatsModal from "./StatsModal"; // ADD THIS IMPORT

// --- Skeleton Component (for loading state) ---
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

// --- Main Page Component ---
export default function ProfilePage({ userId, onNavigateToProfile }) {
    const { mongoUser, refetchMongoUser, user } = useAuth(); // ✅ הוספת user מה-Context
    const allCountries = useCountries();
    const { processFiles, processedFiles, isProcessing: isCompressing } = useFileProcessor(); // ✅ 2. שימוש ב-Hook

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
    const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', list: [] });

    const [bioInput, setBioInput] = useState('');
    const [profileImageInput, setProfileImageInput] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // ADD ONLY THIS ONE STATE FOR STATS
    const [isShowingStats, setIsShowingStats] = useState(false);

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
            .catch(err => {
                console.error("Failed to fetch profile data", err);
                setProfileData({ error: true });
            })
            .finally(() => { setLoading(false); });
    }, [userId, mongoUser?._id, allCountries.length, isOwnProfile]);

    useEffect(() => {
        setIsClient(true);
        fetchProfileData();
        const timer = setTimeout(() => { initialLoad.current = false; }, 1000);
        return () => clearTimeout(timer);
    }, [userId, fetchProfileData]);

    useEffect(() => {
        if (!isOwnProfile || initialLoad.current || !mongoUser?.email) return;
        const visitedCca3 = visitedCountries.map(c => c.code3);
        const wishlistCca3 = wishlistCountries.map(c => c.code3);
        axios.put(`http://localhost:5000/api/users/${mongoUser._id}/country-lists`, {
            visited: visitedCca3,
            wishlist: wishlistCca3,
            visitedCcn3: visitedCountries.map(c => c.name),
            wishlistCcn3: wishlistCountries.map(c => c.name),
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

            const imageToUpload = processedFiles.length > 0 ? processedFiles[0] : null;

            if (imageToUpload && user?.uid && mongoUser?.email) {
                if (profileImageUrl && profileImageUrl.includes("firebase")) {
                    try { await deleteObject(ref(storage, profileImageUrl)); } catch (err) { console.warn("Old image deletion failed:", err.message); }
                }

                const userFullName = mongoUser.fullName.replace(/\s+/g, '_');
                const userEmail = mongoUser.email;
                const imageRef = ref(storage, `profile_images/${userFullName}_(${userEmail})`);

                await uploadBytes(imageRef, imageToUpload);
                profileImageUrl = await getDownloadURL(imageRef);
            }

            await axios.put(`http://localhost:5000/api/users/${userId}/bio`, { bio: bioInput, profileImageUrl });

            await refetchMongoUser();
            fetchProfileData();
            setIsEditingProfile(false);
        } catch (err) {
            console.error("Failed to update profile", err);
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const openFollowModal = (type) => {
        if (type === 'followers' && profileData?.followers) {
            setModalData({ title: 'Followers', list: profileData.followers });
            setIsFollowModalOpen(true);
        } else if (type === 'following' && profileData?.following) {
            setModalData({ title: 'Following', list: profileData.following });
            setIsFollowModalOpen(true);
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

    const handleDeleteProfile = async () => {
        if (!isOwnProfile || !mongoUser) return;
        const confirmationText = 'DELETE MY ACCOUNT';
        const promptMessage = `This action is irreversible. It will delete your profile, posts, comments, and all associated data permanently.\n\nPlease type "${confirmationText}" to confirm.`;
        const userInput = window.prompt(promptMessage);

        if (userInput === confirmationText) {
            try {
                await axios.delete(`http://localhost:5000/api/users/${mongoUser._id}`, {
                    data: { firebaseUid: mongoUser.firebaseUid }
                });
                alert("Your account has been deleted successfully.");
                window.location.href = '/login';
            } catch (error) {
                console.error("Failed to delete account:", error);
                alert("An error occurred while deleting your account. Please try again.");
            }
        } else if (userInput !== null) {
            alert("Account deletion cancelled.");
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

    return (
        <div>
            <ProfileHeader
                profileData={profileData}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                isClient={isClient}
                getAge={getAge}
                onFollowToggle={handleFollowToggle}
                onOpenFollowModal={openFollowModal}
                onEdit={() => {
                    setBioInput(profileData.bio || '');
                    setProfileImageInput(null);
                    setIsEditingProfile(true);
                }}
                onShowStats={() => setIsShowingStats(true)}
            />

            <ProfileCountryLists
                isOwnProfile={isOwnProfile}
                visitedCountries={visitedCountries}
                wishlistCountries={wishlistCountries}
                addingToList={addingToList}
                allCountries={allCountries}
                onAddRequest={setAddingToList}
                onRemove={handleRemoveCountry}
                onSelectCountry={handleAddCountry}
                onCancelAdd={() => setAddingToList(null)}
            />

            <UserPostFeed
                posts={userPosts}
                profileName={profileData.fullName}
                currentUserMongoId={mongoUser?._id}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
                onNavigateToProfile={onNavigateToProfile}
            />

            {isOwnProfile && <DangerZone onDeleteProfile={handleDeleteProfile} />}

            <EditProfileModal
                isOpen={isEditingProfile}
                onClose={() => setIsEditingProfile(false)}
                onSave={handleEditProfileSave}
                isSaving={isSaving || isCompressing}
                bioInput={bioInput}
                onBioChange={(e) => setBioInput(e.target.value)}
                onImageChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        setProfileImageInput(e.target.files[0]); // Keep original file for the hook
                        processFiles([e.target.files[0]], { maxWidth: 400, maxHeight: 400, quality: 0.9 });
                    }
                }}
            />

            <StatsModal
                isOpen={isShowingStats}
                onClose={() => setIsShowingStats(false)}
                userId={userId}
                isOwnProfile={isOwnProfile}
            />

            <FollowListModal
                isOpen={isFollowModalOpen}
                onClose={() => setIsFollowModalOpen(false)}
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