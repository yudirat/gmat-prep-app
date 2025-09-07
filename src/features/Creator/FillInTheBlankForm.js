// This component provides a form for creating fill-in-the-blank questions.
import React from 'react';

/**
 * Component for creating fill-in-the-blank questions.
 * This form allows the creator to build a question with a mix of text and dropdowns.
 */
export default function FillInTheBlankForm({ question, index, onSubQuestionChange }) {
    const questionParts = question.questionParts || [{ type: 'text', value: '' }];
    const dropdowns = question.dropdowns || [];

    // --- Part Handlers ---

    /**
     * Handles changes to a text part of the question.
     * @param {number} partIndex - The index of the part.
     * @param {string} value - The new text value.
     */
    const handlePartChange = (partIndex, value) => {
        const newParts = [...questionParts];
        newParts[partIndex].value = value;
        onSubQuestionChange(index, 'questionParts', newParts);
    };

    /**
     * Adds a new part (text or dropdown) to the question.
     * @param {number} partIndex - The index after which to add the new part.
     * @param {string} type - The type of part to add ('text' or 'dropdown').
     */
    const addPart = (partIndex, type) => {
        const newParts = [...questionParts];
        if (type === 'dropdown') {
            const newDropdowns = [...dropdowns, { options: [''], correctAnswer: 0 }];
            newParts.splice(partIndex + 1, 0, { type: 'dropdown', value: dropdowns.length });
            onSubQuestionChange(index, 'dropdowns', newDropdowns);
        } else {
            newParts.splice(partIndex + 1, 0, { type: 'text', value: '' });
        }
        onSubQuestionChange(index, 'questionParts', newParts);
    };

    /**
     * Removes a part from the question.
     * @param {number} partIndex - The index of the part to remove.
     */
    const removePart = (partIndex) => {
        if (questionParts.length <= 1) return; // Cannot remove the last part
        const newParts = questionParts.filter((_, i) => i !== partIndex);
        onSubQuestionChange(index, 'questionParts', newParts);
    };

    // --- Dropdown Handlers ---

    /**
     * Handles changes to a dropdown option.
     * @param {number} dropdownIndex - The index of the dropdown.
     * @param {number} optionIndex - The index of the option.
     * @param {string} value - The new option value.
     */
    const handleDropdownOptionChange = (dropdownIndex, optionIndex, value) => {
        const newDropdowns = [...dropdowns];
        newDropdowns[dropdownIndex].options[optionIndex] = value;
        onSubQuestionChange(index, 'dropdowns', newDropdowns);
    };

    /**
     * Adds a new option to a dropdown.
     * @param {number} dropdownIndex - The index of the dropdown.
     */
    const addDropdownOption = (dropdownIndex) => {
        const newDropdowns = [...dropdowns];
        newDropdowns[dropdownIndex].options.push('');
        onSubQuestionChange(index, 'dropdowns', newDropdowns);
    };

    /**
     * Removes an option from a dropdown.
     * @param {number} dropdownIndex - The index of the dropdown.
     * @param {number} optionIndex - The index of the option to remove.
     */
    const removeDropdownOption = (dropdownIndex, optionIndex) => {
        const newDropdowns = [...dropdowns];
        if (newDropdowns[dropdownIndex].options.length > 1) {
            newDropdowns[dropdownIndex].options.splice(optionIndex, 1);
            onSubQuestionChange(index, 'dropdowns', newDropdowns);
        }
    };

    /**
     * Sets the correct answer for a dropdown.
     * @param {number} dropdownIndex - The index of the dropdown.
     * @param {number} optionIndex - The index of the correct answer.
     */
    const setDropdownCorrectAnswer = (dropdownIndex, optionIndex) => {
        const newDropdowns = [...dropdowns];
        newDropdowns[dropdownIndex].correctAnswer = optionIndex;
        onSubQuestionChange(index, 'dropdowns', newDropdowns);
    };

    return (
        <div className="p-3 bg-white rounded border">
            <label className="block text-gray-700 text-xs font-bold mb-2">Question Builder</label>
            <div className="flex flex-wrap items-start gap-2">
                {questionParts.map((part, partIndex) => (
                    <div key={partIndex} className="flex items-center gap-1">
                        {part.type === 'text' ? (
                            <input 
                                type="text" 
                                value={part.value} 
                                onChange={e => handlePartChange(partIndex, e.target.value)} 
                                className="p-1 border rounded" 
                                placeholder="Enter text..."
                            />
                        ) : (
                            <div className="p-2 border border-dashed border-indigo-400 rounded bg-indigo-50">
                                <p className="text-xs font-semibold">Dropdown {part.value + 1}</p>
                                {(dropdowns[part.value]?.options || []).map((opt, optIndex) => (
                                    <div key={optIndex} className="flex items-center my-1">
                                        <input 
                                            type="radio" 
                                            name={`q${index}dd${part.value}`} 
                                            checked={dropdowns[part.value]?.correctAnswer === optIndex} 
                                            onChange={() => setDropdownCorrectAnswer(part.value, optIndex)} 
                                        />
                                        <input 
                                            type="text" 
                                            value={opt} 
                                            onChange={e => handleDropdownOptionChange(part.value, optIndex, e.target.value)} 
                                            className="flex-grow p-1 border rounded mx-2 text-sm" 
                                        />
                                        <button type="button" onClick={() => removeDropdownOption(part.value, optIndex)} className="text-red-400 hover:text-red-600 text-xs">&times;</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addDropdownOption(part.value)} className="text-xs text-indigo-600 hover:text-indigo-800">+ Add Option</button>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <button type="button" onClick={() => removePart(partIndex)} title="Remove Part" className="text-gray-400 hover:text-red-500 text-lg">&minus;</button>
                            <button type="button" onClick={() => addPart(partIndex, 'text')} title="Add Text Part" className="text-gray-400 hover:text-green-500 text-lg">+</button>
                            <button type="button" onClick={() => addPart(partIndex, 'dropdown')} title="Add Dropdown" className="text-gray-400 hover:text-indigo-500 text-lg">&#9662;</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}