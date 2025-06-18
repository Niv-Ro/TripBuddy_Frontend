"use client"
import React from 'react';
import SignInForm from "@/components/SignInForm";
import {handleRegister} from "@/services/auth/register_handle";
import {handleSignIn} from "@/services/auth/signIn_handle";


const SignIn = () => (
    <div className="container vh-50 d-flex justify-content-center align-items-center">
        <div style={{minWidth: '400px'}}>
            <h3 className="text-center fs-6">Travel Buddy</h3>
            <h2 className="text-center mb-3">Login</h2>
            <SignInForm onSubmit={handleSignIn}/>
        </div>
    </div>
);

export default SignIn;