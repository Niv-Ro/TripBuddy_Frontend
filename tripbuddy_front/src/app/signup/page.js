'use client';
import React, { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { handleRegister } from '@/services/auth/register_handle';
import SignUpForm from '@/components/auth/SignUpForm';

export default function SignUpPage() {
    const router = useRouter();
    const { setMongoUser } = useContext(AuthContext); //get set function from our context
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleSubmit = async (formValues) => {
        try {
            const newUser = await handleRegister(formValues);

            if (newUser) {
                // to prevent the race condition, manually apply user to mongodb
                setMongoUser(newUser);

                // another way to deal with race condition after a new use registration
                setIsRedirecting(true);


                //redirect to homepage, with a small timeout for completing data saving in mongodb
                setTimeout(() => {
                    router.push('/');
                }, 2000);

                alert('Registration successful! Redirecting to your dashboard...');
            }
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