import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import useCountries from '@/hooks/useCountries';
import CountrySearch from './CountrySearch';
import { storage } from '@/services/fireBase'; // Import Firebase storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CreateGroupModal({ onClose, onGroupCreated }) {
    const { mongoUser } = useAuth();
    const allCountries = useCountries();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [taggedCountries, setTaggedCountries] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
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
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file.');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image file size should be less than 5MB.');
                return;
            }

            setImageFile(file);
            setError('');

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
        // Reset the file input
        const fileInput = document.getElementById('groupImage');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const uploadImageToFirebase = async () => {
        if (!imageFile || !mongoUser) return null;

        try {
            // Create a unique filename for the group image
            const timestamp = Date.now();
            const fileExtension = imageFile.name.split('.').pop();
            const fileName = `group_${timestamp}_${mongoUser._id}.${fileExtension}`;

            // Create the file path in Firebase Storage
            const filePath = `groups/${fileName}`;
            const storageRef = ref(storage, filePath);

            console.log('Uploading group image to Firebase Storage...');

            // Upload the file to Firebase Storage
            const snapshot = await uploadBytes(storageRef, imageFile);

            // Get the download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            console.log('Group image uploaded successfully:', downloadURL);

            return {
                url: downloadURL,
                path: filePath // Store the path for potential future deletion
            };
        } catch (error) {
            console.error('Error uploading image to Firebase:', error);
            throw new Error('Failed to upload image to Firebase Storage');
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

        try {
            let imageUrl = null;

            // Upload image to Firebase Storage if provided
            if (imageFile) {
                console.log('Starting image upload to Firebase...');
                const uploadResult = await uploadImageToFirebase();
                imageUrl = uploadResult?.url || null;
            }

            const groupData = {
                name,
                description,
                countries: taggedCountries.map(c => c.code3),
                adminUserId: mongoUser._id,
                isPrivate,
                imageUrl
            };

            console.log('Creating group with data:', groupData);
            const res = await axios.post('http://localhost:5000/api/groups', groupData);

            console.log('Group created successfully');
            onGroupCreated(res.data);
            onClose();
        } catch (err) {
            console.error("Failed to create group", err);
            setError(err.response?.data?.message || err.message || 'Failed to create group. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h5 className="mb-3">Create a New Travel Group</h5>
                <form onSubmit={handleSubmit}>
                    {/* Group Image Upload */}
                    <div className="mb-3">
                        <label className="form-label">Group Image (Optional)</label>
                        <div className="border rounded p-3 text-center">
                            {imagePreview ? (
                                <div className="image-preview-container">
                                    <img
                                        src={imagePreview}
                                        alt="Group preview"
                                        className="image-preview"
                                        style={{
                                            maxWidth: '200px',
                                            maxHeight: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-danger mt-2"
                                        onClick={handleRemoveImage}
                                    >
                                        <i className="fas fa-times me-1"></i>
                                        Remove Image
                                    </button>
                                </div>
                            ) : (
                                <div className="text-muted py-4">
                                    <i className="fas fa-image fa-3x mb-2"></i>
                                    <p>Upload an image for your group</p>
                                </div>
                            )}
                            <input
                                type="file"
                                id="groupImage"
                                className="form-control mt-2"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            <small className="text-muted">
                                <i className="fas fa-cloud-upload-alt me-1"></i>
                                Will be saved to Firebase Storage. Supported formats: JPG, PNG, GIF. Max size: 5MB
                            </small>
                        </div>
                    </div>

                    {/* Group Name */}
                    <div className="mb-3">
                        <label className="form-label">Group Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="form-control"
                            required
                            placeholder="Enter group name"
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="form-control"
                            rows="3"
                            placeholder="Describe your group's purpose and activities"
                        ></textarea>
                    </div>

                    {/* Privacy Setting */}
                    <div className="mb-3">
                        <label className="form-label">Privacy Setting</label>
                        <select
                            className="form-select"
                            value={isPrivate}
                            onChange={e => setIsPrivate(e.target.value === "true")}
                        >
                            <option value="true">Private (Invitation only)</option>
                            <option value="false">Public (Anyone can find and join)</option>
                        </select>
                        <small className="text-muted">
                            {isPrivate ? 'Only invited members can join your group' : 'Your group will be visible in search results'}
                        </small>
                    </div>

                    {/* Tagged Countries */}
                    <div className="mb-3">
                        <label className="form-label">Tagged Countries * (at least one)</label>
                        {taggedCountries.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mb-2">
                                {taggedCountries.map(c => (
                                    <span key={c.code} className="badge bg-light text-dark border d-flex align-items-center">
                                        <img src={c.flag} alt={c.name} style={{ width: '16px', height: '12px', marginRight: '5px' }} />
                                        {c.name}
                                        <button
                                            type="button"
                                            className="btn-close ms-2"
                                            style={{ fontSize: '0.6rem' }}
                                            onClick={() => handleRemoveCountry(c.code)}
                                        ></button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {!isSearching && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setIsSearching(true)}
                            >
                                <i className="fas fa-plus me-1"></i>
                                Add Country
                            </button>
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

                    {/* Error Message */}
                    {error && <div className="alert alert-danger">{error}</div>}

                    {/* Submit Button */}
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isUploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isUploading || !name || taggedCountries.length === 0}
                        >
                            {isUploading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    {imageFile ? 'Uploading Image & Creating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus me-1"></i>
                                    Create Group
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}