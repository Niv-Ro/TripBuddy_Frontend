"use client"
import {useEffect, useState} from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import {auth} from './FireBase'
import {createUserWithEmailAndPassword} from 'firebase/auth';
import axios from 'axios';

const SignUp = () => {
    const [profileImage, setProfileImage] = useState(null);
    const[fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [countryOrigin, setCountryOrigin] = useState("");
    const [gender, setGender] = useState("");
    const [countries, setCountries] = useState([]);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProfileImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault()
        try {
            if (confirmPassword === password)
            {
                await createUserWithEmailAndPassword(auth, email, password)
                handleDataSave()
            }
            else {
                alert("Passwords don't match")
            }

        } catch (err) {
            console.log(err)
        }
    }

    const handleDataSave = async (data={})=>{
        try {
            const response = await axios.post('http://localhost:5000/api/users', {
                data:{
                    fullName,birthDate,countryOrigin,gender, ...data
                }
            })
            alert("User registered Successfully")
        }catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name');
                const data = await response.json();
                const list = data.map(country => country.name.common)
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b));
                setCountries(list);
            } catch (error) {
                console.error('Error fetching countries:', error);
            }
        };
        fetchCountries();
    }, []);

    return (
        <div className="container vh-50 d-flex justify-content-center align-items-center" >
            <div style={{ minWidth: '400px' }}>
                <h2 className="text-center mb-4">Travel Buddy</h2>
                <form onSubmit={handleRegister}>
                    <div className="text-center mb-3 ">
                        <label htmlFor="profileImage" style={{cursor: 'pointer'}}>
                            <img
                                src={profileImage || 'https://a0.anyrgb.com/pngimg/438/1372/unfriended-unknown-user-profile-online-and-offline-avatar-person-user-youtube-logos-information.png'}
                                alt="Romano" className="rounded-circle" width="80" height="80"/>
                        </label>
                        <input type="file" id="profileImage" accept="image/*" style={{display: 'none'}}
                               onChange={handleImageChange}/>
                    </div>

                    <div className="mb-3">
                        <input type="text"
                               className="form-control"
                               placeholder="Enter your full name"
                               value={fullName}
                               onChange={e => setFullName(e.target.value)}
                               required/>
                    </div>


                    <div className="mb-3">
                        <input type="email"
                               className="form-control"
                               placeholder="Enter your email"
                               value={email}
                               onChange={e => setEmail(e.target.value)}
                               required/>
                    </div>

                    <div className="mb-3">
                        <input type="password"
                               className="form-control"
                               placeholder="Enter your password"
                               value={password}
                               onChange={e => setPassword(e.target.value)}
                               required/>
                    </div>

                    <div className="mb-3">
                        <input type="password"
                               className="form-control"
                               placeholder="Confirm your password"
                               value={confirmPassword}
                               onChange={e => setConfirmPassword(e.target.value)}
                               required/>
                    </div>

                    <div className="mb-3">
                        <input
                            type="date"
                            className="form-control"
                            value={birthDate}
                            onChange={e => setBirthDate(e.target.value)}
                            required/>
                    </div>

                    <div className="mb-3">
                        <select className="form-select"
                                value={countryOrigin}
                                onChange={e => setCountryOrigin(e.target.value)}
                                required>
                            <option value="">Select your country</option>
                            {countries.map(country => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <select className="form-select"
                                value={gender}
                                onChange={e => setGender(e.target.value)}
                                required>
                            <option value="">Select your gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary w-100">Register</button>
                </form>
            </div>
        </div>
    );
}
export default SignUp;