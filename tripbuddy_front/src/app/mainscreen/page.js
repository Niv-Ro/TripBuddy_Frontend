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
    const {mongoUser, loading, logout,refetchMongoUser} = useAuth();
    const [viewedUserId, setViewedUserId] = useState(null);
    const [viewedGroupId, setViewedGroupId] = useState(null);

    const allCountries = useCountries();
    // To pass for relevant pages and maintain only one list to prevent un-necessary server calls
    const [visitedCountries, setVisitedCountries] = useState([]);
    const [wishlistCountries, setWishlistCountries] = useState([]);

    //Default page will set to feed page, if not feed, loads the last viewed page
    const [view, setView] = useState(() => {
        return localStorage.getItem('currentView') || 'feed';
    });

    //Saves the current page, when user refreshes they stay on the same page, with the help of local storage
    useEffect(() => {
        localStorage.setItem('currentView', view);
    }, [view]);

    //When user logs in, sets their own profile as the default profile to view
    useEffect(() => {
        if (mongoUser && !viewedUserId) {
            setViewedUserId(mongoUser._id);
        }
    }, [mongoUser, viewedUserId]);

    //When one of the lists has changed, update the local list
    useEffect(() => {
        if (mongoUser && allCountries.length > 0) {
            const visited = mongoUser.visitedCountries?.map(code => allCountries.find(c => c.code3 === code)).filter(Boolean) || [];
            const wishlist = mongoUser.wishlistCountries?.map(code => allCountries.find(c => c.code3 === code)).filter(Boolean) || [];
            setVisitedCountries(visited);
            setWishlistCountries(wishlist);
        }
    }, [mongoUser, allCountries]);

    //Saves the new list to the DB
    const handleCountryListUpdate = async (newVisited, newWishlist) => {
        if (!mongoUser?._id) return;
        try {
            await axios.put(`http://localhost:5000/api/users/${mongoUser._id}/country-lists`, {
                visited: newVisited.map(c => c.code3),
                wishlist: newWishlist.map(c => c.code3),
            });
            refetchMongoUser();
        } catch (error) {
            console.error("Failed to save updated lists", error);
        }
    };



    // Navigation handler function passed as a prop to child components.
    // It changes the view to 'profile' and sets the ID of the user to display.
    const navigateToProfile = (data) => {
        const idToView = (typeof data === 'object' && data !== null) ? data._id : data;
        if (idToView) {
            setViewedUserId(idToView);
            setView('profile');
        } else {
            console.error("Navigation to profile failed: ID is missing or invalid.", data);
        }
    };

    //Switches to groups list page
    const navigateToGroups = () => {
        setView('groups');
        setViewedGroupId(null);
    };

    //Switches to group detail page
    const navigateToGroupView = (groupId) => {
        setViewedGroupId(groupId);
        setView('group-view');
    };

    // Show loading while auth is being determined
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

    //Passes navigation functions to child components so they can navigate to other pages
    let Content;
    switch (view) {
        case 'feed':
            Content = <Feed onNavigateToProfile={navigateToProfile} />;
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
            // whenever the viewedUserId (key) changes, forcing react to re-mount and re-fetch data.
            Content = viewedUserId ?
                <ProfilePage
                                key={viewedUserId}
                                userId={viewedUserId}
                                onNavigateToProfile={navigateToProfile}
                                visitedCountries={visitedCountries}
                                wishlistCountries={wishlistCountries}
                                onListsChange={handleCountryListUpdate}/> : <div>Loading profile...</div>;
            break;
        case 'search':
            Content = <UserSearch onUserSelect={navigateToProfile} />;
            break;
        case 'groups':
            Content = <GroupsPage onViewGroup={navigateToGroupView} />;
            break;
        case 'group-view':
            Content = <GroupView key={viewedGroupId}
                                 groupId={viewedGroupId}
                                 onBack={navigateToGroups}
                                 onNavigateToProfile={navigateToProfile} />;
            break;
        default:
            Content = <Feed onNavigateToProfile={navigateToProfile} />;
    }

    return (
        <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
            <Sidebar
                setView={setView}
                navigateToProfile={navigateToProfile}
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