"use client"
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries"; // Import the hook to get all countries
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Tooltip } from "react-tooltip";

// URL for the map topology
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// --- Legend Component ---
const MapLegend = () => (
    <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontFamily: 'Arial, sans-serif'
    }}>
        <h4 style={{ margin: '0 0 5px 0', paddingBottom: '5px', borderBottom: '1px solid #ccc' }}>Legend</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: 'orange', border: '1px solid #ccc' }}></div>
            <span>Wishlist</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#f9ff33', border: '1px solid #ccc' }}></div>
            <span>Visited</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#2D723D', border: '1px solid #ccc' }}></div>
            <span>Not Selected</span>
        </div>
        <p style={{ fontSize: '12px', margin: '10px 0 0 0', paddingTop: '10px', borderTop: '1px solid #ccc' }}>
            <b>Instructions:</b><br />
            - 1st Click: Add to Wishlist<br />
            - 2nd Click: Add to Visited<br />
            - 3rd Click: Remove from lists
        </p>
    </div>
);


function MapView() {
    // --- State and Hooks ---
    const { user } = useAuth();
    const allCountries = useCountries(); // Get the master list of all countries
    const [content, setContent] = useState("");
    const [position, setPosition] = useState({ coordinates: [15, 0], zoom: 1 });

    // State to hold the full country objects for visited and wishlist
    const [visitedCountries, setVisitedCountries] = useState([]);
    const [wishlistCountries, setWishlistCountries] = useState([]);
    const initialLoad = useRef(true); // Prevent saving on initial data fetch


    // --- Effects ---
    // Effect 1: Fetch initial user data to populate the lists
    useEffect(() => {
        if (!user?.email || allCountries.length === 0) return;

        axios.get(`http://localhost:5000/api/users/${user.email}`)
            .then(res => {
                const userData = res.data;
                // Populate lists with full country objects based on saved cca3 codes
                if (userData.visitedCountries) {
                    const initialVisited = allCountries.filter(c => userData.visitedCountries.includes(c.code3));
                    setVisitedCountries(initialVisited);
                }
                if (userData.wishlistCountries) {
                    const initialWishlist = allCountries.filter(c => userData.wishlistCountries.includes(c.code3));
                    setWishlistCountries(initialWishlist);
                }
            })
            .catch(err => {
                console.error("Failed to fetch user data for map:", err);
            })
            .finally(() => {
                // Set initial load to false after the first fetch is complete
                setTimeout(() => initialLoad.current = false, 500);
            });
    }, [user, allCountries]); // Rerun when user or country list is available


    // Effect 2: Automatically save any changes to the lists to the DB
    useEffect(() => {
        // Prevent running on the initial data load
        if (initialLoad.current || !user?.email) return;

        // Map to cca3 for profile lists
        const visitedCca3 = visitedCountries.map(c => c.code3);
        const wishlistCca3 = wishlistCountries.map(c => c.code3);

        // Map to ccn3 for map coloring
        const visitedCcn3 = visitedCountries.map(c => c.ccn3);
        const wishlistCcn3 = wishlistCountries.map(c => c.ccn3);

        console.log('SAVING MAP CHANGES TO DB:', { visitedCca3, wishlistCca3, visitedCcn3, wishlistCcn3 });

        // Send all four arrays to the backend to be saved
        axios.put(`http://localhost:5000/api/users/${user.email}/country-lists`, {
            visited: visitedCca3,
            wishlist: wishlistCca3,
            visitedCcn3: visitedCcn3,
            wishlistCcn3: wishlistCcn3
        })
            .then(res => console.log('Map lists saved successfully!'))
            .catch(err => console.error('Failed to save map lists:', err));

    }, [visitedCountries, wishlistCountries]); // This effect runs whenever the lists change


    // --- Handler Functions ---
    const handleCountryClick = (geo) => {
        // Find the full country object from our master list using the map ID (ccn3)
        const clickedCountry = allCountries.find(c => c.ccn3 === geo.id);
        if (!clickedCountry) {
            console.warn("Country not found in master list:", geo.properties.name);
            return;
        }

        const isInVisited = visitedCountries.some(c => c.ccn3 === clickedCountry.ccn3);
        const isInWishlist = wishlistCountries.some(c => c.ccn3 === clickedCountry.ccn3);

        // 3-Stage Click Logic
        if (isInVisited) {
            // 3rd Click: Remove from Visited
            setVisitedCountries(prev => prev.filter(c => c.ccn3 !== clickedCountry.ccn3));
        } else if (isInWishlist) {
            // 2nd Click: Move from Wishlist to Visited
            setWishlistCountries(prev => prev.filter(c => c.ccn3 !== clickedCountry.ccn3));
            setVisitedCountries(prev => [...prev, clickedCountry]);
        } else {
            // 1st Click: Add to Wishlist
            setWishlistCountries(prev => [...prev, clickedCountry]);
        }
    };


    function handleZoomIn() {
        if (position.zoom >= 4) return;
        setPosition((pos) => ({ ...pos, zoom: pos.zoom * 2 }));
    }

    function handleZoomOut() {
        if (position.zoom <= 1) return;
        setPosition((pos) => ({ ...pos, zoom: pos.zoom / 2 }));
    }

    function handleMoveEnd(position) {
        setPosition(position);
    }

    // --- Create Sets for quick lookups ---
    const visitedIds = new Set(visitedCountries.map(c => c.ccn3));
    const wishlistIds = new Set(wishlistCountries.map(c => c.ccn3));

    return (
        <div className="Map" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            backgroundColor: 'skyblue'
        }}>
            <Tooltip
                id="country-tooltip"
                style={{ zIndex: 1000 }}
            >
                {content}
            </Tooltip>

            <div style={{
                width: '1200px',
                borderStyle: "double",
                position: 'fixed',
                zIndex: 1
            }}>
                <ComposableMap>
                    <ZoomableGroup
                        zoom={position.zoom}
                        center={position.coordinates}
                        onMoveEnd={handleMoveEnd}
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }) => geographies.map((geo) => {
                                const name = geo.properties.name || geo.properties.NAME || geo.properties.NAME_LONG;
                                const isVisited = visitedIds.has(geo.id);
                                const isWishlist = wishlistIds.has(geo.id);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        data-tooltip-id="country-tooltip"
                                        data-tooltip-content={name}
                                        onClick={() => handleCountryClick(geo)} // Call the new click handler
                                        onMouseEnter={() => setContent(name)}
                                        onMouseLeave={() => setContent("")}
                                        stroke="#000000"
                                        style={{
                                            default: {
                                                fill: isVisited ? "#f9ff33" : isWishlist ? "orange" : "#2D723D",
                                                outline: "none",
                                                cursor: "pointer"
                                            },
                                            hover: {
                                                fill: "#96C549",
                                                outline: "none"
                                            },
                                            pressed: {
                                                fill: "#E42"
                                            }
                                        }}
                                    />
                                );
                            })}
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>
            </div>

            {/* Map Legend */}
            <MapLegend />

            {/* Zoom Controls */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 1000
            }}>
                <button
                    onClick={handleZoomIn}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    Zoom In
                </button>
                <button
                    onClick={handleZoomOut}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    Zoom Out
                </button>
            </div>
        </div>
    )
}

export default MapView;
