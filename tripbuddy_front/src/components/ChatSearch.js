"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

function ChatSearch({ onChatSelect, onBack, myChats = [] }) {
    const { mongoUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Get IDs of chats user is already a member of - memoized to prevent infinite re-renders
    const myChatsIds = useMemo(() => myChats.map(chat => chat._id), [myChats]);

    // Search for public chats and filter out user's existing chats
    useEffect(() => {
        if (searchTerm.trim()) {
            setIsSearching(true);
            const delayedSearch = setTimeout(async () => {
                try {
                    const response = await axios.get('http://localhost:5000/api/chats/search', {
                        params: {
                            userId: mongoUser._id,
                            query: searchTerm
                        }
                    });
                    // Filter out chats the user is already a member of
                    const filteredResults = response.data.filter(chat => !myChatsIds.includes(chat._id));
                    setSearchResults(filteredResults);
                } catch (error) {
                    console.error('Error searching chats:', error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 300); // Debounce search

            return () => clearTimeout(delayedSearch);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, mongoUser._id, myChatsIds]);

    const handleChatBrowserModeChange = (mode) => {
        // Remove this function as we no longer need mode switching
    };

    const getChatName = (chat) => {
        if (chat.isGroupChat) return chat.name;
        if (!mongoUser || !chat.members) return "Chat";
        const otherUser = chat.members.find(m => m.user?._id !== mongoUser._id)?.user;
        return otherUser?.fullName || "Chat";
    };

    // Get the chats to display - only search results (chats user is not a member of)
    const displayChats = searchResults;

    return (
        <div className="d-flex flex-column h-100">
            {/* Header with search and toggle */}
            <div className="p-3 border-bottom bg-white">
                <div className="d-flex align-items-center gap-3 mb-3">
                    <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
                        <i className="bi bi-arrow-left"></i> Back
                    </button>
                    <h5 className="mb-0">Find Chats</h5>
                </div>

                {/* Search Input */}
                <div className="d-flex gap-2 align-items-center">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search for public group chats to join..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Description */}
                <small className="text-muted d-block mt-2">
                    Discover and join public group chats that you're not already a member of
                </small>
            </div>

            {/* Chat List */}
            <div className="flex-grow-1 overflow-auto">
                {!searchTerm.trim() ? (
                    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                        <div className="text-center">
                            <i className="bi bi-search display-4 d-block mb-3"></i>
                            <p className="lead mb-0">Start typing to search for public group chats</p>
                        </div>
                    </div>
                ) : isSearching ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Searching...</span>
                        </div>
                    </div>
                ) : displayChats.length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                        <div className="text-center">
                            <i className="bi bi-inbox display-4 d-block mb-3"></i>
                            <p className="lead mb-0">No new group chats found</p>
                            <small className="text-muted">Try searching with different keywords</small>
                        </div>
                    </div>
                ) : (
                    <div className="list-group list-group-flush">
                        {displayChats.map(chatItem => {
                            const chatName = getChatName(chatItem);
                            const memberCount = chatItem.members?.length || 0;
                            const otherUser = !chatItem.isGroupChat && chatItem.members ?
                                chatItem.members.find(m => m.user?._id !== mongoUser?._id)?.user : null;

                            return (
                                <div
                                    key={chatItem._id}
                                    className="list-group-item list-group-item-action p-0"
                                    onClick={() => onChatSelect(chatItem)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center p-3">
                                        {/* Chat Avatar */}
                                        {chatItem.isGroupChat ? (
                                            <div className="chat-avatar bg-secondary text-white">👥</div>
                                        ) : (
                                            <img
                                                src={otherUser?.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                                                alt={otherUser?.fullName}
                                                className="chat-avatar"
                                            />
                                        )}

                                        {/* Chat Info */}
                                        <div className="ms-3 flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <h6 className="mb-1 text-truncate">{chatName}</h6>
                                                <span className="badge bg-primary">
                                                    <i className="bi bi-plus-circle me-1"></i>
                                                    Join
                                                </span>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    {chatItem.isGroupChat && (
                                                        <small className="text-muted d-block">
                                                            <i className="bi bi-people me-1"></i>
                                                            {memberCount} member{memberCount !== 1 ? 's' : ''}
                                                        </small>
                                                    )}
                                                    {chatItem.latestMessage ? (
                                                        <small className="text-muted text-truncate d-block">
                                                            Recent: {chatItem.latestMessage.content}
                                                        </small>
                                                    ) : (
                                                        <small className="text-muted fst-italic">No messages yet</small>
                                                    )}
                                                </div>

                                                {chatItem.latestMessage && (
                                                    <small className="text-muted">
                                                        {new Date(chatItem.updatedAt).toLocaleDateString()}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* CSS for chat avatar */}
            <style jsx>{`
                .chat-avatar {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    object-fit: cover;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                .list-group-item-action:hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </div>
    );
}

export default ChatSearch;