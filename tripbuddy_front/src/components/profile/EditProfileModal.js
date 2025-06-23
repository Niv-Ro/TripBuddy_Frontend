"use client";
import React from 'react';

// This is a "Dumb" or "Presentational" component. It's fully controlled by its parent.
export default function EditProfileModal({
                                             isOpen, // Boolean flag determines if modal should be displayed on screen
                                             onClose, // callBack function for closing the modal
                                             onSave,
                                             isSaving,
                                             bioInput,
                                             onBioChange,
                                             onImageChange
                                         }) {
    // if the isOpen prop is false, render nothing.
    if (!isOpen) {
        return null;
    }

    return (
        // The dark, semi-transparent background overlay.
        <div className="modal-overlay">
            {/* The white content box of the modal. */}
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h5>Edit Profile</h5>

                <label className="form-label mt-3">Bio</label>
                <textarea
                    className="form-control mb-3"
                    rows="3"
                    value={bioInput} // The value is directly from the parent's state.
                    onChange={onBioChange} // Every change calls a function in the parent.
                />

                <label className="form-label">Profile Picture</label>
                <input
                    type="file"
                    className="form-control mb-3"
                    accept="image/*"
                    onChange={onImageChange}
                />

                {/* The save button is disabled while the parent component is saving the data. */}
                <button className="btn btn-primary" onClick={onSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}