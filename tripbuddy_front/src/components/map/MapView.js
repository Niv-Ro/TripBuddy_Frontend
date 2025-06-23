"use client";
import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import useCountries from "@/hooks/useCountries";

// URLs for the 3D globe textures.
const globeImageUrl = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

// A simple presentational component for the map's legend.
const MapLegend = () => (
    <div style={{
        position: 'absolute', bottom: '20px', left: '20px', backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '15px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 1000,
        fontFamily: 'Arial, sans-serif'
    }}>
        <h4 style={{margin:0,marginBottom:10,fontSize:16}}>Legend</h4>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
            <span style={{background:"orange",display:'inline-block',width:20,height:20,borderRadius:3}}></span>
            <span>Wishlist</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
            <span style={{background:"#07FF007F",display:'inline-block',width:20,height:20,borderRadius:3}}></span>
            <span>Visited</span>
        </div>
        <div style={{fontSize:12,color:'#666'}}>
            <b>Instructions:</b><br/>
            - 1st Click: Add to Wishlist<br/>
            - 2nd Click: Mark as Visited<br/>
            - 3rd Click: Remove from lists
        </div>
    </div>
);

// Receives its data and a handler function as props from MainScreenPage.
export default function MapView({ visitedCountries, wishlistCountries, onListsChange }) {

    // Fetches the master list of all countries in the world for data matching.
    const allCountries = useCountries();
    // State to hold the geographical data (the country shapes) fetched from API.
    const [geoData, setGeoData] = useState({ features: [] });
    // Tracks the currently hovered country for the tooltip.
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    // A ref to get direct access to the Globe component's instance for advanced commands if needed.
    const globeEl = useRef();

    // Effect runs only once when the component mounts to fetch the map's geometry.

    useEffect(() => {
        const loadMapData = async () => {
            try {
                // Fetches a GeoJSON file. GeoJSON is a standard format for encoding geographic data.
                const response = await fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
                const world = await response.json();
                // world holds the raw data from the GeoJSON file.
                // world.features is an array where each item is a country's data and geometry.

                // Important notes: GeoJSON files, which describes geographic polygons
                // can come from different sources and sometimes can cause inconsistency in data
                // In some maps country code is "id" and in others is "ISO_A3" for example
                // In this effect we will try to make a standard way
                // We will go over each country in the array, create a copy and make sure that in that copy
                // there will be 2 keys with constant names we can trust: id (to identify country) and (properties.name) for country name
                const processedFeatures = world.features.map((feature) => ({
                    ...feature,
                    id: feature.properties.ISO_A3 || feature.id,
                    properties: { ...feature.properties, name: feature.properties.NAME || feature.properties.ADMIN }
                }));
                // Finally, it updates the component's state with the newly processed and cleaned array of features.
                setGeoData({ type: "FeatureCollection", features: processedFeatures });
            } catch (err) {
                console.error("Failed to load map data:", err);
            }
        };
        loadMapData();
    }, []);

    // Updates the mouse position state whenever the mouse moves over the main div.
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });

    // A helper function to find our standardized country object using data from a map feature.
    // A "bridge" between useCountries and GeoJSON to find a country
    const findCountryFromFeature = (feature) => {
        if (!feature) return null;
        // Extracts the ID and name from the map feature. Can be different names like explained above
        const countryId = feature.id || feature.properties?.ISO_A3;
        const countryName = feature.properties?.name;
        return allCountries.find(c =>
            c.ccn3 === countryId || parseInt(c.ccn3) === parseInt(countryId) ||
            c.code3 === countryId || (countryName && c.name.toLowerCase() === countryName.toLowerCase())
        );
    };

    // Called for every country on the globe to determine its color.
    const getPolygonColor = (feature) => {
        const country = findCountryFromFeature(feature);
        if (!country) return "rgba(45, 114, 61, 0.0)"; //There are some "unknown" countries, which our api doesn't support

        if (visitedCountries.some(c => c.code3 === country.code3)) return "rgba(7,255,0,0.5)"; // Green for visited
        if (wishlistCountries.some(c => c.code3 === country.code3)) return "rgba(255, 165, 0, 0.5)"; // Orange for wishlist

        return "rgba(45, 114, 61, 0.0)"; // Default green
    };

    // The click handler now calculates the new state and calls the parent's handler function.
    const handleCountryClick = (feature) => {
        const clickedCountry = findCountryFromFeature(feature);
        if (!clickedCountry) return;

        const isInVisited = visitedCountries.some(c => c.code3 === clickedCountry.code3);
        const isInWishlist = wishlistCountries.some(c => c.code3 === clickedCountry.code3);

        // Create copies of the current lists to modify them
        let newVisited = [...visitedCountries];
        let newWishlist = [...wishlistCountries];

        if (isInVisited) {
            // Stage 3 -> 1: If it's visited, remove it from all lists.
            newVisited = visitedCountries.filter(c => c.code3 !== clickedCountry.code3);
        } else if (isInWishlist) {
            // Stage 2 -> 3: If it's in the wishlist, move it to visited.
            newWishlist = wishlistCountries.filter(c => c.code3 !== clickedCountry.code3);
            newVisited.push(clickedCountry);
        } else {
            // Stage 1 -> 2: If it's not selected, add it to the wishlist.
            newWishlist.push(clickedCountry);
        }
        // Notifies the parent component MainScreenPage of the updated lists to save them.
        onListsChange(newVisited, newWishlist);
    };

    return (
        <div
            style={{
                width: "1200px",
                height: "700px",
                position: "relative",
                margin: "0 auto",
                border: "2px solid #ddd",
                background: "#000",
                overflow: "hidden",
                borderRadius: "8px"
            }}
            onMouseMove={handleMouseMove}
        >
            <MapLegend/>
            <div style={{
                position: 'absolute', top: '10px', right: '10px',
                background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px',
                borderRadius: '4px', fontSize: '12px', zIndex: 1000
            }}>
                <div style={{borderBottom: '1px solid #555', paddingBottom: '5px', marginBottom: '5px'}}>Countries</div>
                <div>Visited: {visitedCountries.length}</div>
                <div>Wishlist: {wishlistCountries.length}</div>
            </div>
            {/* The main Globe component from the `react-globe.gl` library. */}
            <Globe
                ref={globeEl}
                width={1200}
                height={700}
                backgroundColor="rgba(0, 0, 0, 0)"
                showAtmosphere={true}
                atmosphereColor="rgba(100, 150, 255, 0.4)"
                atmosphereAltitude={0.35}
                globeImageUrl={globeImageUrl}
                polygonsData={geoData.features} // The data that defines the country shapes.
                polygonCapColor={getPolygonColor} // The function that sets the color for each country.
                polygonSideColor={() => "rgba(0, 0, 0, 0)"}
                polygonStrokeColor={() => "#222"}
                onPolygonHover={setHoveredCountry} // Sets the state when a user hovers over a country.
                onPolygonClick={handleCountryClick} // The main click handler.
                polygonsTransitionDuration={300} // A small animation for color changes.
            />
            {/* Conditionally renders the tooltip next to the mouse when a country is hovered. */}
            {hoveredCountry && (
                <div
                    style={{
                        position: "fixed",
                        top: mousePos.y + 10,
                        left: mousePos.x + 10,
                        background: "rgba(0,0,0,0.8)",
                        color: "white",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        zIndex: 2000,
                        pointerEvents: "none"
                    }}
                >
                    {findCountryFromFeature(hoveredCountry)?.name || "Unknown Country"}
                </div>
            )}
        </div>
    );
}