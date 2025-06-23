'use client';
import { useState, createContext, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "@/services/fireBase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [mongoUser, setMongoUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserFromDB = useCallback(async (email) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/users/${email}`);
            const freshMongoUser = res.data;
            setMongoUser(freshMongoUser);
            localStorage.setItem('mongoUser', JSON.stringify(freshMongoUser));
        } catch (error) {
            console.error("AuthContext: Failed to fetch user from DB. Logging out.", error);
            await firebaseSignOut(auth);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser?.email) {
                setUser(firebaseUser);
                await fetchUserFromDB(firebaseUser.email);
            } else {
                setUser(null);
                setMongoUser(null);
                localStorage.removeItem('mongoUser');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [fetchUserFromDB]);

    const login = async (email) => {
        setLoading(true);
        await fetchUserFromDB(email);
        setLoading(false);
    };

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    // ✅ הפונקציה המרכזית לסנכרון מחדש מכל מקום באפליקציה
    const refetchMongoUser = useCallback(async () => {
        if (mongoUser?.email) {
            console.log("Refetching user data from context...");
            setLoading(true);
            await fetchUserFromDB(mongoUser.email);
            setLoading(false);
        }
    }, [mongoUser, fetchUserFromDB]);

    const value = {
        user,
        mongoUser,
        loading,
        login,
        logout,
        refetchMongoUser // חשיפת הפונקציה לסנכרון
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};