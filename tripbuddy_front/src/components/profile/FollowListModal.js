"use client";
import React from 'react';

// A reusable modal to display a list of users (followers or following).
export default function FollowListModal({
                                            isOpen, onClose, title, list = [], isOwnProfile, onUnfollow, onNavigateToProfile, currentUserId
                                        }) {
    // If the modal is not meant to be open, render nothing.
    if (!isOpen) return null;

    // A helper function to close the modal before navigating to another profile.
    const handleNavigate = (userId) => {
        onClose(); // Close the current modal.
        onNavigateToProfile(userId); // Trigger navigation in the parent component.
    };

    // This crucial function prevents the modal from closing when clicking inside the white content area.
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // The semi-transparent background overlay. Clicking it closes the modal.
        <div className="modal-overlay" onClick={onClose}>
            {/* The main content box. Clicking it will NOT close the modal due to handleContentClick. */}
            <div className="modal-content" style={{maxWidth: '450px', maxHeight: '80vh', display: 'flex', flexDirection: 'column'}} onClick={handleContentClick}>
                <div className="d-flex justify-content-between align-items-center mb-3 p-3 border-bottom">
                    <h5 className="mb-0">{title}</h5>
                    <button className="btn-close" onClick={onClose}></button>
                </div>

                {/* The scrollable area for the list of users. */}
                <div className="overflow-auto flex-grow-1">
                    {list.length > 0 ? (
                        <ul className="list-group list-group-flush">
                            {/* Map over the list of users to render each one as a list item. */}
                            {list.map(item => (
                                <li key={item._id} className="list-group-item d-flex align-items-center justify-content-between p-3">
                                    {/* This div is clickable and navigates to the user's profile. */}
                                    <div
                                        className="d-flex align-items-center"
                                        onClick={() => handleNavigate(item._id)}
                                        style={{cursor: 'pointer'}}
                                    >
                                        <img
                                            src={item.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                                            alt={item.fullName}
                                            style={{width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', marginRight: '15px'}}
                                        />
                                        <span className="fw-bold">{item.fullName}</span>
                                    </div>

                                    {/* The "Unfollow" button has complex conditional rendering to ensure it appears only when appropriate. */}
                                    {isOwnProfile && item._id !== currentUserId && title === 'Following' && (
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => onUnfollow(item._id)}
                                        >
                                            Unfollow
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted text-center p-4">This list is empty.</p>
                    )}
                </div>
            </div>
        </div>
    );
}