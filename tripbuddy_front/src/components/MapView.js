"use client";
import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import useCountries from "@/hooks/useCountries";

const globeImageUrl = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const bumpImageUrl = "https://unpkg.com/three-globe/example/img/earth-topology.png";

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
            <span style={{background:"#f9ff33",display:'inline-block',width:20,height:20,borderRadius:3}}></span>
            <span>Visited</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{background:"#2D723D",display:'inline-block',width:20,height:20,borderRadius:3}}></span>
            <span>Not Selected</span>
        </div>
        <div style={{fontSize:12,color:'#666'}}>
            <b>Instructions:</b><br/>
            - 1st Click: Add to Wishlist<br/>
            - 2nd Click: Mark as Visited<br/>
            - 3rd Click: Remove from lists
        </div>
    </div>
);

function MapView() {
    const { user } = useAuth();
    const allCountries = useCountries();
    const [visitedCountries, setVisitedCountries] = useState([]);
    const [wishlistCountries, setWishlistCountries] = useState([]);
    const [geoData, setGeoData] = useState({ features: [] });
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const globeEl = useRef();
    const initialLoad = useRef(true);

    // Mouse move handler for tooltip positioning
    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    // 1. Load map geometry
    useEffect(() => {
        const loadMapData = async () => {
            try {
                const response = await fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
                const world = await response.json();

                const processedFeatures = world.features.map((feature) => ({
                    ...feature,
                    id: feature.properties.ISO_A3 || feature.id,
                    properties: {
                        ...feature.properties,
                        name: feature.properties.NAME || feature.properties.ADMIN
                    }
                }));

                setGeoData({
                    type: "FeatureCollection",
                    features: processedFeatures
                });
            } catch (err) {
                console.error("Failed to load map data:", err);
                setGeoData({ type: "FeatureCollection", features: [] });
            }
        };

        loadMapData();
    }, []);

    // 2. Load user data
    useEffect(() => {
        if (!user?.email || allCountries.length === 0) return;

        axios.get(`http://localhost:5000/api/users/${user.email}`)
            .then(res => {
                const userData = res.data;
                console.log("User data loaded:", userData);

                if (userData.visitedCountries) {
                    const visited = allCountries.filter(c =>
                        userData.visitedCountries.includes(c.code3) ||
                        userData.visitedCountries.includes(c.ccn3?.toString())
                    );
                    setVisitedCountries(visited);
                }

                if (userData.wishlistCountries) {
                    const wishlist = allCountries.filter(c =>
                        userData.wishlistCountries.includes(c.code3) ||
                        userData.wishlistCountries.includes(c.ccn3?.toString())
                    );
                    setWishlistCountries(wishlist);
                }
            })
            .catch(err => console.error("Failed to load user data:", err))
            .finally(() => {
                setTimeout(() => initialLoad.current = false, 500);
            });
    }, [user?.email, allCountries]);

    // 3. Save to DB on change
    useEffect(() => {
        if (initialLoad.current || !user?.email) return;

        const visitedCca3 = visitedCountries.map(c => c.code3);
        const wishlistCca3 = wishlistCountries.map(c => c.code3);
        const visitedCcn3 = visitedCountries.map(c => c.ccn3);
        const wishlistCcn3 = wishlistCountries.map(c => c.ccn3);

        axios.put(`http://localhost:5000/api/users/${user.email}/country-lists`, {
            visited: visitedCca3,
            wishlist: wishlistCca3,
            visitedCcn3,
            wishlistCcn3
        })
            .catch(err => console.error("Failed to save country lists:", err));
    }, [visitedCountries, wishlistCountries, user?.email]);

    // Improved country name extraction
    const getCountryName = (feature) => {
        if (!feature) return null;

        // Try different property names that might contain the country name
        const name = feature.properties?.name ||
            feature.properties?.NAME ||
            feature.properties?.ADMIN ||
            feature.properties?.name_long ||
            feature.properties?.NAME_LONG ||
            feature.properties?.name_en ||
            feature.properties?.NAME_EN;

        // If we found a name, return it directly
        if (name) return name;

        // If no name found but we have an ID, try to find a matching country
        if (feature.id) {
            const matchedCountry = allCountries.find(c =>
                c.code3 === feature.id ||
                c.cca3 === feature.id ||
                c.ccn3 === feature.id
            );
            if (matchedCountry) return matchedCountry.name;
        }

        // Final fallback
        return null;
    };

    // Determine polygon color based on country status
    const getPolygonColor = (feature) => {
        if (!feature) return "rgba(45, 114, 61, 0.3)"; // Transparent version of #2D723D (30% opacity)

        const countryId = feature.id || feature.properties?.ISO_A3 || feature.properties?.ADM0_A3;
        const countryName = getCountryName(feature);

        // Check if country is in visited list (yellow) - keep opaque
        const isVisited = visitedCountries.some(c =>
            c.ccn3 === countryId ||
            parseInt(c.ccn3) === parseInt(countryId) ||
            c.code3 === countryId ||
            c.cca3 === countryId ||
            (countryName && c.name?.toLowerCase().includes(countryName.toLowerCase()))
        );

        if (isVisited) return "rgba(250, 255, 100, 0.5)"; // Opaque yellow

        // Check if country is in wishlist (orange) - keep opaque
        const isWishlist = wishlistCountries.some(c =>
            c.ccn3 === countryId ||
            parseInt(c.ccn3) === parseInt(countryId) ||
            c.code3 === countryId ||
            c.cca3 === countryId ||
            (countryName && c.name?.toLowerCase().includes(countryName.toLowerCase()))
        );

        if (isWishlist) return "rgba(255, 165, 0, 0.5)"; // Opaque orange

        // Default: not selected (green) - now transparent
        return "rgba(45, 114, 61, 0.3)"; // #2D723D with 30% opacity
    };

    // Country click logic
    const handleCountryClick = (feature) => {
        if (!feature) return;

        const countryId = feature.id || feature.properties?.ISO_A3 || feature.properties?.ADM0_A3;
        const countryName = getCountryName(feature);

        let clickedCountry = allCountries.find(c =>
            c.ccn3 === countryId ||
            parseInt(c.ccn3) === parseInt(countryId) ||
            c.code3 === countryId ||
            c.cca3 === countryId ||
            (countryName && c.name?.toLowerCase().includes(countryName.toLowerCase()))
        );

        if (!clickedCountry) {
            clickedCountry = {
                name: countryName || `Country ${countryId}`,
                code3: countryId,
                ccn3: countryId,
                cca3: countryId
            };
        }

        const isInVisited = visitedCountries.some(c =>
            c.ccn3 === clickedCountry.ccn3 ||
            c.code3 === clickedCountry.code3 ||
            c.name === clickedCountry.name
        );
        const isInWishlist = wishlistCountries.some(c =>
            c.ccn3 === clickedCountry.ccn3 ||
            c.code3 === clickedCountry.code3 ||
            c.name === clickedCountry.name
        );

        if (isInVisited) {
            setVisitedCountries(prev => prev.filter(c =>
                c.ccn3 !== clickedCountry.ccn3 &&
                c.code3 !== clickedCountry.code3 &&
                c.name !== clickedCountry.name
            ));
        } else if (isInWishlist) {
            setWishlistCountries(prev => prev.filter(c =>
                c.ccn3 !== clickedCountry.ccn3 &&
                c.code3 !== clickedCountry.code3 &&
                c.name !== clickedCountry.name
            ));
            setVisitedCountries(prev => [...prev, clickedCountry]);
        } else {
            setWishlistCountries(prev => [...prev, clickedCountry]);
        }
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
            <MapLegend />
            {process.env.NODE_ENV === 'development' && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 1000
                }}>
                    <div className="border-bottom border-info-subtle">Countries</div>
                    <div>Visited: {visitedCountries.length}</div>
                    <div>Wishlist: {wishlistCountries.length}</div>
                </div>
            )}
            <Globe
                ref={globeEl}
                width={1200}
                height={700}
                backgroundColor="rgba(0, 0, 0, 0)"
                showAtmosphere={true}
                atmosphereColor="rgba(100, 150, 255, 0.4)"
                atmosphereAltitude={0.35}
                globeImageUrl={globeImageUrl}
                polygonsData={geoData.features}
                polygonCapColor={getPolygonColor}
                polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
                polygonStrokeColor={() => "#111"}
                onPolygonHover={(polygon) => {
                    if (polygon) {
                        console.log("Hovering over:", getCountryName(polygon));
                    }
                    setHoveredCountry(polygon);
                }}
                onPolygonClick={handleCountryClick}
                polygonsTransitionDuration={300}
                enablePointerInteraction={true}
                waitForGlobeReady={true}
                animateIn={true}
            />

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
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        zIndex: 2000,
                        pointerEvents: "none",
                        fontFamily: "Arial, sans-serif",
                        fontSize: "14px",
                        maxWidth: "200px",
                        wordWrap: "break-word",
                        whiteSpace: "nowrap"
                    }}
                >
                    {getCountryName(hoveredCountry) || "Unknown Country"}
                </div>
            )}
        </div>
    );
}

export default MapView;