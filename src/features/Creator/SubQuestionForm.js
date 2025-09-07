// This file defines the SubQuestionForm component, which is a container for different types of sub-question forms.
import React from 'react';
import MCQForm from './MCQForm';
import EitherOrForm from './EitherOrForm';
import TableClassificationForm from './TableClassificationForm';
import TwoPartAnalysisForm from './TwoPartAnalysisForm';
import FillInTheBlankForm from './FillInTheBlankForm';

/**
 * A default object for a new sub-question.
 * This is used to initialize the state for a new sub-question.
 */
export const defaultSubQuestion = { 
    questionText: '', 
    format: 'mcq', 
    options: [[{type: 'text', value: ''}], [{type: 'text', value: ''}]], 
    isMultipleCorrect: false,
    correctAnswer: [0], 
    difficulty: 3, 
    statements: [''], 
    labels: ['True', 'False'],
    itemsToClassify: [''], 
    classificationLabels: [''],
    part1Prompt: '', 
    part1Options: [''], 
    part2Prompt: '', 
    part2Options: [''],
    questionParts: [{type: 'text', value: ''}], 
    dropdowns: [{options: [''], correctAnswer: 0}],
};

/**
 * Component that renders a form for a sub-question.
 * It dynamically renders the correct form based on the question format.
 */
export default function SubQuestionForm({ question, index, onSubQuestionChange, onRemove, isRemovable, contentType }) {
    
    /**
     * Renders the appropriate form for the selected question format.
     */
    const renderQuestionFormatForm = () => {
        switch (question.format) {
            case 'mcq':
                return <MCQForm question={question} index={index} onSubQuestionChange={onSubQuestionChange} />;
            case 'either-or':
                return <EitherOrForm question={question} index={index} onSubQuestionChange={onSubQuestionChange} />;
            case 'table-classification':
                return <TableClassificationForm question={question} index={index} onSubQuestionChange={onSubQuestionChange} />;
            case 'two-part-analysis':
                return <TwoPartAnalysisForm question={question} index={index} onSubQuestionChange={onSubQuestionChange} />;
            case 'fill-in-the-blank':
                return <FillInTheBlankForm question={question} index={index} onSubQuestionChange={onSubQuestionChange} />;
            default:
                return null;
        }
    };

    return (
        <div className="mb-6 p-4 border rounded-lg relative bg-gray-50">
            <h4 className="font-semibold text-lg mb-4">Associated Question {index + 1}</h4>
            {isRemovable && <button type="button" onClick={() => onRemove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-2xl">&times;</button>}
            
            <div className="mb-4">
                <label className="block text-gray-700 text-xs font-bold mb-1">Question Format</label>
                {/* Dropdown to select the question format */}
                <select value={question.format} onChange={e => onSubQuestionChange(index, 'format', e.target.value)} className="w-full p-2 border rounded">
                    <option value="mcq">Multiple Choice</option>
                    {contentType === 'Data Insights' && <option value="fill-in-the-blank">Fill-in-the-Blank</option>}
                    <option value="either-or">Two-Option Statements</option>
                    <option value="table-classification">Table Classification</option>
                    <option value="two-part-analysis">Two-Part Analysis</option>
                </select>
            </div>

            {renderQuestionFormatForm()}

            <div className="mt-4">
                <label className="block text-gray-700 text-xs font-bold mb-1">Difficulty (1-5)</label>
                {/* Slider to set the difficulty of the question */}
                <input type="range" min="1" max="5" value={question.difficulty} onChange={e => onSubQuestionChange(index, 'difficulty', e.target.value)} className="w-full mt-2" />
                <div className="text-center text-sm">{question.difficulty}</div>
            </div>
        </div>
    );
}