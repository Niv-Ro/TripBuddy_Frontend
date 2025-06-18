import React, { useEffect, useState } from 'react';
import Page from '../app/mainscreen/page';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/services/fireBase';
import { useNavigate } from 'react-router-dom';
import SignIn from "@/app/page";

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
    return <Page user={user} />;
}

export default Dashboard;
