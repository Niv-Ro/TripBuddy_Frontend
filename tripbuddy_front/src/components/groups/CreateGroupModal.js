"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import useCountries from '@/hooks/useCountries';
import CountrySearch from '../profile/CountrySearch';
import { storage } from '@/services/fireBase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFileProcessor } from '@/hooks/useFileProcessor';

export default function CreateGroupModal({ onClose, onGroupCreated }) {
    const { mongoUser } = useAuth();
    const allCountries = useCountries();
    const { processFiles, processedFiles, isProcessing, reset } = useFileProcessor();  //Our custom hook for image processing

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [taggedCountries, setTaggedCountries] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Adds a country to the taggedCountries state, preventing duplicates.
    const handleAddCountry = (country) => {
        if (!taggedCountries.some(c => c.code === country.code)) {
            setTaggedCountries(prev => [...prev, country]);
        }
        setIsSearching(false);
    };
    // Removes a country from the taggedCountries state.
    const handleRemoveCountry = (countryCode) => {
        setTaggedCountries(prev => prev.filter(c => c.code !== countryCode));
    };

    // Triggers the file processing hook when a user selects an image.
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            //Process group picture
            processFiles([e.target.files[0]], { maxWidth: 800, maxHeight: 800, quality: 0.85 });
        }
    };

    // The main submission, entire creation process.
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) {
            setError('Group must have a name.');
            return;
        }
        if (isProcessing) {
            setError('Please wait for image processing to complete.');
            return;
        }
        setIsUploading(true);
        setError('');
        let imageUrl = ''; // Will hold group's image url in firebase storage to display on card and group view
        try {
            // Get the compressed file from our custom hook's state.
            const imageToUpload = processedFiles.length > 0 ? processedFiles[0] : null;

            // If an image was selected, upload it to Firebase Storage.
            if (imageToUpload) {
                const folder = isPrivate ? "private" : "public";
                const imageRef = ref(storage, `groups/${folder}/${name}`); //Upload to a readable and clear folder
                await uploadBytes(imageRef, imageToUpload);
                imageUrl = await getDownloadURL(imageRef);  // Get the public URL of the uploaded image.
            }
            //  Assemble the final data object to send to our server
            const groupData = {
                name, description, imageUrl, isPrivate,
                countries: taggedCountries.map(c => c.code3),
                adminUserId: mongoUser._id
            };
            // Send the data to the server API to create the group in MongoDB.
            const res = await axios.post('http://localhost:5000/api/groups', groupData);
            // Notify the parent component and close the modal.
            onGroupCreated(res.data);
            onClose();
        } catch (err) {
            setError('Failed to create group. Please try again.');
        } finally {
            // This block runs regardless of success or failure, ensuring the loading state is always reset
            setIsUploading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h5 className="mb-3">Create a New Travel Group</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-2"><label className="form-label">Group Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="form-control" required /></div>
                    <div className="mb-2"><label className="form-label">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="form-control"></textarea></div>
                    <div className="mb-3">
                        <label className="form-label">Group Image</label>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="form-control" disabled={isProcessing || isUploading} />
                        {isProcessing && <small className="text-muted d-block mt-1">Compressing image...</small>}
                    </div>
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
                        {/* Toggles the visibility of the CountrySearch component. */}
                        {!isSearching && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setIsSearching(true)}>+ Add Country</button>}
                        {isSearching && <CountrySearch allCountries={allCountries} existingCodes={taggedCountries.map(c => c.code)} onSelectCountry={handleAddCountry} onCancel={() => setIsSearching(false)} />}
                    </div>
                    <hr />
                    {error && <p className="text-danger">{error}</p>}
                    <button type="submit" className="btn btn-primary" disabled={isUploading || isProcessing}>
                        {isUploading ? 'Creating...' : isProcessing ? 'Processing...' : 'Create Group'}
                    </button>
                </form>
            </div>
        </div>
    );
}