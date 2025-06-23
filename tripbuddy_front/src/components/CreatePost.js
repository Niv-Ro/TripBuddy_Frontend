// src/components/CreatePost.js
'use client';
import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { storage } from '@/services/fireBase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import useCountries from "@/hooks/useCountries.js";
import CountrySearch from './CountrySearch';

/**
 * Canvas component for image compression
 */
const ImageCompressor = ({ file, onCompressionComplete, maxWidth = 1200, maxHeight = 1200, quality = 0.8 }) => {
    const canvasRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);

    React.useEffect(() => {
        if (!file || !file.type.startsWith('image/')) {
            onCompressionComplete(file);
            return;
        }

        setIsProcessing(true);
        const img = new Image();

        img.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Clear canvas and draw image
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Convert canvas to blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File(
                            [blob],
                            `compressed_${file.name}`,
                            { type: 'image/jpeg' }
                        );
                        onCompressionComplete(compressedFile);
                    } else {
                        onCompressionComplete(file);
                    }
                    setIsProcessing(false);
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            onCompressionComplete(file);
            setIsProcessing(false);
        };

        img.src = URL.createObjectURL(file);

        return () => {
            URL.revokeObjectURL(img.src);
        };
    }, [file, maxWidth, maxHeight, quality, onCompressionComplete]);

    return (
        <div style={{ display: 'none' }}>
            <canvas ref={canvasRef} />
            {isProcessing && <span>Processing...</span>}
        </div>
    );
};

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
    const [originalFiles, setOriginalFiles] = useState([]);
    const [processedFiles, setProcessedFiles] = useState([]);
    const [taggedCountries, setTaggedCountries] = useState([]);

    // State for UI control
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [compressionProgress, setCompressionProgress] = useState(0);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 10) {
            setError('You can upload a maximum of 10 files.');
            return;
        }

        setOriginalFiles(selectedFiles);
        setProcessedFiles([]);
        setCompressionProgress(0);
        setIsProcessing(true);
        setError('');
    };

    const handleCompressionComplete = useCallback((index, compressedFile) => {
        setProcessedFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = compressedFile;

            // Update progress
            const completedFiles = newFiles.filter(Boolean).length;
            setCompressionProgress((completedFiles / originalFiles.length) * 100);

            // Check if all files are processed
            if (completedFiles === originalFiles.length) {
                setIsProcessing(false);

                // Log compression results
                originalFiles.forEach((original, idx) => {
                    if (original.type.startsWith('image/')) {
                        const compressed = newFiles[idx];
                        const originalSize = (original.size / 1024 / 1024).toFixed(2);
                        const compressedSize = (compressed.size / 1024 / 1024).toFixed(2);
                        const savings = ((1 - compressed.size / original.size) * 100).toFixed(1);
                        console.log(`Image ${idx + 1}: ${originalSize}MB → ${compressedSize}MB (${savings}% reduction)`);
                    }
                });
            }

            return newFiles;
        });
    }, [originalFiles.length]);

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
        if (!text.trim() || processedFiles.length === 0) {
            setError('Please provide text and at least one file.');
            return;
        }
        if (isProcessing) {
            setError('Please wait for file processing to complete.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            // 1. Upload processed files to Firebase Storage
            const uploadPromises = processedFiles.map(file => {
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
                ...(groupId && { groupId })
            };

            // 3. Send post data to the backend
            await axios.post('http://localhost:5000/api/posts', postData);

            // 4. Reset form and trigger callback
            setText('');
            setOriginalFiles([]);
            setProcessedFiles([]);
            setTaggedCountries([]);
            setCompressionProgress(0);
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
                />

                {/* Image Compression Progress */}
                {isProcessing && (
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">Compressing images...</small>
                            <small className="text-muted">{Math.round(compressionProgress)}%</small>
                        </div>
                        <div className="progress" style={{ height: '4px' }}>
                            <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ width: `${compressionProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Hidden Canvas Components for Image Compression */}
                {originalFiles.map((file, index) => (
                    <ImageCompressor
                        key={`${file.name}-${index}`}
                        file={file}
                        onCompressionComplete={(compressedFile) => handleCompressionComplete(index, compressedFile)}
                    />
                ))}

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
                    {isUploading ? 'Posting...' : isProcessing ? 'Processing Images...' : 'Post'}
                </button>
                {error && <p className="text-danger mt-2">{error}</p>}
                {processedFiles.length > 0 && (
                    <p className="text-muted mt-2 small">
                        {processedFiles.length} files ready for upload.
                    </p>
                )}
            </form>
        </div>
    );
}