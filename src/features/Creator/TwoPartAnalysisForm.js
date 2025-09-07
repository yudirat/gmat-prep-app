// This component provides a form for creating two-part analysis questions.
import React from 'react';

/**
 * Component for creating two-part analysis questions.
 * This form allows the creator to define two separate parts of a question, each with its own prompt and options.
 */
export default function TwoPartAnalysisForm({ question, index, onSubQuestionChange }) {
    const part1Options = question.part1Options || [''];
    const part2Options = question.part2Options || [''];
    const correctAnswers = question.correctAnswers || [0, 0];

    // --- Part 1 Handlers ---

    /**
     * Handles changes to the prompt for Part 1.
     * @param {string} value - The new prompt.
     */
    const handlePart1PromptChange = (value) => {
        onSubQuestionChange(index, 'part1Prompt', value);
    };

    /**
     * Handles changes to an option for Part 1.
     * @param {number} optIndex - The index of the option.
     * @param {string} value - The new option value.
     */
    const handlePart1OptionChange = (optIndex, value) => {
        const newOptions = [...part1Options];
        newOptions[optIndex] = value;
        onSubQuestionChange(index, 'part1Options', newOptions);
    };

    /**
     * Adds a new option to Part 1.
     */
    const addPart1Option = () => {
        onSubQuestionChange(index, 'part1Options', [...part1Options, '']);
    };

    /**
     * Removes an option from Part 1.
     * @param {number} optIndex - The index of the option to remove.
     */
    const removePart1Option = (optIndex) => {
        onSubQuestionChange(index, 'part1Options', part1Options.filter((_, i) => i !== optIndex));
    };

    /**
     * Sets the correct answer for Part 1.
     * @param {number} optIndex - The index of the correct answer.
     */
    const handlePart1CorrectAnswerChange = (optIndex) => {
        const newAnswers = [...correctAnswers];
        newAnswers[0] = optIndex;
        onSubQuestionChange(index, 'correctAnswers', newAnswers);
    };

    // --- Part 2 Handlers ---

    /**
     * Handles changes to the prompt for Part 2.
     * @param {string} value - The new prompt.
     */
    const handlePart2PromptChange = (value) => {
        onSubQuestionChange(index, 'part2Prompt', value);
    };

    /**
     * Handles changes to an option for Part 2.
     * @param {number} optIndex - The index of the option.
     * @param {string} value - The new option value.
     */
    const handlePart2OptionChange = (optIndex, value) => {
        const newOptions = [...part2Options];
        newOptions[optIndex] = value;
        onSubQuestionChange(index, 'part2Options', newOptions);
    };

    /**
     * Adds a new option to Part 2.
     */
    const addPart2Option = () => {
        onSubQuestionChange(index, 'part2Options', [...part2Options, '']);
    };

    /**
     * Removes an option from Part 2.
     * @param {number} optIndex - The index of the option to remove.
     */
    const removePart2Option = (optIndex) => {
        onSubQuestionChange(index, 'part2Options', part2Options.filter((_, i) => i !== optIndex));
    };

    /**
     * Sets the correct answer for Part 2.
     * @param {number} optIndex - The index of the correct answer.
     */
    const handlePart2CorrectAnswerChange = (optIndex) => {
        const newAnswers = [...correctAnswers];
        newAnswers[1] = optIndex;
        onSubQuestionChange(index, 'correctAnswers', newAnswers);
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* --- Column 1: Part 1 of the question --- */}
            <div className="p-3 bg-white rounded border">
                <label className="block text-gray-700 text-xs font-bold mb-2">Part 1 Prompt</label>
                <input 
                    type="text" 
                    value={question.part1Prompt || ''} 
                    onChange={e => handlePart1PromptChange(e.target.value)} 
                    className="w-full p-1 border rounded mb-2" 
                />
                <label className="block text-gray-700 text-xs font-bold mb-2">Part 1 Options</label>
                {part1Options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center mb-1">
                        <input 
                            type="radio" 
                            name={`q${index}part1correct`} 
                            checked={correctAnswers[0] === optIndex} 
                            onChange={() => handlePart1CorrectAnswerChange(optIndex)} 
                        />
                        <input 
                            type="text" 
                            value={opt} 
                            onChange={e => handlePart1OptionChange(optIndex, e.target.value)} 
                            className="flex-grow p-1 border rounded mx-2" 
                        />
                        {part1Options.length > 1 && 
                            <button type="button" onClick={() => removePart1Option(optIndex)} className="text-red-400 hover:text-red-600">&times;</button>
                        }
                    </div>
                ))}
                <button type="button" onClick={addPart1Option} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Option</button>
            </div>

            {/* --- Column 2: Part 2 of the question --- */}
            <div className="p-3 bg-white rounded border">
                <label className="block text-gray-700 text-xs font-bold mb-2">Part 2 Prompt</label>
                <input 
                    type="text" 
                    value={question.part2Prompt || ''} 
                    onChange={e => handlePart2PromptChange(e.target.value)} 
                    className="w-full p-1 border rounded mb-2" 
                />
                <label className="block text-gray-700 text-xs font-bold mb-2">Part 2 Options</label>
                {part2Options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center mb-1">
                        <input 
                            type="radio" 
                            name={`q${index}part2correct`} 
                            checked={correctAnswers[1] === optIndex} 
                            onChange={() => handlePart2CorrectAnswerChange(optIndex)} 
                        />
                        <input 
                            type="text" 
                            value={opt} 
                            onChange={e => handlePart2OptionChange(optIndex, e.target.value)} 
                            className="flex-grow p-1 border rounded mx-2" 
                        />
                        {part2Options.length > 1 && 
                            <button type="button" onClick={() => removePart2Option(optIndex)} className="text-red-400 hover:text-red-600">&times;</button>
                        }
                    </div>
                ))}
                <button type="button" onClick={addPart2Option} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Option</button>
            </div>
        </div>
    );
}