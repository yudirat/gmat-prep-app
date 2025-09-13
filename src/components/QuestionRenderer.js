import React from 'react';

const QuestionRenderer = ({ question, onSubmit }) => {
  // This is a placeholder. You'll need to implement the rendering of different question formats.
  const handleOptionClick = (isCorrect) => {
    onSubmit(isCorrect);
  };

  return (
    <div>
      <h2>{question.questionText}</h2>
      {question.options.map((option, index) => (
        <button key={index} onClick={() => handleOptionClick(index === question.correctAnswer)}>
          {option}
        </button>
      ))}
    </div>
  );
};

export default QuestionRenderer;
