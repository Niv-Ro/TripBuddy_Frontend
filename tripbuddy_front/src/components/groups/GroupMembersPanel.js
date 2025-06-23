"use client";
import React from 'react';

export default function GroupMembersPanel({ isAdmin, members, pendingMembers, onRespondToRequest, onRemoveMember, adminId }) {

    // A small helper component for rendering a single member item.
    const MemberItem = ({ member }) => (
        <li className="list-group-item d-flex justify-content-between align-items-center">
            <span>{member.user.fullName} {member.user._id === adminId && <small className="text-primary fw-bold ms-1">(Admin)</small>}</span>
            {/* Show remove button if the viewer is an admin AND the member is not the admin. */}
            {isAdmin && member.user._id !== adminId && (
                <button className="btn btn-sm btn-outline-danger" onClick={() => onRemoveMember(member.user._id)}>
                    Remove
                </button>
            )}
        </li>
    );

    return (
        <div className="card">
            <div className="card-header">
                Members ({members.length})
            </div>
            <ul className="list-group list-group-flush">
                {members.length > 0 ? (
                    members.map(member => <MemberItem key={member.user._id} member={member} />)
                ) : (
                    <li className="list-group-item text-muted">No approved members yet.</li>
                )}
            </ul>

            {/* This section now handles ALL pending members (both requests and invitations). */}
            {isAdmin && pendingMembers && pendingMembers.length > 0 && (
                <div className="card-body border-top">
                    <h6 className="card-subtitle mb-2 text-muted">Pending Members ({pendingMembers.length})</h6>
                    <ul className="list-group list-group-flush">
                        {pendingMembers.map(member => (
                            <li key={member.user._id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                <span>{member.user.fullName}</span>
                                <div>
                                    {/*  Conditionally renders buttons OR text based on the member's status. */}
                                    {member.status === 'pending_approval' ? (
                                        // This user REQUESTED to join. Admin can approve/decline.
                                        <div className="btn-group">
                                            <button className="btn btn-sm btn-success" onClick={() => onRespondToRequest(member.user._id, 'approved')}>Approve</button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => onRespondToRequest(member.user._id, 'declined')}>Decline</button>
                                        </div>
                                    ) : (
                                        // This user was INVITED and has not yet responded.
                                        <small className="text-muted fst-italic">Invited</small>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}