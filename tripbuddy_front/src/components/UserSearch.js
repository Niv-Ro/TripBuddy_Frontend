// client/components/UserSearch.js
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';

/**
 * רכיב לחיפוש משתמשים.
 * @param {string[]} existingMemberIds - מערך של ID של משתמשים שכבר חברים בקבוצה, כדי לסנן אותם מהתוצאות.
 * @param {function} onSelectUser - פונקציה שתופעל כאשר נבחר משתמש. היא מקבלת את אובייקט המשתמש.
 * @param {function} onCancel - פונקציה לסגירת ממשק החיפוש.
 */
export default function UserSearch({ existingMemberIds = [], onSelectUser, onCancel }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // פונקציה אסינכרונית לחיפוש משתמשים
    const fetchUsers = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const res = await axios.get(`http://localhost:5000/api/users/search?q=${searchQuery}`);
            // סינון משתמשים שכבר חברים בקבוצה
            const filteredResults = res.data.filter(user => !existingMemberIds.includes(user._id));
            setResults(filteredResults);
        } catch (err) {
            console.error("Failed to search for users", err);
            setError('Failed to find users. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // שימוש ב-debounce כדי למנוע קריאות API מיותרות בזמן ההקלדה
    // הפונקציה תרוץ רק 500ms לאחר שהמשתמש הפסיק להקליד
    const debouncedFetchUsers = useCallback(debounce(fetchUsers, 500), [existingMemberIds]);

    useEffect(() => {
        debouncedFetchUsers(query);
        // ניקוי ה-debounce כאשר הרכיב יורד מהעץ
        return () => {
            debouncedFetchUsers.cancel();
        };
    }, [query, debouncedFetchUsers]);

    return (
        <div className="card mt-3 p-3 shadow-sm">
            <h6 className="mb-2">Invite a New Member</h6>
            <div className="input-group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="form-control"
                    placeholder="Search by name..."
                    aria-label="Search for a user to invite"
                />
                <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancel</button>
            </div>

            {isLoading && <div className="text-center p-2 text-muted">Searching...</div>}
            {error && <div className="alert alert-danger mt-2">{error}</div>}

            {results.length > 0 && (
                <ul className="list-group mt-2">
                    {results.map(user => (
                        <li
                            key={user._id}
                            className="list-group-item list-group-item-action d-flex align-items-center"
                            style={{ cursor: 'pointer' }}
                            onClick={() => onSelectUser(user)} // קריאה לפונקציה onSelectUser עם המשתמש שנבחר
                        >
                            <img
                                src={user.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                                alt={user.fullName}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '15px' }}
                            />
                            <span>{user.fullName} ({user.email})</span>
                        </li>
                    ))}
                </ul>
            )}

            {results.length === 0 && query.length > 1 && !isLoading && !error && (
                <p className="text-muted mt-2">No new users found matching your search.</p>
            )}
        </div>
    );
}