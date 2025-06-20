import React from 'react';
import '../styles/Style.css';

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
                    <div key={country.code} className="country-item-wrapper" title={country.name}>
                        <button
                            className="remove-btn"
                            onClick={() => onRemove(country.code)}
                        >
                            &times;
                        </button>
                        <div className="country-circle">
                            <img src={country.flag} alt={country.name} className="country-flag" />
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}

export default CountryList;