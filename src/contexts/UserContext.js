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

  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (!auth || !db || !appId) {
          throw new Error('Firebase configuration is missing');
        }

        if (authUser) {
          try {
            await authUser.getIdToken(true); // Force refresh of custom claims
          } catch (tokenError) {
            console.error('Failed to refresh token:', tokenError);
            // Continue without throwing, as we might still have a valid old token
          }

          const userRef = doc(db, `artifacts/${appId}/users`, authUser.uid);
          
          try {
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Validate required fields
              if (!userData.uid || !userData.email || !userData.role) {
                throw new Error('Invalid user profile data');
              }
              setUserProfile(userData);
            } else {
              // If the user document doesn't exist, create it
              const newUserProfile = {
                uid: authUser.uid,
                email: authUser.email || '',
                role: 'Student', // Default role
                createdAt: new Date(),
                displayName: authUser.email || 'Anonymous User',
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
          } catch (profileError) {
            console.error('Error managing user profile:', profileError);
            // Still set the auth user even if profile fails
            setUser(authUser);
            setError({
              type: 'profile',
              message: 'Failed to load or create user profile',
              details: profileError.message
            });
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setError(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError({
          type: 'auth',
          message: 'Authentication error',
          details: error.message
        });
      } finally {
        setIsAuthReady(true);
      }
    }, (authError) => {
      console.error('Auth state observer error:', authError);
      setError({
        type: 'observer',
        message: 'Authentication observer failed',
        details: authError.message
      });
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    isAuthReady,
    error,
    isLoading: !isAuthReady,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
