import { auth, storage } from '@/services/fireBase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function handleRegister(formValues) {
    // --- State and Hooks ---
    const { email, password, confirmPassword, fullName, birthDate, countryOrigin, gender, profileImage } = formValues;

    // --- Guards and Checks ---
    if (confirmPassword !== password) {
        alert("Passwords don't match");
        return false;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        console.log('Successfully created user in Firebase Auth with UID:', firebaseUser.uid);

        // --- לוגיקת העלאת תמונה ---
        let profileImageUrl = '';
        if (profileImage) {
            const imageRef = ref(storage, `profileImages/${firebaseUser.uid}`);
            await uploadBytes(imageRef, profileImage);
            profileImageUrl = await getDownloadURL(imageRef);
        }

        //   אובייקט הנתונים לשליחה ל-MongoDB
        const userDataForMongo = {
            firebaseUid: firebaseUser.uid,
            fullName,
            birthDate,
            countryOrigin,
            gender,
            profileImageUrl,
            email,
        };

        //  שליחת המידע ישירות לשרת
        await axios.post('http://localhost:5000/api/users', userDataForMongo);
        alert('User registered successfully!');
        return true;

    } catch (err) {
        console.error("Registration process failed:", err);
        switch (err.code) {
            case 'auth/email-already-in-use':
                alert("The email selected is already in use");
                break;
            case 'auth/weak-password':
                alert("Passwords should be at least 6 characters");
                break;
            case 'auth/invalid-email':
                alert("Please enter a valid email format")
                break;
            default:
                alert('An unknown error occurred during registration.');
                break;
        }
        return false;
    }
}
