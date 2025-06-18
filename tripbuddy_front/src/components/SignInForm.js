"use client"
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation'; // 1. ייבוא של useRouter מ-Next.js
import Link from 'next/link'; // 2. ייבוא של Link מ-Next.js

const SignInForm = ({ onSubmit }) => {
    const router = useRouter(); // 3. שימוש ב-Hook של Next.js
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async e => {
        e.preventDefault();
        // כאן הלוגיקה של שליחת הטופס נשארת זהה
        await onSubmit({ email, password });

        // 4. ניווט פרוגרמטי לאחר ההתחברות
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

                <div className="mb-3"> {/* תיקנתי מ-mb-6 ל-mb-3 בשביל עקביות */}
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

            {/* 5. שימוש ברכיב Link לניווט דקלרטיבי */}
            <Link href="/signup" className="btn btn-secondary">
                Sign Up
            </Link>
        </div>
    );
};

export default SignInForm;