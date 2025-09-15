import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ContentRenderer from './ContentRenderer';

const DATA_SUFFICIENCY_OPTIONS = [
  "Statement (1) ALONE is sufficient, but statement (2) ALONE is not sufficient.",
  "Statement (2) ALONE is sufficient, but statement (1) ALONE is not sufficient.",
  "BOTH statements TOGETHER are sufficient, but NEITHER statement ALONE is sufficient.",
  "EACH statement ALONE is sufficient.",
  "Statements (1) and (2) TOGETHER are NOT sufficient."
];

const QuestionRenderer = ({ question, onSubmit }) => {
  const [tpaSelections, setTpaSelections] = useState([null, null]);

  useEffect(() => {
    setTpaSelections([null, null]);
  }, [question]);

  if (!question) {
    return <div>Error: Question data is missing</div>;
  }

  const handleTpaSelection = (partIndex, optionIndex) => {
    const newSelections = [...tpaSelections];
    newSelections[partIndex] = optionIndex;
    setTpaSelections(newSelections);
  };

  const handleTpaSubmit = () => {
    if (tpaSelections[0] !== null && tpaSelections[1] !== null) {
      const isCorrect = tpaSelections[0] === question.correctAnswers[0] && tpaSelections[1] === question.correctAnswers[1];
      onSubmit(isCorrect);
    } else {
      alert("Please select an answer for both columns.");
    }
  };

  if (question.format === 'Two-Part Analysis') {
    return (
      <div className="space-y-4">
        <div className="question-prompt">
          <ContentRenderer content={question.questionText} />
        </div>
        <table className="w-full text-center border">
          <thead>
            <tr>
              <th className="p-2 border">Options</th>
              <th className="p-2 border">{question.part1Prompt || 'Column 1'}</th>
              <th className="p-2 border">{question.part2Prompt || 'Column 2'}</th>
            </tr>
          </thead>
          <tbody>
            {(question.options || []).map((opt, optIndex) => (
              <tr key={optIndex}>
                <td className="p-2 border text-left">{opt}</td>
                <td className="p-2 border">
                  <input 
                    type="radio"
                    name={`part1_selection`}
                    checked={tpaSelections[0] === optIndex}
                    onChange={() => handleTpaSelection(0, optIndex)}
                  />
                </td>
                <td className="p-2 border">
                  <input 
                    type="radio"
                    name={`part2_selection`}
                    checked={tpaSelections[1] === optIndex}
                    onChange={() => handleTpaSelection(1, optIndex)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button 
          onClick={handleTpaSubmit} 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Submit Answer
        </button>
      </div>
    );
  }

  // Handle Data Sufficiency format
  if (question.format === 'Data Sufficiency') {
    return (
      <div className="space-y-4">
        <div className="question-text">
          <ContentRenderer content={question.questionText} />
        </div>
        <div className="statements space-y-3 mt-4">
          <div className="p-3 border rounded-md bg-gray-50"><strong>(1)</strong> <ContentRenderer content={question.statement1} /></div>
          <div className="p-3 border rounded-md bg-gray-50"><strong>(2)</strong> <ContentRenderer content={question.statement2} /></div>
        </div>
        <div className="options-grid grid gap-3 mt-4">
          {DATA_SUFFICIENCY_OPTIONS.map((option, index) => (
            <button
              key={index}
              className="option-button p-3 border rounded text-left hover:bg-gray-100 transition-colors"
              onClick={() => onSubmit(index === question.correctAnswer)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
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
            className="option-button p-3 border rounded hover:bg-gray-100 transition-colors text-left"
            onClick={() => handleOptionClick(index)}
          >
            <ContentRenderer content={option} />
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
