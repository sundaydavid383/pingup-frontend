// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCl4Pt_gq0snnoCVnkIlDjvhbI8zLgA6ck",
  authDomain: "pingup-6e155.firebaseapp.com",
  projectId: "pingup-6e155",
  storageBucket: "pingup-6e155.firebasestorage.app",
  messagingSenderId: "191373671087",
  appId: "1:191373671087:web:20b977546d74ee0192725a",
  measurementId: "G-GQDTLW3VXR",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth setup
export const auth = getAuth(app);

// ✅ Google Provider setup
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// ✅ Google Sign-in function
export const signInWithGoogle = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence); // keeps user logged in after refresh
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;

    // ✅ You can send `token` or `user` info to your backend here if needed
    return { user, token };
  } catch (error) {
    console.error("Google Sign-in Error:", error);
    throw new Error(error.message);
  }
};

// ✅ Logout function
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Sign-out Error:", error);
  }
};
