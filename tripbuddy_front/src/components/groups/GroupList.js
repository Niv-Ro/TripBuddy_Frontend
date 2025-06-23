"use client";
import React from 'react';
import GroupCard from './GroupCard';

// This component renders a grid of group cards.
export default function GroupList({ groups, onViewGroup, allCountries }) {

    // If the provided list of groups is empty, it displays a user-friendly placeholder message.
    if (groups.length === 0) {
        return (
            <div className="text-center p-5 bg-light rounded">
                <h5 className="text-muted">No Groups Yet</h5>
                <p className="text-muted">You are not a member of any group yet. Create one or search for existing groups to join!</p>
            </div>
        );
    }

    return (
        // Uses Bootstrap's row to contain the cards.
        <div className="row">
            {/* Maps over the groups array. For each group object, it renders a GroupCard component. */}
            {groups.map(group => (
                <GroupCard
                    key={group._id} // A unique key is essential for list rendering in React.
                    group={group}   // Passes the entire group object down to the card.
                    onViewGroup={onViewGroup} // Passes the navigation handler down.
                    allCountries={allCountries} // Passes the master country list down.
                />
            ))}
        </div>
    );
}