// File: components/page.js
"use client";
import React, {useEffect, useState} from "react";
import { handleSignOut } from "@/services/auth/SignOut_handle.js";
import Profile from "../../components/Profile.js";
import MapView from "../../components/MapView.js";
import Chats from "../../components/Chats.js";
import Feed from "../feed/page.js";

function Page() {
    const [view, setView] = useState('feed');

    const onSignOut = async () => {
        await handleSignOut();
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
            Content = <Profile />;
            break;
        default:
            Content = <div><p>Select an option.</p></div>;
    }

    return (
        <div className="d-flex" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <nav
                className="bg-light border-end d-flex flex-column p-3  align-items-center"
                style={{ width: '220px', height: '100vh', flexShrink: 0, overflow: 'hidden' }}
            >
                <div>
                    <h2 className="mb-1">Travel Buddy</h2>
                    <div className="mt-3 d-flex flex-column align-items-center">
                        {/* Button 1: Corrected */}
                        <button
                            className="btn mb-2 text-start"
                            onClick={() => setView('profile')}
                        >
                            {/* This wrapper handles the layout of the icon and text */}
                            <div className="d-inline-flex flex-column align-items-center">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="4" fill="#fff"/>
                                    <circle cx="32" cy="26" r="10" stroke="#555" strokeWidth="3"/>
                                    <path d="M16 50c2-10 28-10 32 0" stroke="#555" strokeWidth="3" fill="none"
                                          strokeLinecap="round"/>
                                </svg>

                                {/* The text is now below the SVG */}
                                <span className="mt-1">My Profile</span>
                            </div>
                        </button>

                        {/* Apply the same pattern to the other buttons... */}
                        <button
                            className="btn mb-2 text-start"
                            onClick={() => setView('map')}
                        >
                            <div className="d-inline-flex flex-column align-items-center">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="4" fill="#fff"/>
                                    <circle cx="32" cy="32" r="18" stroke="#555" strokeWidth="3" fill="none"/>
                                    <ellipse cx="32" cy="32" rx="18" ry="7" stroke="#555" strokeWidth="2"
                                             fill="none"/>
                                    <ellipse cx="32" cy="32" rx="7" ry="18" stroke="#555" strokeWidth="2"
                                             fill="none"/>
                                    <line x1="14" y1="32" x2="50" y2="32" stroke="#555" strokeWidth="2"/>
                                </svg>
                                <span className="mt-1">Explore Map</span>
                            </div>
                        </button>

                        <button
                            className="btn mb-2 text-start"
                            onClick={() => setView('chats')}
                        >
                            <div className="d-inline-flex flex-column align-items-center">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="4" fill="#fff"/>
                                    <rect x="18" y="22" width="28" height="16" rx="5" stroke="#555" strokeWidth="3"
                                          fill="none"/>
                                    <polygon points="32,43 38,38 26,38" fill="#7863ad"/>
                                    <circle cx="25" cy="30" r="2" fill="#7863ad"/>
                                    <circle cx="32" cy="30" r="2" fill="#7863ad"/>
                                    <circle cx="39" cy="30" r="2" fill="#7863ad"/>
                                </svg>
                                <span className="mt-1">Chats</span>
                            </div>
                        </button>

                        <button
                            className="btn mb-2 text-start"
                            onClick={() => setView('feed')}
                        >
                            <div className="d-inline-flex flex-column align-items-center">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="4" fill="#fff"/>
                                    <rect x="20" y="23" width="24" height="21" rx="4" stroke="#555" strokeWidth="3"
                                          fill="none"/>
                                    <rect x="24" y="26" width="16" height="4" rx="2" fill="#555"/>
                                    <rect x="24" y="32" width="12" height="4" rx="2" fill="#555"/>
                                    <rect x="24" y="38" width="8" height="4" rx="2" fill="#555"/>
                                </svg>
                                <span className="mt-1">Feed</span>
                            </div>
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
            <div
                className="flex-grow-1"
                style={{
                    height: '100vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    background: '#f8f9fa',
                }}
            >
                {Content}
            </div>
        </div>
    );
}

export default Page;
