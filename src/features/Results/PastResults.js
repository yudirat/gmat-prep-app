import React, { useState, useEffect } from 'react';
import { onSnapshot, collection, query } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useUser } from '../../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

/**
 * Component to display a user's past test results.
 * It fetches the test history from Firestore and displays it in a list.
 */
export default function PastResults() {
    const { user } = useUser();
    const navigate = useNavigate();
    // State to store the test history and loading status
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Effect to fetch the user's test history from Firestore
    useEffect(() => {
        if (!user) return;
        const historyRef = collection(db, `artifacts/${appId}/users/${user.uid}/testHistory`);
        const q = query(historyRef); // You can add orderBy here if needed, e.g., orderBy('completedAt', 'desc')
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistory(historyData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const onViewResult = (result) => {
        navigate('/results', { state: { results: result } });
    };

    if (loading || !user) return <div>Loading past results...</div>;

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Past Test Results</h2>
            {history.length > 0 ? (
                <div className="space-y-4">
                    {history.map(result => (
                        <div key={result.id} className="p-4 border rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{result.testType}</p>
                                <p className="text-sm text-gray-500">{new Date(result.completedAt.seconds * 1000).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-indigo-600">{result.score}</p>
                                <button onClick={() => onViewResult(result)} className="text-sm text-indigo-500 hover:underline">View Details</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>You haven't completed any tests yet.</p>
            )}
        </div>
    );
}