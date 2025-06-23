// src/components/CreatePost.js
'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { storage } from '@/services/fireBase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import useCountries from "@/hooks/useCountries.js";
import CountrySearch from './CountrySearch';

/**
 * רכיב ליצירת פוסט חדש, עם תמיכה בהעלאת קבצים,
 * תיוג מדינות, ושיוך לקבוצה (אופציונלי).
 * @param {function} onPostCreated - קולבק שיופעל לאחר יצירת הפוסט.
 * @param {string|null} groupId - מזהה הקבוצה לשיוך הפוסט.
 */
export default function CreatePost({ onPostCreated, groupId = null }) {
    const { mongoUser } = useAuth();
    const allCountries = useCountries();

    // State for form fields
    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [taggedCountries, setTaggedCountries] = useState([]);

    // State for UI control
    const [isUploading, setIsUploading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 10) {
            setError('You can upload a maximum of 10 files.');
            return;
        }
        setFiles(selectedFiles);
        setError('');
    };

    const handleAddCountry = (country) => {
        if (!taggedCountries.some(c => c.code === country.code)) {
            setTaggedCountries(prev => [...prev, country]);
        }
        // אין צורך לסגור את החיפוש אוטומטית, מאפשר תיוג של כמה מדינות ברצף
    };

    const handleRemoveCountry = (countryCode) => {
        setTaggedCountries(prev => prev.filter(c => c.code !== countryCode));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() || files.length === 0) {
            setError('Please provide text and at least one file.');
            return;
        }
        setIsUploading(true);
        setError('');

        try {
            // 1. Upload files to Firebase Storage
            const uploadPromises = files.map(file => {
                const filePath = `posts/${mongoUser._id}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, filePath);
                return uploadBytes(storageRef, file).then(snapshot =>
                    getDownloadURL(snapshot.ref).then(url => ({ url, type: file.type, path: filePath }))
                );
            });
            const mediaData = await Promise.all(uploadPromises);

            // 2. Prepare post data for the backend
            const postData = {
                authorId: mongoUser._id,
                text,
                media: mediaData,
                taggedCountries: taggedCountries.map(c => c.code3),
                ...(groupId && { groupId }) // Add groupId only if it exists
            };

            // 3. Send post data to the backend
            await axios.post('http://localhost:5000/api/posts', postData);

            // 4. Reset form and trigger callback
            if (onPostCreated) {
                onPostCreated();
            }
        } catch (err) {
            console.error('Error creating post:', err.response ? err.response.data : err.message);
            setError('Failed to create post. Please try again.');
            setIsUploading(false);
        }
    };

    return (
        <div className="card p-3 shadow-sm">
            <h5 className="card-title">{groupId ? 'Create a post in group' : 'Create a new post'}</h5>
            <form onSubmit={handleSubmit}>
                <textarea
                    className="form-control mb-2"
                    rows="3"
                    placeholder="What's on your mind?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                />
                <input
                    type="file"
                    className="form-control mb-2"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                />

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

                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setIsSearching(!isSearching)}>
                        {isSearching ? 'Close Search' : '+ Add Country'}
                    </button>

                    {isSearching && (
                        <div className="mt-2 card card-body">
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
                {files.length > 0 && <p className="text-muted mt-2 small">{files.length} files selected.</p>}
            </form>
        </div>
    );
}