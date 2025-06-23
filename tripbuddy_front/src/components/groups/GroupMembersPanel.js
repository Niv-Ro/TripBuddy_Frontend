"use client";
import React from 'react';

export default function GroupMembersPanel({ isAdmin, isMember, members, pendingRequests, onRespondToRequest, onRemoveMember, adminId }) {
    return (
        <div className="d-flex flex-column gap-3">
            {isMember && isAdmin && pendingRequests.length > 0 && (
                <div className="card">
                    <div className="card-header bg-warning">Pending Join Requests</div>
                    <ul className="list-group list-group-flush">
                        {pendingRequests.map(({ user }) => (
                            user && (
                                <li key={user._id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <span>{user.fullName}</span>
                                    <div>
                                        <button className="btn btn-sm btn-success me-1 py-0 px-2" onClick={() => onRespondToRequest(user._id, 'approve')}>✓</button>
                                        <button className="btn btn-sm btn-danger py-0 px-2" onClick={() => onRespondToRequest(user._id, 'decline')}>X</button>
                                    </div>
                                </li>
                            )
                        ))}
                    </ul>
                </div>
            )}
            <div className="card">
                <div className="card-header">{members.length} Members</div>
                <ul className="list-group list-group-flush">
                    {members.map(({ user }) => (
                        user && (
                            <li key={user._id} className="list-group-item d-flex justify-content-between align-items-center">
                                <span>{user.fullName} {adminId === user._id && <span className="badge bg-primary ms-2">Admin</span>}</span>
                                {isMember && isAdmin && user._id !== adminId && (
                                    <button className="btn btn-sm btn-outline-danger py-0" onClick={() => onRemoveMember(user._id)}>Remove</button>
                                )}
                            </li>
                        )
                    ))}
                </ul>
            </div>
        </div>
    );
}