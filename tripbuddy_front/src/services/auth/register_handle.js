import { auth, storage } from '@/services/fireBase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function handleRegister(formValues) {
    const { email, password, confirmPassword, fullName, birthDate, countryOrigin, gender, profileImage } = formValues;

    // Validate password confirmation
    if (confirmPassword !== password) {
        alert("Passwords don't match");
        return null;
    }

    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        console.log('Successfully created user in Firebase Auth with UID:', firebaseUser.uid);

        // Handle profile image upload or use default
        let profileImageUrl = 'https://i1.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'; // Default profile image
        if (profileImage) {
            const imageRef = ref(storage, `profileImages/${fullName}_(${email})`);
            await uploadBytes(imageRef, profileImage);
            profileImageUrl = await getDownloadURL(imageRef);
        }

        // Prepare user data for MongoDB
        const userDataForMongo = {
            firebaseUid: firebaseUser.uid,
            fullName,
            birthDate,
            countryOrigin,
            gender,
            profileImageUrl,
            email,
        };

        // Save user data to MongoDB via API
        const response = await axios.post('http://localhost:5000/api/users', userDataForMongo);

        // Return the complete user data from server
        return response.data;

    } catch (err) {
        console.error("Registration process failed:", err);
        const errorCode = err.code;
        const errorMessage = err.message;

        if (err.response) {
            // Server error (e.g., user already exists in MongoDB)
            alert(err.response.data.message || 'Registration failed.');
        } else if (errorCode) {
            // Firebase Auth error
            switch (errorCode) {
                case 'auth/email-already-in-use':
                    alert("The email selected is already in use");
                    break;
                case 'auth/weak-password':
                    alert("Passwords should be at least 6 characters");
                    break;
                case 'auth/invalid-email':
                    alert("Please enter a valid email format");
                    break;
                default:
                    alert(errorMessage || 'An unknown error occurred during registration.');
                    break;
            }
        } else {
            // Unknown error
            alert('An unknown error occurred.');
        }
        return null;
    }
}