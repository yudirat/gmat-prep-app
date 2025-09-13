import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { useUser } from '../contexts/UserContext';

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
        return;
    }

    setLoading(true);

    const q = query(collection(db, `artifacts/${appId}/public/data/${collectionName}`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData(fetchedData);
      setLoading(false);
    }, (err) => {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(err);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthReady, user, collectionName]);

  return { data, loading, error };
};

export default useCollectionData;