'use client';
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import useCountries from '../../hooks/useCountries.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFileProcessor } from '@/hooks/useFileProcessor'; // ✅ שימוש ב-Hook

const SignUpForm = ({ onSubmit, isSubmitting }) => { // הוספנו isSubmitting
    const router = useRouter();
    const countries = useCountries();
    const { processFiles, processedFiles, isProcessing } = useFileProcessor();

    const [profileImagePreview, setProfileImagePreview] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [countryOrigin, setCountryOrigin] = useState("");
    const [gender, setGender] = useState("");

    const handleImageChange = e => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImagePreview(URL.createObjectURL(file));
            //call for hook to process profile image
            processFiles([file], { maxWidth: 400, maxHeight: 400, quality: 0.9 });
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        // השתמש בקובץ הדחוס מה-Hook אם הוא קיים
        const profileImage = processedFiles.length > 0 ? processedFiles[0] : null;
        await onSubmit({ fullName, email, password, confirmPassword, birthDate, countryOrigin, gender, profileImage });
    };

    return (
        <div className="text-center">
            <form onSubmit={handleSubmit}>
                <div className="text-center mb-3">
                    <label htmlFor="profileImage" style={{cursor: 'pointer'}}>
                        <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", display: "inline-block", position: "relative" }}>
                            <img
                                src={profileImagePreview || 'https://i1.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
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
                    <input type="file" id="profileImage" accept="image/*" style={{display: 'none'}} onChange={handleImageChange} disabled={isProcessing} />
                </div>

                <div className="mb-3">
                    <input type="text" className="form-control" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>

                <div className="mb-3">
                    <input type="email" className="form-control" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="mb-3">
                    <input type="password" className="form-control" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>

                <div className="mb-3">
                    <input type="password" className="form-control" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>

                <div className="mb-3">
                    <input type="date" className="form-control" value={birthDate} onChange={e => setBirthDate(e.target.value)} required />
                </div>

                <div className="mb-3">
                    <select className="form-select" value={countryOrigin} onChange={e => setCountryOrigin(e.target.value)} required>
                        <option value="">Select your country</option>
                        {countries.map(country => (<option key={country.code} value={country.name}>{country.name}</option>))}
                    </select>
                </div>

                <div className="mb-3">
                    <select className="form-select" value={gender} onChange={e => setGender(e.target.value)} required>
                        <option value="">Select your gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>

                <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isProcessing || isSubmitting}>
                    {isProcessing ? 'Processing Image...' : isSubmitting ? 'Registering...' : 'Register'}
                </button>
            </form>

            <Link href="/" className="btn btn-secondary">Sign In</Link>
        </div>
    );
};

export default SignUpForm;