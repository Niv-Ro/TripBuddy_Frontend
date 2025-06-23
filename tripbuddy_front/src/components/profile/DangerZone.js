"use client";
import React from 'react';

export default function DangerZone({ onDeleteProfile }) {
    return (
        <div className="p-4 mt-4 border-top border-danger">
            <h4 className="text-danger">Danger Zone</h4>
            <p>Deleting your account is permanent and cannot be undone.</p>
            <button className="btn btn-danger" onClick={onDeleteProfile}>
                Delete My Account
            </button>
        </div>
    );
}