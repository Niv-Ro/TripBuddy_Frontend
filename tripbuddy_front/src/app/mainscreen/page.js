"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProfilePage from "@/components/profile/ProfilePage";
import MapView from "@/components/map/MapView";
import Chats from "@/components/chat/ChatPage";
import Feed from "@/app/feed/page";
import UserSearch from "@/components/groups/UserSearch";
import GroupsPage from "@/components/groups/GroupsPage";
import GroupView from "@/components/groups/GroupView";
import Sidebar from "./sidebar";
import useCountries from "@/hooks/useCountries";
import axios from "axios";

export default function MainScreenPage() {
    const { mongoUser, loading, logout, refetchMongoUser } = useAuth();
    const [viewedUserId, setViewedUserId] = useState(null);
    const [viewedGroupId, setViewedGroupId] = useState(null);

    const allCountries = useCountries();

    //One true source of the 2 lists, to use in any child component necessary
    const [visitedCountries, setVisitedCountries] = useState([]);
    const [wishlistCountries, setWishlistCountries] = useState([]);

    //Sets the page as the last page viewed by the user, to support stability on refreshes
    const [view, setView] = useState(() => {
        // This check prevents errors during server-side rendering where `window` does not exist.
        if (typeof window !== 'undefined') {
            const savedView = localStorage.getItem('currentView');
            // If a view is found in localStorage, use it. Otherwise, default to 'feed'.
            return savedView || 'feed';
        }
        // Default value for the server-side render.
        return 'feed';
    });

    // Saves the current view to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('currentView', view);
    }, [view]);

    // When the user logs in, set their own profile ID as the default to be viewed.
    useEffect(() => {
        if (mongoUser && !viewedUserId) {
            setViewedUserId(mongoUser._id);
        }
    }, [mongoUser, viewedUserId]);

    // This effect populates the local country lists from the global mongoUser object
    //Only an indicator of each country is saved on DB, this will insert the entire object of the country to use name,flags, etc..
    useEffect(() => {
        if (mongoUser && allCountries.length > 0) {
            const visited = mongoUser.visitedCountries?.map(code =>
                allCountries.find(c => c.code3 === code)) || [];
            const wishlist = mongoUser.wishlistCountries?.map(code => allCountries.find(c =>
                c.code3 === code))|| [];
            setVisitedCountries(visited);
            setWishlistCountries(wishlist);
        }
    }, [mongoUser, allCountries]);

    // The single handler function that updates state and saves to DB.
    const handleCountryListUpdate = async (newVisited, newWishlist) => {
        if (!mongoUser?._id) return;

        // Optimistically update the UI
        setVisitedCountries(newVisited);
        setWishlistCountries(newWishlist);

        try {
            await axios.put(`http://localhost:5000/api/users/${mongoUser._id}/country-lists`, {
                visited: newVisited.map(c => c.code3),
                wishlist: newWishlist.map(c => c.code3),
            });
            await refetchMongoUser();
        } catch (error) {
            console.error("Failed to save updated lists", error);
        }
    };

    // Navigation handler to switch to a user's profile.
    const navigateToProfile = (data) => {
        const idToView = (typeof data === 'object' && data !== null) ? data._id : data;
        if (idToView) {
            setViewedUserId(idToView);
            setView('profile');
        } else {
            console.error("Navigation to profile failed: ID is missing or invalid.", data);
        }
    };

    // Navigation handler to switch to the main groups page.
    const navigateToGroups = () => {
        setView('groups');
        setViewedGroupId(null);
    };

    // Navigation handler to switch to a specific group's view.
    const navigateToGroupView = (groupId) => {
        setViewedGroupId(groupId);
        setView('group-view');
    };

    // Show a loading spinner while the initial authentication check is in progress.
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // This switch statement acts as a client-side router, rendering the correct component.
    let Content;
    switch (view) {
        case 'feed':
            Content = <Feed onNavigateToProfile={navigateToProfile} wishlistCountries={wishlistCountries} />;
            break;
        case 'map':
            Content = <MapView
                visitedCountries={visitedCountries}
                wishlistCountries={wishlistCountries}
                onListsChange={handleCountryListUpdate}/>;
            break;
        case 'chats':
            Content = <Chats />;
            break;
        case 'profile':
            Content = viewedUserId ?
                <ProfilePage
                    key={viewedUserId}
                    userId={viewedUserId}
                    onNavigateToProfile={navigateToProfile}
                    visitedCountries={visitedCountries}
                    wishlistCountries={wishlistCountries}
                    onListsChange={handleCountryListUpdate}
                /> : <div>Loading profile...</div>;
            break;
        case 'search':
            Content = <UserSearch onUserSelect={navigateToProfile} />;
            break;
        case 'groups':
            Content = <GroupsPage onViewGroup={navigateToGroupView} />;
            break;
        case 'group-view':
            Content = <GroupView key={viewedGroupId} groupId={viewedGroupId} onBack={navigateToGroups} onNavigateToProfile={navigateToProfile} />;
            break;
        default:
            Content = <Feed onNavigateToProfile={navigateToProfile} wishlistCountries={wishlistCountries} />;
    }

    return (
        <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
            <Sidebar
                setView={setView}
                navigateToProfile={() => navigateToProfile(mongoUser?._id)}
                navigateToGroups={navigateToGroups}
                currentUserId={mongoUser?._id}
                onSignOut={logout}
            />
            <main className="flex-grow-1" style={{minWidth: 0, overflowY: 'auto'}}>
                {Content}
            </main>
        </div>
    );
}