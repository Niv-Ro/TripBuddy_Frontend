'use client';
import React, { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { handleRegister } from '@/services/auth/register_handle';
import SignUpForm from '@/components/auth/SignUpForm';

export default function SignUpPage() {
    const router = useRouter();
    const { setMongoUser } = useContext(AuthContext);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleSubmit = async (formValues) => {
        try {
            // קורא לפונקציית ההרשמה המעודכנת, שמחזירה את המשתמש המלא
            const newUser = await handleRegister(formValues);

            if (newUser) {
                // ✅ עדכון ישיר של המשתמש ב-Context, פותר את ה-Race Condition
                setMongoUser(newUser);

                // ✅ הפתרון הפשוט - חכה 2 שניות לפני ניווט
                setIsRedirecting(true);

                setTimeout(() => {
                    router.push('/');
                }, 2000);

                // הצג הודעה למשתמש
                alert('Registration successful! Redirecting to your dashboard...');
            }
            // אם newUser הוא null, ההודעה למשתמש כבר הוצגה בתוך handleRegister
        } catch (error) {
            console.error("An unexpected error occurred in SignUpPage handleSubmit:", error);
            alert("A critical error occurred. Please try again.");
            setIsRedirecting(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            <div className="card shadow-lg p-4 p-md-5" style={{ width: '100%', maxWidth: '500px', border: 'none', borderRadius: '15px' }}>
                <h2 className="text-center mb-4 fw-bold">Create Your Account</h2>

                {/* הצגת מצב הפניה */}
                {isRedirecting && (
                    <div className="text-center mb-3">
                        <div className="spinner-border text-success" role="status">
                            <span className="visually-hidden">Redirecting...</span>
                        </div>
                        <p className="mt-2 text-success">Account created! Redirecting...</p>
                    </div>
                )}

                <SignUpForm onSubmit={handleSubmit} />
            </div>
        </div>
    );
}