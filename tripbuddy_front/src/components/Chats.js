"use client";
import React, { useState } from "react";
import NewChatWindow from "./NewChat";

function Chats() {
    const [searchTerm, setSearchTerm] = useState('');
    const [chatView, setChatView] = useState('all-chats'); // State to switch between views

    const allConversations = [
        'Chat with Alice',
        'Chat with Bob',
        'Group: Travel Plans',
    ];

    const filteredConversations = allConversations.filter(chat =>
        chat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="d-flex flex-column">
            {/* Top Bar (Horizontal Navigation) - Using Bootstrap classes */}
            <nav className=" bg-white border-bottom shadow-sm p-3 d-flex align-items-center">
                <h2 className="me-4 mb-0">Chats</h2>

                {/* Search input field - Using Bootstrap form-control */}
                <input
                    type="text"
                    placeholder="Search conversations..."
                    className="form-control w-50 mx-auto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Buttons for navigation - Using Bootstrap buttons and gap utility */}
                <div className="ms-auto d-flex gap-2">
                    <button
                        className={`btn ${chatView === 'all-chats' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setChatView('all-chats')}
                    >
                        All Chats
                    </button>
                    <button
                        className={`btn ${chatView === 'new-chat' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setChatView('new-chat')}
                    >
                        New Chat
                    </button>
                </div>
            </nav>

            {/* Main Content Area - Renders content based on chatView state */}
            <div className="flex-grow-1 overflow-y-auto p-4">
                {chatView === 'all-chats' && (
                    <>
                        <h3 className="mb-4">All Chats</h3>
                        {filteredConversations.length > 0 ? (
                            <div className="list-group">
                                {filteredConversations.map((chat, index) => (
                                    // Using Bootstrap's list group for a clean, clickable list
                                    <button
                                        key={index}
                                        type="button"
                                        className="list-group-item list-group-item-action "
                                    >
                                        {chat}
                                        <span className="badge text-bg-secondary ms-2">4</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted mt-4">No conversations found matching "{searchTerm}".</p>
                        )}
                    </>
                )}

                {chatView === 'new-chat' && <NewChatWindow />}
            </div>
        </div>
    );
}

export default Chats;