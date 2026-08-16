import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    updateProfile,
} from "firebase/auth";

import { auth } from "../firebase/firebase.js";


const googleProvider =
    new GoogleAuthProvider();






export const registerUser = async (
    name,
    email,
    password
) => {

    const userCredential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

    await updateProfile(
        userCredential.user,
        {
            displayName: name,
        }
    );

    return userCredential.user;
};






export const loginUser = async (
    email,
    password
) => {

    const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    return userCredential.user;
};






export const googleLogin = async () => {

    const result =
        await signInWithPopup(
            auth,
            googleProvider
        );

    return result.user;
};






export const getIdToken = async () => {

    if (!auth.currentUser) {
        return null;
    }

    return await auth.currentUser.getIdToken();
};






export const logoutUser = async () => {

    await signOut(auth);

};