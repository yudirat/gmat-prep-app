// src/features/Dashboard/PracticeHistory.js - (Updated Code)

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useUser } from '../../contexts/UserContext';
import useData from '../../hooks/useData'; // 1. Import useData to get all questions

const PracticeHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  
  // 2. Fetch all questions from the question bank
  const { data: allQuestions, loading: questionsLoading } = useData('questions');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);
      const q = query(
        collection(db, 'practice_sessions'), 
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(historyData);
      setLoading(false);
    };

    fetchHistory();
  }, [user]);

  // 3. Memoized calculation for performance by tag
  const performanceByTag = useMemo(() => {
    if (!history.length || !allQuestions.length) return {};

    const tagStats = {};
    const questionsMap = new Map(allQuestions.map(q => [q.id, q]));

    history.forEach(session => {
      session.questionsAttempted.forEach(attempt => {
        const question = questionsMap.get(attempt.questionId);
        if (question && question.tags) {
          question.tags.forEach(tag => {
            if (!tagStats[tag]) {
              tagStats[tag] = { correct: 0, total: 0 };
            }
            tagStats[tag].total += 1;
            if (attempt.isCorrect) {
              tagStats[tag].correct += 1;
            }
          });
        }
      });
    });
    return tagStats;
  }, [history, allQuestions]);

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-green-600 bg-green-100';
    if (accuracy >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading || questionsLoading) return <p>Loading performance data...</p>;

  return (
    <div className="mt-8">
      {/* --- New Performance by Topic Section --- */}
      {Object.keys(performanceByTag).length > 0 && ( // Only render if there's data
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Performance by Topic</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(performanceByTag).sort((a,b) => b[1].total - a[1].total).map(([tag, stats]) => {
              const accuracy = (stats.correct / stats.total) * 100;
              return (
                <div key={tag} className="p-4 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-800">{tag}</span>
                    <span className={`px-2 py-1 text-sm font-bold rounded-full ${getAccuracyColor(accuracy)}`}>
                      {accuracy.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.correct}/{stats.total} correct
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* --- Existing Recent Practice Quizzes Section --- */}
      <h3 className="text-xl font-semibold mb-4">Recent Practice Quizzes</h3>
      {history.length === 0 ? (
        <p>No practice sessions recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map(session => (
            <div key={session.id} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center">
                <p className="font-bold">{session.section}</p>
                <p className={`font-bold text-lg ${session.score >= 75 ? 'text-green-600' : 'text-orange-500'}`}>
                  {session.score.toFixed(1)}%
                </p>
              </div>
              <p className="text-sm text-gray-500">
                {session.correctAnswers} / {session.totalQuestions} correct
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {session.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PracticeHistory;