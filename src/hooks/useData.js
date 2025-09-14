import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { useUser } from '../contexts/UserContext';
import { validateQuestionData } from '../utils'; // Assuming you move validation logic to a utils file

const useData = () => {
  const { isAuthReady, user } = useUser();
  const [questions, setQuestions] = useState([]);
  const [passages, setPassages] = useState([]);
  const [msrSets, setMsrSets] = useState([]);
  const [graphicStimuli, setGraphicStimuli] = useState([]);
  const [tableStimuli, setTableStimuli] = useState([]);
  const [appSettings, setAppSettings] = useState({
    isPracticeHubActive: true,
    isMockTestActive: true,
    isSectionalTestActive: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribes = [];

    const setupDataListeners = async () => {
      setError(null); // Reset error state at the start
      
      // 1. Handle appSettings first to ensure it exists
      const settingsDocRef = doc(db, `artifacts/${appId}/public/data/appSettings/config`);
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (!docSnap.exists()) {
          const defaultSettings = {
            isPracticeHubActive: true,
            isMockTestActive: true,
            isSectionalTestActive: true,
            testLimits: { quantLimit: 5, verbalLimit: 5, diLimit: 5, mockLimit: 3 }
          };
          await setDoc(settingsDocRef, defaultSettings);
          setAppSettings(defaultSettings);
        } else {
          setAppSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Error ensuring appSettings exist:", error);
        setError({
          type: 'settings',
          message: 'Failed to load application settings',
          details: error.message
        });
      }

      // Now set up the real-time listener for appSettings
      const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setAppSettings(docSnap.data());
        }
      }, (error) => {
        console.error("Error fetching appSettings real-time:", error);
      });
      unsubscribes.push(unsubscribeSettings);

      // 2. Set up listeners for other collections
      const collectionsToFetch = [
        { name: 'questions', setState: setQuestions },
        { name: 'passages', setState: setPassages },
        { name: 'msrSets', setState: setMsrSets },
        { name: 'graphicStimuli', setState: setGraphicStimuli },
        { name: 'tableStimuli', setState: setTableStimuli },
      ];

      const promises = [];
      collectionsToFetch.forEach(({ name, setState }) => {
        const q = query(collection(db, `artifacts/${appId}/public/data/${name}`));
        const promise = new Promise((resolve, reject) => {
          const unsubscribe = onSnapshot(q, (snapshot) => {
            try {
              if (!snapshot) {
                throw new Error(`No snapshot received for ${name}`);
              }

              if (name === 'questions') {
                const questionsData = [];
                snapshot.docs.forEach(doc => {
                  const data = doc.data();
                  
                  // --- Defensive Data Handling ---
                  // Provide default values for potentially missing fields in older documents
                  const processedData = {
                    ...data,
                    creationDate: data.creationDate?.toDate ? data.creationDate.toDate() : new Date(),
                    lastModified: data.lastModified?.toDate ? data.lastModified.toDate() : new Date(),
                    usageCount: typeof data.usageCount === 'number' ? data.usageCount : 0,
                  };

                  if (validateQuestionData(processedData)) {
                    questionsData.push({ id: doc.id, ...processedData });
                  } else {
                    // This will now only log for truly malformed data
                    console.error(`Skipping invalid question data for ID: ${doc.id}`);
                  }
                });
                setState(questionsData);
              } else {
                const data = snapshot.docs.map((doc) => {
                  if (!doc) {
                    throw new Error(`Invalid document in ${name} snapshot`);
                  }
                  const docData = doc.data();
                  if (!docData) {
                    throw new Error(`Empty document data for ID: ${doc.id} in ${name}`);
                  }
                  return { id: doc.id, ...docData };
                });

                // Validate required fields for other collections
                data.forEach(item => {
                  switch(name) {
                    case 'passages':
                      if (!item.text) {
                        throw new Error(`Invalid passage data for ID: ${item.id}`);
                      }
                      break;
                    case 'msrSets':
                      if (!Array.isArray(item.statements)) {
                        throw new Error(`Invalid MSR set data for ID: ${item.id}`);
                      }
                      break;
                    // Add validations for other collection types as needed
                  }
                });
                
                setState(data);
              }
              resolve();
            } catch (error) {
              console.error(`Error processing ${name} data:`, error);
              setError({
                type: 'data',
                message: `Failed to process ${name} data`,
                details: error.message
              });
              reject(error);
            }
          }, (error) => {
            console.error(`Error fetching ${name}:`, error);
            setError({
              type: 'collection',
              message: `Failed to load ${name} data`,
              details: error.message
            });
            reject(error);
          });
          unsubscribes.push(unsubscribe);
        });
        promises.push(promise);
      });

      try {
        await Promise.all(promises);
      } catch (error) {
        console.error('Error loading data:', error);
        setError({
          type: 'general',
          message: 'Failed to load some application data',
          details: error.message
        });
      } finally {
        setIsLoading(false);
      }
    };

    setupDataListeners();

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [isAuthReady, user, db, appId]);

  return { questions, passages, msrSets, graphicStimuli, tableStimuli, appSettings, isLoading, error };
};

export default useData;