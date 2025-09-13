// This component is used to create and edit Quantitative and Data Insights Multiple Choice Questions.
import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc, Timestamp, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { GMAT_TOPICS } from '../../constants/gmatTopics';
import QuestionSelectorModal from './QuestionSelectorModal';
import QuestionPreviewModal from './QuestionPreviewModal';
import BlockEditor from '../../components/BlockEditor';

/**
 * Component for creating and editing Quantitative and Data Insights Multiple Choice Questions.
 */
export default function QuantMCQCreator({ user, onSave, initialData = null, type = 'Quant', allQuestions }) {
    // State for question categories, text, options, and correct answer
    const [selectedTags, setSelectedTags] = useState([]);
    const [questionText, setQuestionText] = useState([{ type: 'text', value: '' }]);
    const [options, setOptions] = useState([[{type: 'text', value: ''}], [{type: 'text', value: ''}]]);
    const [isMultipleCorrect, setIsMultipleCorrect] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState([]);
    const [difficulty, setDifficulty] = useState(3);

    // State for form submission and UI feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [isEditingCopy, setIsEditingCopy] = useState(false);

    // Available categories for Quantitative questions
    const quantCategoryOptions = ['Arithmetic', 'Algebra', 'Geometry', 'Word Problems'];

    // Effect to populate the form when editing an existing question
    useEffect(() => {
        if (initialData || isEditingCopy) {
            const data = initialData || isEditingCopy;
            const parseContent = (content) => {
                if (typeof content === 'string') {
                    try { return JSON.parse(content); } catch (e) { return [{ type: 'text', value: content }]; }
                }
                return Array.isArray(content) ? content : [{ type: 'text', value: '' }];
            };

            setSelectedTags(data.tags || []);
            setQuestionText(parseContent(data.questionText));
            setOptions((data.options || []).map(opt => parseContent(opt)));
            setIsMultipleCorrect(data.isMultipleCorrect || false);
            setCorrectAnswer(Array.isArray(data.correctAnswer) ? data.correctAnswer : [data.correctAnswer]);
            setDifficulty(data.difficulty || 3);
        }
    }, [initialData, isEditingCopy]);

    const handleCopyForEditing = (question) => {
        setIsEditingCopy(question);
        setIsSelectorOpen(false);
    };

    const handleCopySelected = async (selectedQuestionsWithCopies) => {
        setIsSubmitting(true); // Indicate submission is in progress
        try {
            if (selectedQuestionsWithCopies.length > 0) {
                                const questionToCopy = selectedQuestionsWithCopies[0];
                const newQuestionRef = doc(collection(db, `artifacts/${appId}/public/data/questions`));
    
                const processedQuestion = { ...questionToCopy };
                delete processedQuestion.id; // Remove original ID
                delete processedQuestion.passageId;
                delete processedQuestion.msrSetId;

                processedQuestion.creatorId = user.uid;
                processedQuestion.type = type;
                processedQuestion.createdAt = Timestamp.now();
    
                await setDoc(newQuestionRef, processedQuestion);
                onSave("Question copied successfully to question bank!"); // Success message
            }
        } catch (err) {
            console.error("Error copying question:", err);
            onSave("Failed to copy question. Please try again."); // Error message
        } finally {
            setIsSubmitting(false); // End submission
            setIsSelectorOpen(false); // Close modal
        }
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
     * @param {number} index - The selected answer.
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

    const handleTagChange = (tag) => {
        setSelectedTags(prevTags =>
            prevTags.includes(tag)
            ? prevTags.filter(t => t !== tag) // Deselect if already selected
            : [...prevTags, tag] // Select if not already selected
        );
    };

    
    
    /**
     * Handles the selection of questions from the selector modal and creates copies.
     * @param {Array<object>} selectedQuestionsWithCopies - Array of selected questions with their copy counts.
     */
    

    /**
     * Handles the form submission.
     * Saves or updates the question in Firestore.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (correctAnswer.length === 0) {
            // Still show local error for this case
            setIsSubmitting(false);
            return;
        }

        if (type === 'Quant' && selectedTags.length === 0) {
            alert('Please select at least one tag for the question.');
            setIsSubmitting(false);
            return;
        }

        const questionData = {
            creatorId: user.uid,
            type: type,
            difficulty: Number(difficulty),
            format: 'mcq',
            questionText: JSON.stringify(questionText), 
            options: options.map(optionContent => JSON.stringify(optionContent)), 
            correctAnswer: isMultipleCorrect ? correctAnswer : correctAnswer[0],
            isMultipleCorrect,
            tags: selectedTags,
        };

        try {
            if (initialData) {
                const questionRef = doc(db, `artifacts/${appId}/public/data/questions`, initialData.id);
                const versionsRef = collection(questionRef, 'versions');

                // 1. Get the current state of the question before we overwrite it
                const currentDoc = await getDoc(questionRef);
                const currentData = currentDoc.data();

                // 2. Save the current state as a historical version
                await addDoc(versionsRef, {
                    ...currentData,
                    editedAt: serverTimestamp(),
                    editorId: user.uid // Assume user context is available
                });

                // 3. Now, update the main document with the new data
                await updateDoc(questionRef, questionData);
                
                onSave("Question updated successfully!");
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/questions`), questionData);
                onSave(isEditingCopy ? "Copied question saved successfully!" : "Question added successfully!");
            }
        } catch (err) {
            // The parent will handle the error message
            console.error(err);
            onSave("Failed to save content. Please try again.");
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
        tags: selectedTags,
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
                    onCopySelected={handleCopySelected}
                    onCopyForEditing={handleCopyForEditing}
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
                    <div className="mt-6">
                        <label className="block text-gray-700 text-lg font-bold mb-2">
                          Question Topics & Tags
                        </label>
                        <div className="space-y-4">
                          {Object.entries(GMAT_TOPICS.Quantitative).map(([category, tags]) => (
                            <div key={category}>
                              <h4 className="font-semibold text-md text-gray-600 border-b pb-1 mb-2">{category}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {tags.map(tag => (
                                  <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedTags.includes(tag)}
                                      onChange={() => handleTagChange(tag)}
                                      className="form-checkbox h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">{tag}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
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