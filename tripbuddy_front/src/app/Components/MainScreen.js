// File: components/MainScreen.js
"use client";
import React, { useState } from "react";
import { handleSignOut } from "../services/SignOut_handle.js";
import Profile from "./Profile.js";
import MapView from "./MapView.js";
import Chats from "./Chats.js";
import Feed from "./Feed.js";
import {useNavigate} from "react-router-dom";

function MainScreen({ user }) {
    const [view, setView] = useState('feed');
    const navigate = useNavigate();

    const onSignOut = async () => {
        await handleSignOut();
        navigate('/Dashboard');
    };

    // decide which component to render
    let Content;
    switch (view) {
        case 'feed':
            Content = <Feed />;
            break;
        case 'map':
            Content = <MapView />;
            break;
        case 'chats':
            Content = <Chats />;
            break;
        case 'profile':
            Content = <Profile user={user} />;
            break;
        default:
            Content = <div><p>Select an option.</p></div>;
    }

    return (
        <div className="d-flex " style={{ width: '70vw', height: '90vh' }}>
            {/* Sidebar */}
            <nav className="bg-light border-end border-start border-top border-bottom d-flex flex-column p-3" style={{ width: '250px', height: '100%' }}>
                {/* Top: Logo, User, and Navigation Buttons */}
                <div>
                    <h2 className="mb-1">Travel Buddy</h2>
                    <span className="text-muted">{user.email}</span>
                    <div className="mt-3 d-flex flex-column">
                        <button
                            className="btn btn-outline-primary mb-2 text-start"
                            onClick={() => setView('profile')}
                        >
                            My Profile
                        </button>
                        <button
                            className="btn btn-outline-success mb-2 text-start"
                            onClick={() => setView('map')}
                        >
                            Explore Map
                        </button>
                        <button
                            className="btn btn-outline-warning mb-2 text-start"
                            onClick={() => setView('chats')}
                        >
                            Chats
                        </button>
                        <button
                            className="btn btn-outline-info mb-2 text-start"
                            onClick={() => setView('feed')}
                        >
                            Feed
                        </button>
                    </div>
                </div>

                {/* Bottom: Sign Out */}
                <div className="mt-auto">
                    <button className="btn btn-outline-danger w-100" onClick={onSignOut}>
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-grow-1 p-5 overflow-auto" style={{ height: '100%' }}>
                {Content}
            </div>
        </div>
    );
}

export default MainScreen;
