"use client"
import React, {useEffect, useState} from "react";
import NewChatWindow from "@/components/NewChat";

function Feed() {
    const [searchTerm, setSearchTerm] = useState('');

    const allPosts = [
        'Post 1',
        'Post 2',
        'Post 3',
    ];

    const filteredPosts = allPosts.filter(post =>
        post.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="d-flex flex-column">
            {/* Top Bar (Horizontal Navigation) - Using Bootstrap classes */}
            <nav className=" bg-white border-bottom shadow-sm p-3 d-flex align-items-center">
                <h2 className="me-4 mb-0">Posts</h2>

                {/* Search input field - Using Bootstrap form-control */}
                <input
                    type="text"
                    placeholder="Search posts..."
                    className="form-control w-50 mx-auto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="ms-auto d-flex gap-2">
                    <button className="btn btn-primary">
                    {/*    className={`btn ${chatView === 'all-chats' ? 'btn-primary' : 'btn-outline-secondary'}`}*/}
                    {/*    onClick={() => setChatView('all-chats')}*/}
                    {/*>*/}
                        New post
                    </button>
                </div>
            </nav>

            {/* Main Content Area - Renders content based on chatView state */}
            <div className="flex-grow-1 overflow-y-auto p-4">
                {filteredPosts.length > 0 ? (
                    <div className="list-group">
                        {filteredPosts.map((post, index) => (
                            // Using Bootstrap's list group for a clean, clickable list
                            <button
                                key={index}
                                type="button"
                                className="list-group-item list-group-item-action "
                            >
                            {post}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted mt-4">No posts found matching "{searchTerm}".</p>
                )}
            </div>
        </div>
    )
}

export default Feed;