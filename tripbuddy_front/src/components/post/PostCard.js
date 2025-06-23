'use client';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import EditPostModal from './EditPostModal';
import EditCommentModal from './EditCommentModal';
import useCountries from '@/hooks/useCountries';


// A helper function to detect Right-to-Left (RTL) characters (like Hebrew) for nicer look
const isRTL = (str) => {
    // This regular expression checks for characters in the Hebrew or Arabic Unicode range.
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
    return rtlRegex.test(str);
};

// The main component to display a single post. It receives post data and handler functions as props.
export default function PostCard({ post, onNavigateToProfile, currentUserMongoId, onUpdate, onDelete }) {
    const { user, mongoUser } = useAuth();
    const allCountries = useCountries();

    // Local state for likes and comments allows for optimistic updates for a better performance - no need to fetch post data .
    const [likes, setLikes] = useState(post?.likes || []);
    const [comments, setComments] = useState(post.comments || []);

    // State for managing the media carousel and modals.
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0); //Which photo/video is displayed
    const [isEditingPost, setIsEditingPost] = useState(false); //Flag to know if edit post
    const [fullscreenMedia, setFullscreenMedia] = useState(null); //Flag to know if on full screen
    const [editingComment, setEditingComment] = useState(null); //Flag to know if edit post
    const [commentSearchTerm, setCommentSearchTerm] = useState('');
    const [newComment, setNewComment] = useState('');
    const [commentsVisible, setCommentsVisible] = useState(false);

    // Computed variables for cleaner conditional rendering in JSX.
    const isOwner = mongoUser?._id === post.author._id;
    const isLikedByCurrentUser = currentUserMongoId ? likes.includes(currentUserMongoId) : false;
    const hasMultipleMedia = post.media && post.media.length > 1;
    const currentMedia = post.media?.[currentMediaIndex];
    const isVideo = currentMedia?.type.startsWith('video/');

    const isTextRTL = isRTL(post.text);

    // This effect synchronizes the local state with the parent's props if the post data is updated.
    useEffect(() => {
        setComments(post.comments || []);
        setLikes(post.likes || []);
    }, [post]);

    // Filters the comments based on the search term, memoized for performance.
    const filteredComments = useMemo(() => {
        if (!commentSearchTerm.trim()) {
            return comments;
        }
        const searchLower = commentSearchTerm.toLowerCase();
        return comments.filter(comment =>
                comment && comment.author && (
                    comment.text?.toLowerCase().includes(searchLower) || //By text
                    comment.author.fullName?.toLowerCase().includes(searchLower) //By author name
                )
        );
    }, [comments, commentSearchTerm]);

    const taggedCountryObjects = post.taggedCountries?.map(
        code => allCountries.find(c => c.code3 === code)).filter(Boolean);

    // Carousel navigation functions. The (%) ensures the index wraps around.
    // Makes sure after the last media it will go back to first one
    const goToNext = (e) => { e.stopPropagation(); setCurrentMediaIndex(prev => (prev + 1) % post.media.length); };
    // Here we add + before length to make sure result is not negative
    const goToPrevious = (e) => { e.stopPropagation(); setCurrentMediaIndex(prev => (prev - 1 + post.media.length) % post.media.length); };

    // Navigation handler passed from the parent component.
    const handleProfileClick = (authorId) => { if (onNavigateToProfile) { onNavigateToProfile(authorId); } };

    // Implements an "optimistic update" for a fast and responsive user experience.
    const handleLikeToggle = async () => {
        if (!currentUserMongoId) return;

        // Immediately update the UI without waiting for the server.
        const originalLikes = [...likes];
        const newLikes = isLikedByCurrentUser ? likes.filter(id => id !== currentUserMongoId) : [...likes, currentUserMongoId];
        setLikes(newLikes);

        try {
            // Send the update to the server in the background.
            const response = await axios.post(`http://localhost:5000/api/posts/${post._id}/like`, { userId: currentUserMongoId });
            onUpdate(response.data); // Notify parent of the final state from the server.
        } catch (error) {
            // If the server fails, revert the UI change.
            setLikes(originalLikes);
        }
    };

    // Submits a new comment and optimistically updates the local comments list.
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserMongoId) return;
        try {
            const response = await axios.post(`http://localhost:5000/api/posts/${post._id}/comments`, { authorId: currentUserMongoId, text: newComment });
            setComments(prev => [...prev, response.data]);
            setNewComment('');  // Reset textbox after submit
        } catch (error) { console.error("Failed to add comment", error); }
    };

    // Deletes a comment and optimistically removes it from the local list.
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/posts/${post._id}/comments/${commentId}`, { data: { userId: currentUserMongoId } });
            setComments(prev => prev.filter(c => c._id !== commentId));
        } catch (error) { alert("Could not delete comment."); }
    };

    // Updates a comment and optimistically updates it in the local list.
    const handleUpdateComment = async (commentId, newText) => {
        try {
            const res = await axios.put(`http://localhost:5000/api/posts/${post._id}/comments/${commentId}`, { text: newText, userId: currentUserMongoId });
            const updatedComment = res.data;
            setComments(prev => prev.map(c => c._id === updatedComment._id ? updatedComment : c));
            setEditingComment(null);
        } catch (error) { alert("Comment cannot be empty!"); }
    };

    const clearSearch = () => {
        setCommentSearchTerm('');
    };

    //Changes the state of the visibility of comments
    const toggleCommentsVisibility = () => {
        setCommentsVisible(prev => !prev);
    };


    return (
        <>
            <div className="card post-card shadow-sm mb-4 mx-auto">
                <div className="card-header bg-white d-flex align-items-center p-2">
                    <div className="d-flex align-items-center text-decoration-none text-dark">
                        <img src={post.author.profileImageUrl || 'default-avatar.png'} alt={post.author.fullName} className="post-author-img me-2" onClick={() => handleProfileClick(post.author._id)} style={{ cursor: 'pointer' }} />
                        <div className="d-flex flex-column">
                            <strong onClick={() => handleProfileClick(post.author._id)} style={{ cursor: 'pointer' }}>{post.author.fullName}</strong>
                            <small className="text-muted">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</small>
                        </div>
                    </div>
                    {isOwner && (
                        <div className="dropdown ms-auto">
                            <button className="btn btn-light btn-sm" type="button" data-bs-toggle="dropdown">⋮</button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li><button className="dropdown-item" onClick={() => setIsEditingPost(true)}>Edit</button></li>
                                <li><button className="dropdown-item text-danger" onClick={() => onDelete(post._id)}>Delete</button></li>
                            </ul>
                        </div>
                    )}
                </div>

                {currentMedia && (
                    <div className="media-container" onClick={() => setFullscreenMedia(currentMedia)}>
                        {isVideo ? <video src={currentMedia.url} className="post-media" controls/> : <img src={currentMedia.url} alt="Post content" className="post-media"/>}
                        {hasMultipleMedia && (
                            <>
                                <button className="media-nav-btn prev" onClick={goToPrevious}>‹</button>
                                <button className="media-nav-btn next" onClick={goToNext}>›</button>
                                <div className="media-counter">{currentMediaIndex + 1} / {post.media.length}</div>
                            </>
                        )}
                    </div>
                )}

                <div className="card-body">
                    <p className="card-text"
                       style={{
                           direction: isTextRTL ? 'rtl' : 'ltr',
                           textAlign: isTextRTL ? 'right' : 'left'
                       }}>{post.text}</p>
                    {taggedCountryObjects && taggedCountryObjects.length > 0 && (
                        <div className="mt-3">
                            <div className="d-flex flex-wrap gap-2">{taggedCountryObjects.map(country => (
                                <span key={country.code} className="badge bg-light text-dark fw-normal border"><img
                                    src={country.flag} alt={country.name}
                                    style={{width: '16px', marginRight: '5px'}}/>{country.name}</span>))}</div>
                        </div>
                    )}
                    <div className="d-flex align-items-center mb-2">
                        <button
                            className={`btn btn-sm me-2 ${isLikedByCurrentUser ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={handleLikeToggle}>❤️ Like ({likes.length})
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={toggleCommentsVisibility}>💬
                            Comment ({comments.length})
                        </button>
                    </div>

                    {commentsVisible && (
                        <>
                            <hr/>
                            {comments.length > 0 && (
                                <div className="mb-3">
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text">🔍</span>
                                        <input type="text" className="form-control" placeholder="Search comments..."
                                               value={commentSearchTerm}
                                               onChange={(e) => setCommentSearchTerm(e.target.value)}/>
                                        {commentSearchTerm && (
                                            <button className="btn btn-outline-secondary" type="button"
                                                    onClick={clearSearch} title="Clear search">✕</button>)}
                                    </div>
                                    {commentSearchTerm && (<small
                                        className="text-muted">Showing {filteredComments.length} of {comments.length} comments</small>)}
                                </div>
                            )}

                            <div className="comments-section">
                                {filteredComments.length === 0 && commentSearchTerm ? (
                                    <div className="text-muted text-center py-2"><small>No comments found matching
                                        "{commentSearchTerm}"</small></div>
                                ) : (
                                    filteredComments.map(comment => (
                                        comment && comment.author && (
                                            <div key={comment._id} className="d-flex mb-2">
                                                <img src={comment.author.profileImageUrl || 'default-avatar.png'}
                                                     alt={comment.author.fullName} className="post-author-img me-2"
                                                     width="25" height="25"
                                                     onClick={() => handleProfileClick(comment.author._id)}
                                                     style={{cursor: 'pointer'}}/>
                                                <div className="flex-grow-1"
                                                     onClick={() => handleProfileClick(comment.author._id)}
                                                     style={{cursor: 'pointer'}}>
                                                    <strong>{comment.author.fullName}</strong>
                                                    <p className="mb-0 small">{comment.text}</p>
                                                </div>
                                                {isOwner && (
                                                    <div className="dropdown">
                                                        <button className="btn btn-light btn-sm py-0 px-2" type="button"
                                                                data-bs-toggle="dropdown">⋮
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-end">
                                                            <li>
                                                                <button className="dropdown-item"
                                                                        onClick={() => setEditingComment(comment)}>Edit
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button className="dropdown-item text-danger"
                                                                        onClick={() => handleDeleteComment(comment._id)}>Delete
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ))
                                )}
                            </div>
                            <form className="d-flex mt-2" onSubmit={handleCommentSubmit}>
                                <input type="text" className="form-control form-control-sm"
                                       placeholder="Add a comment..." value={newComment}
                                       onChange={e => setNewComment(e.target.value)}/>
                                <button type="submit" className="btn btn-outline-primary btn-sm ms-2">Post</button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {fullscreenMedia && (
                <div className="fullscreen-viewer" onClick={() => setFullscreenMedia(null)}>
                    <button className="close-btn" onClick={() => setFullscreenMedia(null)}>&times;</button>
                    {fullscreenMedia.type.startsWith('video/') ?
                        <video src={fullscreenMedia.url} controls autoPlay onClick={e => e.stopPropagation()}/> :
                        <img src={fullscreenMedia.url} alt="Fullscreen content" onClick={e => e.stopPropagation()} />}
                </div>
            )}
            {isEditingPost && ( <EditPostModal post={post} onUpdate={(updatedPost) => { onUpdate(updatedPost); setIsEditingPost(false); }} onCancel={() => setIsEditingPost(false)} /> )}
            {editingComment && ( <EditCommentModal isOpen={!!editingComment} comment={editingComment} onSave={handleUpdateComment} onCancel={() => setEditingComment(null)} /> )}
        </>
    );
}