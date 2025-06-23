"use client";
import React, { useState, useEffect } from 'react';

export default function EditCommentModal({ isOpen, comment, onSave, onCancel }) {
    const [text, setText] = useState('');

    useEffect(() => {
        if (comment) {
            setText(comment.text);
        }
    }, [comment]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(comment._id, text);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h5 className="mb-3">Edit Comment</h5>
                <textarea
                    className="form-control"
                    rows="4"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
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