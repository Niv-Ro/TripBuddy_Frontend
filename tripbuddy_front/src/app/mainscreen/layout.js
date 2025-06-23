"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedLayout({ children }) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        // Don't do anything while loading
        if (loading) return;

        // If not loading and no user, redirect
        if (!loading && !user) {
            console.log('No user found after loading, redirecting...');
            router.push('/');
        }
    }, [user, loading, router]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!user) {
        return null;
    }

    // User is authenticated, show content
    return <>{children}</>;
}