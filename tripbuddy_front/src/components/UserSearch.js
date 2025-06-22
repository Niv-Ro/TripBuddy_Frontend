// client/components/UserSearch.js
"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// המטרה של onNavigateToProfile היא "לומר" לרכיב האב (MainScreenPage)
// לעבור לתצוגת פרופיל עם ה-ID של המשתמש שנלחץ
export default function UserSearch({ onNavigateToProfile }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // טכניקת "Debouncing": ממתינים שהמשתמש יפסיק להקליד לפני ששולחים בקשה
        const delayDebounceFn = setTimeout(() => {
            if (query.length > 1) { // בצע חיפוש רק אם יש לפחות 2 תווים
                setIsLoading(true);
                axios.get(`http://localhost:5000/api/users/search?q=${query}`)
                    .then(res => {
                        setResults(res.data);
                    })
                    .catch(err => console.error(err))
                    .finally(() => setIsLoading(false));
            } else {
                setResults([]); // נקה תוצאות אם החיפוש קצר מדי
            }
        }, 500); // המתן 500ms אחרי ההקלדה האחרונה

        // נקה את ה-timeout אם המשתמש ממשיך להקליד
        return () => clearTimeout(delayDebounceFn);
    }, [query]); // ה-useEffect ירוץ בכל פעם שה-query משתנה

    return (
        <div className="p-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3>Search for Users</h3>
            <input
                type="text"
                className="form-control"
                placeholder="Enter a name..."
                value={query}
                onChange={e => setQuery(e.target.value)}
            />

            {isLoading && <p className="text-muted mt-2">Searching...</p>}

            <div className="list-group mt-3">
                {results.map(user => (
                    <div
                        key={user._id}
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => onNavigateToProfile(user._id)} // נווט לפרופיל בלחיצה
                    >
                        <img
                            src={user.profileImageUrl || 'default-avatar.png'}
                            alt={user.fullName}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '15px' }}
                        />
                        <span>{user.fullName}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}