import React from "react";

const sidebar = ({ setView, navigateToProfile, navigateToGroups, currentUserId, onSignOut }) => (
    <nav
        className="bg-light border-end d-flex flex-column p-3 align-items-center"
        style={{ width: '220px', height: '100vh', flexShrink: 0, position: 'sticky', top: 0 }}
    >
        <div>
            <h2 className="mb-1">Travel Buddy</h2>
            <div className="mt-3 d-flex flex-column align-items-center">
                {/* Each button uses an onClick handler to call a function from the parent MainScreenPage, changing the view. */}

                <button className="btn mb-2 text-start" onClick={() => setView('feed')}>
                    <div className="d-inline-flex flex-column align-items-center">
                        <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="4" fill="#fff"/>
                            <rect x="20" y="23" width="24" height="21" rx="4" stroke="#555" strokeWidth="3" fill="none"/>
                            <rect x="24" y="26" width="16" height="4" rx="2" fill="#555"/>
                            <rect x="24" y="32" width="12" height="4" rx="2" fill="#555"/>
                            <rect x="24" y="38" width="8" height="4" rx="2" fill="#555"/>
                        </svg>
                        <span className="mt-1">Feed</span>
                    </div>
                </button>
                <button className="btn mb-2 text-start" onClick={navigateToGroups}>
                    <div className="d-inline-flex flex-column align-items-center">
                        <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="3" fill="#fff"/>
                            <circle cx="32" cy="30" r="7" stroke="#555" strokeWidth="3" fill="none"/>
                            <path d="M24 45c1-5 15-5 16 0" stroke="#555" strokeWidth="3" fill="none" strokeLinecap="round"/>
                            <circle cx="20" cy="37" r="5" stroke="#555" strokeWidth="3" fill="none"/>
                            <path d="M14 47c1-4 10-4 11 0" stroke="#555" strokeWidth="3" fill="none" strokeLinecap="round"/>
                            <circle cx="44" cy="37" r="5" stroke="#555" strokeWidth="3" fill="none"/>
                            <path d="M39 47c1-4 10-4 11 0" stroke="#555" strokeWidth="3" fill="none" strokeLinecap="round"/>
                        </svg>
                        <span className="mt-1">Travel Groups</span>
                    </div>
                </button>
                <button className="btn mb-2 text-start" onClick={() => setView('search')}>
                    <div className="d-inline-flex flex-column align-items-center">
                        <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="4" fill="#fff"/>
                            <circle cx="29" cy="29" r="10" stroke="#555" strokeWidth="3" fill="none"/>
                            <rect x="37" y="37" width="12" height="4" rx="2" transform="rotate(45 37 37)" fill="#555"/>
                        </svg>
                        <span className="mt-1">Search Buddies</span>
                    </div>
                </button>
                <button className="btn mb-2 text-start" onClick={() => setView('map')}>
                    <div className="d-inline-flex flex-column align-items-center">
                        <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="4" fill="#fff"/>
                            <circle cx="32" cy="32" r="18" stroke="#555" strokeWidth="3" fill="none"/>
                            <ellipse cx="32" cy="32" rx="18" ry="7" stroke="#555" strokeWidth="2" fill="none"/>
                            <ellipse cx="32" cy="32" rx="7" ry="18" stroke="#555" strokeWidth="2" fill="none"/>
                            <line x1="14" y1="32" x2="50" y2="32" stroke="#555" strokeWidth="2"/>
                        </svg>
                        <span className="mt-1">Explore Map</span>
                    </div>
                </button>
                <button className="btn mb-2 text-start" onClick={() => setView('chats')}>
                    <div className="d-inline-flex flex-column align-items-center">
                        <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="4" fill="#fff"/>
                            <rect x="18" y="22" width="28" height="16" rx="5" stroke="#555" strokeWidth="3" fill="none"/>
                            <polygon points="32,43 38,38 26,38" fill="#7863ad"/>
                            <circle cx="25" cy="30" r="2" fill="#7863ad"/>
                            <circle cx="32" cy="30" r="2" fill="#7863ad"/>
                            <circle cx="39" cy="30" r="2" fill="#7863ad"/>
                        </svg>
                        <span className="mt-1">Chats</span>
                    </div>
                </button>
                <button className="btn mb-2 text-start" onClick={() => navigateToProfile(currentUserId)}>
                    <div className="d-inline-flex flex-column align-items-center">
                        <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="30" stroke="#555" strokeWidth="4" fill="#fff"/>
                            <circle cx="32" cy="26" r="10" stroke="#555" strokeWidth="3"/>
                            <path d="M16 50c2-10 28-10 32 0" stroke="#555" strokeWidth="3" fill="none" strokeLinecap="round"/>
                        </svg>
                        <span className="mt-1">My Profile</span>
                    </div>
                </button>
            </div>
        </div>
        <div className="mt-auto">
            {/* mt-auto pushes this div to the bottom of the container. */}
            <button className="btn btn-outline-danger w-100" onClick={onSignOut}>Sign Out</button>
        </div>
    </nav>
);

export default sidebar;