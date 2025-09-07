// This component provides a form for creating multiple-choice questions.
import React from 'react';
import BlockEditor from '../../components/BlockEditor';

/**
 * Component for creating multiple-choice questions.
 * This form allows the creator to define a question prompt, a list of options, and select the correct answer(s).
 */
export default function MCQForm({ question, index, onSubQuestionChange }) {
    const options = question.options || [];
    const correctAnswer = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];

    /**
     * Handles changes to an option.
     * @param {number} optIndex - The index of the option.
     * @param {object} newContent - The new content of the option.
     */
    const handleOptionChange = (optIndex, newContent) => {
        const newOptions = [...options];
        newOptions[optIndex] = newContent;
        onSubQuestionChange(index, 'options', newOptions);
    };

    /**
     * Adds a new option to the question.
     */
    const handleAddOption = () => {
        const newOptions = [...options, [{ type: 'text', value: '' }]];
        onSubQuestionChange(index, 'options', newOptions);
    };

    /**
     * Removes an option from the question.
     * @param {number} optIndex - The index of the option to remove.
     */
    const handleRemoveOption = (optIndex) => {
        const newOptions = options.filter((_, i) => i !== optIndex);
        onSubQuestionChange(index, 'options', newOptions);
    };
    
    /**
     * Handles changes to the correct answer.
     * @param {number} optIndex - The index of the selected answer.
     */
    const handleCorrectAnswerChange = (optIndex) => {
        if (question.isMultipleCorrect) {
            const newAnswers = correctAnswer.includes(optIndex)
                ? correctAnswer.filter(i => i !== optIndex)
                : [...correctAnswer, optIndex];
            onSubQuestionChange(index, 'correctAnswer', newAnswers.sort((a,b) => a - b));
        } else {
            onSubQuestionChange(index, 'correctAnswer', [optIndex]);
        }
    };

    return (
        <>
            <div className="mb-4">
                <label className="block text-gray-700 text-xs font-bold mb-1">Question Prompt / Text</label>
                {/* Editor for the question prompt */}
                <BlockEditor 
                    content={Array.isArray(question.questionText) ? question.questionText : [{type: 'text', value: question.questionText || ''}]}
                    onContentChange={(newContent) => onSubQuestionChange(index, 'questionText', newContent)}
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-xs font-bold mb-1">Options</label>
                <div className="flex items-center space-x-2 mb-4">
                    <input type="checkbox" id={`multipleCorrect-${index}`} checked={question.isMultipleCorrect || false} onChange={e => onSubQuestionChange(index, 'isMultipleCorrect', e.target.checked)} />
                    <label htmlFor={`multipleCorrect-${index}`}>Allow Multiple Correct Answers</label>
                </div>
                {options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-start space-x-2 mb-4">
                        <input 
                            type={question.isMultipleCorrect ? 'checkbox' : 'radio'} 
                            name={`correct-answer-${index}`} 
                            checked={correctAnswer.includes(optIndex)} 
                            onChange={() => handleCorrectAnswerChange(optIndex)}
                            className="mt-2"
                        />
                        <div className="flex-grow">
                           <BlockEditor content={opt} onContentChange={(newContent) => handleOptionChange(optIndex, newContent)} />
                        </div>
                        {options.length > 1 && <button type="button" onClick={() => handleRemoveOption(optIndex)} className="text-red-500 font-bold text-xl mt-1">&times;</button>}
                    </div>
                ))}
                <button type="button" onClick={handleAddOption} className="text-indigo-600 font-semibold mt-2">+ Add Option</button>
            </div>
        </>
    );
}