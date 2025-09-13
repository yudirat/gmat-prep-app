import React, { useState, useEffect } from 'react';
import { onSnapshot, collection, query } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../../contexts/UserContext';
import { useDataFromContext as useData } from '../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import PracticeHistory from './PracticeHistory';

/**
 * StudentDashboard component displays a student's overall performance, test history, and test attempt limits.
 */
export default function StudentDashboard({ userProfile }) {
    const { user } = useUser();
    const { appSettings, isLoading } = useData();
    const [testHistory, setTestHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const navigate = useNavigate();

    // Effect to fetch the user's test history from Firestore
    useEffect(() => {
        if (!user) return;
        const historyRef = collection(db, `artifacts/${appId}/users/${user.uid}/testHistory`);
        const q = query(historyRef);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTestHistory(historyData);
            setLoadingHistory(false);
        });
        return () => unsubscribe();
    }, [user]);

    const onViewResult = (result) => {
        navigate('/results', { state: { results: result } });
    };

    const testLimits = appSettings?.testLimits || {};
    const attempts = userProfile?.testAttempts || {};

    // Process test history to calculate dashboard metrics
    const sectionPerformances = [];
    let totalQuestions = 0;
    let totalCorrect = 0;

    testHistory.forEach(result => {
        // For single-section tests, which are identified by their testType
        if (result.testType === 'Quantitative' || result.testType === 'Verbal' || result.testType === 'Data Insights') {
            sectionPerformances.push({
                name: result.testType,
                score: result.score,
            });
            totalQuestions += result.totalQuestions || 0;
            totalCorrect += result.totalCorrect || 0;
        } 
        // For Full Mock Exams, which contain multiple sections
        else if (result.testType === 'Full Mock Exam' && result.sections) {
            result.sections.forEach(section => {
                sectionPerformances.push({
                    name: section.name,
                    score: section.score,
                });
                totalQuestions += section.totalQuestions || 0;
                totalCorrect += section.correctCount || 0; // Note: field might be correctCount here
            });
        }
    });

    const overallAverage = sectionPerformances.length > 0
        ? Math.round(sectionPerformances.reduce((acc, curr) => acc + curr.score, 0) / sectionPerformances.length)
        : 0;

    const overallAccuracy = totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;

    const sectionDataForChart = sectionPerformances.reduce((acc, perf) => {
        if (!acc[perf.name]) {
            acc[perf.name] = { totalScore: 0, count: 0 };
        }
        acc[perf.name].totalScore += perf.score;
        acc[perf.name].count++;
        return acc;
    }, {});

    const chartData = Object.keys(sectionDataForChart).map(name => ({
        name,
        avgScore: Math.round(sectionDataForChart[name].totalScore / sectionDataForChart[name].count),
    }));

    if (isLoading || loadingHistory || !userProfile) {
    return <div>Loading dashboard...</div>;
}

    const isNewStudent = testHistory.length === 0 && Object.values(userProfile.testAttempts || {}).every(attempts => attempts === 0);

    if (isNewStudent) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to GMAT Focus Prep!</h1>
                <p className="text-lg text-gray-600 mb-8">It looks like you're new here. Let's get you started on your GMAT journey.</p>
                <div className="space-y-4 max-w-md mx-auto">
                    <button onClick={() => navigate('/practice')} className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 text-lg">
                        Start Practicing Questions
                    </button>
                    <button onClick={() => navigate('/')} className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 text-lg">
                        Take a Full Mock Test
                    </button>
                    <button onClick={() => navigate('/past-results')} className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 text-lg">
                        Review Past Results (Once you have some!)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
                <button onClick={() => navigate('/profile')} className="text-indigo-600 hover:text-indigo-800">
                    My Profile
                </button>
            </div>

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
                                <p className="text-2xl font-bold text-indigo-600">{result.score ?? 'No last test score'}</p>
                                <button onClick={() => onViewResult(result)} className="text-sm text-indigo-500 hover:underline">View Details</button>
                            </div>
                        </div>
                    ))}
                </div>np
            </div>
            <PracticeHistory />
        </div>
    );
}