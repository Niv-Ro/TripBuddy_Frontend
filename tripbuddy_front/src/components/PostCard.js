'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function PostCard({ post, currentUserMongoId, onUpdate, onDelete }) {
    // --- State Management ---
    const { user } = useAuth(); // User from Firebase Auth for ownership checks
    const [likes, setLikes] = useState(post?.likes || []);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    // FIX 1: State variable now correctly named 'fullscreenMedia' to hold the entire media object
    const [fullscreenMedia, setFullscreenMedia] = useState(null);

    // --- Side Effects ---
    // This effect ensures Bootstrap's JavaScript for dropdowns is loaded on the client
    useEffect(() => {
        if (typeof window !== 'undefined') {
            require('bootstrap/dist/js/bootstrap.bundle.min.js');
        }
    }, []);

    // --- Guards and Checks ---
    if (!post || !post.author) return null;

    const isOwner = user && user.uid === post.author.firebaseUid;
    const isLikedByCurrentUser = currentUserMongoId ? likes.includes(currentUserMongoId) : false;

    // --- Media Logic ---
    const hasMultipleMedia = post.media && post.media.length > 1;
    const currentMedia = post.media?.[currentMediaIndex]; // This is an object: { url, type }
    const isVideo = currentMedia?.type.startsWith('video/');

    // --- Handlers ---
    const handleLikeToggle = async () => {
        if (!currentUserMongoId) {
            alert("You must be logged in to like a post.");
            return;
        }
        const originalLikes = [...likes];
        const newLikes = isLikedByCurrentUser
            ? likes.filter(id => id !== currentUserMongoId)
            : [...likes, currentUserMongoId];
        setLikes(newLikes);

        try {
            const response = await axios.post(`http://localhost:5000/api/posts/${post._id}/like`, { userId: currentUserMongoId });
            onUpdate(response.data);
            setLikes(response.data.likes);
        } catch (error) {
            setLikes(originalLikes);
            alert("Action failed. Please try again.");
        }
    };

    const goToNext = (e) => { e.stopPropagation(); setCurrentMediaIndex(prev => (prev + 1) % post.media.length); };
    const goToPrevious = (e) => { e.stopPropagation(); setCurrentMediaIndex(prev => (prev - 1 + post.media.length) % post.media.length); };

    // --- JSX Rendering ---
    return (
        <>
            <div className="card post-card shadow-sm mb-4 mx-auto">
                {/* Header */}
                <div className="card-header bg-white d-flex align-items-center p-2">
                    <img src={post.author.profileImageUrl || 'https://i.pravatar.cc/150'} alt={post.author.fullName} className="post-author-img me-2"/>
                    <div className="d-flex flex-column">
                        <strong>{post.author.fullName}</strong>
                        <small className="text-muted">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</small>
                    </div>
                    {isOwner && (
                        <div className="dropdown ms-auto">
                            <button className="btn btn-light btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false"> ⋮ </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li><button className="dropdown-item" disabled>Edit</button></li>
                                <li><button className="dropdown-item text-danger" onClick={() => onDelete(post._id)}>Delete</button></li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Media Container */}
                <div className="media-container" onClick={() => setFullscreenMedia(currentMedia)}>
                    {currentMedia ? (
                        isVideo ? (
                            // FIX 2: Added 'controls' attribute so the video player UI shows up
                            <video src={currentMedia.url} className="post-media" controls />
                        ) : (
                            <img src={currentMedia.url} alt="Post content" className="post-media" />
                        )
                    ) : (
                        <div className="post-media d-flex align-items-center justify-content-center text-muted">No media available</div>
                    )}

                    {hasMultipleMedia && (
                        <>
                            <button className="media-nav-btn prev" onClick={goToPrevious}>‹</button>
                            <button className="media-nav-btn next" onClick={goToNext}>›</button>
                            <div className="media-counter">{currentMediaIndex + 1} / {post.media.length}</div>
                        </>
                    )}
                </div>

                {/* Card Body */}
                <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                        <button
                            className={`btn btn-sm me-2 ${isLikedByCurrentUser ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={handleLikeToggle}
                        >
                            ❤️ Like ({likes.length})
                        </button>
                        <button className="btn btn-outline-secondary btn-sm">💬 Comment ({post.comments.length})</button>
                    </div>
                    <p className="card-text">{post.text}</p>
                </div>
            </div>

            {/* Fullscreen Viewer */}
            {fullscreenMedia && (
                <div className="fullscreen-viewer" onClick={() => setFullscreenMedia(null)}>
                    <button className="close-btn">&times;</button>
                    {/* FIX 3: Check the 'type' property of the object, not the object itself */}
                    {fullscreenMedia.type.startsWith('video/') ? (
                        <video src={fullscreenMedia.url} controls autoPlay muted loop />
                    ) : (
                        <img src={fullscreenMedia.url} alt="Fullscreen content" />
                    )}
                </div>
            )}
        </>
    );
}
