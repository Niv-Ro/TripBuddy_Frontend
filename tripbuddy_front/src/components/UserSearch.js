"use client";
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// פונקציית עזר לחישוב גיל מתאריך
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

// רכיב כרטיסייה להצגת משתמש
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
                        className={`btn btn-sm w-100 ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={(e) => {
                            e.stopPropagation(); // מונע מהקליק להגיע ל-onClick של הכרטיס
                            onFollowToggle(user._id);
                        }}
                    >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default function UserSearch({ onUserSelect, existingMemberIds = [] }) {
    const { mongoUser, refetchMongoUser } = useAuth();
    const [filters, setFilters] = useState({
        name: '',
        minAge: '',
        maxAge: '',
        gender: 'any'
    });
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false); // State חדש כדי לדעת אם בוצע חיפוש

    const fetchUsers = async () => {
        // ודא שיש לפחות פילטר אחד לפני שרצים
        const hasFilters = Object.values(filters).some(value => value && value !== 'any');
        if (!hasFilters) {
            setError("Please enter at least one search filter.");
            setResults([]);
            return;
        }

        setIsLoading(true);
        setHasSearched(true); // סמן שבוצע חיפוש
        setError('');
        try {
            const res = await axios.get('http://localhost:5000/api/users/search', { params: filters });
            const filteredResults = existingMemberIds.length > 0
                ? res.data.filter(user => !existingMemberIds.includes(user._id))
                : res.data;
            setResults(filteredResults);
        } catch (err) {
            console.error("Failed to search for users", err);
            setError('Failed to find users. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchClick = () => {
        fetchUsers();
    };

    const handleFollowToggleInSearch = async (userIdToFollow) => {
        if (!mongoUser) return;
        try {
            await axios.post(`http://localhost:5000/api/users/${userIdToFollow}/follow`, { loggedInUserId: mongoUser._id });
            await refetchMongoUser(); // רענן את המידע הגלובלי על המשתמש
        } catch (error) {
            console.error("Failed to toggle follow in search", error);
            alert("Could not perform action.");
        }
    };

    return (
        <div className="p-4">
            <h3 className="mb-4">Search for Buddies</h3>
            <div className="card card-body mb-4">
                <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                        <label htmlFor="name" className="form-label">Name</label>
                        <input type="text" name="name" id="name" value={filters.name} onChange={handleFilterChange} className="form-control" placeholder="Search by name..." />
                    </div>
                    <div className="col-md-2">
                        <label htmlFor="minAge" className="form-label">Min Age</label>
                        <input type="number" name="minAge" id="minAge" value={filters.minAge} onChange={handleFilterChange} className="form-control" placeholder="e.g., 18" />
                    </div>
                    <div className="col-md-2">
                        <label htmlFor="maxAge" className="form-label">Max Age</label>
                        <input type="number" name="maxAge" id="maxAge" value={filters.maxAge} onChange={handleFilterChange} className="form-control" placeholder="e.g., 99" />
                    </div>
                    <div className="col-md-2">
                        <label htmlFor="gender" className="form-label">Gender</label>
                        <select name="gender" id="gender" value={filters.gender} onChange={handleFilterChange} className="form-select">
                            <option value="any">Any</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-primary w-100" onClick={handleSearchClick} disabled={isLoading}>
                            {isLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Search'}
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {!isLoading && results.length > 0 && (
                <div className="row">
                    {results.map(user => (
                        <UserCard
                            key={user._id}
                            user={user}
                            onSelect={onUserSelect}
                            onFollowToggle={handleFollowToggleInSearch}
                            isFollowing={mongoUser?.following.includes(user._id)}
                        />
                    ))}
                </div>
            )}

            {!isLoading && results.length === 0 && hasSearched && (
                <p className="text-muted text-center mt-4">No users found matching your criteria.</p>
            )}
        </div>
    );
}