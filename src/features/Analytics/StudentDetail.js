import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * StudentDetail component to display in-depth performance analytics for a single student.
 */
export default function StudentDetail() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [testHistory, setTestHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let unsubscribe;
        const fetchStudentData = async () => {
            const studentRef = doc(db, `artifacts/${appId}/users`, studentId);
            const studentSnap = await getDoc(studentRef);
            if (studentSnap.exists()) {
                setStudent({ id: studentSnap.id, ...studentSnap.data() });
            } else {
                setIsLoading(false);
                return; // Student not found, stop.
            }

            const historyRef = collection(db, `artifacts/${appId}/users/${studentId}/testHistory`);
            const q = query(historyRef, orderBy('completedAt', 'desc'));

            unsubscribe = onSnapshot(q, (snapshot) => {
                const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTestHistory(historyData);
                setIsLoading(false);
            });
        };

        fetchStudentData();
        
        return () => {
            if(unsubscribe) unsubscribe();
        }
    }, [studentId]);

    const onViewResult = (result) => {
        navigate('/results', { state: { results: result } });
    };

    if (isLoading) {
        return <div>Loading student details...</div>;
    }

    if (!student) {
        return <div>Student not found.</div>;
    }

    // --- Data Processing for Charts ---
    const sectionPerformances = [];
    let totalCorrect = 0;
    let totalQuestions = 0;

    testHistory.forEach(result => {
        if (result.answers) {
            totalCorrect += result.answers.filter(a => a.isCorrect).length;
            totalQuestions += result.answers.length;
        }
        if (result.testType !== 'Full Mock Exam' && result.score) {
            sectionPerformances.push({ name: result.testType, score: result.score });
        } else if (result.sections) {
            result.sections.forEach(sec => sectionPerformances.push({ name: sec.testType, score: sec.score }));
        }
    });

    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const overallAverage = sectionPerformances.length > 0
        ? Math.round(sectionPerformances.reduce((acc, curr) => acc + curr.score, 0) / sectionPerformances.length)
        : 0;

    const sectionChartData = ['Quantitative', 'Verbal', 'Data Insights'].map(sectionName => {
        const sectionScores = sectionPerformances.filter(p => p.name === sectionName).map(p => p.score);
        const avgScore = sectionScores.length > 0 ? Math.round(sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length) : 0;
        return { name: sectionName, 'Average Score': avgScore };
    });

    const progressChartData = testHistory
        .slice()
        .reverse()
        .map((result, index) => ({
            name: `Test ${index + 1}`,
            Score: result.score,
            Date: new Date(result.completedAt.seconds * 1000).toLocaleDateString(),
        }));
    
    // --- Render ---
    return (
        <div className="space-y-8">
            <button onClick={() => navigate('/student-performance')} className="text-indigo-600 hover:text-indigo-800">&larr; Back to All Students</button>
            <h1 className="text-3xl font-bold text-gray-800">Performance for {student.displayName || student.email}</h1>

            {testHistory.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h2 className="text-2xl font-semibold text-gray-700">No Data Available</h2>
                    <p className="mt-2 text-gray-500">This student has not completed any tests yet.</p>
                </div>
            ) : (
                <>
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Average Score by Section</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={sectionChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[60, 90]} />
                                    <Tooltip />
                                    <Bar dataKey="Average Score" fill="#4f46e5" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Score Progression</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={progressChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[200, 805]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="Score" stroke="#8884d8" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Test History</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                     <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {testHistory.map(result => (
                                        <tr key={result.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{result.testType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(result.completedAt.seconds * 1000).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-semibold">{result.score}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button onClick={() => onViewResult(result)} className="text-indigo-600 hover:text-indigo-800">View Details</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}