"use client";
import React from 'react';

export default function GroupCard({ group, onViewGroup, allCountries = [] }) {
    // A helper function to find a full country object from a country code (e.g., 'ISR').
    const getCountryInfo = (code) => allCountries.find(c => c.code3 === code);

    // This block processes the raw country codes from the group object into full country objects.
    const groupCountries = (group.countries || []) // if group.countries is undefined, use an empty array
        .map(getCountryInfo) // Runs the helper function on each code, creating an array of country objects (or undefined).

    return (
        <div className="col-lg-3 col-md-6 col-sm-12 mb-4">
            {/* The entire card is a clickable element that navigates to the group's view. */}
            <div className="card h-100 shadow-sm" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => onViewGroup(group._id)}>
                {/* The group's cover image. Generates a placeholder from ui-avatars.com if no image is provided. */}
                <img
                    src={group.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random&size=200`}
                    alt={group.name}
                    className="card-img-top"
                    style={{ height: '150px', objectFit: 'cover' }}
                />
                <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title mb-0" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{group.name}</h5>
                        {/* A badge that changes its style based on the group's privacy status. */}
                        <span className={`badge ${group.isPrivate ? 'bg-warning text-dark' : 'bg-success'}`}>{group.isPrivate ? 'Private' : 'Public'}</span>
                    </div>
                    {/* The description text, limited to 2 lines with (...) if it's too long. */}
                    <p className="card-text text-muted mb-2" style={{ fontSize: '0.9rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {group.description || 'No description available'}
                    </p>
                    <small className="text-muted mb-2">Admin: <strong>{group.admin?.fullName || 'N/A'}</strong></small>

                    <div className="mt-auto">
                        {groupCountries.length > 0 && (
                            <div className="d-flex flex-wrap gap-1">
                                {/* Displays only the first 3 countries for a clean UI. */}
                                {groupCountries.slice(0, 3).map(country => (
                                    <span key={country.code} className="badge bg-light text-dark fw-normal border" style={{ fontSize: '0.7rem' }}>
                                        <img src={country.flag} alt={country.name} style={{ width: '12px', height: '9px', marginRight: '3px' }} />
                                        {country.name}
                                    </span>
                                ))}
                                {/* If there are more than 3 countries, it shows a "+X more" badge. */}
                                {groupCountries.length > 3 && (<span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>+{groupCountries.length - 3} more</span>)}
                            </div>
                        )}
                    </div>
                </div>
                {/* The card footer displays the number of members in the group.
                    If group has only one member, write in singular*/}
                <div className="card-footer text-muted small">
                    {(group.members || []).length} members{(group.members || []).length !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
    );
}