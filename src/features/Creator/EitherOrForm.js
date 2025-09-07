// This component provides a form for creating "either/or" or "two-option" style questions.
import React from 'react';

/**
 * Component for creating "either/or" or "two-option" style questions.
 * This form allows the creator to define a set of statements, each of which can be classified as one of two options (e.g., True/False).
 */
export default function EitherOrForm({ question, index, onSubQuestionChange }) {
    /**
     * Handles changes to the labels for the two choices.
     * @param {number} labelIndex - The index of the label (0 or 1).
     * @param {string} value - The new label text.
     */
    const handleLabelChange = (labelIndex, value) => {
        const newLabels = [...(question.labels || ['True', 'False'])];
        newLabels[labelIndex] = value;
        onSubQuestionChange(index, 'labels', newLabels);
    };

    /**
     * Handles changes to a statement.
     * @param {number} stmtIndex - The index of the statement.
     * @param {string} value - The new statement text.
     */
    const handleStatementChange = (stmtIndex, value) => {
        const newStatements = [...(question.statements || [''])];
        newStatements[stmtIndex] = value;
        onSubQuestionChange(index, 'statements', newStatements);
    };

    /**
     * Sets the correct answer for a statement.
     * @param {number} stmtIndex - The index of the statement.
     * @param {boolean} value - The correct answer (true for the first label, false for the second).
     */
    const handleAnswerChange = (stmtIndex, value) => {
        const newAnswers = [...(question.correctAnswers || [])];
        newAnswers[stmtIndex] = value;
        onSubQuestionChange(index, 'correctAnswers', newAnswers);
    };

    /**
     * Adds a new statement to the question.
     */
    const addStatement = () => {
        const newStatements = [...(question.statements || []), ''];
        const newAnswers = [...(question.correctAnswers || []), false];
        onSubQuestionChange(index, 'statements', newStatements);
        onSubQuestionChange(index, 'correctAnswers', newAnswers);
    };

    /**
     * Removes a statement from the question.
     * @param {number} stmtIndex - The index of the statement to remove.
     */
    const removeStatement = (stmtIndex) => {
        const newStatements = (question.statements || []).filter((_, i) => i !== stmtIndex);
        const newAnswers = (question.correctAnswers || []).filter((_, i) => i !== stmtIndex);
        onSubQuestionChange(index, 'statements', newStatements);
        onSubQuestionChange(index, 'correctAnswers', newAnswers);
    };

    const labels = question.labels || ['True', 'False'];
    const statements = question.statements || [''];
    const correctAnswers = question.correctAnswers || [];

    return (
        <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1">Choice 1 Label</label>
                    <input 
                        type="text" 
                        value={labels[0]} 
                        onChange={e => handleLabelChange(0, e.target.value)} 
                        className="w-full p-2 border rounded" 
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1">Choice 2 Label</label>
                    <input 
                        type="text" 
                        value={labels[1]} 
                        onChange={e => handleLabelChange(1, e.target.value)} 
                        className="w-full p-2 border rounded" 
                    />
                </div>
            </div>

            <label className="block text-gray-700 text-xs font-bold mb-2">Statements</label>
            {statements.map((stmt, stmtIndex) => (
                <div key={stmtIndex} className="flex items-center space-x-2 mb-2 bg-white p-2 rounded border">
                    <input 
                        type="text" 
                        value={stmt} 
                        onChange={(e) => handleStatementChange(stmtIndex, e.target.value)} 
                        className="flex-grow p-1 border rounded" 
                        placeholder={`Statement ${stmtIndex + 1}`}
                    />
                    <label className="flex items-center space-x-1">
                        <input 
                            type="radio" 
                            name={`q${index}stmt${stmtIndex}`} 
                            checked={correctAnswers[stmtIndex] === true} 
                            onChange={() => handleAnswerChange(stmtIndex, true)}
                        />
                        <span>{labels[0]}</span>
                    </label>
                    <label className="flex items-center space-x-1">
                        <input 
                            type="radio" 
                            name={`q${index}stmt${stmtIndex}`} 
                            checked={correctAnswers[stmtIndex] === false} 
                            onChange={() => handleAnswerChange(stmtIndex, false)}
                        />
                        <span>{labels[1]}</span>
                    </label>
                    {statements.length > 1 && 
                        <button type="button" onClick={() => removeStatement(stmtIndex)} className="text-red-400 hover:text-red-600">&times;</button>
                    }
                </div>
            ))}
            <button type="button" onClick={addStatement} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Statement</button>
        </div>
    );
}