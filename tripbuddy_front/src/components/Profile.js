'use client';

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries.js";

// Import helper components
import CountryList from "@/components/CountryList";
import CountrySearch from "@/components/CountrySearch";

// Import styles
import '@/styles/ProfileAdditions.css';

// It's good practice to have a skeleton component for a better loading experience
const ProfileSkeleton = () => <div className="p-4">Loading profile...</div>;

function Profile() {
    // --- State and Hooks ---
    const [data, setData] = useState(null); // For user data from Mongo
    const { user } = useAuth(); // For user auth state from Firebase
    const allCountries = useCountries(); // Full list of countries from API

    // State for the two separate country lists
    const [visitedCountries, setVisitedCountries] = useState([]);
    const [wishlistCountries, setWishlistCountries] = useState([]);

    // State to manage which list is currently being edited ('visited' or 'wishlist')
    const [addingToList, setAddingToList] = useState(null);

    // State to fix Hydration issues
    const [isClient, setIsClient] = useState(false);

    // Ref to prevent saving lists to DB on the initial component load
    const initialLoad = useRef(true);

    // --- Side Effects ---

    // Effect 1: Fetch initial profile data when component mounts or user changes
    useEffect(() => {
        // Guard clause: Don't run if we don't have the user or the full country list yet
        if (!user?.email || allCountries.length === 0) {
            return;
        }

        axios.get(`http://localhost:5000/api/users/${user.email}`)
            .then(res => {
                const userData = res.data;
                setData(userData);

                // Initialize lists from the data that came from the DB
                if (userData.visitedCountries) {
                    const initialVisited = allCountries.filter(c => userData.visitedCountries.includes(c.code3));
                    setVisitedCountries(initialVisited);
                }
                if (userData.wishlistCountries) {
                    const initialWishlist = allCountries.filter(c => userData.wishlistCountries.includes(c.code3));
                    setWishlistCountries(initialWishlist);
                }
            })
            .catch(err => {
                console.error("Failed to fetch user data:", err);
                setData({ error: "User not found" });
            })
            .finally(() => {
                // Allow saving to DB only after the initial data has been loaded
                initialLoad.current = false;
            });
    }, [user, allCountries]);

    // Effect 2: Save lists to DB automatically whenever they change
    useEffect(() => {
        // Don't save on the very first render cycle
        if (initialLoad.current || !user?.email) {
            return;
        }

        // Prepare the data (arrays of 3-letter codes) to send to the backend
        const visitedCodes = visitedCountries.map(c => c.code3);
        const wishlistCodes = wishlistCountries.map(c => c.code3);

        axios.put(`http://localhost:5000/api/users/${user.email}/country-lists`, {
            visited: visitedCodes,
            wishlist: wishlistCodes
        })
            .then(res => console.log('User lists saved successfully.'))
            .catch(err => console.error('Failed to save user lists:', err));

    }, [visitedCountries, wishlistCountries, user]); // This effect depends on these states

    // Effect 3: Fix Hydration errors for client-side only values like age
    useEffect(() => {
        setIsClient(true);
    }, []);

    // --- Handler Functions ---
    const addCountry = (country, listType) => {
        const list = listType === 'visited' ? visitedCountries : wishlistCountries;
        const setList = listType === 'visited' ? setVisitedCountries : setWishlistCountries;

// Ensure the country isn't in either list already
        if (!visitedCountries.some(c => c.code === country.code) && !wishlistCountries.some(c => c.code === country.code)) {
            setList(prev => [...prev, country]);
        }
        setAddingToList(null); // Close search UI after action
    };

    const removeCountry = (countryCode, listType) => {
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

    // --- Loading and Error States ---
    if (!data) return <ProfileSkeleton />;
    if (data.error) return <div className="p-4 text-danger">{data.error}</div>;

    // --- JSX Rendering ---
    return (
        <div>
            {/* Section 1: Main Profile Header (Restored) */}
            <nav className="navbar navbar-light border-bottom py-3 px-4">
                <div className="d-flex align-items-center w-100">
                    <div style={{ width: 200, height: 200, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                        <img
                            src={data.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: "cover" }}
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

            {/* Section 2: Reusable Country List Components */}
            <div className="p-4">
                <CountryList
                    title="Countries I've Visited"
                    countries={visitedCountries}
                    onAddRequest={() => setAddingToList('visited')}
                    onRemove={(code) => removeCountry(code, 'visited')}
                />

                <CountryList
                    title="My Wishlist"
                    countries={wishlistCountries}
                    onAddRequest={() => setAddingToList('wishlist')}
                    onRemove={(code) => removeCountry(code, 'wishlist')}
                />
            </div>

            {/* Section 3: Conditionally Rendered Search Component */}
            {addingToList && (
                <CountrySearch
                    allCountries={allCountries}
                    existingCodes={[
                        ...visitedCountries.map(c => c.code),
                        ...wishlistCountries.map(c => c.code)
                    ]}
                    onSelectCountry={(country) => addCountry(country, addingToList)}
                    onCancel={() => setAddingToList(null)}
                />
            )}
        </div>
    );
}

export default Profile;