import React, { useEffect, useState } from 'react';
import SignIn from './SignIn';
import MainScreen from './MainScreen';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './FireBase';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, currentUser => {
            setUser(currentUser);
        });
        return () => unsubscribe();  // <-- make sure to call it
    }, []);

    if (!user) {
        // not logged in: show the SignIn form
        return <SignIn />;
    }

    // logged in:
    return <MainScreen user={user} />;
}

export default Dashboard;
