// This component serves as the main dashboard for students, displaying their performance and test history.
import React, { useState, useEffect } from 'react';
import { onSnapshot, collection, query, doc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * StudentDashboard component displays a student's overall performance, test history, and test attempt limits.
 */
export default function StudentDashboard({ user, userProfile, setView, onViewResult }) {
    // State for test history, loading status, and test limits
    const [testHistory, setTestHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testLimits, setTestLimits] = useState(null);

    // Effect to fetch the user's test history from Firestore
    useEffect(() => {
        const historyRef = collection(db, `artifacts/${appId}/users/${user.uid}/testHistory`);
        const q = query(historyRef);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTestHistory(historyData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);

    // Effect to fetch the global test limits from Firestore
    useEffect(() => {
        const limitsRef = doc(db, `artifacts/${appId}/public/data/appSettings`, 'testLimits');
        const unsubscribe = onSnapshot(limitsRef, (docSnap) => {
            if (docSnap.exists()) {
                setTestLimits(docSnap.data());
            } else {
                // Default limits if none are set in the database
                setTestLimits({ quantLimit: 5, verbalLimit: 5, diLimit: 5, mockLimit: 3 });
            }
        });
        return () => unsubscribe();
    }, []);

    if (loading || !testLimits) {
        return <div>Loading dashboard...</div>;
    }

    // --- Calculate Performance Statistics ---
    // Total questions answered across all tests
    const totalQuestions = testHistory.reduce((acc, result) => acc + (result.answers?.length || 0), 0);
    // Total correct answers across all tests
    const totalCorrect = testHistory.reduce((acc, result) => acc + (result.answers?.filter(a => a.isCorrect).length || 0), 0);
    // Overall accuracy percentage
    const overallAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : "N/A";

    // Group scores by section type
    const sectionScores = { Quant: [], Verbal: [], 'Data Insights': [] };
    testHistory.forEach(result => {
        if (sectionScores[result.testType]) {
            sectionScores[result.testType].push(result.score);
        }
    });

    // Calculate average scores for each section
    const averageScores = {
        Quant: sectionScores.Quant.length > 0 ? (sectionScores.Quant.reduce((a, b) => a + b, 0) / sectionScores.Quant.length).toFixed(1) : "N/A",
        Verbal: sectionScores.Verbal.length > 0 ? (sectionScores.Verbal.reduce((a, b) => a + b, 0) / sectionScores.Verbal.length).toFixed(1) : "N/A",
        'Data Insights': sectionScores['Data Insights'].length > 0 ? (sectionScores['Data Insights'].reduce((a, b) => a + b, 0) / sectionScores['Data Insights'].length).toFixed(1) : "N/A",
    };
    
    // Calculate overall average score across all tests
    const overallAverage = testHistory.length > 0 ? (testHistory.reduce((acc, result) => acc + result.score, 0) / testHistory.length).toFixed(1) : "N/A";

    // Data for the average score by section chart
    const chartData = [
        { name: 'Quant', avgScore: averageScores.Quant },
        { name: 'Verbal', avgScore: averageScores.Verbal },
        { name: 'Data Insights', avgScore: averageScores['Data Insights'] },
    ];

    // User's test attempts from their profile
    const attempts = userProfile.testAttempts || {};

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>

            {/* Performance Snapshot Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Overall Average Score</h3>
                    <p className="text-4xl font-bold text-indigo-600">{overallAverage}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Questions Answered</h3>
                    <p className="text-4xl font-bold text-indigo-600">{totalQuestions}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Overall Accuracy</h3>
                    <p className="text-4xl font-bold text-indigo-600">{overallAccuracy}%</p>
                </div>
            </div>

            {/* Section Performance & Attempts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Average Score by Section</h3>
                    {/* Bar chart displaying average scores per section */}
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[60, 90]} />
                            <Tooltip />
                            <Bar dataKey="avgScore" fill="#4f46e5" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Test Attempts Used</h3>
                    <div className="space-y-4">
                        {/* Progress bars for each test type showing attempts used vs. limit */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-base font-medium text-gray-700">Quantitative</span>
                                <span className="text-sm font-medium text-gray-700">{attempts.Quant || 0} / {testLimits.quantLimit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{width: `${((attempts.Quant || 0) / testLimits.quantLimit) * 100}%`}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-base font-medium text-gray-700">Verbal</span>
                                <span className="text-sm font-medium text-gray-700">{attempts.Verbal || 0} / {testLimits.verbalLimit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-purple-600 h-2.5 rounded-full" style={{width: `${((attempts.Verbal || 0) / testLimits.verbalLimit) * 100}%`}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-base font-medium text-gray-700">Data Insights</span>
                                <span className="text-sm font-medium text-gray-700">{attempts['Data Insights'] || 0} / {testLimits.diLimit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-teal-500 h-2.5 rounded-full" style={{width: `${((attempts['Data Insights'] || 0) / testLimits.diLimit) * 100}%`}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-base font-medium text-gray-700">Full Mock Exam</span>
                                <span className="text-sm font-medium text-gray-700">{attempts['Full Mock Exam'] || 0} / {testLimits.mockLimit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-gray-700 h-2.5 rounded-full" style={{width: `${((attempts['Full Mock Exam'] || 0) / testLimits.mockLimit) * 100}%`}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Test History Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Test History</h3>
                <div className="space-y-4">
                    {testHistory.slice(0, 5).map(result => (
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
            </div>
        </div>
    );
}