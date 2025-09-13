import React, { useState, useEffect, useCallback } from 'react';
import QuestionRenderer from '../../components/QuestionRenderer';

const TestTaker = ({ section, onFinishSection, allQuestions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [currentDifficulty, setCurrentDifficulty] = useState(3); // Start at Medium difficulty
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState(new Set()); // Track seen questions
  const [sectionQuestions, setSectionQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
  const [isTestStarted, setIsTestStarted] = useState(false);


  // Memoize the filtering of questions to prevent re-calculation on every render
  useEffect(() => {
    const filteredQuestions = allQuestions.filter(q => q.section === section);
    setSectionQuestions(filteredQuestions);
    setIsTestStarted(true);
  }, [allQuestions, section]);


  // Function to select the next adaptive question
  const getNextAdaptiveQuestion = useCallback((difficulty) => {
    let difficultyToTry = difficulty;
    let attempts = 0;

    while (attempts < 5) { // Try 5 times to find a question (up/down difficulty)
        const potentialQuestions = sectionQuestions.filter(
            (q) => q.difficulty === difficultyToTry && !answeredQuestionIds.has(q.id)
        );

        if (potentialQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * potentialQuestions.length);
            return potentialQuestions[randomIndex];
        }

        // Fallback logic: if no questions found, try a different difficulty
        if (attempts % 2 === 0) {
            difficultyToTry = Math.max(1, difficultyToTry - (attempts + 1));
        } else {
            difficultyToTry = Math.min(5, difficultyToTry + (attempts + 1));
        }
        attempts++;
    }
    return null; // Return null if no suitable question is found after fallbacks
  }, [sectionQuestions, answeredQuestionIds]);


  // Set the initial question when the component mounts
  useEffect(() => {
    if (sectionQuestions.length > 0) {
        const firstQuestion = getNextAdaptiveQuestion(3); // Start with a medium question
        setCurrentQuestion(firstQuestion);
        if (firstQuestion) {
            setAnsweredQuestionIds(prevIds => new Set(prevIds).add(firstQuestion.id));
        }
    }
  }, [sectionQuestions, getNextAdaptiveQuestion]);

  const calculateScore = (finalAnswers) => {
      if(finalAnswers.length === 0) return 60;
      
      const rawScore = finalAnswers
          .filter(a => a.isCorrect)
          .reduce((sum, a) => sum + a.difficulty, 0);

      const maxRawScore = finalAnswers
          .reduce((sum, a) => sum + a.difficulty, 0);
      
      if (maxRawScore === 0) return 60;

      const percentageScore = rawScore / maxRawScore;
      const scaledScore = Math.round(60 + (percentageScore * 30));

      return scaledScore;
  };

  const endSection = useCallback((finalAnswers) => {
      if (!isTestStarted) return;
      setIsTestStarted(false);
      onFinishSection({ 
          answers: finalAnswers, 
          score: calculateScore(finalAnswers), 
          timeTaken: (45 * 60) - timeLeft, 
          testType: section
      });
  }, [isTestStarted, onFinishSection, timeLeft, section, answeredQuestions]);

  // Effect for the test timer
  useEffect(() => {
      const timer = setInterval(() => { if (isTestStarted) setTimeLeft(prev => prev > 0 ? prev - 1 : 0); }, 1000);
      if (timeLeft === 0 && isTestStarted) endSection(answeredQuestions);
      return () => clearInterval(timer);
  }, [isTestStarted, timeLeft, endSection, answeredQuestions]);


  const handleAnswerSubmit = (isCorrect) => {
    // 1. Update difficulty based on the answer
    const nextDifficulty = isCorrect
      ? Math.min(5, currentDifficulty + 1) // Increase difficulty, max 5
      : Math.max(1, currentDifficulty - 1); // Decrease difficulty, min 1
    setCurrentDifficulty(nextDifficulty);

    // 2. Record the answered question
    const newAnsweredQuestions = [...answeredQuestions, { ...currentQuestion, answeredCorrectly: isCorrect }];
    setAnsweredQuestions(newAnsweredQuestions);


    // 3. Check if the section is complete (e.g., based on a fixed number of questions)
    if (newAnsweredQuestions.length >= getSectionQuestionCount(section)) { // Assuming a utility function
      endSection(newAnsweredQuestions);
      return;
    }


    // 4. Find and set the next question
    const nextQuestion = getNextAdaptiveQuestion(nextDifficulty);
    setCurrentQuestion(nextQuestion);

    if(nextQuestion) {
        setAnsweredQuestionIds(prevIds => new Set(prevIds).add(nextQuestion.id));
    } else {
        // Handle case where there are no more questions to serve
        endSection(newAnsweredQuestions);
    }
  };


  if (!currentQuestion) {
    return <div>Loading question... or Section Complete!</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow">
          <div className="text-lg font-semibold">{section} Section</div>
          <div className="text-lg font-mono bg-gray-200 px-3 py-1 rounded">{Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}</div>
          <div className="text-lg">Question {answeredQuestions.length + 1} / {getSectionQuestionCount(section)}</div>
      </div>
      <QuestionRenderer
        question={currentQuestion}
        onSubmit={handleAnswerSubmit}
      />
    </div>
  );
};

// Helper function to define how many questions are in each section
const getSectionQuestionCount = (section) => {
    switch(section) {
        case 'Quantitative': return 21;
        case 'Verbal': return 23;
        case 'Data Insights': return 20;
        default: return 20; // Default or for practice sessions
    }
}

export default TestTaker;