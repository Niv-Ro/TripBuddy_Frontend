import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import useCountries from '@/hooks/useCountries';
import CountrySearch from './CountrySearch';

export default function CreateGroupModal({ onClose, onGroupCreated }) {
    const { mongoUser } = useAuth();
    const allCountries = useCountries();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(true); // ברירת מחדל: קבוצה פרטית
    const [taggedCountries, setTaggedCountries] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');

    const handleAddCountry = (country) => {
        if (!taggedCountries.some(c => c.code === country.code)) {
            setTaggedCountries(prev => [...prev, country]);
        }
        setIsSearching(false);
    };

    const handleRemoveCountry = (countryCode) => {
        setTaggedCountries(prev => prev.filter(c => c.code !== countryCode));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || taggedCountries.length === 0) {
            setError('Group name and at least one tagged country are required.');
            return;
        }
        const groupData = {
            name,
            description,
            countries: taggedCountries.map(c => c.code3),
            adminUserId: mongoUser._id,
            isPrivate // שלח גם את זה
        };
        try {
            const res = await axios.post('http://localhost:5000/api/groups', groupData);
            onGroupCreated(res.data);
            onClose();
        } catch (err) {
            console.error("Failed to create group", err);
            setError('Failed to create group. Please try again.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h5 className="mb-3">Create a New Travel Group</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Group Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-control" required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="form-control"></textarea>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Private Group?</label>
                        <select
                            className="form-select"
                            value={isPrivate}
                            onChange={e => setIsPrivate(e.target.value === "true")}
                        >
                            <option value="true">Yes (Private)</option>
                            <option value="false">No (Public)</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Tagged Countries (at least one)</label>
                        {taggedCountries.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mb-2">
                                {taggedCountries.map(c => (
                                    <span key={c.code} className="badge bg-light text-dark border d-flex align-items-center">
                                        <img src={c.flag} alt={c.name} style={{ width: '16px', height: '12px', marginRight: '5px' }} />
                                        {c.name}
                                        <button type="button" className="btn-close ms-2" style={{ fontSize: '0.6rem' }} onClick={() => handleRemoveCountry(c.code)}></button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {!isSearching && (
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setIsSearching(true)}>+ Add Country</button>
                        )}
                        {isSearching && (
                            <CountrySearch
                                allCountries={allCountries}
                                existingCodes={taggedCountries.map(c => c.code)}
                                onSelectCountry={handleAddCountry}
                                onCancel={() => setIsSearching(false)}
                            />
                        )}
                    </div>
                    <hr />
                    {error && <p className="text-danger">{error}</p>}
                    <button type="submit" className="btn btn-primary">Create Group</button>
                </form>
            </div>
        </div>
    );
}
