'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { storage } from '@/services/fireBase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';

// ייבוא הרכיבים וה-hooks הדרושים
import useCountries from "@/hooks/useCountries.js";
import CountrySearch from './CountrySearch';

export default function CreatePost({ onPostCreated, groupId = null }) {

    const { user, mongoUser } = useAuth();
    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    // State לניהול תיוג מדינות
    const allCountries = useCountries();
    const [taggedCountries, setTaggedCountries] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- Handlers ---
    const handleFileChange = (e) => {
        if (e.target.files.length > 10) {
            setError('You can select up to 10 files.');
            return;
        }
        setFiles(Array.from(e.target.files));
        setError('');
    };

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
        if (!text || files.length === 0 || !mongoUser) { // Check for mongoUser
            setError('Please fill in text, select at least one file, and be logged in.');
            return;
        }
        setIsUploading(true);
        setError('');
        try {
            const uploadPromises = files.map(file => {
                const filePath = `posts/${mongoUser._id}/${Date.now()}_${file.name}`; // Use mongoUser ID for folder
                const storageRef = ref(storage, filePath);
                return uploadBytes(storageRef, file).then(snapshot =>
                    getDownloadURL(snapshot.ref).then(url => ({
                        url: url,
                        type: file.type,
                        path: filePath
                    }))
                );
            });
            const mediaData = await Promise.all(uploadPromises);

            const postData = {
                // ✅ FIX: Send the correct MongoDB ID, not the Firebase UID
                authorId: mongoUser._id,
                text,
                media: mediaData,
                taggedCountries: taggedCountries.map(c => c.code3),
                groupId: groupId
            };

            await axios.post('http://localhost:5000/api/posts', postData);

            // איפוס הטופס
            setText('');
            setFiles([]);
            setTaggedCountries([]);
            setIsUploading(false);
            alert('Post created successfully!');

            if (onPostCreated) {
                onPostCreated();
            }
        } catch (err) {
            console.error('Error creating post:', err.response ? err.response.data : err.message);
            setError('Failed to create post. See console for details.');
            setIsUploading(false);
        }
    };

    return (
        <div className="card p-3 mb-4 shadow-sm">
            <h5 className="card-title">{groupId ? 'Create a post in group' : 'Create a new post'}</h5>
            <form onSubmit={handleSubmit}>
                <textarea
                    className="form-control mb-2"
                    rows="3"
                    placeholder="What's on your mind?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                ></textarea>
                <input
                    type="file"
                    className="form-control mb-2"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                />

                {/* ממשק תיוג מדינות */}
                <div className="mb-3">
                    <label className="form-label fw-bold">Tag Countries (optional)</label>
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
                        <div className="mt-2 card card-body">
                            <h6 className="card-title">Search for a country to tag</h6>
                            <CountrySearch
                                allCountries={allCountries}
                                existingCodes={taggedCountries.map(c => c.code)}
                                onSelectCountry={handleAddCountry}
                                onCancel={() => setIsSearching(false)}
                            />
                        </div>
                    )}
                </div>
                <hr />

                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                    {isUploading ? 'Posting...' : 'Post'}
                </button>
                {error && <p className="text-danger mt-2">{error}</p>}
                {files.length > 0 && <p className="text-muted mt-2">{files.length} files selected.</p>}
            </form>
        </div>
    );
}