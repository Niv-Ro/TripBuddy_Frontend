'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import EditPostModal from './EditPostModal';
import Link from 'next/link';

export default function PostCard({ post ,onNavigateToProfile , currentUserMongoId, onUpdate, onDelete }) {
    // --- State and Hooks ---
    const { user } = useAuth(); // User from Firebase Auth for ownership checks
    const [likes, setLikes] = useState(post?.likes || []);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [fullscreenMedia, setFullscreenMedia] = useState(null);
    const [comments, setComments] = useState(post.comments || []);
    const [newComment, setNewComment] = useState('');
    const isOwner = user && user.uid === post.author.firebaseUid;
    const isLikedByCurrentUser = currentUserMongoId ? likes.includes(currentUserMongoId) : false;
    const hasMultipleMedia = post.media && post.media.length > 1;
    const currentMedia = post.media?.[currentMediaIndex]; // This is an object: { url, type }
    const isVideo = currentMedia?.type.startsWith('video/');
    const goToNext = (e) => { e.stopPropagation(); setCurrentMediaIndex(prev => (prev + 1) % post.media.length); };
    const goToPrevious = (e) => { e.stopPropagation(); setCurrentMediaIndex(prev => (prev - 1 + post.media.length) % post.media.length); };


    // This effect ensures Bootstrap's JavaScript for dropdowns is loaded on the client
    useEffect(() => {
        if (typeof window !== 'undefined') {
            require('bootstrap/dist/js/bootstrap.bundle.min.js');
        }
    }, []);

    // --- Guards and Checks ---
    if (!post || !post.author) return null;

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

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserMongoId) return;
        try {
            const response = await axios.post(`http://localhost:5000/api/posts/${post._id}/comments`, {
                authorId: currentUserMongoId,
                text: newComment
            });
            setComments(prev => [...prev, response.data]);
            setNewComment(''); // אפס את תיבת הטקסט
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    return (
        <>
            <div className="card post-card shadow-sm mb-4 mx-auto">
                <div className="card-header bg-white d-flex align-items-center p-2">
                    {/* 🔥 FIX: The author's name and image are wrapped in a Link */}
                    <Link href={`/users/${post.author._id}`}
                          className="d-flex align-items-center text-decoration-none text-dark">
                        <img src={post.author.profileImageUrl || 'default-avatar.png'} alt={post.author.fullName}
                             className="post-author-img me-2"/>
                        <div className="d-flex flex-column">
                            <strong>{post.author.fullName}</strong>
                            <small
                                className="text-muted">{formatDistanceToNow(new Date(post.createdAt), {addSuffix: true})}</small>
                        </div>
                    </Link>

                    {isOwner && (
                        <div className="dropdown ms-auto">
                            <button className="btn btn-light btn-sm" type="button" data-bs-toggle="dropdown"
                                    aria-expanded="false"> ⋮
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button className="dropdown-item" onClick={() => setIsEditing(true)}>Edit</button>
                                </li>
                                <li>
                                    <button className="dropdown-item text-danger"
                                            onClick={() => onDelete(post._id)}>Delete
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Media Container */}
                <div className="media-container" onClick={() => setFullscreenMedia(currentMedia)}>
                    {currentMedia ? (
                        isVideo ? (
                            <video src={currentMedia.url} className="post-media" controls/>
                        ) : (
                            <img src={currentMedia.url} alt="Post content" className="post-media"/>
                        )
                    ) : (
                        <div className="post-media d-flex align-items-center justify-content-center text-muted">No
                            media available</div>
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
                        <button className="btn btn-outline-secondary btn-sm">💬 Comment ({post.comments.length})
                        </button>
                    </div>
                    <p className="card-text">{post.text}</p>
                    <hr/>
                    <div className="comments-section">
                        {comments.map(comment => (
                            <div key={comment._id} className="d-flex mb-2">
                                <img src={comment.author.profileImageUrl || '...'} alt={comment.author.fullName}
                                     className="post-author-img me-2 " width="25" height="25"/>
                                <div>
                                    <strong>{comment.author.fullName}</strong>
                                    <p className="mb-0 small">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form className="d-flex mt-2" onSubmit={handleCommentSubmit}>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                        />
                        <button type="submit" className="btn btn-outline-primary btn-sm ms-2">Post</button>
                    </form>
                </div>
            </div>

            {/* Fullscreen Viewer */}
            {fullscreenMedia && (
                <div className="fullscreen-viewer" onClick={() => setFullscreenMedia(null)}>
                    <button className="close-btn">&times;</button>
                    {fullscreenMedia.type.startsWith('video/') ? (
                        <video src={fullscreenMedia.url} controls autoPlay muted loop/>
                    ) : (
                        <img src={fullscreenMedia.url} alt="Fullscreen content"/>
                    )}
                </div>
            )}

            {/* הצגה מותנית של מודל העריכה */}
            {isEditing && (
                <EditPostModal
                    post={post}
                    onUpdate={(updatedPost) => {
                        onUpdate(updatedPost);
                        setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            )}

        </>
    );
}
