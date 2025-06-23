"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import useCountries from '@/hooks/useCountries';

export default function GroupSearch({ onViewGroup }) {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('all');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const allCountries = useCountries();

    const fetchGroups = useCallback(async (searchQuery, type) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            let finalSearchQuery = searchQuery;

            // If searching by country, convert country names to codes
            if (type === 'country' && allCountries.length > 0) {
                const matchingCountries = allCountries.filter(country =>
                    country.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (matchingCountries.length > 0) {
                    // Create a regex pattern that matches any of the country codes
                    const countryCodes = matchingCountries.map(c => c.code3);
                    // We'll send multiple requests or use the first matching code
                    // For simplicity, let's search for all matching groups
                    const searchPromises = countryCodes.map(code =>
                        axios.get(`http://localhost:5000/api/groups/search?q=${code}&searchType=country`)
                    );

                    // Also search by the original query (in case user typed a country code)
                    searchPromises.push(
                        axios.get(`http://localhost:5000/api/groups/search?q=${searchQuery}&searchType=country`)
                    );

                    const responses = await Promise.all(searchPromises);
                    const allResults = responses.flatMap(res => res.data);

                    // Remove duplicates based on group ID
                    const uniqueResults = allResults.filter((group, index, arr) =>
                        arr.findIndex(g => g._id === group._id) === index
                    );

                    setResults(uniqueResults);
                    return;
                }
            }

            // For 'all' search type, we need to handle country name conversion too
            if (type === 'all' && allCountries.length > 0) {
                const matchingCountries = allCountries.filter(country =>
                    country.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (matchingCountries.length > 0) {
                    // Search by original query and also by country codes
                    const countryCodes = matchingCountries.map(c => c.code3);
                    const searchPromises = [
                        axios.get(`http://localhost:5000/api/groups/search?q=${searchQuery}&searchType=all`)
                    ];

                    // Add searches for each matching country code
                    countryCodes.forEach(code => {
                        searchPromises.push(
                            axios.get(`http://localhost:5000/api/groups/search?q=${code}&searchType=country`)
                        );
                    });

                    const responses = await Promise.all(searchPromises);
                    const allResults = responses.flatMap(res => res.data);

                    // Remove duplicates
                    const uniqueResults = allResults.filter((group, index, arr) =>
                        arr.findIndex(g => g._id === group._id) === index
                    );

                    setResults(uniqueResults);
                    return;
                }
            }

            // Default search for other types or when no country matches found
            const res = await axios.get(`http://localhost:5000/api/groups/search?q=${finalSearchQuery}&searchType=${type}`);
            setResults(res.data);
        } catch (err) {
            console.error("Failed to search groups", err);
        } finally {
            setIsLoading(false);
        }
    }, [allCountries]);

    const debouncedFetchGroups = useCallback(debounce(fetchGroups, 400), [fetchGroups]);

    useEffect(() => {
        debouncedFetchGroups(query, searchType);
        return () => debouncedFetchGroups.cancel();
    }, [query, searchType, debouncedFetchGroups]);

    const getPlaceholderText = () => {
        switch (searchType) {
            case 'name':
                return 'Search by group name...';
            case 'country':
                return 'Search by country name or code...';
            case 'admin':
                return 'Search by admin name...';
            default:
                return 'Search groups by name, country, or admin...';
        }
    };

    const GroupCard = ({ group }) => {
        const groupCountries = (group.countries || []).map(code => allCountries.find(c => c.code3 === code)).filter(Boolean);

        return (
            <div className="col-lg-3 col-md-6 col-sm-12 mb-4">
                <div className="card h-100 shadow-sm hover-shadow" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => onViewGroup(group._id)}>
                    {/* Group Image */}
                    <div style={{ height: '200px', overflow: 'hidden' }}>
                        <img
                            src={group.imageUrl || '/default-group-image.jpg'}
                            alt={group.name}
                            className="card-img-top"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x200/e9ecef/6c757d?text=Group+Image';
                            }}
                        />
                    </div>

                    <div className="card-body d-flex flex-column">
                        {/* Group Header */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="card-title mb-0" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{group.name}</h5>
                            <div className="d-flex align-items-center gap-2">
                                <span className={`badge ${group.isPrivate ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: '0.75rem' }}>
                                    {group.isPrivate ? 'Private' : 'Public'}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="card-text text-muted mb-2" style={{
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {group.description || 'No description available'}
                        </p>

                        {/* Admin Info */}
                        <small className="text-muted mb-2">
                            <strong>Admin:</strong> {group.admin?.fullName || 'N/A'}
                        </small>

                        {/* Countries */}
                        {groupCountries.length > 0 && (
                            <div className="mb-2">
                                <div className="d-flex flex-wrap gap-1">
                                    {groupCountries.slice(0, 3).map(country => (
                                        <span key={country.code} className="badge bg-light text-dark fw-normal border" style={{ fontSize: '0.7rem' }}>
                                            <img src={country.flag} alt={country.name} style={{ width: '12px', height: '9px', marginRight: '3px' }} />
                                            {country.name}
                                        </span>
                                    ))}
                                    {groupCountries.length > 3 && (
                                        <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                                            +{groupCountries.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Members Count - Push to bottom */}
                        <div className="mt-auto pt-2">
                            <small className="text-muted">
                                <i className="fas fa-users me-1"></i>
                                {(group.members || []).length} member{(group.members || []).length !== 1 ? 's' : ''}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <h4 className="mb-4">Find New Groups</h4>

            {/* Search Controls */}
            <div className="mb-4">
                <div className="row g-3">
                    {/* Search Type Selector */}
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            <option value="all">Search All</option>
                            <option value="name">Group Name</option>
                            <option value="country">Country</option>
                            <option value="admin">Admin Name</option>
                        </select>
                    </div>

                    {/* Search Input */}
                    <div className="col-md-9">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="form-control form-control-lg"
                            placeholder={getPlaceholderText()}
                        />
                    </div>
                </div>

                {/* Search Info */}
                <small className="text-muted mt-2 d-block">
                    {searchType === 'all' && 'Searching across group names, descriptions, countries, and admin names'}
                    {searchType === 'name' && 'Searching in group names only'}
                    {searchType === 'country' && 'Searching in group countries (names and codes)'}
                    {searchType === 'admin' && 'Searching in admin names only'}
                </small>
            </div>

            {isLoading && (
                <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Searching...</span>
                    </div>
                    <p className="mt-2 text-muted">Searching groups...</p>
                </div>
            )}

            {results.length > 0 && (
                <>
                    <div className="mb-3">
                        <small className="text-muted">
                            Found {results.length} group{results.length !== 1 ? 's' : ''}
                            {searchType !== 'all' && ` matching ${searchType} "${query}"`}
                        </small>
                    </div>
                    <div className="row">
                        {results.map(group => (
                            <GroupCard key={group._id} group={group} />
                        ))}
                    </div>
                </>
            )}

            {results.length === 0 && query.length > 1 && !isLoading && (
                <div className="text-center p-5 bg-light rounded">
                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No Groups Found</h5>
                    <p className="text-muted">
                        No public groups found
                        {searchType !== 'all' && ` in ${searchType}`}
                        matching "<strong>{query}</strong>".
                        Try different keywords or search in all fields!
                    </p>
                </div>
            )}

            {query.length === 0 && (
                <div className="text-center p-5 bg-light rounded">
                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">Search for Groups</h5>
                    <p className="text-muted">
                        Choose a search type and enter at least 2 characters to start searching for public groups.
                    </p>
                </div>
            )}

            <style jsx>{`
                .hover-shadow:hover {
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
                    transform: translateY(-2px);
                }

                .card {
                    transition: all 0.3s ease;
                    border: 1px solid #e3e6f0;
                }

                .card:hover {
                    border-color: #5a5c69;
                }
            `}</style>
        </div>
    );
}