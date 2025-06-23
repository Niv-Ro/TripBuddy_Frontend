"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import useCountries from '@/hooks/useCountries';

export default function GroupSearch({ onViewGroup }) {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('name');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const allCountries = useCountries();

    // Create a mapping of country names to codes for easier lookup
    const countryNameToCode = useMemo(() => {
        const mapping = {};
        allCountries.forEach(country => {
            // Map both full name and partial matches
            mapping[country.name.toLowerCase()] = country.code;
            // Also map common variations
            const words = country.name.toLowerCase().split(' ');
            words.forEach(word => {
                if (word.length > 2) { // Only for words longer than 2 characters
                    mapping[word] = country.code;
                }
            });
        });
        return mapping;
    }, [allCountries]);

    // Function to find country code from country name
    const findCountryCode = useCallback((searchTerm) => {
        const term = searchTerm.toLowerCase().trim();

        // Try to find the country by name
        const matchingCountry = allCountries.find(country =>
            country.name.toLowerCase().includes(term)
        );

        if (matchingCountry) {
            // Return all possible country codes for better matching
            return {
                code: matchingCountry.code,      // 2-letter (e.g., 'IL')
                code3: matchingCountry.code3,    // 3-letter (e.g., 'ISR')
                ccn3: matchingCountry.ccn3       // 3-digit numeric (e.g., '376')
            };
        }

        return null;
    }, [allCountries]);

    const fetchGroups = useCallback(async (searchQuery, type) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const params = {};

            switch (type) {
                case 'name':
                    params.q = searchQuery;
                    break;
                case 'admin':
                    params.adminName = searchQuery;
                    break;
                case 'country':
                    // Convert country name to country codes and try all formats
                    const countryInfo = findCountryCode(searchQuery);
                    if (countryInfo) {
                        // Try all possible country code formats
                        params.country = countryInfo.code3; // Try 3-letter first (most common)
                        // We'll also add a special parameter to try other formats if the first doesn't work
                        params.countryCode2 = countryInfo.code;  // 2-letter
                        params.countryCodeNumeric = countryInfo.ccn3; // numeric
                    } else {
                        // If no country code found, search by name directly
                        params.countryName = searchQuery;
                    }
                    break;
                default:
                    // Default to name search
                    params.q = searchQuery;
                    break;
            }

            const res = await axios.get(`http://localhost:5000/api/groups/search`, { params });
            setResults(res.data);
        } catch (err) {
            console.error("Failed to search groups", err);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [findCountryCode]);

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
                return 'Search by country name (e.g., Israel, United States)...';
            case 'admin':
                return 'Search by admin name...';
            default:
                return 'Search by group name...';
        }
    };

    // Function to get country name from country code for display
    const getCountryName = useCallback((countryCode) => {
        const country = allCountries.find(c => c.code === countryCode || c.code3 === countryCode);
        return country ? country.name : countryCode;
    }, [allCountries]);

    const GroupCard = ({ group }) => {
        const groupCountries = (group.countries || []).map(code => {
            // Try to find by code3 first, then by code
            return allCountries.find(c => c.code3 === code || c.code === code);
        }).filter(Boolean);

        return (
            <div className="col-lg-3 col-md-6 col-sm-12 mb-4">
                <div className="card h-100 shadow-sm hover-shadow" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => onViewGroup(group._id)}>
                    <div style={{ height: '200px', overflow: 'hidden' }}>
                        <img
                            src={group.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random&color=fff&size=200`}
                            alt={group.name}
                            className="card-img-top"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/200/e9ecef/6c757d?text=Image';
                            }}
                        />
                    </div>

                    <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="card-title mb-0" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{group.name}</h5>
                            <span className={`badge ${group.isPrivate ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: '0.75rem' }}>
                                {group.isPrivate ? 'Private' : 'Public'}
                            </span>
                        </div>

                        <p className="card-text text-muted mb-2" style={{
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {group.description || 'No description available'}
                        </p>

                        <small className="text-muted mb-2">
                            <strong>Admin:</strong> {group.admin?.fullName || 'N/A'}
                        </small>

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

    // Show country suggestions when searching by country
    const getCountrySuggestions = () => {
        if (searchType !== 'country' || !query || query.length < 2) return [];

        return allCountries
            .filter(country =>
                country.name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5)
            .map(country => country.name);
    };

    const countrySuggestions = getCountrySuggestions();

    return (
        <div>
            <h4 className="mb-4">Find New Groups</h4>

            <div className="mb-4">
                <div className="row g-3">
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            <option value="name">Group Name</option>
                            <option value="country">Country</option>
                            <option value="admin">Admin Name</option>
                        </select>
                    </div>
                    <div className="col-md-9">
                        <div className="position-relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="form-control form-control-lg"
                                placeholder={getPlaceholderText()}
                                list={searchType === 'country' ? 'country-suggestions' : undefined}
                            />
                            {searchType === 'country' && (
                                <datalist id="country-suggestions">
                                    {countrySuggestions.map(countryName => (
                                        <option key={countryName} value={countryName} />
                                    ))}
                                </datalist>
                            )}
                        </div>
                    </div>
                </div>
                <small className="text-muted mt-2 d-block">
                    {searchType === 'name' && 'Searching in group names and descriptions'}
                    {searchType === 'country' && 'Searching in group countries - type full country names like "Israel" or "United States"'}
                    {searchType === 'admin' && 'Searching in admin names only'}
                </small>
            </div>

            {isLoading && (
                <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Searching...</span>
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <div className="row">
                    {results.map(group => (
                        <GroupCard key={group._id} group={group} />
                    ))}
                </div>
            )}

            {results.length === 0 && query.length > 1 && !isLoading && (
                <div className="text-center p-5 bg-light rounded">
                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No Groups Found</h5>
                    <p className="text-muted">No public groups found matching "<strong>{query}</strong>".</p>
                    {searchType === 'country' && (
                        <small className="text-muted">
                            Try searching with the full country name (e.g., "Israel", "United States", "Germany")
                        </small>
                    )}
                </div>
            )}

            {query.length < 2 && (
                <div className="text-center p-5 bg-light rounded">
                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">Search for Groups</h5>
                    <p className="text-muted">Enter at least 2 characters to start searching.</p>
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