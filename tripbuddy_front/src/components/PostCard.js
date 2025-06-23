'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import EditPostModal from './EditPostModal';
import useCountries from '@/hooks/useCountries';


export default function PostCard({ post ,onNavigateToProfile , currentUserMongoId, onUpdate, onDelete }) {
    // --- State and Hooks ---
    const { user } = useAuth(); // User from Firebase Auth for ownership checks
    const allCountries = useCountries();
    const [likes, setLikes] = useState(post?.likes || []);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [fullscreenMedia, setFullscreenMedia] = useState(null);
    const [comments, setComments] = useState(post.comments || []);
    const [newComment, setNewComment] = useState('');

    // --- Derived State & Checks ---
    const isOwner = user && user.uid === post.author.firebaseUid;
    const isLikedByCurrentUser = currentUserMongoId ? likes.includes(currentUserMongoId) : false;
    const hasMultipleMedia = post.media && post.media.length > 1;
    const currentMedia = post.media?.[currentMediaIndex];
    const isVideo = currentMedia?.type.startsWith('video/');

    const taggedCountryObjects = post.taggedCountries
        ?.map(code => allCountries.find(c => c.code3 === code))
        .filter(Boolean);

    // --- Effects & Handlers ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            require('bootstrap/dist/js/bootstrap.bundle.min.js');
        }
    }, []);

    if (!post || !post.author) return null;

    const goToNext = (e) => { e.stopPropagation(); setCurrentMediaIndex(prev => (prev + 1) % post.media.length); };
    const goToPrevious = (e) => { e.stopPropagation(); setCurrentMediaIndex(prev => (prev - 1 + post.media.length) % post.media.length); };
    const handleProfileClick = () => { if (onNavigateToProfile) onNavigateToProfile(post.author._id); };

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
            setNewComment('');
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };


    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/posts/${post._id}/comments/${commentId}`, {
                data: { userId: currentUserMongoId }  // SEND userId for auth!
            });
            setComments(prev => prev.filter(c => c._id !== commentId));
        } catch (error) {
            alert('Failed to delete comment');
        }
    };


    return (
        <>
            <div className="card post-card shadow-sm mb-4 mx-auto">
                <div className="card-header bg-white d-flex align-items-center p-2">
                    <div onClick={handleProfileClick} className="d-flex align-items-center text-decoration-none text-dark" style={{ cursor: 'pointer' }}>
                        <img src={post.author.profileImageUrl || 'default-avatar.png'} alt={post.author.fullName} className="post-author-img me-2"/>
                        <div className="d-flex flex-column">
                            <strong>{post.author.fullName}</strong>
                            <small className="text-muted">{formatDistanceToNow(new Date(post.createdAt), {addSuffix: true})}</small>
                        </div>
                    </div>

                    {isOwner && (
                        <div className="dropdown ms-auto">
                            <button className="btn btn-light btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false"> ⋮ </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button className="dropdown-item" onClick={() => setIsEditing(true)}>Edit</button>
                                </li>
                                <li>
                                    <button className="dropdown-item text-danger" onClick={() => onDelete(post._id)}>Delete</button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="media-container" onClick={() => setFullscreenMedia(currentMedia)}>
                    {currentMedia ? (
                        isVideo ? (
                            <video src={currentMedia.url} className="post-media" controls/>
                        ) : (
                            <img src={currentMedia.url} alt="Post content" className="post-media"/>
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

                <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                        <button
                            className={`btn btn-sm me-2 ${isLikedByCurrentUser ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={handleLikeToggle}
                        >
                            ❤️ Like ({likes.length})
                        </button>
                        <button className="btn btn-outline-secondary btn-sm">💬 Comment ({comments.length})</button>
                    </div>
                    <p className="card-text">{post.text}</p>

                    {taggedCountryObjects && taggedCountryObjects.length > 0 && (
                        <div className="mt-3">
                            <div className="d-flex flex-wrap align-items-center gap-2">
                                {taggedCountryObjects.map(country => (
                                    <span key={country.code}
                                          className="badge bg-light text-dark fw-normal border d-flex align-items-center">
                                        <img
                                            src={country.flag}
                                            alt={country.name}
                                            style={{
                                                width: '16px',
                                                height: '12px',
                                                marginRight: '5px',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        {country.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <hr/>
                    <div className="comments-section">
                        {comments.map(comment => (
                            comment.author && (
                                <div
                                    key={comment._id}
                                    className="d-flex mb-2 align-items-center justify-content-between"
                                    style={{position: 'relative'}}
                                >
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={comment.author.profileImageUrl || 'default-avatar.png'}
                                            alt={comment.author.fullName}
                                            className="post-author-img me-2"
                                            style={{width: '25px', height: '25px', cursor: 'pointer'}}
                                            onClick={() => onNavigateToProfile && onNavigateToProfile(comment.author._id)}
                                        />
                                        <div>
                                            <strong
                                                style={{cursor: 'pointer'}}
                                                onClick={() => onNavigateToProfile && onNavigateToProfile(comment.author._id)}
                                            >
                                                {comment.author.fullName}
                                            </strong>
                                            <p className="mb-0 small">{comment.text}</p>
                                        </div>
                                    </div>
                                    {/* X Button: right side, no underline, looks like a clean icon */}
                                    {(currentUserMongoId === comment.author._id || isOwner) && (
                                        <button
                                            className="btn btn-link btn-sm text-danger p-0"
                                            title="Delete comment"
                                            onClick={() => handleDeleteComment(comment._id)}
                                            style={{
                                                fontSize: '1.2rem',
                                                textDecoration: 'none', // removes underline
                                                boxShadow: 'none',
                                                outline: 'none',
                                                marginLeft: '10px'
                                            }}
                                        >&times;</button>
                                    )}
                                </div>
                            )
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