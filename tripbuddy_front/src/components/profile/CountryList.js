'use client';
import React from 'react';
import '../../styles/Style.css';

export default function CountryList({ title, countries, onAddRequest, onRemove, isOwnProfile, allCountries = [] }) {

    // Determine if this is the "Visited" list.
    const isVisitedList = title.includes('Visited');

    return (
        <div className="countries-section pt-3">
            <div className="d-flex align-items-baseline">
                <h5 className="mb-2 px-2">{title} ({countries.length} / {allCountries.length})</h5>

                {/* Conditionally render the statistics only for the "Visited" list. */}
                {isVisitedList && allCountries.length > 0 && (
                    <small className="text-muted fw-light">
                        {`(visited ${((countries.length / allCountries.length) * 100).toFixed(1)}% of the world)`}
                    </small>
                )}
            </div>

            <div className="scroll-container">
                {isOwnProfile && (
                    <div className="country-item-wrapper" onClick={onAddRequest}>
                        <div className="add-circle"><span>+</span></div>
                    </div>
                )}
                {countries.map(country => (
                    <div key={country.code} className="country-item-wrapper" title={country.name}>
                        {isOwnProfile && (
                            <button
                                className="remove-btn"
                                onClick={() => onRemove(country.code, isVisitedList ? 'visited' : 'wishlist')}
                            >&times;</button>
                        )}
                        <div className="country-circle">
                            <img src={country.flag} alt={country.name} className="country-flag" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}