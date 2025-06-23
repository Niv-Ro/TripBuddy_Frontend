'use client';
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import useCountries from '../../hooks/useCountries.js';
import useImageProcessor from '../../hooks/useImageProcessor.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SignUpForm = ({ onSubmit }) => {
    const router = useRouter();
    const countries = useCountries();

    // Use the custom hook for image processing
    const {
        isProcessing,
        processedImage,
        imagePreview,
        handleImageChange
    } = useImageProcessor();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [countryOrigin, setCountryOrigin] = useState("");
    const [gender, setGender] = useState("");

    //Passes all form data, Goes to home page after registration
    const handleSubmit = async e => {
        e.preventDefault();
        const profileImage = processedImage || null;
        await onSubmit({ fullName, email, password, confirmPassword, birthDate, countryOrigin, gender, profileImage });
        router.push('/');
    };

    return (
        <div className="text-center">
            <form onSubmit={handleSubmit}>
                {/* Profile Image Section */}
                <div className="text-center mb-3">
                    <label htmlFor="profileImage" style={{cursor: 'pointer'}}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            overflow: "hidden",
                            display: "inline-block",
                            position: "relative"
                        }}>
                            <img
                                src={imagePreview || 'https://i1.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                                alt="Profile"
                                width={80}
                                height={80}
                                style={{
                                    objectFit: "cover",
                                    filter: isProcessing ? 'blur(2px) brightness(0.7)' : 'none',
                                    transition: 'filter 0.3s ease'
                                }}
                            />
                            {isProcessing && (
                                <div className="spinner-border text-light" role="status" style={{position: 'absolute', top: 'calc(50% - 1rem)', left: 'calc(50% - 1rem)'}}>
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            )}
                        </div>
                    </label>
                    <input
                        type="file"
                        id="profileImage"
                        accept="image/*"
                        style={{display: 'none'}}
                        onChange={handleImageChange}
                        disabled={isProcessing}
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
                            <option key={country.code} value={country.name}>
                                {country.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <select
                        className="form-select"
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        required
                    >
                        <option value="">Select your gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>

                <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isProcessing}>
                    {isProcessing ? 'Processing Image...' : 'Register'}
                </button>
            </form>

            <Link href="/" className="btn btn-secondary">
                Sign In
            </Link>
        </div>
    );
};

export default SignUpForm;