"use client";
import React from 'react';

export default function PendingInvitations({ invites, onResponse }) {
    if (invites.length === 0) {
        return null;
    }

    return (
        <div className="mb-4">
            <h4 className="mb-3">Pending Invitations</h4>
            {invites.map(group => (
                <div key={group._id} className="card mb-2">
                    <div className="card-body d-flex justify-content-between align-items-center">
                        <span>You were invited to join <strong>{group.name}</strong> by {group.admin?.fullName}</span>
                        <div>
                            <button className="btn btn-success btn-sm me-2" onClick={() => onResponse(group._id, 'accept')}>Accept</button>
                            <button className="btn btn-danger btn-sm" onClick={() => onResponse(group._id, 'decline')}>Decline</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}