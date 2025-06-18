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

    if(user) {
        if (!user.email) return <div>Loading user...</div>;
    }
    if (!data) return <div>Loading...</div>;
    if (data.error) return <div>{data.error}</div>;

    function getAge(dateString) {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    return (
        <div>
            <nav className="navbar navbar-light  border-bottom px-4 py-2"
                 style={{minHeight: "36px", width: "100vw"}}>
                <div className="d-flex align-items-center w-100">
                    {/* Image */}
                    <div style={{
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        overflow: "hidden",
                    }}>
                        <img
                            src={data.profileImageUrl || 'https://i1.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                            alt="Profile"
                            width={200}
                            height={200}
                            style={{objectFit: "cover"}}
                        />
                    </div>
                    {/* Info to the right */}
                    <div style={{marginLeft: "32px"}}>
                        <h1 className="py-2 mb-1">{data.fullName}</h1>
                        <h5 className="mb-1">Country: {data.countryOrigin}</h5>
                        <h5 className="mb-1">Gender: {data.gender}</h5>
                        <h5 className="mb-0">Age: {getAge(data.birthDate)}</h5>
                    </div>
                    <div style={{marginLeft: "32px"}}>
                        <h4>About me</h4>
                    </div>
                </div>
            </nav>
            <nav className="navbar navbar-light border-bottom px-4 py-2"
                 style={{minHeight: "36px", width: "100vw"}}>
                <div
                    className="d-flex align-items-center w-100" style={{
                        overflowX: "auto",
                        whiteSpace: "nowrap"
                    }}>
                    {/* Your wide content here */}
                </div>
            </nav>
        </div>
    )
        ;
}

export default Profile;
