// This component is used to create and edit Quantitative and Data Insights Multiple Choice Questions.
import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import QuestionSelectorModal from './QuestionSelectorModal';
import QuestionPreviewModal from './QuestionPreviewModal';
import BlockEditor from '../../components/BlockEditor';

/**
 * Component for creating and editing Quantitative and Data Insights Multiple Choice Questions.
 */
export default function QuantMCQCreator({ user, onSave, initialData = null, type = 'Quant', allQuestions }) {
    // State for question categories, text, options, and correct answer
    const [quantCategories, setQuantCategories] = useState([]);
    const [questionText, setQuestionText] = useState([{ type: 'text', value: '' }]);
    const [options, setOptions] = useState([[{type: 'text', value: ''}], [{type: 'text', value: ''}]]);
    const [isMultipleCorrect, setIsMultipleCorrect] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState([]);
    const [difficulty, setDifficulty] = useState(3);

    // State for form submission and UI feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Available categories for Quantitative questions
    const quantCategoryOptions = ['Arithmetic', 'Algebra', 'Geometry', 'Word Problems'];

    // Effect to populate the form when editing an existing question
    useEffect(() => {
        if (initialData) {
            const parseContent = (content) => {
                if (typeof content === 'string') {
                    try { return JSON.parse(content); } catch (e) { return [{ type: 'text', value: content }]; }
                }
                return Array.isArray(content) ? content : [{ type: 'text', value: '' }];
            };

            setQuantCategories(initialData.categories || []);
            setQuestionText(parseContent(initialData.questionText));
            setOptions((initialData.options || []).map(opt => parseContent(opt)));
            setIsMultipleCorrect(initialData.isMultipleCorrect || false);
            setCorrectAnswer(Array.isArray(initialData.correctAnswer) ? initialData.correctAnswer : [initialData.correctAnswer]);
            setDifficulty(initialData.difficulty || 3);
        }
    }, [initialData]);

    /**
     * Resets the form to its initial state.
     */
    const resetForm = () => {
        setQuestionText([{ type: 'text', value: '' }]);
        setOptions([[{type: 'text', value: ''}], [{type: 'text', value: ''}]]);
        setCorrectAnswer([]);
        setDifficulty(3);
        setQuantCategories([]);
        setIsMultipleCorrect(false);
    };

    /**
     * Adds a new option to the question.
     */
    const handleAddOption = () => {
        setOptions([...options, [{ type: 'text', value: '' }]]);
    };

    /**
     * Removes an option from the question.
     * @param {number} index - The index of the option to remove.
     */
    const handleRemoveOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        const newCorrectAnswer = correctAnswer.filter(ans => ans < newOptions.length);
        setCorrectAnswer(newCorrectAnswer);
    };

    /**
     * Handles changes to the content of an option.
     * @param {number} index - The index of the option.
     * @param {object} newContent - The new content of the option.
     */
    const handleOptionChange = (index, newContent) => {
        const newOptions = [...options];
        newOptions[index] = newContent;
        setOptions(newOptions);
    };

    /**
     * Handles changes to the correct answer.
     * @param {number} index - The index of the selected answer.
     */
    const handleCorrectAnswerChange = (index) => {
        if (isMultipleCorrect) {
            const newAnswers = correctAnswer.includes(index)
                ? correctAnswer.filter(i => i !== index)
                : [...correctAnswer, index];
            setCorrectAnswer(newAnswers.sort((a,b) => a - b));
        } else {
            setCorrectAnswer([index]);
        }
    };

    /**
     * Handles changes to the quantitative categories.
     * @param {string} category - The selected category.
     */
    const handleQuantCategoryChange = (category) => {
        setQuantCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    };
    
    /**
     * Populates the form with the data of an existing question.
     * @param {object} question - The question to copy.
     */
    const handleQuestionSelect = (question) => {
        // This helper function ensures content is always in the correct array format
        const parseContent = (content) => {
            if (typeof content === 'string') {
                try { 
                    return JSON.parse(content); 
                } catch (e) { 
                    return [{ type: 'text', value: content }]; 
                }
            }
            return Array.isArray(content) ? content : [{ type: 'text', value: '' }];
        };
        
        setQuantCategories(question.categories || []);
        setQuestionText(parseContent(question.questionText)); // Parse the question text
        setOptions((question.options || []).map(opt => parseContent(opt))); // Parse each option
        setIsMultipleCorrect(question.isMultipleCorrect || false);
        setCorrectAnswer(Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]);
        setDifficulty(question.difficulty || 3);
    };

    /**
     * Handles the form submission.
     * Saves or updates the question in Firestore.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        const questionData = {
            creatorId: user.uid,
            type: type,
            difficulty: Number(difficulty),
            format: 'mcq',
            // Stringify the question text blocks
            questionText: JSON.stringify(questionText), 
            // Map over the options and stringify the blocks for each one
            options: options.map(optionContent => JSON.stringify(optionContent)), 
            correctAnswer: isMultipleCorrect ? correctAnswer : correctAnswer[0],
            isMultipleCorrect,
            categories: type === 'Quant' ? quantCategories : [],
        };

        try {
            if (initialData) {
                const questionRef = doc(db, `artifacts/${appId}/public/data/questions`, initialData.id);
                await updateDoc(questionRef, questionData);
                setSuccess("Question updated successfully!");
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/questions`), questionData);
                setSuccess("Question added successfully!");
            }
            setTimeout(() => onSave(), 1000);
        } catch (err) {
            setError("Failed to save content. Please try again.");
            console.error(err);
        }
        setIsSubmitting(false);
    };

    /**
     * Assembles the current question state for previewing.
     * @returns {object} The current question state.
     */
    const getCurrentQuestionState = () => ({
        questionText,
        options,
        correctAnswer,
        difficulty,
        type,
        categories: type === 'Quant' ? quantCategories : [],
        isMultipleCorrect
    });

    return (
        <>
            {/* Modal for selecting an existing question to copy */}
            {isSelectorOpen && (
                <QuestionSelectorModal 
                    isOpen={isSelectorOpen}
                    onClose={() => setIsSelectorOpen(false)}
                    questions={allQuestions}
                    onQuestionSelect={handleQuestionSelect}
                />
            )}
            {/* Modal for previewing the question */}
            {isPreviewOpen && (
                <QuestionPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    question={getCurrentQuestionState()}
                />
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                {!initialData && (
                    <div className="text-right">
                        <button type="button" onClick={() => setIsSelectorOpen(true)} className="text-sm text-indigo-600 hover:underline">
                            Copy Existing Question...
                        </button>
                    </div>
                )}

                {/* Category selection for Quantitative questions */}
                {type === 'Quant' && 
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Categories</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {quantCategoryOptions.map(cat => (
                                <label key={cat} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={quantCategories.includes(cat)} onChange={() => handleQuantCategoryChange(cat)} className="rounded text-indigo-600 focus:ring-indigo-500"/>
                                    <span>{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                }
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Question Text</label>
                    <BlockEditor content={questionText} onContentChange={setQuestionText} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Options</label>
                    <div className="flex items-center space-x-2 mb-4">
                        <input type="checkbox" id="multipleCorrect" checked={isMultipleCorrect} onChange={e => { setIsMultipleCorrect(e.target.checked); setCorrectAnswer([]); }} />
                        <label htmlFor="multipleCorrect">Allow Multiple Correct Answers</label>
                    </div>
                    {options.map((opt, index) => (
                        <div key={index} className="flex items-start space-x-2 mb-4">
                             <input 
                                type={isMultipleCorrect ? 'checkbox' : 'radio'} 
                                name="correctAnswer" 
                                checked={correctAnswer.includes(index)} 
                                onChange={() => handleCorrectAnswerChange(index)}
                                className="mt-2"
                            />
                            <div className="flex-grow">
                                <BlockEditor content={opt} onContentChange={(newContent) => handleOptionChange(index, newContent)} />
                            </div>
                            {options.length > 2 && <button type="button" onClick={() => handleRemoveOption(index)} className="text-red-500 font-bold text-xl mt-1">&times;</button>}
                        </div>
                    ))}
                    <button type="button" onClick={handleAddOption} className="text-indigo-600 font-semibold mt-2">+ Add Option</button>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty (1-5)</label>
                    <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full" />
                    <div className="text-center">{difficulty}</div>
                </div>
                <hr className="my-8"/>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}
                <div className="flex space-x-4">
                    <button type="button" onClick={onSave} className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={() => setIsPreviewOpen(true)} className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600">
                        Preview
                    </button>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 text-lg">
                        {isSubmitting ? 'Saving...' : (initialData ? 'Update Question' : 'Add Question to Bank')}
                    </button>
                </div>
            </form>
        </>
    );
}