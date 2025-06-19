'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries.js";
import '../styles/ProfileAdditions.css'; // ייבוא קובץ ה-CSS

function Profile() {
    // --- State and Hooks ---
    const [data, setData] = useState(null);
    const { user } = useAuth();
    const allCountries = useCountries();
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false); // State to control search visibility

    // --- Data Fetching Logic (Original) ---
    useEffect(() => {
        if (!user?.email) return;
        axios.get(`http://localhost:5000/api/users/${user.email}`)
            .then(res => setData(res.data))
            .catch(err => {
                console.error("Failed to fetch user data:", err);
                setData({ error: "User not found" });
            });
    }, [user]);

    // --- Handler Functions for Countries ---
    const handleAddCountry = (country) => {
        if (!selectedCountries.some(sc => sc.code === country.code)) {
            setSelectedCountries(prev => [...prev, country]);
        }
        setSearchQuery('');
        setIsAdding(false); // Close the search UI after adding
    };

    const handleRemoveCountry = (countryCode) => {
        setSelectedCountries(prev => prev.filter(c => c.code !== countryCode));
    };

    // --- Helper Functions ---
    function getAge(dateString) {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    const filteredCountries = searchQuery
        ? allCountries.filter(country =>
            country.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !selectedCountries.some(sc => sc.code === country.code)
        )
        : [];

    // --- Loading and Error States ---
    if (!user) return <div className="p-4">Loading user authentication...</div>;
    if (!data) return <div className="p-4">Loading profile data...</div>;
    if (data.error) return <div className="p-4 text-danger">{data.error}</div>;

    // --- JSX Rendering ---
    return (
        <div>
            <nav className="navbar navbar-light  border-bottom py-2"
                 style={{minHeight: "36px"}}>
                <div className="d-flex align-items-center w-100">
                    {/* Image */}
                    <div style={{
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        overflow: "hidden",
                    }}>
                        <img
                            src={data.profileImageUrl || 'https://i1.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                            alt="Profile"
                            width={200}
                            height={200}
                            style={{objectFit: "cover"}}
                        />
                    </div>
                    {/* Info to the right */}
                    <div style={{marginLeft: "32px"}}>
                        <h1 className="py-2 mb-1">{data.fullName}</h1>
                        <h5 className="mb-1">Country: {data.countryOrigin}</h5>
                        <h5 className="mb-1">Gender: {data.gender}</h5>
                        <h5 className="mb-0">Age: {getAge(data.birthDate)}</h5>
                    </div>
                    <div style={{marginLeft: "32px"}}>
                        <h4>About me</h4>

                    </div>
                </div>
            </nav>
            <nav className="navbar navbar-light border-bottom px-4 py-2"
                 style={{minHeight: "36px"}}>

                <div className="d-flex align-items-center w-100" style={{
                    overflowX: "auto",
                    whiteSpace: "nowrap"}}>

                    {/* Section 2: Visited Countries Scroller */}
                    <div className="countries-section px-4 pt-3">
                        <h5>Countries Visited</h5>
                        <div className="scroll-container">
                            {/* Add Button */}
                            <div className="country-item-wrapper" onClick={() => setIsAdding(true)}>
                                <div className="add-circle">
                                    <span>+</span>
                                </div>
                                <p className="country-caption" style={{fontWeight: 'normal', color: '#65676b'}}>Add</p>
                            </div>

                            {/* Render the list of selected countries */}
                            {selectedCountries.map(country => (
                                <div key={country.code} className="country-item-wrapper">
                                    <button
                                        className="remove-btn"
                                        onClick={() => handleRemoveCountry(country.code)}
                                    >
                                        &times;
                                    </button>
                                    <div className="country-circle">
                                        <img src={country.flag} alt={country.name} className="country-flag" />
                                    </div>
                                    <p className="country-caption">{country.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div>

                    {/* Section 3: Search UI (Conditionally Rendered) */}
                    {isAdding && (
                        <div className="search-section px-4 py-3">
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
                                <button className="btn btn-outline-secondary" type="button" onClick={() => setIsAdding(false)}>Cancel</button>
                            </div>

                            {searchQuery && (
                                <div className="search-results">
                                    {filteredCountries.length > 0 ? (
                                        filteredCountries.slice(0, 5).map(country => ( // Show top 5 results
                                            <div
                                                key={country.code}
                                                className="result-item"
                                                onClick={() => handleAddCountry(country)}
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
                    )}
                </div>
            </nav>
        </div>
    );
}

export default Profile;