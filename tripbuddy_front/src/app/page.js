"use client"
import React from 'react';
import SignInForm from "@/components/SignInForm";
import {handleRegister} from "@/services/auth/register_handle";
import {handleSignIn} from "@/services/auth/signIn_handle";

const SignIn = () => (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
        <div className="card shadow" style={{minWidth: '500px'}}>
            <div className="card-body">
                <h3 className="text-center fs-6">Travel Buddy</h3>
                <h2 className="text-center mb-3">Login</h2>
                <SignInForm onSubmit={handleSignIn}/>
            </div>
        </div>
    </div>
);

export default SignIn;