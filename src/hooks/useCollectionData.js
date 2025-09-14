import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { useUser } from '../contexts/UserContext';

const VALID_COLLECTION_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

const useCollectionData = (collectionName) => {
  const { isAuthReady, user } = useUser();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setLoading(false);
      return;
    }

    if (!collectionName) {
      setLoading(false);
      setData([]);
      setError(new Error('Collection name is required'));
      return;
    }

    if (!VALID_COLLECTION_NAME_REGEX.test(collectionName)) {
      setLoading(false);
      setData([]);
      setError(new Error('Invalid collection name format'));
      return;
    }

    if (!db || !appId) {
      setLoading(false);
      setData([]);
      setError(new Error('Firebase configuration is missing'));
      return;
    }

    setLoading(true);
    setError(null); // Reset error state when retrying

    try {
      const q = query(collection(db, `artifacts/${appId}/public/data/${collectionName}`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          if (!snapshot) {
            throw new Error('No snapshot received');
          }
          
          const fetchedData = snapshot.docs.map((doc) => {
            if (!doc) {
              throw new Error('Invalid document in snapshot');
            }
            const data = doc.data();
            if (!data) {
              throw new Error(`Empty document data for ID: ${doc.id}`);
            }
            return { id: doc.id, ...data };
          });
          
          setData(fetchedData);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error(`Error processing ${collectionName} data:`, err);
          setError({
            type: 'data',
            message: `Failed to process ${collectionName} data`,
            details: err.message
          });
          setLoading(false);
        }
      }, (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError({
          type: 'fetch',
          message: `Failed to fetch ${collectionName}`,
          details: err.message
        });
        setLoading(false);
      });
      
      return unsubscribe;
    } catch (err) {
      console.error(`Error setting up ${collectionName} listener:`, err);
      setError({
        type: 'setup',
        message: `Failed to set up ${collectionName} listener`,
        details: err.message
      });
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }

    return () => {
      unsubscribe();
    };
  }, [isAuthReady, user, collectionName, db, appId]);

  return { data, loading, error };
};

export default useCollectionData;