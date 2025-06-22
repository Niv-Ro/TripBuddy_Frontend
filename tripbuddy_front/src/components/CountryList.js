'use client';

import React from 'react';
import '../styles/Style.css';

// The component now receives an 'isOwnProfile' prop
export default function CountryList({ title, countries, onAddRequest, onRemove, isOwnProfile }) {
    return (
        <div className="countries-section pt-3">
            <h5 className="mb-2 px-2">{title} ({countries.length})</h5>
            <div className="scroll-container">
                {/* 🔥 FIX 3: The Add button only appears on your own profile */}
                {isOwnProfile && (
                    <div className="country-item-wrapper" onClick={onAddRequest}>
                        <div className="add-circle">
                            <span>+</span>
                        </div>
                    </div>
                )}

                {countries.map(country => (
                    <div key={country.code} className="country-item-wrapper" title={country.name}>
                        {/* 🔥 FIX 3: The Remove button only appears on your own profile */}
                        {isOwnProfile && (
                            <button
                                className="remove-btn"
                                onClick={() => onRemove(country.code, title.includes('Visited') ? 'visited' : 'wishlist')}
                            >
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
