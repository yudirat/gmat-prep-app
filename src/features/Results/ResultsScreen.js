// src/features/Results/ResultsScreen.js - (Updated Code)
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSectionScaledScore, getTotalScaledScore } from '../../utils/scoringUtils'; // Import the new functions
import ContentRenderer from '../../components/ContentRenderer';
import QuestionRenderer from '../../components/QuestionRenderer';
import { getCorrectAnswerText, getStudentAnswerText } from '../../utils'; // Assuming these helpers exist

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

  let resultsArray = [];
  if (Array.isArray(results)) { // This is a mock test result
      resultsArray = results;
  } else if (results.testType && results.answers) { // This is a past result
      resultsArray = [{ section: results.testType, results: results.answers }];
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

      <div className="max-w-4xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">Question Review</h2>
        {resultsArray.map(sectionResult => (
          <div key={sectionResult.section}>
            <h3 className="text-xl font-semibold my-4 p-2 bg-gray-200 rounded-md">{sectionResult.section}</h3>
            {(Array.isArray(sectionResult.results) ? sectionResult.results : sectionResult.results.answers).map((q, index) => (
              <div key={index} className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
                <p className="font-semibold">Question {index + 1}</p>
                <QuestionRenderer question={q.question} />
                <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
                  Correct Answer: {getCorrectAnswerText(q.question)}
                </div>
                {q.isCorrect === false && (
                  <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
                    Your Answer: {getStudentAnswerText(q.question, q.answer)}
                  </div>
                )}

                {q.question.explanation && (
                  <div className="mt-4">
                    <h3 className="text-lg font-bold border-b pb-2 mb-2">Explanation</h3>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <ContentRenderer content={q.question.explanation} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsScreen;