"use client";
import React from 'react';

// A presentational component for the header of the group page.
export default function GroupHeader({ group, isAdmin, isMember, onBack, onInvite, onDelete, onLeave, isDeleting, isLeaving, isInviting }) {
    return (
        // A Bootstrap navbar used as a styled container for the header.
        <nav className="bg-light border-bottom p-3 d-flex align-items-center justify-content-between">

            {/* Left side of the header: back button, image, and text. */}
            <div className="d-flex align-items-center">
                <button className="btn btn-secondary me-3" onClick={onBack}>←</button>
                <img
                    //If group has no pictures, it generates one randomly based on group's name
                    src={group.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random`}
                    alt={group.name}
                    className="rounded-circle me-3"
                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                />
                <div>
                    <h3 className="mb-1">{group.name}</h3>
                    <p className="mb-0 text-muted small">{group.description}</p>
                </div>
            </div>

            {/* Right side of the header: action buttons. */}
            <div className="d-flex gap-2">
                {isMember &&  <button className="btn btn-warning" onClick={onLeave} disabled={isLeaving}>{isLeaving ? "Leaving..." : "Leave Group"}</button>}

                {/* Admin-only buttons. */}
                {isAdmin && <button className="btn btn-outline-primary" onClick={onInvite} disabled={isDeleting || isLeaving}>{isInviting ? 'Cancel Invite' : 'Invite Member'}</button>}
                {isAdmin && <button className="btn btn-danger" onClick={onDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Group'}</button>}
            </div>
        </nav>
    );
}