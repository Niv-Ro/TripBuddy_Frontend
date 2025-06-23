'use client';
import React, { useState, useEffect } from 'react';

// A controlled component for editing. It receives its state and handlers via props.
export default function EditCommentModal({ isOpen, comment, onSave, onCancel }) {
    const [text, setText] = useState('');

    // This effect syncs the local text state with the incoming comment prop.
    // It ensures that when a new comment is selected for editing, the comment updates
    useEffect(() => {
        if (comment) {
            setText(comment.text);
        }
    }, [comment]);

    // If the modal is not supposed to be open, render nothing.
    if (!isOpen) return null;

    // Calls the onSave function passed from the parent PostCard with the updated data.
    const handleSave = () => {
        onSave(comment._id, text);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h5 className="mb-3">Edit Comment</h5>
                <textarea
                    className="form-control"
                    value={text} // The input's value is controlled by the React state.
                    onChange={(e) => setText(e.target.value)} // Every keystroke updates the state.
                    autoFocus
                />
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" type="button" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}