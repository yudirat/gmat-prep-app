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


  // Function to validate a question's structure
  const isValidQuestion = useCallback((question) => {
    return question &&
           typeof question === 'object' &&
           'id' in question &&
           'difficulty' in question &&
           typeof question.difficulty === 'number' &&
           question.difficulty >= 1 &&
           question.difficulty <= 5 &&
           'section' in question &&
           typeof question.section === 'string';
  }, []);

  // Function to select the next adaptive question
  const getNextAdaptiveQuestion = useCallback((difficulty) => {
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
      console.error('Invalid difficulty value:', difficulty);
      difficulty = 3; // Fall back to medium difficulty
    }

    let difficultyToTry = difficulty;
    let attempts = 0;
    const maxAttempts = 5;
    const seenDifficulties = new Set();

    while (attempts < maxAttempts) {
      if (!Array.isArray(sectionQuestions)) {
        console.error('Invalid sectionQuestions:', sectionQuestions);
        return null;
      }

      const potentialQuestions = sectionQuestions.filter(q => 
        isValidQuestion(q) &&
        q.difficulty === difficultyToTry && 
        !answeredQuestionIds.has(q.id)
      );

      if (potentialQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * potentialQuestions.length);
        const selectedQuestion = potentialQuestions[randomIndex];
        
        // Final validation of selected question
        if (!isValidQuestion(selectedQuestion)) {
          console.error('Selected question failed validation:', selectedQuestion);
          continue;
        }
        
        return selectedQuestion;
      }

      seenDifficulties.add(difficultyToTry);

      // Smarter fallback logic
      const availableDifficulties = [1, 2, 3, 4, 5].filter(d => !seenDifficulties.has(d));
      if (availableDifficulties.length === 0) {
        console.warn('No more difficulties to try');
        break;
      }

      // Find the closest available difficulty
      difficultyToTry = availableDifficulties.reduce((closest, current) => 
        Math.abs(current - difficulty) < Math.abs(closest - difficulty) ? current : closest
      );
      
      attempts++;
    }

    console.warn(`Failed to find question after ${maxAttempts} attempts`);
    return null;
  }, [sectionQuestions, answeredQuestionIds, isValidQuestion]);


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

  const calculateScore = useCallback((finalAnswers) => {
    if (!Array.isArray(finalAnswers)) {
      console.error('Invalid finalAnswers:', finalAnswers);
      return 60; // Default score for invalid input
    }

    if (finalAnswers.length === 0) {
      console.warn('No answers provided for scoring');
      return 60;
    }

    try {
      // Validate each answer before processing
      const validAnswers = finalAnswers.filter(answer => 
        answer &&
        typeof answer === 'object' &&
        'isCorrect' in answer &&
        typeof answer.isCorrect === 'boolean' &&
        'difficulty' in answer &&
        typeof answer.difficulty === 'number' &&
        answer.difficulty >= 1 &&
        answer.difficulty <= 5
      );

      if (validAnswers.length === 0) {
        console.error('No valid answers found in:', finalAnswers);
        return 60;
      }

      const rawScore = validAnswers
        .filter(a => a.isCorrect)
        .reduce((sum, a) => sum + a.difficulty, 0);

      const maxRawScore = validAnswers
        .reduce((sum, a) => sum + a.difficulty, 0);

      if (maxRawScore === 0) {
        console.warn('All answers have zero difficulty');
        return 60;
      }

      const percentageScore = rawScore / maxRawScore;
      const scaledScore = Math.round(60 + (percentageScore * 30));

      // Ensure score is within valid range
      return Math.max(60, Math.min(90, scaledScore));
    } catch (error) {
      console.error('Error calculating score:', error);
      return 60;
    }
  }, []);

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


  const handleAnswerSubmit = useCallback((isCorrect) => {
    if (typeof isCorrect !== 'boolean') {
      console.error('Invalid answer submission:', isCorrect);
      return;
    }

    if (!currentQuestion) {
      console.error('No current question to answer');
      return;
    }

    try {
      // 1. Update difficulty based on the answer
      const nextDifficulty = isCorrect
        ? Math.min(5, currentDifficulty + 1) // Increase difficulty, max 5
        : Math.max(1, currentDifficulty - 1); // Decrease difficulty, min 1
      setCurrentDifficulty(nextDifficulty);

      // 2. Record the answered question with validation
      const answeredQuestion = {
        ...currentQuestion,
        answeredCorrectly: isCorrect,
        answeredAt: new Date().toISOString()
      };

      const newAnsweredQuestions = [...answeredQuestions, answeredQuestion];
      setAnsweredQuestions(newAnsweredQuestions);

      // 3. Check if the section is complete
      const requiredQuestionCount = getSectionQuestionCount(section);
      if (!requiredQuestionCount) {
        console.error('Invalid section:', section);
        endSection(newAnsweredQuestions);
        return;
      }

      if (newAnsweredQuestions.length >= requiredQuestionCount) {
        endSection(newAnsweredQuestions);
        return;
      }

      // 4. Find and set the next question
      const nextQuestion = getNextAdaptiveQuestion(nextDifficulty);
      
      if (nextQuestion) {
        if (!nextQuestion.id) {
          console.error('Next question missing ID:', nextQuestion);
          endSection(newAnsweredQuestions);
          return;
        }
        setCurrentQuestion(nextQuestion);
        setAnsweredQuestionIds(prevIds => new Set([...prevIds, nextQuestion.id]));
      } else {
        console.warn('No more questions available');
        endSection(newAnsweredQuestions);
      }
    } catch (error) {
      console.error('Error handling answer submission:', error);
      endSection(answeredQuestions); // End section with existing answers
    }
  }, [currentQuestion, currentDifficulty, answeredQuestions, section, getNextAdaptiveQuestion, endSection]);


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