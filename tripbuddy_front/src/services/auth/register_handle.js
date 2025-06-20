import { auth, storage } from '@/services/fireBase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function handleRegister(formValues) {
    const { email, password, confirmPassword, fullName, birthDate, countryOrigin, gender, profileImage } = formValues;

    if (confirmPassword !== password) {
        alert("Passwords don't match");
        return false; // החזרת ערך כדי שהקומפוננטה תדע שהתהליך נכשל
    }

    try {
        // 🔥 FIX 1: "תפוס" את התשובה מ-Firebase כדי לקבל את פרטי המשתמש
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // אם הגענו לכאן, המשתמש נוצר בהצלחה ב-Firebase Auth
        console.log('Successfully created user in Firebase Auth with UID:', firebaseUser.uid);

        // --- לוגיקת העלאת תמונה (ללא שינוי) ---
        let profileImageUrl = '';
        if (profileImage) {
            const imageRef = ref(storage, `profileImages/${firebaseUser.uid}`); // מומלץ להשתמש ב-UID במקום באימייל
            await uploadBytes(imageRef, profileImage);
            profileImageUrl = await getDownloadURL(imageRef);
        }

        // 🔥 FIX 2: הכנת אובייקט הנתונים *השלם* לשליחה ל-MongoDB
        // האובייקט הזה כולל עכשיו את כל מה שהשרת צריך
        const userDataForMongo = {
            firebaseUid: firebaseUser.uid, // <-- זה השדה החשוב שהיה חסר!
            fullName,
            birthDate,
            countryOrigin,
            gender,
            profileImageUrl,
            email,
        };

        // 🔥 FIX 3: שליחת המידע ישירות לשרת, ללא פונקציית עזר מסבכת
        await axios.post('http://localhost:5000/api/users', userDataForMongo);
        // שים לב: אנחנו שולחים את האובייקט ישירות, ולא עטוף בתוך { data: ... }

        alert('User registered successfully!');
        return true; // החזר true כדי שהקומפוננטה תדע לנווט

    } catch (err) {
        console.error("Registration process failed:", err);
        // ה-switch case שלך נשאר זהה
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

// אין יותר צורך בפונקציה handleDataSave. היא הייתה מיותרת וגרמה לבאג.
// export async function handleDataSave(data) { ... }