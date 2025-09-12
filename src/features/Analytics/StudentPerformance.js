import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../firebase';

/**
 * StudentPerformance component for Admins and Educators to view all student data.
 */
export default function StudentPerformance() {
    const [students, setStudents] = useState([]);
    const [allTestHistories, setAllTestHistories] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const usersRef = collection(db, `artifacts/${appId}/users`);
        const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(usersData.filter(u => u.role === 'Student'));
            setIsLoading(false);
        });

        return () => unsubscribeUsers();
    }, []);

    useEffect(() => {
        if (students.length === 0) return;

        const unsubscribes = students.map(student => {
            const historyRef = collection(db, `artifacts/${appId}/users/${student.id}/testHistory`);
            return onSnapshot(historyRef, (snapshot) => {
                const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllTestHistories(prev => ({ ...prev, [student.id]: historyData }));
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [students]);

    const processedStudents = useMemo(() => {
        return students.map(student => {
            const history = allTestHistories[student.id] || [];
            const totalTests = history.length;
            const totalScore = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
            const avgScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;

            let totalCorrect = 0;
            let totalQuestions = 0;

            history.forEach(result => {
                if (result.answers) {
                    totalCorrect += result.answers.filter(a => a.isCorrect).length;
                    totalQuestions += result.answers.length;
                }
            });

            const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

            return {
                ...student,
                totalTests,
                avgScore,
                accuracy
            };
        });
    }, [students, allTestHistories]);

    const filteredStudents = useMemo(() => {
        return processedStudents.filter(student =>
            (student.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (student.email?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [processedStudents, searchTerm]);


    if (isLoading) {
        return <div>Loading student data...</div>;
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Performance Overview</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search for a student by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border rounded-md"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests Taken</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.displayName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.totalTests}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.avgScore}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.accuracy}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => navigate(`/student-performance/${student.id}`)} className="text-indigo-600 hover:text-indigo-900">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}