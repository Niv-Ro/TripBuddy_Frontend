"use client";
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// A small, simple component for list view display.
const UserListItem = ({ user, onSelect }) => (
    <div
        className="list-group-item list-group-item-action d-flex align-items-center gap-3"
        onClick={() => onSelect(user)}
        style={{ cursor: 'pointer' }}
    >
        <img
            src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.fullName.replace(/\s/g, '+')}`}
            alt={user.fullName}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <span className="fw-medium">{user.fullName}</span>
    </div>
);

function getAge(dateString) {
    if (!dateString) return '';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// A larger component for card view display.
const UserCard = ({ user, isFollowing, onSelect, onFollowToggle }) => (
    <div className="col-lg-3 col-md-4 col-sm-6 mb-4">
        <div className="card h-100 text-center shadow-sm">
            <img
                src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.fullName.replace(/\s/g, '+')}&background=random&color=fff`}
                className="card-img-top"
                alt={user.fullName}
                style={{ height: '180px', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => onSelect(user)}
            />
            <div className="card-body d-flex flex-column">
                <h5 className="card-title" style={{ cursor: 'pointer' }} onClick={() => onSelect(user)}>{user.fullName}</h5>
                <p className="card-text text-muted mb-3">
                    {user.gender}, {getAge(user.birthDate)}
                </p>
                <div className="mt-auto">
                    <button
                        className={`btn btn-sm w-100 ${isFollowing ? 'btn-outline-secondary' : 'btn-primary'}`}
                        // It now calls the `onFollowToggle` function passed down from UserSearch.
                        onClick={(e) => {
                            e.stopPropagation();
                            onFollowToggle(user._id);
                        }}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);


export default function UserSearch({ onUserSelect, existingMemberIds = [], title, onCancel, displayMode = 'card' }) {
    const { mongoUser, refetchMongoUser } = useAuth();
    const [filters, setFilters] = useState({ name: '', minAge: '', maxAge: '', gender: 'any' });
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchClick = async () => {
        const hasFilters = Object.values(filters).some(value => value && value !== 'any');
        if (!hasFilters) {
            setError("Please enter at least one search filter.");
            setResults([]);
            setHasSearched(true);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        setError('');
        try {
            const res = await axios.get('http://localhost:5000/api/users/search', { params: filters });
            const filteredResults = res.data.filter(user =>
                user._id !== mongoUser?._id && !existingMemberIds.includes(user._id)
            );
            setResults(filteredResults);
        } catch (err) {
            console.error("Failed to search for users", err);
            setError('Failed to find users. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // This is the local function to handle the follow action within the search component.
    const handleFollowToggleInSearch = async (userIdToFollow) => {
        if (!mongoUser) return;
        try {
            await axios.post(`http://localhost:5000/api/users/${userIdToFollow}/follow`, { loggedInUserId: mongoUser._id });
            // After following, refetch the global user data to update the 'following' list everywhere.
            await refetchMongoUser();
        } catch (error) {
            console.error("Failed to toggle follow in search", error);
            alert("Could not perform action.");
        }
    };

    return (
        <div className="p-3">
            {title && <h5 className="mb-3">{title}</h5>}
            <div className="card card-body mb-4">
                <div className="row g-2 align-items-end">
                    <div className="col"><input type="text" name="name" placeholder="Name..." className="form-control" value={filters.name} onChange={handleFilterChange} /></div>
                    <div className="col"><input type="number" name="minAge" placeholder="Min Age" className="form-control" value={filters.minAge} onChange={handleFilterChange} /></div>
                    <div className="col"><input type="number" name="maxAge" placeholder="Max Age" className="form-control" value={filters.maxAge} onChange={handleFilterChange} /></div>
                    <div className="col">
                        <select name="gender" className="form-select" value={filters.gender} onChange={handleFilterChange}>
                            <option value="any">Any Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div className="col-auto"><button className="btn btn-primary w-100" onClick={handleSearchClick} disabled={isLoading}>{isLoading ? '...' : 'Search'}</button></div>
                    {onCancel && <div className="col-auto"><button className="btn btn-outline-secondary w-100" onClick={onCancel}>Cancel</button></div>}
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <div className="text-center"><div className="spinner-border" role="status"></div></div>}

            {!isLoading && results.length > 0 && (
                displayMode === 'card' ? (
                    <div className="row">
                        {results.map(user => (
                            <UserCard
                                key={user._id}
                                user={user}
                                onSelect={onUserSelect}
                                onFollowToggle={handleFollowToggleInSearch}
                                // Check if the logged-in user is following the user in the card.
                                isFollowing={mongoUser?.following.includes(user._id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {results.map(user => <UserListItem key={user._id} user={user} onSelect={onUserSelect} />)}
                    </div>
                )
            )}

            {!isLoading && results.length === 0 && hasSearched && <p className="text-muted text-center mt-4">No users found.</p>}
        </div>
    );
}