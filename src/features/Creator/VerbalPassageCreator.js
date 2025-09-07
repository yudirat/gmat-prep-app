// This component is used to create and edit verbal passages and their associated questions.
import React, { useState, useEffect } from 'react';
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import SubQuestionForm, { defaultSubQuestion } from './SubQuestionForm';
import BlockEditor from '../../components/BlockEditor';

/**
 * Component for creating and editing verbal passages with associated questions.
 */
export default function VerbalPassageCreator({ user, onSave, initialData, allQuestions, allPassages }) {
    // State for the passage content, sub-questions, and form status
    const [passageText, setPassageText] = useState([{ type: 'text', value: '' }]);
    const [subQuestions, setSubQuestions] = useState([{...defaultSubQuestion}]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

            subQuestions.forEach(q => {
                const questionRef = doc(collection(db, `artifacts/${appId}/public/data/questions`));
                const processedQuestion = {
                    ...q,
                    questionText: JSON.stringify(q.questionText), // Stringify sub-question text
                    options: q.options.map(opt => JSON.stringify(opt)), // Stringify each option's blocks
                    creatorId: user.uid,
                    passageId: passageRef.id,
                    type: 'Verbal'
                };
                batch.set(questionRef, processedQuestion);
            });

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
            <hr/>
            <h3 className="text-xl font-semibold">Associated Questions</h3>
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