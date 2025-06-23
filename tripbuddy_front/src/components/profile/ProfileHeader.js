"use client";
import React from 'react';

export default function ProfileHeader({
                                          profileData,
                                          isOwnProfile,
                                          isFollowing,
                                          isClient,
                                          getAge,
                                          onFollowToggle,
                                          onOpenFollowModal,
                                          onEdit,
                                          onShowStats
                                      }) {
    return (
        <nav className="navbar navbar-light border-bottom py-3 px-4">
            <div className="d-flex align-items-start w-100 position-relative">
                <div style={{ width: 200, height: 200, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                    <img src={profileData.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: "cover" }} />
                </div>
                <div className="ms-4 flex-grow-1">
                    <div className="d-flex align-items-center mb-2" style={{ gap: 16 }}>
                        <h1 className="mb-0" style={{ fontSize: '2.1rem', color: 'black', textShadow: '0 0 3px #000000' }}>{profileData.fullName}</h1>
                        {!isOwnProfile && (
                            <button className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} ms-3`} onClick={onFollowToggle}>
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>
                    <div className="d-flex align-items-center" style={{ gap: '1.5rem', cursor: 'pointer' }}>
                        <span className="text-muted" onClick={() => onOpenFollowModal('followers')}>
                            <strong>{profileData.followers?.length || 0}</strong> Followers
                        </span>
                        <span className="text-muted" onClick={() => onOpenFollowModal('following')}>
                            <strong>{profileData.following?.length || 0}</strong> Following
                        </span>
                    </div>
                    <div className="d-flex flex-wrap mt-2" style={{ gap: '1.5rem' }}>
                        <span><b>Country:</b> {profileData.countryOrigin}</span>
                        <span><b>Gender:</b> {profileData.gender}</span>
                        <span><b>Age:</b> {isClient ? getAge(profileData.birthDate) : '...'}</span>
                    </div>
                    <h5 className="fw-bold mb-2 my-2">Bio</h5>
                    <div className="border rounded bg-light p-2" style={{ minHeight: 60, maxHeight: 100, maxWidth: 400, overflowY: 'auto' }}>
                        <p style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
                            {profileData.bio || (isOwnProfile ? "Add something about yourself..." : "No bio yet.")}
                        </p>
                    </div>
                </div>
                {isOwnProfile && (
                    <div className="d-flex flex-column" style={{position: "absolute", top: 0, right: 0}}>
                        <button className="btn btn-outline-primary mb-2"  onClick={onEdit}>
                            Edit Profile
                        </button>
                        <button className="btn btn-outline-success" onClick={onShowStats}>
                             Stats
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}