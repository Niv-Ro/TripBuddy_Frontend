"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import useCountries from '@/hooks/useCountries'; // ✅ ייבוא ה-hook

export default function GroupSearch({ onViewGroup }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const allCountries = useCountries(); // ✅ קבלת רשימת המדינות

    const fetchGroups = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
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
    }, []);

    const debouncedFetchGroups = useCallback(debounce(fetchGroups, 400), [fetchGroups]);

    useEffect(() => {
        debouncedFetchGroups(query);
        return () => debouncedFetchGroups.cancel();
    }, [query, debouncedFetchGroups]);

    return (
        <div>
            <h4>Find New Groups</h4>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="form-control mb-3"
                placeholder="Search for public groups by name..."
            />
            {isLoading && <p className="text-muted">Searching...</p>}
            <div className="list-group">
                {results.map(group => {
                    const groupCountries = (group.countries || []).map(code => allCountries.find(c => c.code3 === code)).filter(Boolean);
                    return (
                        <button
                            key={group._id}
                            type="button"
                            className="list-group-item list-group-item-action"
                            onClick={() => onViewGroup(group._id)}
                        >
                            <div className="d-flex w-100 justify-content-between">
                                <h5 className="mb-1">{group.name}</h5>
                                <small>{(group.members || []).length} members</small>
                            </div>
                            <p className="mb-1 text-muted">{group.description}</p>

                            {/* ✅ הצגת שם מנהל הקבוצה */}
                            <small className="text-muted d-block mb-2">Admin: <strong>{group.admin?.fullName || 'N/A'}</strong></small>

                            {/* ✅ הצגת המדינות המתויגות */}
                            {groupCountries.length > 0 && (
                                <div className="d-flex flex-wrap gap-1">
                                    {groupCountries.map(country => (
                                        <span key={country.code} className="badge bg-light text-dark fw-normal border">
                                            <img src={country.flag} alt={country.name} style={{ width: '16px', height: '12px', marginRight: '5px' }} />
                                            {country.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            {results.length === 0 && query.length > 1 && !isLoading && (
                <p className="text-muted">No public groups found matching your search.</p>
            )}
        </div>
    );
}