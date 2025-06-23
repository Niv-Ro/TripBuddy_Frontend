"use client"
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SignInForm = ({ onSubmit }) => {
    // --- State and Hooks ---
    const router = useRouter(); // 3. שימוש ב-Hook של Next.js
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // -- handlers --
    const handleSubmit = async e => {
        e.preventDefault();
        await onSubmit({ email, password });
        router.push('/mainscreen');
    };

    return (
        <div className="text-center">
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input
                        type="email"
                        className="form-control"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100 mb-3">Login</button>
            </form>

            <Link href="/signup" className="btn btn-secondary">
                Sign Up
            </Link>
        </div>
    );
};

export default SignInForm;