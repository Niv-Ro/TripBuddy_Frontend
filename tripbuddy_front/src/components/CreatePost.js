'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { storage } from '@/services/fireBase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';

// ✅ --- ייבוא הרכיבים וה-hooks החדשים ---
import useCountries from "@/hooks/useCountries.js";
import CountrySearch from './CountrySearch';
import CountryList from './CountryList'; // שימוש חוזר ברכיב מהפרופיל

export default function CreatePost({ onPostCreated }) {
    // --- State and Hooks (קיים) ---
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    // ✅ --- State חדש לניהול תיוג מדינות ---
    const allCountries = useCountries();
    const [taggedCountries, setTaggedCountries] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- Handlers (קיים) ---
    const handleFileChange = (e) => {
        if (e.target.files.length > 10) {
            setError('You can select up to 10 files.');
            return;
        }
        setFiles(Array.from(e.target.files));
        setError('');
    };

    // ✅ --- פונקציות חדשות לניהול תיוג מדינות ---
    const handleAddCountry = (country) => {
        // מנע הוספת כפילויות
        if (!taggedCountries.some(c => c.code === country.code)) {
            setTaggedCountries(prev => [...prev, country]);
        }
        setIsSearching(false); // סגור את חלון החיפוש לאחר בחירה
    };

    const handleRemoveCountry = (countryCode) => {
        setTaggedCountries(prev => prev.filter(c => c.code !== countryCode));
    };
    // ---------------------------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text || files.length === 0 || !user) {
            setError('Please fill in text and select at least one file.');
            return;
        }
        setIsUploading(true);
        setError('');
        try {
            const uploadPromises = files.map(file => {
                const filePath = `posts/${user.uid}/${Date.now()}_${file.name}`;
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

            // ✅ --- עדכון postData עם המדינות המתויגות ---
            const postData = {
                authorId: user.uid, // שים לב, אולי השרת מצפה ל-mongoUser._id ולא user.uid
                text,
                media: mediaData,
                taggedCountries: taggedCountries.map(c => c.code3), // שלח מערך של קודים
            };
            // ----------------------------------------------------

            await axios.post('http://localhost:5000/api/posts', postData);

            // איפוס הטופס
            setText('');
            setFiles([]);
            setTaggedCountries([]); // נקה גם את המדינות המתויגות
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
            <h5 className="card-title">Create a new post</h5>
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

                {/* ✅ --- ממשק חדש לתיוג מדינות --- */}
                <hr />
                <div>
                    <CountryList
                        title="Tagged Countries"
                        countries={taggedCountries}
                        onRemove={handleRemoveCountry}
                        // השתמשנו ב-prop הזה כדי שכפתור המחיקה יופיע
                        isOwnProfile={true}
                        // הפונקציה שתפתח את חלון החיפוש
                        onAddRequest={() => setIsSearching(true)}
                    />

                    {isSearching && (
                        <div className="mt-3 card card-body">
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
                {/* ------------------------------------ */}


                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                    {isUploading ? 'Posting...' : 'Post'}
                </button>
                {error && <p className="text-danger mt-2">{error}</p>}
                {files.length > 0 && <p className="text-muted mt-2">{files.length} files selected.</p>}
            </form>
        </div>
    );
}