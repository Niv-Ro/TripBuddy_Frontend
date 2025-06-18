import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import useCountries from '../hooks/useCountries.js';
import {useNavigation,useNavigate} from "react-router-dom";

const SignUpForm = ({ onSubmit }) => {
    const navigate = useNavigate();
    const [profileImage, setProfileImage] = useState(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [countryOrigin, setCountryOrigin] = useState("");
    const [gender, setGender] = useState("");

    const countries = useCountries();

    const handleImageChange = e => {
        if (e.target.files && e.target.files[0]) {
            setProfileImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = e => {
        e.preventDefault();
        onSubmit({ fullName, email, password, confirmPassword, birthDate, countryOrigin, gender });
    };

    return (
        <div className = "text-center">
            <form onSubmit={handleSubmit}>
                <div className="text-center mb-3">
                    <label htmlFor="profileImage" style={{cursor: 'pointer'}}>
                        <img
                            src={profileImage || 'https://i1.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                            alt="Profile"
                            className="rounded-circle"
                            width="80"
                            height="80"
                        />
                    </label>
                    <input
                        type="file"
                        id="profileImage"
                        accept="image/*"
                        style={{display: 'none'}}
                        onChange={handleImageChange}
                    />
                </div>

                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <input
                        type="email"
                        className="form-control"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <input
                        type="date"
                        className="form-control"
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <select
                        className="form-select"
                        value={countryOrigin}
                        onChange={e => setCountryOrigin(e.target.value)}
                        required
                    >
                        <option value="">Select your country</option>
                        {countries.map(country => (
                            <option key={country} value={country}>
                                {country}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <select
                        className="form-select"
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        required
                    >
                        <option value="">Select your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>

                <button type="submit" className="btn btn-primary w-100 mb-3">Register</button>
            </form>
            <button className="btn btn-secondary" onClick={() => navigate('/Dashboard')}>Sign In</button>
        </div>
    );
};

export default SignUpForm;