// This file initializes and exports Firebase services for the application.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

/**
 * Firebase configuration object.
 * These values are typically obtained from your Firebase project settings.
 */
const firebaseConfig = {
    apiKey: "AIzaSyA99On_n6-sp23bn7Nzd4Vv4FpQt47HnY4",
  authDomain: "gmat-focus.firebaseapp.com",
  projectId: "gmat-focus",
  storageBucket: "gmat-focus.firebasestorage.app",
  messagingSenderId: "251120900436",
  appId: "1:251120900436:web:e9e8efb5255c52a85810c1",
  measurementId: "G-H1280NBNJF"
};

// Initialize Firebase application
const app = initializeApp(firebaseConfig);

// Get Firebase Authentication instance
const auth = getAuth(app);

// Get Firebase Firestore instance
const db = getFirestore(app);

// Get Firebase Functions instance
const functions = getFunctions(app);

// Define an application ID, useful for multi-tenant Firestore structures
const appId = firebaseConfig.projectId;

// Export the initialized services and config for use throughout the application
export { auth, db, functions, appId, firebaseConfig };