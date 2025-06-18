"use client"
import React from 'react';
import SignUpForm from '../../components/SignUpForm.js';
import { handleRegister } from '@/services/auth/register_handle.js';

const Page = () => (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
        <div className="card shadow" style={{minWidth: '500px'}}>
            <div className="card-body">
                <h3 className="text-center fs-6">Travel Buddy</h3>
                <h2 className="text-center mb-3">Register</h2>
                <SignUpForm onSubmit={handleRegister}/>
            </div>
        </div>
    </div>
);

export default Page;