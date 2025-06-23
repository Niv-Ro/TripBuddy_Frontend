"use client"
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

//waits for login to complete, if login worked goes to main app page
const SignInForm = ({ onSubmit }) => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async e => {
        //prevents refreshing the page
        e.preventDefault();
        setIsLoading(true);
        const success = await onSubmit({ email, password });
        setIsLoading(false);
        if (success) {
            router.push('/mainscreen');
        }
    };

    return (
        <div className="text-center">
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input type="email" className="form-control" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                    <input type="password" className="form-control" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isLoading}>
                    {isLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Login'}
                </button>
            </form>
            <Link href="/signup" className="btn btn-secondary">Sign Up</Link>
        </div>
    );
};

export default SignInForm;