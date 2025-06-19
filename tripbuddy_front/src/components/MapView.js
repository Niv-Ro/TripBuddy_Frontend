"use client"
import React, {useState} from "react";
import {ComposableMap, Geographies, Geography, ZoomableGroup} from "react-simple-maps";
import { Tooltip } from "react-tooltip"


//common fields
//countries api ccn3
//map api id


const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"

function MapView() {
    const [content, setContent] = useState("");
    const [clickedCountries, setClickedCountries] = useState({});
    const [position, setPosition] = useState({ coordinates: [15, 0], zoom: 1 });

    const handleCountryClick = (rsmKey) => {
        setClickedCountries(prev => ({
            ...prev,
            [rsmKey]: !prev[rsmKey]
        }));
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
                style={{ zIndex: 1000 }} // Ensure tooltip appears above everything
            >
                {content}
            </Tooltip>

            <div style={{
                width: '1200px',
                borderStyle: "double",
                position: 'fixed', // Changed from fixed to relative
                zIndex: 1 // Lower than tooltip
            }}>
                <ComposableMap>
                    <ZoomableGroup
                        zoom={position.zoom}
                        center={position.coordinates}
                        onMoveEnd={handleMoveEnd}
                    >
                        <Geographies geography={geoUrl}>
                            {({geographies}) => geographies.map((geo) => {
                                const name = geo.properties.name || geo.properties.NAME || geo.properties.NAME_LONG;
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        data-tooltip-id="country-tooltip"
                                        data-tooltip-content={name}
                                        onClick={() => handleCountryClick(geo.rsmKey)}
                                        onMouseEnter={() => setContent(name)}
                                        onMouseLeave={() => setContent("")}
                                        stroke="#000000"
                                        style={{
                                            default: {
                                                fill: clickedCountries[geo.rsmKey] ? "#f9ff33" : "#2D723D",
                                                outline: "none"
                                            },
                                            hover: {
                                                fill: clickedCountries[geo.rsmKey] ? "#3A7CA5" : "#96C549",
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })}
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>
            </div>

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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    <span></span>Zoom In
                </button>
                <button
                    onClick={handleZoomOut}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    <span></span>Zoom Out
                </button>
            </div>
        </div>
    )
}

export default MapView;