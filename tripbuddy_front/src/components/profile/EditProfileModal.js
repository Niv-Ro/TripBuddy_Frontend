"use client";
import React from 'react';

export default function EditProfileModal({
                                             isOpen,
                                             onClose,
                                             onSave,
                                             isSaving,
                                             bioInput,
                                             onBioChange,
                                             onImageChange
                                         }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h5>Edit Profile</h5>
                <label className="form-label mt-3">Bio</label>
                <textarea
                    className="form-control mb-3"
                    rows="3"
                    value={bioInput}
                    onChange={onBioChange}
                />
                <label className="form-label">Profile Picture</label>
                <input
                    type="file"
                    className="form-control mb-3"
                    accept="image/*"
                    onChange={onImageChange}
                />
                <button className="btn btn-primary" onClick={onSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
}