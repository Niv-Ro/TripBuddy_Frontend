'use client';
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { storage } from '@/services/fireBase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import useCountries from "@/hooks/useCountries.js";
import CountrySearch from '../profile/CountrySearch';
import { useFileProcessor } from '@/hooks/useFileProcessor';

export default function CreatePost({ onPostCreated, groupId = null }) {
    const { mongoUser } = useAuth();
    const allCountries = useCountries();
    const { processFiles, processedFiles, isProcessing, progress, reset } = useFileProcessor();

    const [text, setText] = useState('');
    const [taggedCountries, setTaggedCountries] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');

    // limit to 10 files and start process files via hook
    const handleFileChange = (e) => {
        const selectedFiles = e.target.files;
        if (selectedFiles.length > 10) {
            setError('You can upload a maximum of 10 files.');
            return;
        }
        setError('');
        processFiles(selectedFiles);
    };

    const handleAddCountry = (country) => {
        if (!taggedCountries.some(c => c.code === country.code)) {
            setTaggedCountries(prev => [...prev, country]);
        }
    };

    const handleRemoveCountry = (countryCode) => {
        setTaggedCountries(prev => prev.filter(c => c.code !== countryCode));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && (processedFiles.length === 0 && !isProcessing)) { // Checks whether text or media in post
            setError('Please provide text or at least one file.');
            return;
        }
        if (isProcessing) {
            setError('Please wait for file processing to complete.');
            return;
        }

        setIsUploading(true);
        setError('');

        // Save post media on firebase DB under unique name
        try {
            const userFolderName = `${mongoUser.fullName.replace(/\s+/g, '_')}_(${mongoUser.email})`;
            const postCreationTimestamp = Date.now();

            const uploadPromises = processedFiles.map(file => {
                const filePath = `posts/${userFolderName}/${postCreationTimestamp}/${file.name}`;

                const storageRef = ref(storage, filePath);
                return uploadBytes(storageRef, file).then(snapshot =>
                    getDownloadURL(snapshot.ref).then(url => ({ url, type: file.type, path: filePath }))
                );
            });
            //Gets an array of { url, type, path } for each media file
            //Passes only if all media uploaded successfully
            const mediaData = await Promise.all(uploadPromises);

            // Assemble the final post object to be saved in MongoDB.
            const postData = {
                authorId: mongoUser._id,
                text,
                media: mediaData,
                taggedCountries: taggedCountries.map(c => c.code3),
                ...(groupId && { groupId })
            };

            await axios.post('http://localhost:5000/api/posts', postData);

            setText('');
            setTaggedCountries([]);
            reset(); // Reset the file processor hook
            if (onPostCreated) {
                onPostCreated();
            }
        } catch (err) {
            console.error('Error creating post:', err.response ? err.response.data : err.message);
            setError('Failed to create post. Please try again.');
        } finally {
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
                    disabled={isProcessing || isUploading}
                />

                {isProcessing && (
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">Processing files...</small>
                            <small className="text-muted">{Math.round(progress)}%</small>
                        </div>
                        <div className="progress" style={{ height: '4px' }}>
                            <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

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

                <button type="submit" className="btn btn-primary" disabled={isUploading || isProcessing}>
                    {isUploading ? 'Posting...' : isProcessing ? 'Processing...' : 'Post'}
                </button>
                {error && <p className="text-danger mt-2">{error}</p>}
                {processedFiles.length > 0 && !isProcessing &&(
                    <p className="text-muted mt-2 small">
                        {processedFiles.length} files ready for upload.
                    </p>
                )}
            </form>
        </div>
    );
}