'use client';
import React, { useState } from 'react';
import '../styles/ProfileAdditions.css';

function CountrySearch({ allCountries, existingCodes, onSelectCountry, onCancel }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCountries = searchQuery
        ? allCountries.filter(country =>
            country.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !existingCodes.includes(country.code)
        )
        : [];

    const handleSelect = (country) => {
        onSelectCountry(country);
        setSearchQuery(''); // Reset search after selection
    };

    return (
        <div className="search-section px-4 pt-3">
            <h6>Add a country to your list</h6>
            <div className="input-group">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search for a country..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                />
                <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>
                    Cancel
                </button>
            </div>

            {searchQuery && (
                <div className="search-results">
                    {filteredCountries.length > 0 ? (
                        filteredCountries.slice(0, 5).map(country => (
                            <div
                                key={country.code}
                                className="result-item"
                                onClick={() => handleSelect(country)}
                            >
                                <img src={country.flag} alt={country.name} width="30" className="me-2" />
                                {country.name}
                            </div>
                        ))
                    ) : (
                        <div className="result-item text-muted">No matching countries found.</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CountrySearch;