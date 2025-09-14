// This file initializes and exports Firebase services for the application.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  initializeFirestore, 
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentSingleTabManager,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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
let storage;
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

  // Initialize Firestore with persistence configuration
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        tabManager: persistentSingleTabManager()  // Note: this needs to be called as a function
      })
    });
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    throw error;
  }

  // Initialize other Firebase services
  try {
    auth = getAuth(app);
    functions = getFunctions(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Failed to initialize Firebase services:', error);
    throw error;
  }

  // Define application ID
  appId = firebaseConfig.projectId;

  // Connect to emulators in development environment
  // Only attempt to use emulators if explicitly enabled
  const useEmulators = process.env.REACT_APP_USE_EMULATORS === 'true';
  
  if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost' && useEmulators) {
    const checkEmulatorAvailability = async (host, port) => {
      try {
        const response = await fetch(`http://${host}:${port}`);
        return response.status !== 404; // Any response except 404 means emulator is running
      } catch {
        return false;
      }
    };

    const connectEmulators = async () => {
      try {
        console.log('Checking Firebase Emulators availability...');
        
        // Display Java requirement message
        console.info(`
          Firebase Emulators require Java to be installed.
          1. Download and install Java from: https://adoptium.net/
          2. Add Java to your system PATH
          3. Restart your terminal/IDE
          4. Run 'java -version' to verify installation
        `);

        // Check auth emulator
        const authAvailable = await checkEmulatorAvailability('localhost', 9099);
        if (authAvailable) {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
          console.log('Connected to Auth Emulator');
        } else {
          console.warn('Auth Emulator not available. Run: firebase emulators:start');
        }

        // Check Firestore emulator
        const firestoreAvailable = await checkEmulatorAvailability('localhost', 8080);
        if (firestoreAvailable) {
          connectFirestoreEmulator(db, 'localhost', 8080);
          console.log('Connected to Firestore Emulator');
        } else {
          console.warn('Firestore Emulator not available');
        }

        // Check Functions emulator
        const functionsAvailable = await checkEmulatorAvailability('localhost', 5001);
        if (functionsAvailable) {
          connectFunctionsEmulator(functions, 'localhost', 5001);
          console.log('Connected to Functions Emulator');
        } else {
          console.warn('Functions Emulator not available');
        }

        // Check Storage emulator
        const storageAvailable = await checkEmulatorAvailability('localhost', 9199);
        if (storageAvailable) {
          connectStorageEmulator(storage, 'localhost', 9199);
          console.log('Connected to Storage Emulator');
        } else {
          console.warn('Storage Emulator not available');
        }

      } catch (error) {
        console.warn('Error connecting to emulators:', error);
        console.warn('To use emulators, run: firebase emulators:start');
      }
    };

    // Initialize emulator connections
    connectEmulators().catch(console.error);
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
export { auth, db, functions, storage, appId, firebaseConfig };