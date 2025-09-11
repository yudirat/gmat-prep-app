// This component allows administrators/educators to manage questions in the question bank.
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import ContentRenderer from '../../components/ContentRenderer';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';

/**
 * Component for managing questions in the question bank.
 * Allows filtering, editing, and deleting questions.
 */
export default function QuestionBankManager({ questions, handleEditQuestion, setView }) {
    // State for filtered questions, filters, and delete confirmation modal
    const [filteredQuestions, setFilteredQuestions] = useState(questions);
    const [filters, setFilters] = useState({
        section: 'All',
        difficulty: 'All',
        category: 'All'
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState(null);

    // Predefined categories for Quantitative questions
    const quantCategoryOptions = ['Arithmetic', 'Algebra', 'Geometry', 'Word Problems'];

    // Effect to filter questions based on selected criteria
    useEffect(() => {
        let tempQuestions = [...questions];

        if (filters.section !== 'All') {
            tempQuestions = tempQuestions.filter(q => q.type === filters.section);
        }
        if (filters.difficulty !== 'All') {
            tempQuestions = tempQuestions.filter(q => q.difficulty === parseInt(filters.difficulty));
        }
        if (filters.category !== 'All' && filters.section === 'Quant') {
            tempQuestions = tempQuestions.filter(q => q.categories?.includes(filters.category));
        }
        
        setFilteredQuestions(tempQuestions);
    }, [filters, questions]);

    /**
     * Handles changes to the filter selections.
     * @param {string} filterName - The name of the filter being changed (e.g., 'section', 'difficulty').
     * @param {string} value - The new value for the filter.
     */
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };
    
    /**
     * Initiates the editing process for a question.
     * @param {string} questionId - The ID of the question to edit.
     */
    const handleEdit = (questionId) => {
        handleEditQuestion(questionId);
    };

    /**
     * Opens the delete confirmation modal for a specific question.
     * @param {object} question - The question object to be deleted.
     */
    const openDeleteConfirm = (question) => {
        setQuestionToDelete(question);
        setShowDeleteConfirm(true);
    };

    /**
     * Closes the delete confirmation modal.
     */
    const closeDeleteConfirm = () => {
        setQuestionToDelete(null);
        setShowDeleteConfirm(false);
    };

    /**
     * Handles the deletion of a question from Firestore.
     */
    const handleDelete = async () => {
        if (!questionToDelete) return;
        
        const questionRef = doc(db, `artifacts/${appId}/public/data/questions`, questionToDelete.id);
        try {
            await deleteDoc(questionRef);
            closeDeleteConfirm();
        } catch (error) {
            console.error("Error deleting question: ", error);
            alert("There was an error deleting the question.");
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            {/* Delete confirmation modal */}
            {showDeleteConfirm && (
                <Modal 
                    isOpen={showDeleteConfirm} 
                    onClose={closeDeleteConfirm}
                    title="Confirm Deletion"
                >
                    <p>Are you sure you want to permanently delete this question?</p>
                    <p className="my-4 p-2 bg-gray-100 rounded">
                        <ContentRenderer content={questionToDelete?.questionText} />
                    </p>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button onClick={closeDeleteConfirm} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md">Confirm Delete</button>
                    </div>
                </Modal>
            )}

                        <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Question Bank ({filteredQuestions.length})</h2>
                <div className="space-x-4">
                    <button onClick={() => setView('createForm')} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                        + Add New Content
                    </button>
                    <button onClick={() => setView('dashboard')} className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700">
                        Back to Dashboard
                    </button>
                </div>
            </div>
            
            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Section</label>
                    <select onChange={e => handleFilterChange('section', e.target.value)} className="w-full p-2 border rounded-md">
                        <option value="All">All Sections</option>
                        <option value="Quant">Quantitative</option>
                        <option value="Verbal">Verbal</option>
                        <option value="Data Insights">Data Insights</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select onChange={e => handleFilterChange('difficulty', e.target.value)} className="w-full p-2 border rounded-md">
                        <option value="All">All Difficulties</option>
                        {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                {filters.section === 'Quant' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select onChange={e => handleFilterChange('category', e.target.value)} className="w-full p-2 border rounded-md">
                            <option value="All">All Categories</option>
                            {quantCategoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* List of filtered questions */}
            <div className="space-y-4">
                {filteredQuestions.length > 0 ? (
                    filteredQuestions.map(q => (
                        <div key={q.id} className="p-4 border rounded-lg flex justify-between items-center">
                            <div className="flex-1">
                                <div className="text-gray-800">
                                <ContentRenderer content={q.questionText} />
                                </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Type: {q.type} | Difficulty: {q.difficulty}
                            </p>
                        </div>
                            <div className="space-x-2">
                                <button onClick={() => handleEdit(q.id)} className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">Edit</button>
                                <button onClick={() => openDeleteConfirm(q)} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm">Delete</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No questions found matching your criteria.</p>
                )}
            </div>
        </div>
    );
}