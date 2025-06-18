import React, { useEffect, useState } from "react";
import axios from "axios";
import {useAuth} from "@/context/AuthContext";

function Profile({ email }) {
    const [data, setData] = useState(null);
    const {user} = useAuth();

    useEffect(() => {
        if (!user.email) return; // <- wait until user and email are available
        axios.get(`http://localhost:5000/api/users/${user.email}`)
            .then(res => setData(res.data))
            .catch(err => {
                console.error(err);
                setData({ error: "User not found" });
            });
    }, []);

    if (!user.email) return <div>Loading user...</div>;
    if (!data) return <div>Loading...</div>;
    if (data.error) return <div>{data.error}</div>;

    return (
        <div className="card p-4" style={{maxWidth: 500, margin: "auto"}}>
            <div className="d-flex flex-column align-items-center">
                <img
                    src={data.profileImageUrl || 'https://i1.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                    alt="Profile"
                    className="rounded-circle mb-3"
                    width={100}
                    height={100}
                />
                <h2>{data.fullName}</h2>
                <p className="mb-1">{data.email}</p>
                {/* More fields if you want */}
            </div>
        </div>
    );
}

export default Profile;
