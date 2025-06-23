import { auth } from '@/services/fireBase.js';
import { signInWithEmailAndPassword } from "firebase/auth";

export async function handleSignIn(formValues) {
    const { email, password } = formValues;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User signed in successfully");
        return true;
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            alert("Incorrect email or password. Please try again.");
        } else {
            alert("An unknown error occurred during sign-in.");
        }
        return false;
    }
}