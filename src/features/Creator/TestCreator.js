import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import QuantMCQCreator from './QuantMCQCreator';
import VerbalPassageCreator from './VerbalPassageCreator';
import DataInsightsCreator from './DataInsightsCreator';
import { useDataFromContext as useData } from '../../contexts/DataContext';

/**
 * Component that serves as a container for the different question creators.
 * It renders the appropriate creator based on the selected content type.
 */
export default function TestCreator({ user, editingQuestionId, setEditingQuestionId, setView }) {
    const { questions, isLoading: isDataLoading } = useData();
    // State for the content type, question data, and loading status
    const [contentType, setContentType] = useState('Quant');
    const [questionData, setQuestionData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');

    // Effect to fetch the question data when a question is being edited
    useEffect(() => {
        if (editingQuestionId) {
            setIsLoading(true);
            const fetchQuestion = async () => {
                const questionRef = doc(db, `artifacts/${appId}/public/data/questions`, editingQuestionId);
                const docSnap = await getDoc(questionRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setQuestionData(data);
                    setContentType(data.type); // Set content type based on question being edited
                } else {
                    console.error("No such question found!");
                }
                setIsLoading(false);
            };
            fetchQuestion();
        } else {
            setQuestionData(null);
            setIsLoading(false);
        }
    }, [editingQuestionId]);

    /**
     * Resets the editing state and returns to the question bank.
     */
    const handleFinishEditing = (message) => {
        setSuccessMessage(message);
        setEditingQuestionId(null); // Clear editing state
    };

    const handleCreateAnother = () => {
        setSuccessMessage('');
        setQuestionData(null);
    };

    /**
     * Renders the appropriate creator component based on the content type.
     */
    const renderCreator = () => {
        if (isLoading || isDataLoading) {
            return <div>Loading question data...</div>;
        }

        if (successMessage) {
            return (
                <div className="text-center">
                    <p className="text-green-500 text-lg mb-4">{successMessage}</p>
                    <div className="space-x-4">
                        <button onClick={handleCreateAnother} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                            Create Another Question
                        </button>
                        <button onClick={() => setView('questionBank')} className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700">
                            Go to Question Bank
                        </button>
                    </div>
                </div>
            );
        }

        switch (contentType) {
            case 'Quant':
                return <QuantMCQCreator user={user} onSave={handleFinishEditing} initialData={questionData} allQuestions={questions} />;
            case 'Verbal':
                return <VerbalPassageCreator user={user} onSave={handleFinishEditing} initialData={questionData} allQuestions={questions} />;
            case 'Data Insights':
                 return <DataInsightsCreator user={user} onSave={handleFinishEditing} initialData={questionData} allQuestions={questions} />;
            default:
                return <QuantMCQCreator user={user} onSave={handleFinishEditing} initialData={questionData} allQuestions={questions} />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
                {editingQuestionId ? 'Edit Question' : 'Create New Content'}
            </h2>
            
            {/* This dropdown will now only show when creating a NEW question */}
            {!editingQuestionId && !successMessage && (
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Content Type</label>
                    <select value={contentType} onChange={e => setContentType(e.target.value)} className="w-full p-3 border rounded bg-gray-50">
                        <option value="Quant">Quantitative Reasoning</option>
                        <option value="Verbal">Verbal Reasoning</option>
                        <option value="Data Insights">Data Insights</option>
                    </select>
                </div>
            )}
            
            <hr className="my-6"/>
            {renderCreator()}
        </div>
    );
}