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
    const [authInitialized, setAuthInitialized] = useState(false);

    const fetchUserFromDB = useCallback(async (email, retryCount = 0) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/users/${email}`);
            const freshMongoUser = res.data;
            setMongoUser(freshMongoUser);
            console.log('✅ Successfully fetched user from DB:', email);
            return freshMongoUser;
        } catch (error) {
            if (error.response?.status === 404 && retryCount < 3) {
                // Retry with increasing delay
                const delay = (retryCount + 1) * 500; // 500ms, 1s, 1.5s
                console.log(`User not found, retry ${retryCount + 1}/3 in ${delay}ms`);

                return new Promise((resolve) => {
                    setTimeout(async () => {
                        const result = await fetchUserFromDB(email, retryCount + 1);
                        resolve(result);
                    }, delay);
                });
            }

            if (error.response?.status === 404) {
                console.log("User not found in DB after 3 retries - this might be normal for new registrations");
                return null;
            }

            console.error("AuthContext: Failed to fetch user from DB.", error);
            // Don't sign out on error - let the user stay authenticated
            return null;
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!mounted) return;

            console.log('Firebase auth state changed:', firebaseUser?.email || 'No user');

            if (firebaseUser) {
                setUser(firebaseUser);

                // Always try to fetch MongoDB user when Firebase user exists
                if (!mongoUser || mongoUser.email !== firebaseUser.email) {
                    console.log('Fetching MongoDB user for:', firebaseUser.email);
                    const fetchedUser = await fetchUserFromDB(firebaseUser.email);
                    if (!mounted) return;

                    if (fetchedUser) {
                        setMongoUser(fetchedUser);
                    }
                } else {
                    console.log('MongoDB user already loaded:', mongoUser.email);
                }
            } else {
                console.log('No Firebase user - clearing state');
                setUser(null);
                setMongoUser(null);
            }

            if (mounted) {
                setLoading(false);
                setAuthInitialized(true);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []); // Empty dependency array - only run once

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setMongoUser(null);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const refetchMongoUser = useCallback(async () => {
        if (user?.email) {
            const fetchedUser = await fetchUserFromDB(user.email);
            if (fetchedUser) {
                setMongoUser(fetchedUser);
            }
        }
    }, [user, fetchUserFromDB]);

    const value = {
        user,
        mongoUser,
        loading,
        authInitialized,
        logout,
        refetchMongoUser,
        setMongoUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};