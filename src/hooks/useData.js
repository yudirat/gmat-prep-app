import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { useUser } from '../contexts/UserContext';

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

  useEffect(() => {
    if (!isAuthReady || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribes = [];

    const setupDataListeners = async () => {
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
        const promise = new Promise(resolve => {
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setState(data);
            resolve();
          }, (error) => {
            console.error(`Error fetching ${name}:`, error);
            resolve();
          });
          unsubscribes.push(unsubscribe);
        });
        promises.push(promise);
      });

      await Promise.all(promises);
      setIsLoading(false);
    };

    setupDataListeners();

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [isAuthReady, user]);

  return { questions, passages, msrSets, graphicStimuli, tableStimuli, appSettings, isLoading };
};

export default useData;
