import { auth } from '../components/FireBase.js';
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';
import {handleDataSave} from "@/app/Services/register";


export async function handleSignIn(formValues) {
    const { email, password} = formValues;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    }catch (err){
        console.log(err)
    }

}