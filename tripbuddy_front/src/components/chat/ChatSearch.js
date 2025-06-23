"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

function ChatSearch({ onChatSelect, onBack, myChats = [] }) {
    const { mongoUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false); // to know when loading

    // Get IDs of chats user is already a member of - memoized to prevent infinite re-renders
    // To filter out chats user is already in from search results
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
            }, 300); // Debounce search.
            // when user typing im waiting 300 ms and only then search.
            // if the user types again before 300 ms we will start the timeout again
            // we do this in order to minimize api calls
            // Clears timeout if user types again before 300ms
            return () => clearTimeout(delayedSearch);
        } else {
            //  If search box is empty, clear results
            setSearchResults([]);
        }
    }, [searchTerm, mongoUser._id, myChatsIds]);

    // Returns the group name, or if not a group, returns the other users name
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

            {/* Chat List, first checks if the search term is empty, second checks if we are currently searching,
            third checks if the searched chats didn't find anything,
            forth when we find chats.*/}
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
                            // gets the array of members in this chat and its length
                            const memberCount = chatItem.members?.length || 0;
                            // Check if it's not a group chat and has members
                            const otherUser = !chatItem.isGroupChat && chatItem.members ?
                                // look through all members, find the member who is not the current user and get that member's user object
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
                                            /* if group use this emoji*/
                                            <div className="chat-avatar bg-secondary text-white">👥</div>
                                        ) : (
                                            /* else use the other user profile picture or the default one, and its name*/
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
                                                        /*Latest message preview or "No messages yet"*/
                                                        <small className="text-muted text-truncate d-block">
                                                            Recent: {chatItem.latestMessage.content}
                                                        </small>
                                                    ) : (
                                                        <small className="text-muted fst-italic">No messages yet</small>
                                                    )}
                                                </div>

                                                {chatItem.latestMessage && (
                                                    /*Last updated date if there are messages*/
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

        </div>
    );
}

export default ChatSearch;