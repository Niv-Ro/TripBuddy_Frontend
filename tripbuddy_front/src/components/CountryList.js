import React from 'react';
import '../styles/ProfileAdditions.css'; // נשתמש באותו קובץ CSS

function CountryList({ title, countries, onRemove, onAddRequest }) {
    return (
        <div className="countries-section px-2 pt-1">
            <h5>{title}</h5>
            <div className="scroll-container">
                {/* Add Button */}
                <div className="country-item-wrapper" onClick={onAddRequest}>
                    <div className="add-circle">
                        <span>+</span>
                    </div>
                    <p className="country-caption" style={{ fontWeight: 'normal', color: '#65676b' }}>Add</p>
                </div>

                {/* Render the list of countries */}
                {countries.map(country => (
                    <div key={country.code} className="country-item-wrapper">
                        <button
                            className="remove-btn"
                            onClick={() => onRemove(country.code)}
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
    );
}

export default CountryList;