// src/features/Practice/PracticeQuiz.js

import React, { useState, useEffect, useRef } from 'react'; // 1. Add useEffect, useRef
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useUser } from '../../contexts/UserContext';
import QuestionRenderer from '../../components/QuestionRenderer';

const PracticeQuiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const questions = location.state?.questions || [];
  const quizTags = location.state?.tags || []; // Get the tags used for this quiz
  const quizSection = location.state?.section || 'N/A'; // Get the section

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isQuizOver, setIsQuizOver] = useState(false);
  const [startTime, setStartTime] = useState(Date.now()); // 2. State to track start time of a question

  const handleAnswerSubmit = async (isCorrect) => {
    const timeSpent = (Date.now() - startTime) / 1000; // 3. Calculate time in seconds
    const answeredQuestion = questions[currentQuestionIndex];
    
    // 4. Add timeSpent to the answer record
    const newAnswers = [...userAnswers, { questionId: answeredQuestion.id, isCorrect, timeSpent }];
    setUserAnswers(newAnswers);

    if (currentQuestionIndex + 1 >= questions.length) {
      // --- This is the new logic to save results ---
      const correctCount = newAnswers.filter(ans => ans.isCorrect).length;
      const totalCount = questions.length;
      const scorePercent = (correctCount / totalCount) * 100;

      const sessionData = {
        userId: user.uid,
        timestamp: serverTimestamp(),
        section: quizSection,
        tags: quizTags,
        score: scorePercent,
        correctAnswers: correctCount,
        totalQuestions: totalCount,
        questionsAttempted: newAnswers, // This now includes timeSpent for each question
      };

      try {
        await addDoc(collection(db, 'practice_sessions'), sessionData);
      } catch (error) {
        console.error("Error saving practice session: ", error);
        // Optionally, inform the user that results couldn't be saved.
      }
      
      setIsQuizOver(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setStartTime(Date.now()); // 5. Reset timer for the next question
    }
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">No questions found for this quiz.</h2>
        <button onClick={() => navigate('/practice')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Back to Practice Hub
        </button>
      </div>
    );
  }

  if (isQuizOver) {
    const correctAnswers = userAnswers.filter(ans => ans.isCorrect).length;
    const totalQuestions = questions.length;
    const score = ((correctAnswers / totalQuestions) * 100).toFixed(2);

    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Quiz Complete!</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-lg">Your Score:</p>
          <p className="text-5xl font-bold my-2 text-green-600">{score}%</p>
          <p className="text-gray-600">You answered {correctAnswers} out of {totalQuestions} questions correctly.</p>
          <button onClick={() => navigate('/practice')} className="mt-6 w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600">
            Create Another Practice Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Practice Quiz</h2>
        <span className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</span>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <QuestionRenderer
          question={currentQuestion}
          onSubmit={handleAnswerSubmit}
        />
      </div>
    </div>
  );
};

export default PracticeQuiz;