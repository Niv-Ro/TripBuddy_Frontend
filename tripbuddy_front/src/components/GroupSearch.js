"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';

// הרכיב onViewGroup יקבל ID וינווט לתצוגת הקבוצה
export default function GroupSearch({ onViewGroup }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const searchGroups = async (searchQuery) => {
        if (!searchQuery) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/groups/search?q=${searchQuery}`);
            setResults(res.data);
        } catch (err) {
            console.error("Failed to search groups", err);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedSearch = useCallback(debounce(searchGroups, 500), []);

    useEffect(() => {
        debouncedSearch(query);
    }, [query, debouncedSearch]);

    return (
        <div className="p-4">
            <h4>Find New Groups</h4>
            <input
                type="text"
                className="form-control mb-3"
                placeholder="Search for groups by name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {isLoading && <p>Searching...</p>}
            <div className="list-group">
                {results.length > 0 ? results.map(group => (
                    <button key={group._id} type="button" className="list-group-item list-group-item-action" onClick={() => onViewGroup(group._id)}>
                        <h5 className="mb-1">{group.name}</h5>
                        <p className="mb-1 text-muted">{group.description}</p>
                        <small>{group.members.length} members</small>
                    </button>
                )) : !isLoading && query && <p>No groups found.</p>}
            </div>
        </div>
    );
}