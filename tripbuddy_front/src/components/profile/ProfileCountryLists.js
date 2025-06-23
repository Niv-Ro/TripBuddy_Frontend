"use client";
import React from 'react';
import CountryList from './CountryList';
import CountrySearch from './CountrySearch';

export default function ProfileCountryLists({
                                                isOwnProfile,
                                                visitedCountries,
                                                wishlistCountries,
                                                addingToList,
                                                allCountries,
                                                onAddRequest,
                                                onRemove,
                                                onSelectCountry,
                                                onCancelAdd
                                            }) {
    return (
        <div>
            <div className="p-3 border-bottom">
                <CountryList
                    title="Countries Visited"
                    countries={visitedCountries}
                    isOwnProfile={isOwnProfile}
                    onAddRequest={() => onAddRequest('visited')}
                    onRemove={onRemove}
                />
                <CountryList
                    title="My Wishlist"
                    countries={wishlistCountries}
                    isOwnProfile={isOwnProfile}
                    onAddRequest={() => onAddRequest('wishlist')}
                    onRemove={onRemove}
                />
            </div>

            {isOwnProfile && addingToList && (
                <CountrySearch
                    allCountries={allCountries}
                    existingCodes={addingToList === 'visited' ? visitedCountries.map(c => c.code) : wishlistCountries.map(c => c.code)}
                    onSelectCountry={onSelectCountry}
                    onCancel={onCancelAdd}
                />
            )}
        </div>
    );
}