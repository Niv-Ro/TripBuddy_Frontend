'use client';
import React from 'react';
import '../../styles/Style.css';

export default function CountryList({ title, countries, onAddRequest, onRemove, isOwnProfile }) {
    return (
        <div className="countries-section pt-3">
            <h5 className="mb-2 px-2">{title} ({countries.length})</h5>
            {/* This container enables horizontal scrolling. */}
            <div className="scroll-container">
                {/* The "Add" button is only rendered on the user's own profile. */}
                {isOwnProfile && (
                    <div className="country-item-wrapper" onClick={onAddRequest}>
                        <div className="add-circle"><span>+</span></div>
                    </div>
                )}

                {/* Maps over the countries array to render each country item. */}
                {countries.map(country => (

                    <div key={country.code} className="country-item-wrapper" title={country.name}>
                        {/* title is what will be shown when hovered, this is HTML existing feature */}
                        {/* The "Remove" button is also only rendered on the user's own profile. */}
                        {isOwnProfile && (
                            <button className="remove-btn" onClick={() => onRemove(country.code, title.includes('Visited') ? 'visited' : 'wishlist')}>
                                &times;
                            </button>
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