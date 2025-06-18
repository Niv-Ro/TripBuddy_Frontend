import { auth } from '../components/FireBase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';

export async function handleRegister(formValues) {
    const { email, password, confirmPassword, fullName, birthDate, countryOrigin, gender } = formValues;
    if (confirmPassword !== password) {
        alert("Passwords don't match");
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        await handleDataSave({ fullName, birthDate, countryOrigin, gender });
    }catch (err){
        console.log(err)
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