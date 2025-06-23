"use client";
import React from 'react';
import GroupCard from './GroupCard';

export default function GroupList({ groups, onViewGroup, allCountries }) {
    if (groups.length === 0) {
        return (
            <div className="text-center p-5 bg-light rounded">
                <h5 className="text-muted">No Groups Yet</h5>
                <p className="text-muted">You are not a member of any group yet. Create one or search for existing groups to join!</p>
            </div>
        );
    }

    return (
        <div className="row">
            {groups.map(group => (
                <GroupCard key={group._id} group={group} onViewGroup={onViewGroup} allCountries={allCountries} />
            ))}
        </div>
    );
}