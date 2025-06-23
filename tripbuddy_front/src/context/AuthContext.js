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

    const fetchUserFromDB = useCallback(async (email, retryCount = 0) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/users/${email}`);
            const freshMongoUser = res.data;
            setMongoUser(freshMongoUser);
            console.log('✅ Successfully fetched user from DB:', email);
        } catch (error) {
            if (error.response?.status === 404 && retryCount < 3) {
                // נסה שוב אחרי delay מצטבר
                const delay = (retryCount + 1) * 500; // 500ms, 1s, 1.5s
                console.log(`User not found, retry ${retryCount + 1}/3 in ${delay}ms`);

                setTimeout(() => {
                    fetchUserFromDB(email, retryCount + 1);
                }, delay);
                return;
            }

            if (error.response?.status === 404) {
                console.log("User not found in DB after 3 retries - this might be normal for new registrations");
                return;
            }

            console.error("AuthContext: Failed to fetch user from DB.", error);
            await firebaseSignOut(auth);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('Firebase auth state changed:', firebaseUser?.email || 'No user');

            if (firebaseUser) {
                setUser(firebaseUser);

                // רק אם אין mongoUser, תבצע fetch
                if (!mongoUser) {
                    console.log('Fetching MongoDB user for:', firebaseUser.email);
                    await fetchUserFromDB(firebaseUser.email);
                } else {
                    console.log('MongoDB user already exists:', mongoUser.email);
                }
            } else {
                console.log('No Firebase user - clearing state');
                setUser(null);
                setMongoUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [fetchUserFromDB]); // הסרתי mongoUser מה-dependencies למניעת loops

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    const refetchMongoUser = useCallback(async () => {
        if (user?.email) {
            await fetchUserFromDB(user.email);
        }
    }, [user, fetchUserFromDB]);

    const value = {
        user,
        mongoUser,
        loading,
        logout,
        refetchMongoUser,
        setMongoUser // חשיפת הפונקציה החשובה הזו
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};