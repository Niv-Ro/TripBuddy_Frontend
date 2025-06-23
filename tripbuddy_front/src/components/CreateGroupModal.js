"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import useCountries from '@/hooks/useCountries';
import CountrySearch from './CountrySearch';
import { storage } from '@/services/fireBase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CreateGroupModal({ onClose, onGroupCreated }) {
    const { mongoUser } = useAuth();
    const allCountries = useCountries();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [isPrivate, setIsPrivate] = useState(true);
    const [taggedCountries, setTaggedCountries] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleAddCountry = (country) => {
        if (!taggedCountries.some(c => c.code === country.code)) {
            setTaggedCountries(prev => [...prev, country]);
        }
        setIsSearching(false);
    };
    const handleRemoveCountry = (countryCode) => {
        setTaggedCountries(prev => prev.filter(c => c.code !== countryCode));
    };
    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || taggedCountries.length === 0) {
            setError('Group name and at least one tagged country are required.');
            return;
        }
        setIsUploading(true);
        setError('');
        let imageUrl = '';
        try {
            if (imageFile) {
                const imageRef = ref(storage, `groups/${Date.now()}_${imageFile.name}`);
                await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(imageRef);
            }
            const groupData = {
                name, description, imageUrl, isPrivate,
                countries: taggedCountries.map(c => c.code3),
                adminUserId: mongoUser._id
            };
            const res = await axios.post('http://localhost:5000/api/groups', groupData);
            onGroupCreated(res.data);
            onClose();
        } catch (err) {
            setError('Failed to create group. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="modal-overlay"><div className="modal-content">
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
            <h5 className="mb-3">Create a New Travel Group</h5>
            <form onSubmit={handleSubmit}>
                <div className="mb-2"><label className="form-label">Group Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="form-control" required /></div>
                <div className="mb-2"><label className="form-label">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="form-control"></textarea></div>
                <div className="mb-3"><label className="form-label">Group Image</label><input type="file" accept="image/*" onChange={handleImageChange} className="form-control" /></div>
                <div className="form-check form-switch mb-3"><input className="form-check-input" type="checkbox" role="switch" id="isPrivateSwitch" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} /><label className="form-check-label" htmlFor="isPrivateSwitch">{isPrivate ? 'Private Group' : 'Public Group'}</label></div>
                <div className="mb-3">
                    <label className="form-label">Tagged Countries</label>
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
                    {!isSearching && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setIsSearching(true)}>+ Add Country</button>}
                    {isSearching && <CountrySearch allCountries={allCountries} existingCodes={taggedCountries.map(c => c.code)} onSelectCountry={handleAddCountry} onCancel={() => setIsSearching(false)} />}
                </div>
                <hr />
                {error && <p className="text-danger">{error}</p>}
                <button type="submit" className="btn btn-primary" disabled={isUploading}>{isUploading ? 'Creating...' : 'Create Group'}</button>
            </form>
        </div></div>
    );
}