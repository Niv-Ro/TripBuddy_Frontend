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
            // ✅ תיקון: שליחת פרמטרים נכונים בהתאם ל-searchType
            const params = {};

            if (type === 'name' || type === 'all') {
                params.q = searchQuery;
            }
            if (type === 'admin') {
                params.adminName = searchQuery;
            }
            if (type === 'country') {
                params.country = searchQuery;
            }
            if (type === 'all') {
                // במקרה של חיפוש כללי, נשלח את כל הפרמטרים
                params.adminName = searchQuery;
                params.country = searchQuery;
            }

            const res = await axios.get(`http://localhost:5000/api/groups/search`, { params });
            setResults(res.data);
        } catch (err) {
            console.error("Failed to search groups", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
                return 'Search by country name...';
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
                            <option value="all">Search All</option>
                            <option value="name">Group Name</option>
                            <option value="country">Country</option>
                            <option value="admin">Admin Name</option>
                        </select>
                    </div>
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
                <small className="text-muted mt-2 d-block">
                    {searchType === 'all' && 'Searching across group names, descriptions, countries, and admin names'}
                    {searchType === 'name' && 'Searching in group names only'}
                    {searchType === 'country' && 'Searching in group countries'}
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