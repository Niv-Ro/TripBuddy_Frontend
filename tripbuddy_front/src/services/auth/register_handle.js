import { auth } from '@/services/fireBase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function handleRegister(formValues) {
    const { email, password, confirmPassword, fullName, birthDate, countryOrigin, gender, profileImage } = formValues;
    if (confirmPassword !== password) {
        alert("Passwords don't match");
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);

        let profileImageUrl = '';
        if (profileImage) {
            // 1. Create a storage reference
            const imageRef = ref(storage, `profileImages/${email}_${Date.now()}`);

            // 2. Upload file
            await uploadBytes(imageRef, profileImage);

            // 3. Get download URL
            profileImageUrl = await getDownloadURL(imageRef);
        }

        // 4. Save all data (including profileImageUrl) to MongoDB
        await handleDataSave({ fullName, birthDate, countryOrigin, gender, profileImageUrl });

    }catch (err){
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
            case 'auth/network-request-failed':
                alert("Network error");
                break;
        }

    }

}

export async function handleDataSave(data) {
    try {
        await axios.post('http://localhost:5000/api/users', { data });
        alert('User registered Successfully');
    } catch (err) {
        console.error(err);
    }
}