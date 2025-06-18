'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/fireBase.js';

// 1. יצירת ה-Context
const AuthContext = createContext();

// 2. יצירת ה-Provider - הקומפוננטה שתעטוף את האפליקציה
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // זו אותה לוגיקה בדיוק מהשיטה הראשונה!
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // הערכים שכל האפליקציה תוכל לגשת אליהם
    const value = {
        user,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// 3. יצירת Custom Hook לשימוש נוח
export const useAuth = () => {
    return useContext(AuthContext);
};