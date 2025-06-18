"use client"
import { useEffect, useState } from 'react';
import { auth } from '@/services/fireBase';
import { useRouter } from 'next/navigation'; // חשוב: לייבא מ-next/navigation

export default function ProtectedLayout({ children }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // onAuthStateChanged בודק את מצב המשתמש בזמן אמת וגם عند טעינת העמוד
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (!user) {
                // אם אין משתמש מחובר, העבר אותו לדף הבית
                router.replace('/');
            } else {
                // אם יש משתמש, סיים את מצב הטעינה
                setIsLoading(false);
            }
        });

        // נקה את המאזין כשהקומפוננטה יורדת מהעץ
        return () => unsubscribe();
    }, [router]);

    // בזמן הבדיקה, אפשר להציג הודעת טעינה
    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <p>Loading...</p>
            </div>
        );
    }

    // אם המשתמש מחובר, הצג את התוכן של העמוד
    return children;
}