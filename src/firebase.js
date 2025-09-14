// This file initializes and exports Firebase services for the application.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { enableIndexedDbPersistence } from 'firebase/firestore';

/**
 * Validates the Firebase configuration object
 * @param {Object} config - Firebase configuration object
 * @returns {boolean} - Whether the configuration is valid
 */
const validateFirebaseConfig = (config) => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  return requiredFields.every(field => {
    if (!config[field]) {
      console.error(`Missing required Firebase config field: ${field}`);
      return false;
    }
    return true;
  });
};

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

let app;
let auth;
let db;
let functions;
let appId;

try {
  // Validate configuration
  if (!validateFirebaseConfig(firebaseConfig)) {
    throw new Error('Invalid Firebase configuration');
  }

  // Initialize Firebase only if it hasn't been initialized already
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Firebase services with error handling
  try {
    auth = getAuth(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Auth:', error);
    throw error;
  }

  try {
    db = getFirestore(app);
    // Enable offline persistence
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support offline persistence.');
      }
    });
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    throw error;
  }

  try {
    functions = getFunctions(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Functions:', error);
    throw error;
  }

  // Define application ID
  appId = firebaseConfig.projectId;

  // Connect to emulators in development environment
  if (process.env.NODE_ENV === 'development') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (error) {
      console.warn('Failed to connect to Firebase emulators:', error);
    }
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw new Error('Firebase initialization failed. Please check your configuration and try again.');
}

// Helper function to check if Firebase is initialized
const isInitialized = () => {
  return !!(app && auth && db && functions && appId);
};

// Export the initialized services and config for use throughout the application
export { auth, db, functions, appId, firebaseConfig, isInitialized };