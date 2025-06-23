// src/components/UserSearch.js
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';

/**
 * רכיב רב-תכליתי לחיפוש ובחירת משתמשים.
 * @param {function} onUserSelect - חובה: פונקציה שתופעל עם אובייקט המשתמש שנבחר.
 * @param {string[]} [existingMemberIds=[]] - אופציונלי: מערך של ID לסנן מהתוצאות.
 * @param {function} [onCancel] - אופציונלי: פונקציה להצגת כפתור ביטול.
 * @param {string} [title="Search for a user"] - אופציונלי: כותרת לרכיב.
 */
export default function UserSearch({
                                       onUserSelect,
                                       existingMemberIds = [],
                                       onCancel,
                                       title = "Search for a user"
                                   }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchUsers = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const res = await axios.get(`http://localhost:5000/api/users/search?q=${searchQuery}`);

            // בצע סינון רק אם המערך existingMemberIds אינו ריק
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
    }, [existingMemberIds]);

    const debouncedFetchUsers = useCallback(debounce(fetchUsers, 500), [fetchUsers]);

    useEffect(() => {
        debouncedFetchUsers(query);
        return () => debouncedFetchUsers.cancel();
    }, [query, debouncedFetchUsers]);

    const handleSelect = (user) => {
        setQuery(''); // נקה את תיבת החיפוש
        setResults([]); // נקה את התוצאות
        onUserSelect(user); // העבר את המשתמש הנבחר לרכיב האב
    };

    return (
        <div className="card p-3 shadow-sm">
            <h6 className="mb-2">{title}</h6>
            <div className="input-group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="form-control"
                    placeholder="Search by name or email..."
                    aria-label="Search for a user"
                />
                {/* 🔥 כפתור הביטול יופיע רק אם הפונקציה onCancel קיימת */}
                {onCancel && <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancel</button>}
            </div>

            {/*{isLoading && <div className="text-center p-2 text-muted">Searching...</div>}*/}
            {error && <div className="alert alert-danger mt-2">{error}</div>}

            {results.length > 0 && (
                <ul className="list-group mt-2">
                    {results.map(user => (
                        <li
                            key={user._id}
                            className="list-group-item list-group-item-action d-flex align-items-center"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSelect(user)}
                        >
                            <img
                                src={user.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                                alt={user.fullName || 'User'}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '15px' }}
                            />
                            <span>{user.fullName} ({user.email})</span>
                        </li>
                    ))}
                </ul>
            )}

            {results.length === 0 && query.length > 1 && !isLoading && !error && (
                <p className="text-muted mt-2">No users found.</p>
            )}
        </div>
    );
}