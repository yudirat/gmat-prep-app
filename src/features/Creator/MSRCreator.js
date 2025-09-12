// This component is used to create and edit Multi-Source Reasoning (MSR) question sets.
import React, { useState, useEffect } from 'react';
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import SubQuestionForm, { defaultSubQuestion } from './SubQuestionForm';
import BlockEditor from '../../components/BlockEditor';
import QuestionSelectorModal from './QuestionSelectorModal'; // New import
import { v4 as uuidv4 } from 'uuid'; // New import

/**
 * Component for creating and editing Multi-Source Reasoning (MSR) question sets.
 */
export default function MSRCreator({ user, onSave, initialData, allQuestions, allMsrSets }) {
    // State for the MSR tabs, sub-questions, and form status
    const [msrTabs, setMsrTabs] = useState([{ title: 'Tab 1', content: [{ type: 'text', value: '' }] }]);
    const [subQuestions, setSubQuestions] = useState([{...defaultSubQuestion}]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isSelectorOpen, setIsSelectorOpen] = useState(false); // New state

    const [isEditingCopy, setIsEditingCopy] = useState(false);

    // Effect to populate the form when editing an existing MSR set
    useEffect(() => {
        if ((initialData && initialData.msrSetId) || isEditingCopy) {
            const data = initialData || isEditingCopy;
            const parseContent = (content) => {
                if (typeof content === 'string') {
                    try { return JSON.parse(content); } catch (e) { return [{ type: 'text', value: content }]; }
                }
                return Array.isArray(content) ? content : [{ type: 'text', value: '' }];
            };

            if (data.msrSetId) {
                const msrSet = allMsrSets.find(m => m.id === data.msrSetId);
                if (msrSet) {
                    const processedTabs = msrSet.tabs.map(tab => ({
                        ...tab,
                        content: parseContent(tab.content)
                    }));
                    setMsrTabs(processedTabs);
                }
            }

            const associatedQuestions = allQuestions
                .filter(q => q.msrSetId === data.msrSetId)
                .map(q => ({
                    ...q,
                    questionText: parseContent(q.questionText),
                    options: (q.options || []).map(opt => parseContent(opt)),
                    correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
                }));
            
            setSubQuestions(associatedQuestions.length ? associatedQuestions : [{...defaultSubQuestion, id: uuidv4()}]);
        }
    }, [initialData, allQuestions, allMsrSets, isEditingCopy]);

    const handleCopyForEditing = (question) => {
        setIsEditingCopy(question);
        setIsSelectorOpen(false);
    };

    /**
     * Handles changes to a tab's title.
     * @param {number} tabIndex - The index of the tab.
     * @param {string} field - The field to update (always 'title').
     * @param {string} value - The new title.
     */
    const handleTabChange = (tabIndex, field, value) => {
        const newTabs = [...msrTabs];
        newTabs[tabIndex][field] = value;
        setMsrTabs(newTabs);
    };
    
    /**
     * Handles changes to a tab's content.
     * @param {number} tabIndex - The index of the tab.
     * @param {object} newContent - The new content.
     */
    const handleTabContentChange = (tabIndex, newContent) => {
        const newTabs = [...msrTabs];
        newTabs[tabIndex].content = newContent;
        setMsrTabs(newTabs);
    };

    /**
     * Adds a new tab.
     */
    const addTab = () => {
        if(msrTabs.length < 3) {
            setMsrTabs([...msrTabs, { title: `Tab ${msrTabs.length + 1}`, content: [{ type: 'text', value: '' }] }]);
        }
    };

    /**
     * Removes a tab.
     * @param {number} index - The index of the tab to remove.
     */
    const removeTab = (index) => setMsrTabs(msrTabs.filter((_, i) => i !== index));

    /**
     * Adds a new sub-question.
     */
    const addSubQuestion = () => setSubQuestions([...subQuestions, { ...defaultSubQuestion, id: uuidv4() }]);

    /**
     * Removes a sub-question.
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
                        type: 'Data Insights',
                        createdAt: Timestamp.now() // Add creation timestamp
                    };
                    // Remove original ID if it exists, as we're creating a new document
                    delete processedQuestion.passageId; // Remove passageId if it exists
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
     * Handles changes to a sub-question.
     * @param {number} index - The index of the sub-question.
     * @param {string} field - The field to update.
     * @param {any} value - The new value.
     */
    const handleSubQuestionChange = (index, field, value) => {
        const newSubQuestions = [...subQuestions];
        let q = { ...newSubQuestions[index] };

        if (field === 'format') {
            const oldDifficulty = q.difficulty;
            q = { ...defaultSubQuestion, id: uuidv4(), format: value, difficulty: oldDifficulty };
        } else {
            q[field] = value;
        }
        
        newSubQuestions[index] = q;
        setSubQuestions(newSubQuestions);
    };

    /**
     * Handles the form submission.
     * Creates a batch write to Firestore to save the MSR set and its questions.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const batch = writeBatch(db);
            
            const msrSetRef = doc(collection(db, `artifacts/${appId}/public/data/msrSets`));
            // Stringify the content within each tab
            const processedTabs = msrTabs.map(tab => ({
                ...tab,
                content: JSON.stringify(tab.content)
            }));

            batch.set(msrSetRef, { 
                creatorId: user.uid, 
                tabs: processedTabs, 
                type: 'Data Insights',
                createdAt: Timestamp.now()
            });

            for (const q of subQuestions) {
                const questionRef = q.id && !isEditingCopy ? doc(db, `artifacts/${appId}/public/data/questions`, q.id) : doc(collection(db, `artifacts/${appId}/public/data/questions`));
                
                const processedQuestion = {
                    ...q,
                    questionText: JSON.stringify(q.questionText),
                    options: q.options.map(opt => JSON.stringify(opt)),
                    creatorId: user.uid,
                    msrSetId: msrSetRef.id,
                    type: 'Data Insights'
                };
                // Remove the 'id' property if it was generated by uuidv4, as it's already in the doc ref
                if (q.id && !isEditingCopy) {
                    delete processedQuestion.id;
                }
                batch.set(questionRef, processedQuestion);
            }

            await batch.commit();
            onSave(isEditingCopy ? "Copied question saved successfully!" : "MSR question set added successfully!");

        } catch (err) {
            console.error(err);
            onSave("Failed to add content. Please try again.");
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold mb-4">MSR Content Tabs</h3>
                {msrTabs.map((tab, tabIndex) => (
                    <div key={tabIndex} className="mb-4 p-3 border rounded bg-white relative">
                        <div className="flex justify-between items-center mb-2">
                            <input 
                                type="text" 
                                value={tab.title} 
                                onChange={e => handleTabChange(tabIndex, 'title', e.target.value)} 
                                className="font-semibold p-1 border rounded" 
                                placeholder="Tab Title"
                            />
                            {msrTabs.length > 1 && <button type="button" onClick={() => removeTab(tabIndex)} className="text-red-500 hover:text-red-700 text-xl">&times;</button>}
                        </div>
                        <BlockEditor 
                            content={tab.content} 
                            onContentChange={(newContent) => handleTabContentChange(tabIndex, newContent)} 
                        />
                    </div>
                ))}
                <button type="button" onClick={addTab} className="text-indigo-600 hover:text-indigo-800 font-semibold">+ Add Tab</button>
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
            <hr className="my-6"/>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Associated Questions</h3>
                <button type="button" onClick={() => setIsSelectorOpen(true)} className="text-sm text-indigo-600 hover:underline">
                    Copy Existing Question(s)...
                </button>
            </div>
            {subQuestions.map((q, index) => (
                <SubQuestionForm 
                    key={q.id || index}
                    question={q}
                    index={index}
                    onSubQuestionChange={handleSubQuestionChange}
                    onRemove={removeSubQuestion}
                    isRemovable={subQuestions.length > 1}
                    contentType="Data Insights"
                />
            ))}
            <button type="button" onClick={addSubQuestion} className="text-indigo-600 font-semibold">+ Add Question</button>
            
            <hr className="my-8"/>
            
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 text-lg mt-6">
                {isSubmitting ? 'Submitting...' : 'Add Content to Bank'}
            </button>
        </form>
    );
}