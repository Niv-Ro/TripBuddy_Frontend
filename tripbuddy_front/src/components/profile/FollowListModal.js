"use client";
import React from 'react';

export default function FollowListModal({
                                            isOpen,
                                            onClose,
                                            title,
                                            list = [],
                                            isOwnProfile,
                                            onUnfollow,
                                            onNavigateToProfile,
                                            currentUserId
                                        }) {
    if (!isOpen) return null;

    const handleNavigate = (userId) => {
        onClose();
        onNavigateToProfile(userId);
    };

    // פונקציה זו מונעת מהמודאל להיסגר אם לוחצים בתוך התוכן שלו
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // ✅ הוספנו onClick לרקע כדי שיסגור את המודאל
        <div className="modal-overlay" onClick={onClose}>
            {/* ✅ הוספנו onClick שמונע מהלחיצה "לבעבע" החוצה ולסגור את המודאל */}
            <div className="modal-content" style={{maxWidth: '450px', maxHeight: '80vh', display: 'flex', flexDirection: 'column'}} onClick={handleContentClick}>
                <div className="d-flex justify-content-between align-items-center mb-3 p-3 border-bottom">
                    <h5 className="mb-0">{title}</h5>
                    {/* ✅ הוספנו כפתור סגירה סטנדרטי */}
                    <button className="btn-close" onClick={onClose}></button>
                </div>
                <div className="overflow-auto flex-grow-1">
                    {list.length > 0 ? (
                        <ul className="list-group list-group-flush">
                            {list.map(item => (
                                <li key={item._id} className="list-group-item d-flex align-items-center justify-content-between p-3">
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