import { auth } from '@/services/fireBase.js';
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';


export async function handleSignIn(formValues) {
    const { email, password} = formValues;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    }catch (err){
        console.log(err)
    }

}