// This file defines the SubQuestionForm component, which is a container for different types of sub-question forms.
import React, { useState } from 'react';
import MCQForm from './MCQForm';
import EitherOrForm from './EitherOrForm';
import TableClassificationForm from './TableClassificationForm';
import TwoPartAnalysisForm from './TwoPartAnalysisForm';
import FillInTheBlankForm from './FillInTheBlankForm';
import BlockEditor from '../../components/BlockEditor';
import QuestionPreviewModal from './QuestionPreviewModal';

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
    dropdowns: [],
    explanation: [{ type: 'text', value: '' }],
    diTags: [],
    tags: [],
};

/**
 * Component that renders a form for a sub-question.
 * It dynamically renders the correct form based on the question format.
 */
export default function SubQuestionForm({ question, index, onSubQuestionChange, onRemove, isRemovable, contentType }) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
        <>
            {isPreviewOpen && (
                <QuestionPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    question={question}
                />
            )}
            <div className="mb-6 p-4 border rounded-lg relative bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-lg">Associated Question {index + 1}</h4>
                    <div>
                        <button type="button" onClick={() => setIsPreviewOpen(true)} className="text-sm text-blue-600 hover:underline mr-4">Preview</button>
                        {isRemovable && <button type="button" onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>}
                    </div>
                </div>
                
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
                    <label className="block text-sm font-bold text-gray-700 mb-2">Explanation</label>
                    <BlockEditor content={question.explanation} onContentChange={value => onSubQuestionChange(index, 'explanation', value)} />
                </div>

                {contentType === 'Data Insights' &&
                    <div className="mt-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tags</label>
                        <div className="flex space-x-4 mt-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={question.diTags?.includes('Math Related')}
                                    onChange={() => {
                                        const newTags = question.diTags?.includes('Math Related')
                                            ? question.diTags.filter(t => t !== 'Math Related')
                                            : [...(question.diTags || []), 'Math Related'];
                                        onSubQuestionChange(index, 'diTags', newTags);
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">Math Related</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={question.diTags?.includes('Non-Math Related')}
                                    onChange={() => {
                                        const newTags = question.diTags?.includes('Non-Math Related')
                                            ? question.diTags.filter(t => t !== 'Non-Math Related')
                                            : [...(question.diTags || []), 'Non-Math Related'];
                                        onSubQuestionChange(index, 'diTags', newTags);
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">Non-Math Related</span>
                            </label>
                        </div>
                    </div>
                }

                {contentType === 'Verbal' &&
                    <div className="mt-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tags</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={question.tags?.includes('Critical Reasoning')}
                                    onChange={() => {
                                        const newTags = question.tags?.includes('Critical Reasoning')
                                            ? question.tags.filter(t => t !== 'Critical Reasoning')
                                            : [...(question.tags || []), 'Critical Reasoning'];
                                        onSubQuestionChange(index, 'tags', newTags);
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">Critical Reasoning</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={question.tags?.includes('Reading Comprehension')}
                                    onChange={() => {
                                        const newTags = question.tags?.includes('Reading Comprehension')
                                            ? question.tags.filter(t => t !== 'Reading Comprehension')
                                            : [...(question.tags || []), 'Reading Comprehension'];
                                        onSubQuestionChange(index, 'tags', newTags);
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">Reading Comprehension</span>
                            </label>
                        </div>
                    </div>
                }

                <div className="mt-4">
                    <label className="block text-gray-700 text-xs font-bold mb-1">Difficulty (1-5)</label>
                    {/* Slider to set the difficulty of the question */}
                    <input type="range" min="1" max="5" value={question.difficulty} onChange={e => onSubQuestionChange(index, 'difficulty', e.target.value)} className="w-full mt-2" />
                    <div className="text-center text-sm">{question.difficulty}</div>
                </div>
            </div>
        </>
    );
}