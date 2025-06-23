'use client';
import { useState, createContext, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "@/services/fireBase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext); // help function to use the AuthContext context

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // user object from firebase
    const [mongoUser, setMongoUser] = useState(null);  // db user object
    const [loading, setLoading] = useState(true); //lading state when user authentication is happening
    const [authInitialized, setAuthInitialized] = useState(false); // flag to determine if firebase listener was triggered


    const fetchUserFromDB = useCallback(async (email, retryCount = 0) => {
        try {
            // get user information from server by mail
            const res = await axios.get(`http://localhost:5000/api/users/${email}`);
            const freshMongoUser = res.data;
            setMongoUser(freshMongoUser);
            console.log('Successfully fetched user from DB:', email);
            return freshMongoUser;
        } catch (error) {
            //try to overcome race condition between firebase and mongodb which may happen when a new user is regsiterd
            if (error.response?.status === 404 && retryCount < 3) {
                // retry with increasing delay
                const delay = (retryCount + 1) * 500; // 500ms, 1s, 1.5s
                console.log(`User not found, retry ${retryCount + 1}/3 in ${delay}ms`);

                //call again with increased retry count
                return new Promise((resolve) => {
                    setTimeout(async () => {
                        const result = await fetchUserFromDB(email, retryCount + 1);
                        resolve(result);
                    }, delay);
                });
            }

            if (error.response?.status === 404) {
                console.log("User not found in DB after 3 retries - normal for new registrations");
                return null;
            }

            console.error("AuthContext: Failed to fetch user from DB.", error);
            //let the user stay authenticated
            return null;
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        // a state flag to prevent update when component is unmounted
        // important for situation like when async operation in still happening and user logged out

        //firebase listener which runs everytime a user logs in or out or page is refreshed
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!mounted) return;

            console.log('Firebase auth state changed:', firebaseUser?.email || 'No user');

            if (firebaseUser) {
                setUser(firebaseUser);

                // always try to fetch MongoDB user when Firebase user exists
                if (!mongoUser || mongoUser.email !== firebaseUser.email) {
                    console.log('Fetching MongoDB user for:', firebaseUser.email);
                    const fetchedUser = await fetchUserFromDB(firebaseUser.email);
                    if (!mounted) return;  // if user logged out during fetching, return without updating user

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
    }, []); // only run once

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setMongoUser(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('currentView');
            }
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // Re-fetch user data to update its properties on application after changes
    const refetchMongoUser = useCallback(async () => {
        if (user?.email)  { //optional chaining, replacing check if user exists and if so, if user email exists, it's shorter term
            const fetchedUser = await fetchUserFromDB(user.email);
            if (fetchedUser) {
                setMongoUser(fetchedUser);
            }
        }
    }, [user, fetchUserFromDB]);

    //contains all the things that other components able to use from this file, what is exposed to others
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