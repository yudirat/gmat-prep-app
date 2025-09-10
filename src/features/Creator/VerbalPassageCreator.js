// This component is used to create and edit verbal passages and their associated questions.
import React, { useState, useEffect } from 'react';
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import SubQuestionForm, { defaultSubQuestion } from './SubQuestionForm';
import BlockEditor from '../../components/BlockEditor';
import QuestionSelectorModal from './QuestionSelectorModal'; // New import
import { v4 as uuidv4 } from 'uuid'; // New import

/**
 * Component for creating and editing verbal passages with associated questions.
 */
export default function VerbalPassageCreator({ user, onSave, initialData, allQuestions, allPassages }) {
    // State for the passage content, sub-questions, and form status
    const [passageText, setPassageText] = useState([{ type: 'text', value: '' }]);
    const [subQuestions, setSubQuestions] = useState([{...defaultSubQuestion}]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [, setError] = useState('');
    const [, setSuccess] = useState('');
    const [isSelectorOpen, setIsSelectorOpen] = useState(false); // New state

    // Effect to populate the form when editing an existing passage
    useEffect(() => {
        if (initialData && initialData.passageId) {
            const parseContent = (content) => {
                if (typeof content === 'string') {
                    try { return JSON.parse(content); } catch (e) { return [{ type: 'text', value: content }]; }
                }
                return Array.isArray(content) ? content : [{ type: 'text', value: '' }];
            };

            const passage = allPassages.find(p => p.id === initialData.passageId);
            if (passage) {
                setPassageText(parseContent(passage.passageText));
            }

            const associatedQuestions = allQuestions
                .filter(q => q.passageId === initialData.passageId)
                .map(q => ({
                    ...q,
                    questionText: parseContent(q.questionText),
                    options: (q.options || []).map(opt => parseContent(opt)),
                    correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
                }));
            
            setSubQuestions(associatedQuestions.length ? associatedQuestions : [{...defaultSubQuestion}]);
        }
    }, [initialData, allQuestions, allPassages]);

    /**
     * Adds a new sub-question to the form.
     */
    const addSubQuestion = () => setSubQuestions([...subQuestions, { ...defaultSubQuestion }]);

    /**
     * Removes a sub-question from the form.
     * @param {number} index - The index of the sub-question to remove.
     */
    const removeSubQuestion = (index) => setSubQuestions(subQuestions.filter((_, i) => i !== index));

    /**
     * Handles copying selected questions from the selector modal to subQuestions.
     * @param {Array<object>} selectedQuestionsWithCopies - Array of selected questions with their copy counts.
     */
    const handleCopySelectedQuestions = (selectedQuestionsWithCopies) => {
        const newSubQuestions = [...subQuestions];
        selectedQuestionsWithCopies.forEach(selectedItem => {
            const originalQuestion = selectedItem;
            const numberOfCopies = selectedItem.copies;

            for (let i = 0; i < numberOfCopies; i++) {
                // Create a new question object, copying data from the original
                const newQuestion = {
                    ...originalQuestion,
                    id: uuidv4(), // Generate a new unique ID for the copy
                    // Ensure questionText and options are not double-stringified if they were already parsed
                    // when coming from the selector modal.
                    questionText: Array.isArray(originalQuestion.questionText) ? originalQuestion.questionText : [{ type: 'text', value: originalQuestion.questionText }],
                    options: Array.isArray(originalQuestion.options) ? originalQuestion.options : originalQuestion.options.map(opt => [{ type: 'text', value: opt }]),
                    // Verbal specific: ensure type is Verbal
                    type: 'Verbal',
                    passageId: null, // Will be set on batch commit
                    creatorId: user.uid,
                    createdAt: Timestamp.now(),
                };
                // Remove properties that are not part of the question schema or should be re-generated
                delete newQuestion.copies; // This was for the modal, not the question object
                delete newQuestion.categories; // Verbal questions don't have categories directly

                newSubQuestions.push(newQuestion);
            }
        });
        setSubQuestions(newSubQuestions);
    };

    /**
     * Handles changes to a sub-question's fields.
     * @param {number} index - The index of the sub-question.
     * @param {string} field - The field to update.
     * @param {any} value - The new value.
     */
    const handleSubQuestionChange = (index, field, value) => {
        const newSubQuestions = [...subQuestions];
        let q = { ...newSubQuestions[index] };

        if (field === 'format') {
            const oldDifficulty = q.difficulty;
            q = { ...defaultSubQuestion, format: value, difficulty: oldDifficulty };
        } else {
            q[field] = value;
        }
        
        newSubQuestions[index] = q;
        setSubQuestions(newSubQuestions);
    };

    /**
     * Handles the form submission.
     * Creates a batch write to Firestore to save the passage and all associated questions.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const batch = writeBatch(db);
            
            const passageRef = doc(collection(db, `artifacts/${appId}/public/data/passages`));
            batch.set(passageRef, { 
                creatorId: user.uid, 
                passageText: JSON.stringify(passageText), // Stringify the passage blocks
                type: 'Verbal',
                createdAt: Timestamp.now()
            });

            for (const q of subQuestions) {
                const questionRef = q.id ? doc(db, `artifacts/${appId}/public/data/questions`, q.id) : doc(collection(db, `artifacts/${appId}/public/data/questions`));
                
                const processedQuestion = {
                    ...q,
                    questionText: typeof q.questionText === 'string' ? q.questionText : JSON.stringify(q.questionText),
                    options: q.options.map(opt => typeof opt === 'string' ? opt : JSON.stringify(opt)),
                    creatorId: user.uid,
                    passageId: passageRef.id,
                    type: 'Verbal'
                };
                // Remove the 'id' property if it was generated by uuidv4, as it's already in the doc ref
                if (q.id) {
                    delete processedQuestion.id;
                }
                batch.set(questionRef, processedQuestion);
            }

            await batch.commit();
            setSuccess("Verbal passage and questions added successfully!");
            setTimeout(() => {
                onSave(); 
            }, 1000);

        } catch (err) {
            setError("Failed to add content. Please try again.");
            console.error(err);
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Passage Content</label>
                {/* Editor for the passage content */}
                <BlockEditor content={passageText} onContentChange={setPassageText} />
            </div>
            {/* Modal for selecting an existing question to copy */}
            {isSelectorOpen && (
                <QuestionSelectorModal 
                    isOpen={isSelectorOpen}
                    onClose={() => setIsSelectorOpen(false)}
                    questions={allQuestions}
                    onCopySelected={handleCopySelectedQuestions}
                />
            )}
            <hr/>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Associated Questions</h3>
                <button type="button" onClick={() => setIsSelectorOpen(true)} className="text-sm text-indigo-600 hover:underline">
                    Copy Existing Question(s)...
                </button>
            </div>
            {/* Render a form for each sub-question */}
            {subQuestions.map((q, index) => (
                <SubQuestionForm 
                    key={index}
                    question={q}
                    index={index}
                    onSubQuestionChange={handleSubQuestionChange}
                    onRemove={removeSubQuestion}
                    isRemovable={subQuestions.length > 1}
                    contentType="Verbal"
                />
            ))}
            <button type="button" onClick={addSubQuestion} className="text-indigo-600 font-semibold">+ Add Question</button>
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 text-lg">
                {isSubmitting ? 'Submitting...' : 'Save Verbal Content'}
            </button>
        </form>
    );
}