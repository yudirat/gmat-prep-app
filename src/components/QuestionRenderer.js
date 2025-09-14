import React from 'react';
import PropTypes from 'prop-types';
import ContentRenderer from './ContentRenderer';

const QuestionRenderer = ({ question, onSubmit }) => {
  if (!question) {
    return <div>Error: Question data is missing</div>;
  }

  const handleOptionClick = (optionIndex) => {
    if (typeof onSubmit !== 'function') {
      console.error('onSubmit handler is not a function');
      return;
    }

    // Validate the correctAnswer value
    if (typeof question.correctAnswer !== 'number' || 
        question.correctAnswer < 0 || 
        question.correctAnswer >= (question.options?.length || 0)) {
      console.error('Invalid correctAnswer value in question data');
      return;
    }

    onSubmit(optionIndex === question.correctAnswer);
  };

  // Validate required question properties
  if (!question.questionText || !Array.isArray(question.options) || question.options.length === 0) {
    return <div>Error: Invalid question format</div>;
  }

  return (
    <div className="space-y-4">
      <div className="question-text">
        <ContentRenderer content={question.questionText} />
      </div>
      <div className="options-grid grid gap-3">
        {question.options.map((option, index) => (
          <button
            key={option.id || index}
            className="option-button p-3 border rounded hover:bg-gray-100 transition-colors"
            onClick={() => handleOptionClick(index)}
          >
            {typeof option === 'string' ? option : 
             option.text ? <ContentRenderer content={option.text} /> : 
             'Invalid option format'}
          </button>
        ))}
      </div>
    </div>
  );
};

QuestionRenderer.propTypes = {
  question: PropTypes.shape({
    questionText: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.object)
    ]).isRequired,
    options: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        text: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.arrayOf(PropTypes.object)
        ])
      })
    ])).isRequired,
    correctAnswer: PropTypes.number.isRequired
  }).isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default QuestionRenderer;
