import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { useUser } from '../contexts/UserContext';

const useData = () => {
  const { isAuthReady, user } = useUser();
  const [questions, setQuestions] = useState([]);
  const [passages, setPassages] = useState([]);
  const [msrSets, setMsrSets] = useState([]);
  const [graphicStimuli, setGraphicStimuli] = useState([]);
  const [tableStimuli, setTableStimuli] = useState([]);
  const [roles, setRoles] = useState([]);
  const [appSettings, setAppSettings] = useState({
    isPracticeHubActive: true,
    isMockTestActive: true,
    isSectionalTestActive: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const collectionsToFetch = [
      { name: 'questions', setState: setQuestions },
      { name: 'passages', setState: setPassages },
      { name: 'msrSets', setState: setMsrSets },
      { name: 'graphicStimuli', setState: setGraphicStimuli },
      { name: 'tableStimuli', setState: setTableStimuli },
      { name: 'roles', setState: setRoles },
    ];

    const unsubscribes = [];
    const promises = [];

    collectionsToFetch.forEach(({ name, setState }) => {
      const q = query(collection(db, `artifacts/${appId}/public/data/${name}`));
      const promise = new Promise(resolve => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setState(data);
          resolve(); // Resolve the promise when data is fetched
        }, (error) => {
          console.error(`Error fetching ${name}:`, error);
          resolve(); // Resolve even on error to avoid blocking
        });
        unsubscribes.push(unsubscribe);
      });
      promises.push(promise);
    });

    const settingsDocRef = doc(db, `artifacts/${appId}/public/data/appSettings/config`);
    const settingsPromise = new Promise(resolve => {
      const unsubscribeSettings = onSnapshot(settingsDocRef, async (docSnap) => {
          if (docSnap.exists()) {
              setAppSettings(docSnap.data());
          } else {
              // Create default app settings if they don't exist
              const defaultSettings = {
                  isPracticeHubActive: true,
                  isMockTestActive: true,
                  isSectionalTestActive: true,
                  testLimits: { quantLimit: 5, verbalLimit: 5, diLimit: 5, mockLimit: 3 }
              };
              await setDoc(settingsDocRef, defaultSettings);
              setAppSettings(defaultSettings);
          }
          resolve();
      });
      unsubscribes.push(unsubscribeSettings);
    });
    promises.push(settingsPromise);

    Promise.all(promises).then(() => {
      console.log("All data fetched, setting isLoading to false");
      setIsLoading(false);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [isAuthReady, user]);

  return { questions, passages, msrSets, graphicStimuli, tableStimuli, roles, appSettings, isLoading };
};

export default useData;
