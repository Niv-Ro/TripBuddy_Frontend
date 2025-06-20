'use client';
import React, { useState } from 'react';
import axios from 'axios';

export default function EditPostModal({ post, onUpdate, onCancel }) {
    // --- State and Hooks ---
    const [text, setText] = useState(post.text);
    const [isSaving, setIsSaving] = useState(false);

    // --  handlers --
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await axios.put(`http://localhost:5000/api/posts/${post._id}`, { text });
            onUpdate(response.data);
        } catch (error) {
            console.error("Failed to update post", error);
            alert("Update failed.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onCancel}>&times;</button>
                <h5>Edit Post</h5>
                <form onSubmit={handleSubmit}>
                    <textarea
                        className="form-control"
                        rows="5"
                        value={text}
                        onChange={e => setText(e.target.value)}
                    />
                    <div className="d-flex justify-content-end mt-3">
                        <button type="button" className="btn btn-secondary me-2" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}