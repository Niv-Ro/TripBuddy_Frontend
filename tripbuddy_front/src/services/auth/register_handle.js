import { auth, storage } from '@/services/fireBase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function handleRegister(formValues) {
    const { email, password, confirmPassword, fullName, birthDate, countryOrigin, gender, profileImage } = formValues;

    if (confirmPassword !== password) {
        alert("Passwords don't match");
        return null;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        console.log('Successfully created user in Firebase Auth with UID:', firebaseUser.uid);

        let profileImageUrl = '';
        if (profileImage) {
            // const imageRef = ref(storage, `profileImages/${firebaseUser.uid}`);
            const imageRef = ref(storage, `profileImages/${fullName}_(${email})`);
            await uploadBytes(imageRef, profileImage);
            profileImageUrl = await getDownloadURL(imageRef);
        }

        const userDataForMongo = {
            firebaseUid: firebaseUser.uid,
            fullName,
            birthDate,
            countryOrigin,
            gender,
            profileImageUrl,
            email,
        };

        const response = await axios.post('http://localhost:5000/api/users', userDataForMongo);


        // ✅ השינוי הקריטי: החזר את המשתמש המלא שנוצר וחזר מהשרת
        return response.data;

    } catch (err) {
        console.error("Registration process failed:", err);
        const errorCode = err.code;
        const errorMessage = err.message;

        if (err.response) {
            // שגיאה שהגיעה מהשרת שלנו (למשל, משתמש כבר קיים)
            alert(err.response.data.message || 'Registration failed.');
        } else if (errorCode) {
            // שגיאה שהגיעה מ-Firebase
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
            alert('An unknown error occurred.');
        }
        return null;
    }
}