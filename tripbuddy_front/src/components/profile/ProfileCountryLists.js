"use client";
import React from 'react';
import CountryList from './CountryList';
import CountrySearch from './CountrySearch';

export default function ProfileCountryLists({
                                                isOwnProfile, // Flag to determine if it user's profile to let him edit lists
                                                visitedCountries, //List of visited Countries from User model in mongoDB
                                                wishlistCountries, //List of wishlist Countries from User model in mongoDB
                                                addingToList, // Flag to open search bar
                                                allCountries, //All countries from hook
                                                onAddRequest, // Sets what list to add between the 2
                                                onRemove, // Refers to function to delete a country from specific list
                                                onSelectCountry, //Refer to function to add country to list in ProfilePage
                                                onCancelAdd //Refers to close search bar function
                                            }) {
    return (
        <div>
            {/* The main container for both country lists. */}
            <div className="p-3 border-bottom">
                <CountryList
                    title="Countries Visited"
                    countries={visitedCountries}
                    isOwnProfile={isOwnProfile}
                    onAddRequest={() => onAddRequest('visited')} //When add country, determines what list it is
                    onRemove={onRemove}  //knows to remove from specific list by it's title
                />
                <CountryList
                    title="My Wishlist"
                    countries={wishlistCountries}
                    isOwnProfile={isOwnProfile}
                    onAddRequest={() => onAddRequest('wishlist')}
                    onRemove={onRemove}
                />
            </div>
            {/*Option to add countries conditionally if it is user's profile and add searchbar is available*/}
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