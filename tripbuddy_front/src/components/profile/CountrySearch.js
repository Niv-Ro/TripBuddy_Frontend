'use client';
import React, { useState } from 'react';
import '../../styles/Style.css';

function CountrySearch({ allCountries, existingCodes, onSelectCountry, onCancel }) {

    const [searchQuery, setSearchQuery] = useState('');

    // Filters the global list of countries based on the user's query and existing codes.
    const filteredCountries = searchQuery
        ? allCountries.filter(country =>
            // Condition 1: The country name or cca3 code includes the search query (case-insensitive).
            (country.name.toLowerCase().includes(searchQuery.toLowerCase())
            || country.code3.toLowerCase().includes(searchQuery.toLowerCase()))
            &&
            // Condition 2: The country is not already in the user's list.
            !existingCodes.includes(country.code)
        )
        : []; // If search query is empty, show no results.

    // Handler for when a user clicks on a search result.
    const handleSelect = (country) => {
        onSelectCountry(country); // Call the parent's function with the selected country object.
        setSearchQuery(''); // Reset the search field after selection.
    };

    return (
        <div className="search-section px-4 pt-3">
            <h6>Add a country to your list</h6>
            <div className="input-group">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search for a country..."
                    value={searchQuery} // Binds the input value to our state.
                    onChange={e => setSearchQuery(e.target.value)} // Updates the state on every keystroke.
                    autoFocus
                />
                <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancel</button>
            </div>

            {/* The search results are only displayed if there is a search query. */}
            {searchQuery && (
                <div className="search-results">
                    {/* Shows the top 5 results or a "not found" message. */}
                    {filteredCountries.length > 0 ? (
                        filteredCountries.slice(0, 5).map(country => (
                            <div key={country.code} className="result-item" onClick={() => handleSelect(country)}>
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