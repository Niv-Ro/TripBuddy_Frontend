'use client';
import { useState, createContext, useContext, useEffect } from "react";
import axios from "axios";
import { auth } from "@/services/fireBase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [mongoUser, setMongoUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                setUser(firebaseUser);
                const cachedMongoUser = localStorage.getItem('mongoUser');
                if (cachedMongoUser) {
                    setMongoUser(JSON.parse(cachedMongoUser));
                }
                try {
                    // ✅ התיקון: הסרנו את /email מהנתיב
                    const res = await axios.get(`http://localhost:5000/api/users/${firebaseUser.email}`);
                    const freshMongoUser = res.data;
                    setMongoUser(freshMongoUser);
                    localStorage.setItem('mongoUser', JSON.stringify(freshMongoUser));
                } catch (error) {
                    console.error("Failed to fetch mongo user on auth state change. This can happen on first sign-up.", error);
                    // נקה את המידע כדי למנוע חוסר התאמה
                    setUser(null);
                    setMongoUser(null);
                    localStorage.removeItem('mongoUser');
                    await firebaseSignOut(auth); // מומלץ לנתק את המשתמש אם אין לו רשומה ב-DB
                }
            } else {
                setUser(null);
                setMongoUser(null);
                localStorage.removeItem('mongoUser');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email) => {
        setLoading(true);
        try {
            // ✅ התיקון: הסרנו את /email מהנתיב
            const res = await axios.get(`http://localhost:5000/api/users/${email}`);
            setMongoUser(res.data);
            localStorage.setItem('mongoUser', JSON.stringify(res.data));
        } catch (error) {
            console.error("Failed to login", error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        setMongoUser(null);
        localStorage.removeItem('mongoUser');
    };

    const updateMongoUser = (updatedFields) => {
        setMongoUser(prevUser => {
            if (!prevUser) return null;
            const newUser = { ...prevUser, ...updatedFields };
            localStorage.setItem('mongoUser', JSON.stringify(newUser));
            return newUser;
        });
    };

    const value = {
        user,
        mongoUser,
        loading,
        login,
        logout,
        updateMongoUser
    };

    return (
        <AuthContext.Provider value={value}>
            {/* התיקון הקודם נשאר - מציגים תמיד את הילדים */}
            {children}
        </AuthContext.Provider>
    );
};