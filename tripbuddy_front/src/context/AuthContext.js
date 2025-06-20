'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import { auth } from '@/services/fireBase.js';

// 1. יצירת ה-Context
const AuthContext = createContext();

// 2. יצירת ה-Provider - הקומפוננטה שתעטוף את האפליקציה
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // המשתמש מ-Firebase Auth
    const [mongoUser, setMongoUser] = useState(null); // המשתמש מה-DB שלנו (עם _id)
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
