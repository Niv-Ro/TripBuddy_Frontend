'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import { auth } from '@/services/fireBase.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    // --- State and Hooks ---
    const [user, setUser] = useState(null);
    const [mongoUser, setMongoUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // 1. משתמש מחובר ל-Firebase, נשמור את הפרטים שלו
                setUser(currentUser);
                try {
                    // 2. נביא את הפרטים המלאים שלו מה-MongoDB שלנו באמצעות האימייל
                    const response = await axios.get(`http://localhost:5000/api/users/${currentUser.email}`);
                    setMongoUser(response.data); // 3. נשמור את פרטי המשתמש מה-DB
                } catch (error) {
                    console.error("AuthContext: Failed to fetch user data from MongoDB", error);
                    setMongoUser(null); // במקרה של שגיאה, נאפס את המידע
                }
            } else {
                // אין משתמש מחובר, נאפס את שני המשתנים
                setUser(null);
                setMongoUser(null);
            }
            setLoading(false); // סימון שהטעינה הראשונית הסתיימה
        });

        // ניקוי המאזין כשהאפליקציה נסגרת למניעת דליפות זיכרון
        return () => unsubscribe();
    }, []); // המערך הריק מבטיח שה-useEffect ירוץ פעם אחת בלבד

    // הערכים שכל האפליקציה תוכל לגשת אליהם
    const value = {
        user,
        mongoUser,
        loading,
    };

    // אנחנו מציגים את התוכן של האפליקציה רק אחרי שהטעינה הראשונית הסתיימה
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// 3. יצירת Custom Hook לשימוש נוח וקל בכל קומפוננטה
export const useAuth = () => {
    return useContext(AuthContext);
};
