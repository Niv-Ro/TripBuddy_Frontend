"use client";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getDatabase} from "firebase/database";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBeq2s1YaKlK_MfSRkTFpRghsS4PMDawX8",
    authDomain: "finalprojectandroid2-5d32f.firebaseapp.com",
    projectId: "finalprojectandroid2-5d32f",
    storageBucket: "finalprojectandroid2-5d32f.firebasestorage.app",
    messagingSenderId: "534679001606",
    appId: "1:534679001606:web:057475d621a7b9c6460187",
    measurementId: "G-M4QL0BYWWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
export {auth}
export default database