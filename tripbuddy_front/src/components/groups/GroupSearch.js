"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import useCountries from '@/hooks/useCountries';
import GroupCard from './GroupCard'; // Imports the reusable GroupCard component.

export default function GroupSearch({ onViewGroup }) {
    // State to hold the user's search query and selected filter type.
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('name');

    // State for the search results and loading indicator.
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const allCountries = useCountries();

    // A memoized helper function to find a country's various codes from a search term.
    const findCountryCode = useCallback((searchTerm) => {
        const term = searchTerm.toLowerCase().trim();
        const matchingCountry = allCountries.find(country =>
            country.name.toLowerCase().includes(term)
        );
        if (matchingCountry) {
            return {
                code: matchingCountry.code,
                code3: matchingCountry.code3,
                ccn3: matchingCountry.ccn3
            };
        }
        return null;
    }, [allCountries]);

    // The main function that sends the search request to the backend API.
    const fetchGroups = useCallback(async (searchQuery, type) => {
        // Prevents sending requests for empty or very short queries.
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const params = {}; // The query parameters object for the GET request.

            // This switch builds the `params` object based on the selected search type.
            switch (type) {
                case 'name':
                    params.q = searchQuery;
                    break;
                case 'admin':
                    params.adminName = searchQuery;
                    break;
                case 'country':
                    const countryInfo = findCountryCode(searchQuery);
                    if (countryInfo) {
                        params.country = countryInfo.code3;
                    } else {
                        params.countryName = searchQuery;
                    }
                    break;
                default:
                    params.q = searchQuery;
                    break;
            }

            // Makes the API call with the constructed parameters.
            const res = await axios.get(`http://localhost:5000/api/groups/search`, { params });
            setResults(res.data);
        } catch (err) {
            console.error("Failed to search groups", err);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [findCountryCode]);

    // Creates a "debounced" version of the fetch function for performance.
    // It waits 400ms after the user stops typing before making the API call.
    const debouncedFetchGroups = useCallback(debounce(fetchGroups, 400), [fetchGroups]);

    // This effect connects the user's input to the debounced search function.
    useEffect(() => {
        debouncedFetchGroups(query, searchType);
        // The cleanup function cancels any pending API call if the component unmounts.
        return () => debouncedFetchGroups.cancel();
    }, [query, searchType, debouncedFetchGroups]);

    // A helper function to set the input's placeholder text dynamically.
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

    // A helper function to generate suggestions for the country search input's datalist.
    const getCountrySuggestions = () => {
        if (searchType !== 'country' || !query || query.length < 2) return [];
        return allCountries
            .filter(country => country.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
            .map(country => country.name);
    };

    const countrySuggestions = getCountrySuggestions();

    return (
        <div>
            <h4 className="mb-4">Find New Groups</h4>

            {/* Search Controls Section */}
            <div className="mb-4">
                <div className="row g-3">
                    <div className="col-md-3">
                        {/* Dropdown to select the search type */}
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
                            {/* The main text input for the search query */}
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="form-control form-control-lg"
                                placeholder={getPlaceholderText()}
                                list={searchType === 'country' ? 'country-suggestions' : undefined}
                            />
                            {/* Provides autocomplete suggestions for country search */}
                            {searchType === 'country' && (
                                <datalist id="country-suggestions">
                                    {countrySuggestions.map(countryName => ( <option key={countryName} value={countryName} /> ))}
                                </datalist>
                            )}
                        </div>
                    </div>
                </div>
                <small className="text-muted mt-2 d-block">
                    {searchType === 'name' && 'Searching in group names and descriptions'}
                    {searchType === 'country' && 'Searching in group countries'}
                    {searchType === 'admin' && 'Searching in admin names only'}
                </small>
            </div>

            {/* Shows a spinner only when a search is actively in progress. */}
            {isLoading && (
                <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Searching...</span>
                    </div>
                </div>
            )}
            {/* Renders the results grid only if there are results and we are not loading. */}
            {results.length > 0 && !isLoading && (
                <div className="row">
                    {/* Maps over the results array and renders an imported card for each group. */}
                    {results.map(group => (
                        <GroupCard key={group._id} group={group} onViewGroup={onViewGroup} allCountries={allCountries} />
                    ))}
                </div>
            )}
            {/* Shows a "No Results" message only if a search was performed but returned empty. */}
            {results.length === 0 && query.length > 1 && !isLoading && (
                <div className="text-center p-5 bg-light rounded">
                    <h5 className="text-muted">No Groups Found</h5>
                    <p className="text-muted">No groups found matching "<strong>{query}</strong>".</p>
                </div>
            )}
            {/* Shows the initial prompt before the user has started typing. */}
            {query.length < 2 && !isLoading && (
                <div className="text-center p-5 bg-light rounded">
                    <h5 className="text-muted">Search for Groups</h5>
                    <p className="text-muted">Enter at least 2 characters to start searching.</p>
                </div>
            )}
        </div>
    );
}