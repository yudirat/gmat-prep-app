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
    
    const [isSelectorOpen, setIsSelectorOpen] = useState(false); // New state

    const [isEditingCopy, setIsEditingCopy] = useState(false);

    // Effect to populate the form when editing an existing passage
    useEffect(() => {
        if ((initialData && initialData.passageId) || isEditingCopy) {
            const data = initialData || isEditingCopy;
            const parseContent = (content) => {
                if (typeof content === 'string') {
                    try { return JSON.parse(content); } catch (e) { return [{ type: 'text', value: content }]; }
                }
                return Array.isArray(content) ? content : [{ type: 'text', value: '' }];
            };

            if (data.passageId) {
                const passage = allPassages.find(p => p.id === data.passageId);
                if (passage) {
                    setPassageText(parseContent(passage.passageText));
                }
            }

            const associatedQuestions = allQuestions
                .filter(q => q.passageId === data.passageId)
                .map(q => ({
                    ...q,
                    questionText: parseContent(q.questionText),
                    options: (q.options || []).map(opt => parseContent(opt)),
                    correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
                }));
            
            setSubQuestions(associatedQuestions.length ? associatedQuestions : [{...defaultSubQuestion, id: uuidv4()}]);
        }
    }, [initialData, allQuestions, allPassages, isEditingCopy]);

    const handleCopyForEditing = (question) => {
        setIsEditingCopy(question);
        setIsSelectorOpen(false);
    };

    /**
     * Adds a new sub-question to the form.
     */
    const addSubQuestion = () => setSubQuestions([...subQuestions, { ...defaultSubQuestion, id: uuidv4() }]);

    /**
     * Removes a sub-question from the form.
     * @param {number} index - The index of the sub-question to remove.
     */
    const removeSubQuestion = (index) => setSubQuestions(subQuestions.filter((_, i) => i !== index));

    /**
     * Handles copying selected questions from the selector modal to subQuestions.
     * @param {Array<object>} selectedQuestionsWithCopies - Array of selected questions with their copy counts.
     */
    const handleCopySelected = async (selectedQuestionsWithCopies) => {
        setIsSubmitting(true); // Indicate submission is in progress
        try {
            const batch = writeBatch(db);
            const newSubQuestions = []; // To store questions that will be added to local state
    
            for (const q of selectedQuestionsWithCopies) {
                // Create copies and prepare them for Firestore
                for (let i = 0; i < (q.copies || 1); i++) {
                    const newQuestionRef = doc(collection(db, `artifacts/${appId}/public/data/questions`));
                    const processedQuestion = {
                        ...q,
                        id: newQuestionRef.id, // Assign new Firestore ID
                        questionText: JSON.stringify(q.questionText),
                        options: q.options.map(opt => JSON.stringify(opt)),
                        creatorId: user.uid,
                        type: 'Verbal',
                        createdAt: Timestamp.now() // Add creation timestamp
                    };
                    // Remove original ID if it exists, as we're creating a new document
                    delete processedQuestion.passageId; // Remove passageId as it's not associated yet
                    delete processedQuestion.msrSetId; // Remove msrSetId if it exists
                    delete processedQuestion.id; // Remove original ID
    
                    batch.set(newQuestionRef, processedQuestion);
                    newSubQuestions.push({ ...processedQuestion, id: newQuestionRef.id }); // Add to local state with new ID
                }
            }
    
            await batch.commit();
            // Update local state after successful Firestore write
            setSubQuestions(prev => [...prev.filter(sq => sq.questionText !== '[{"type":"text","value":""}]'), ...newSubQuestions]);
            onSave("Questions copied successfully to question bank!"); // Success message
        } catch (err) {
            console.error("Error copying questions:", err);
            onSave("Failed to copy questions. Please try again."); // Error message
        } finally {
            setIsSubmitting(false); // End submission
            setIsSelectorOpen(false); // Close modal
        }
    };
    

    /**
     * Handles changes to a sub-question's fields.
     * @param {number} index - The index of the sub-question.
     * @param {string} field - The field to update.
     * @param {any} value - The new value.
     */
    const handleSubQuestionChange = (index, fieldOrChanges, value) => {
        const newSubQuestions = [...subQuestions];
        let q = { ...newSubQuestions[index] };

        if (typeof fieldOrChanges === 'object') {
            q = { ...q, ...fieldOrChanges };
        } else if (fieldOrChanges === 'format') {
            const oldDifficulty = q.difficulty;
            q = { ...defaultSubQuestion, id: q.id || uuidv4(), format: value, difficulty: oldDifficulty };
        } else {
            q[fieldOrChanges] = value;
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
                const questionRef = q.id && !isEditingCopy ? doc(db, `artifacts/${appId}/public/data/questions`, q.id) : doc(collection(db, `artifacts/${appId}/public/data/questions`));
                
                const processedQuestion = {
                    ...q,
                    questionText: JSON.stringify(q.questionText),
                    options: q.options.map(opt => JSON.stringify(opt)),
                    explanation: JSON.stringify(q.explanation),
                    creatorId: user.uid,
                    passageId: passageRef.id,
                    type: 'Verbal'
                };
                // Remove the 'id' property if it was generated by uuidv4, as it's already in the doc ref
                if (q.id && !isEditingCopy) {
                    delete processedQuestion.id;
                }
                batch.set(questionRef, processedQuestion);
            }

            await batch.commit();
            onSave(isEditingCopy ? "Copied question saved successfully!" : "Verbal passage and questions added successfully!");

        } catch (err) {
            console.error(err);
            onSave("Failed to add content. Please try again.");
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
                    onCopySelected={handleCopySelected}
                    onCopyForEditing={handleCopyForEditing}
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
                    key={q.id || index}
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