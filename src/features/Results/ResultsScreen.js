// src/features/Results/ResultsScreen.js - (Updated Code)
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSectionScaledScore, getTotalScaledScore } from '../../utils/scoringUtils'; // Import the new functions

const ResultsScreen = ({ results: propResults }) => {
  const location = useLocation();
  const resultsFromState = location.state?.results;
  const results = propResults || resultsFromState;

  const [calculatedScores, setCalculatedScores] = useState(null);

  useEffect(() => {
    if (!results) return;

    const scores = {};
    let sectionScoresForTotal = {};
    let resultsArray = [];

    if (Array.isArray(results)) { // This is a mock test result
        resultsArray = results;
    } else if (results.testType && results.answers) { // This is a past result
        resultsArray = [{ section: results.testType, results: results.answers }];
    }

    resultsArray.forEach(sectionResult => {
      let totalPointsEarned = 0;
      let maxPossiblePoints = 0;

      const answers = Array.isArray(sectionResult.results) ? sectionResult.results : sectionResult.results.answers;

      answers.forEach(question => {
        const points = question.difficulty;
        maxPossiblePoints += points;
        if (question.answeredCorrectly) {
          totalPointsEarned += points;
        }
      });

      const accuracy = maxPossiblePoints > 0 ? (totalPointsEarned / maxPossiblePoints) * 100 : 0;
      const scaledScore = getSectionScaledScore(accuracy);
      
      scores[sectionResult.section] = {
        accuracy: accuracy.toFixed(2),
        scaledScore: scaledScore,
        totalQuestions: answers.length,
        correctQuestions: answers.filter(q => q.answeredCorrectly).length
      };

      sectionScoresForTotal[sectionResult.section] = scaledScore;
    });

    // Calculate total score after all sections are processed
    const totalScore = getTotalScaledScore(
        sectionScoresForTotal['Quantitative'],
        sectionScoresForTotal['Verbal'],
        sectionScoresForTotal['Data Insights']
    );

    setCalculatedScores({ sections: scores, total: totalScore });

  }, [results]);

  if (!calculatedScores) {
    return <div>Calculating results...</div>;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-4">Test Results</h1>
      
      {/* Display Total Score */}
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-xl mb-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Total GMAT Score</h2>
        <p className="text-6xl font-bold text-indigo-600 my-2">{calculatedScores.total}</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {Object.entries(calculatedScores.sections).map(([section, score]) => (
          <div key={section} className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">{section}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-lg font-semibold text-blue-800">Section Scaled Score</p>
                <p className="text-3xl font-bold text-blue-600">{score.scaledScore}</p>
                <p className="text-sm text-gray-500">(from {score.accuracy}% weighted accuracy)</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-lg font-semibold text-green-800">Raw Accuracy</p>
                <p className="text-3xl font-bold text-green-600">
                  {((score.correctQuestions / score.totalQuestions) * 100).toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500">({score.correctQuestions} / {score.totalQuestions} questions)</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsScreen;