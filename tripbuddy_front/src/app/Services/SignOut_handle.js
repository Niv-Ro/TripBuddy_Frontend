import { auth } from '../components/FireBase.js';
import { signOut } from 'firebase/auth';

export async function handleSignOut() {
    try {
        await signOut(auth);
        alert('User signed out successfully');
    } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out. Please try again.');
    }
}
