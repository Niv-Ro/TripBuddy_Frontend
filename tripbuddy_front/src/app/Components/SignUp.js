"use client"
import React from 'react';
import SignUpForm from './SignUpForm.js';
import { handleRegister } from '../Services/register_handle.js';

const SignUp = () => (
    <div className="container vh-50 d-flex justify-content-center align-items-center">
        <div style={{minWidth: '400px'}}>
            <h3 className="text-center fs-6">Travel Buddy</h3>
            <h2 className="text-center mb-3">Register</h2>
            <SignUpForm onSubmit={handleRegister}/>
        </div>
    </div>
);

export default SignUp;