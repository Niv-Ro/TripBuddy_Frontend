'use client';

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries.js";
import { storage } from "@/services/fireBase.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useFileProcessor } from "@/hooks/useFileProcessor";

// Import all the smaller, presentational components that make up this page.
import FollowListModal from './FollowListModal';
import ProfileHeader from "./ProfileHeader";
import ProfileCountryLists from "./ProfileCountryLists";
import UserPostFeed from "./UserPostFeed";
import DangerZone from "./DangerZone";
import EditProfileModal from "./EditProfileModal";
import StatsModal from "./StatsModal";

// A simple component to show while the main profile data is loading.
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

// This is the main "Container" component for the profile page.
// It receives the userId to display and a function to navigate to other profiles.
export default function ProfilePage({ userId, onNavigateToProfile, visitedCountries, wishlistCountries, onListsChange }) {

    // Gets global user data and functions from the authentication context.
    const { mongoUser, refetchMongoUser, user } = useAuth();
    // Gets the global list of all countries from a custom hook.
    const allCountries = useCountries();
    // Gets file processing logic from a custom hook.
    const { processFiles, processedFiles, isProcessing: isCompressing } = useFileProcessor();

    // State for the data of the profile being viewed.
    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);


    // UI state for managing interactions.

    const isOwnProfile = mongoUser?._id === userId; // A computed boolean to check if viewing your own profile.

    // Makes sure that all information depends on user browser (time, last window opened) is being calculated at client side after sync with server
    const [isClient, setIsClient] = useState(false);
    const [addingToList, setAddingToList] = useState(null); // Tracks if the user is adding to 'visited' or 'wishlist'.
    const initialLoad = useRef(true); // A ref to prevent effects from running on the initial render.
    const [isFollowing, setIsFollowing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // State for controlling modals.
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', list: [] });
    const [isShowingStats, setIsShowingStats] = useState(false);

    // State for the controlled inputs in the edit modal.
    const [bioInput, setBioInput] = useState('');
    const [profileImageInput, setProfileImageInput] = useState(null);


    // Main data fetching function, we use useCallback to prevent function load every render, only loads when dependencies change.
    const fetchProfileData = useCallback(() => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        // Fetches user details from the database by user id got as a prop.
        axios.get(`http://localhost:5000/api/users/id/${userId}`)
            .then(res => {
                const userData = res.data;
                setProfileData(userData);
                // After getting the data, check if the logged-in user is following this profile.
                if (mongoUser && userData.followers) {
                    setIsFollowing(userData.followers.some(follower => follower._id === mongoUser._id));
                }
            })
            .catch(err => {
                console.error("Failed to fetch profile data", err);
                setProfileData({ error: true });
            })
            .finally(() => { setLoading(false); });

        // Fetches all posts belonging to this user
        axios.get(`http://localhost:5000/api/posts/user/${userId}`)
            .then(postRes => { setUserPosts(postRes.data); })
            .catch(err => { console.error("Failed to fetch user posts", err); });

    }, [userId, mongoUser]); //Runs when the viewed profile has changed or the system user changed

    // This effect runs when the component mounts or when the userId/fetchProfileData function changes.
    // Its main job is to trigger the initial data fetch.
    useEffect(() => {
        setIsClient(true);
        fetchProfileData();
        // The timer and ref prevent the auto-save effect from running on the very first load.
        // Removing it will cause override data and deletion of user data each time
        const timer = setTimeout(() => { initialLoad.current = false; }, 1000);
        return () => clearTimeout(timer); //Prevent memory leak if object is off the screen
    }, [userId, fetchProfileData]);


    // Adds a country to the appropriate list in the local state.
    const handleAddCountry = (country) => {
        if (!isOwnProfile || !addingToList) return;

        if (addingToList === 'visited') {
            const newWishlist = wishlistCountries.filter(c => c.code !== country.code);
            const newVisited = visitedCountries.some(c => c.code === country.code) ? visitedCountries : [...visitedCountries, country];
            onListsChange(newVisited, newWishlist);
        } else { // 'wishlist'
            const newWishlist = wishlistCountries.some(c => c.code === country.code) ? wishlistCountries : [...wishlistCountries, country];
            onListsChange(visitedCountries, newWishlist);
        }
        setAddingToList(null);
    };

    const handleRemoveCountry = (countryCode, listType) => {
        if (!isOwnProfile) return;

        if (listType === 'visited') {
            const newVisited = visitedCountries.filter(c => c.code !== countryCode);
            onListsChange(newVisited, wishlistCountries);
        } else { // 'wishlist'
            const newWishlist = wishlistCountries.filter(c => c.code !== countryCode);
            onListsChange(visitedCountries, newWishlist);
        }
    };

    // Deletes a post from the DB and optimistically removes it from the UI, no need to load list again.
    const handleDeletePost = async (postId) => {
        if (isOwnProfile && window.confirm("Are you sure?")) {
            await axios.delete(`http://localhost:5000/api/posts/${postId}`);
            setUserPosts(prev => prev.filter(p => p._id !== postId));
        }
    };

    // Updates a post in the UI after it has been edited, no need to load list again, DB save is in EditPostModal .
    const handleUpdatePost = (updatedPost) => {
        setUserPosts(prev => prev.map(p => (p._id === updatedPost._id ? updatedPost : p)));
    };

    // Handles the follow/unfollow logic.
    const handleFollowToggle = async () => {
        if (!mongoUser) return;
        try {
            await axios.post(`http://localhost:5000/api/users/${userId}/follow`, { loggedInUserId: mongoUser._id });
            await refetchMongoUser();
            fetchProfileData();
        } catch (error) { console.error("Failed to toggle follow", error); }
    };

    // Handles saving both bio and profile picture changes.
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

            //Update on DB
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

    // Opens the modal to show the list of followers or following.
    const openFollowModal = (type) => {
        if (type === 'followers' && profileData?.followers) {
            setModalData({ title: 'Followers', list: profileData.followers });
            setIsFollowModalOpen(true);
        } else if (type === 'following' && profileData?.following) {
            setModalData({ title: 'Following', list: profileData.following });
            setIsFollowModalOpen(true);
        }
    };

    // Handler for the unfollow button inside the FollowListModal.
    const handleUnfollowFromModal = async (userIdToUnfollow) => {
        try {
            await axios.post(`http://localhost:5000/api/users/${userIdToUnfollow}/follow`, { loggedInUserId: mongoUser._id });
            await refetchMongoUser();
            setModalData(prev => ({ ...prev, list: prev.list.filter(user => user._id !== userIdToUnfollow) }));
            fetchProfileData();
        } catch (error) { console.error("Failed to unfollow from modal", error); }
    };

    // Handles the permanent deletion of the user's own account.
    const handleDeleteProfile = async () => {
        if (!isOwnProfile || !mongoUser) return;
        const confirmationText = 'DELETE MY ACCOUNT';
        const promptMessage = `This action is irreversible. It will delete your profile, posts, comments, and all associated data permanently.\n\nPlease type "${confirmationText}" to confirm.`;

        if (window.prompt(promptMessage) === confirmationText) {
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
        } else if (promptMessage) {
            alert("Account deletion cancelled.");
        }
    };

    // A simple function to calculate age from a birthdate.
    const getAge = (dateString) =>{
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
        //Passes necessary data for profile components as props
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
                    setProfileImageInput(null); // Clear previous file selection
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
                        setProfileImageInput(e.target.files[0]);
                        processFiles([e.target.files[0]], { maxWidth: 400, maxHeight: 400, quality: 0.9 });
                    }
                }}
            />
            <StatsModal
                isOpen={isShowingStats}
                onClose={() => setIsShowingStats(false)}
                userId={userId}
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