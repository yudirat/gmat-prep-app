import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        await authUser.getIdToken(true); // Force refresh of custom claims
        const userRef = doc(db, `artifacts/${appId}/users`, authUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          // If the user document doesn't exist, create it.
          const newUserProfile = {
            uid: authUser.uid,
            email: authUser.email,
            role: 'Student', // Default role
            createdAt: new Date(),
            displayName: authUser.email,
            seenQuestionIds: [],
            testAttempts: {
              Quant: 0,
              Verbal: 0,
              'Data Insights': 0,
              'Full Mock Exam': 0
            }
          };
          await setDoc(userRef, newUserProfile);
          setUserProfile(newUserProfile);
        }
        setUser(authUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    isAuthReady,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
