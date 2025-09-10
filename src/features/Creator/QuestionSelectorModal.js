// This component provides a modal for selecting existing questions from the question bank.
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import ContentRenderer from '../../components/ContentRenderer';

/**
 * QuestionSelectorModal component allows users to select multiple existing questions from a list.
 * It provides filtering options to narrow down the question selection.
 */
export default function QuestionSelectorModal({ isOpen, onClose, questions = [], onCopySelected }) {
    // State for filtered questions, filter criteria, and selected question IDs
    const [filteredQuestions, setFilteredQuestions] = useState(questions);
    const [selectedQuestionsWithCopies, setSelectedQuestionsWithCopies] = useState([]);
    const [filters, setFilters] = useState({
        section: 'All',
        difficulty: 'All',
        category: 'All'
    });

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
     * Toggles the selection of a question and initializes/updates its copy count.
     * @param {object} question - The question object to toggle.
     */
    const handleToggleQuestion = (question) => {
        setSelectedQuestionsWithCopies(prev => {
            const existing = prev.find(item => item.id === question.id);
            if (existing) {
                return prev.filter(item => item.id !== question.id);
            } else {
                return [...prev, { ...question, copies: 1 }]; // Initialize copies to 1
            }
        });
    };

    /**
     * Handles changes to the number of copies for a selected question.
     * @param {string} questionId - The ID of the question.
     * @param {number} copies - The new number of copies.
     */
    const handleCopyChange = (questionId, copies) => {
        setSelectedQuestionsWithCopies(prev =>
            prev.map(item =>
                item.id === questionId ? { ...item, copies: Math.max(1, parseInt(copies) || 1) } : item
            )
        );
    };

    /**
     * Handles the final selection of multiple questions.
     * Calls the `onCopySelected` callback with the selected questions and closes the modal.
     */
    const handleConfirmSelection = () => {
        onCopySelected(selectedQuestionsWithCopies);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Questions to Copy">
            <div className="space-y-4">
                {/* Filter Controls Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
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

                {/* Question List Section */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredQuestions.length > 0 ? (
                        filteredQuestions.map(q => (
                            <div key={q.id} className="p-2 border rounded-lg flex items-center">
                                <input 
                                    type="checkbox"
                                    checked={selectedQuestionsWithCopies.some(item => item.id === q.id)}
                                    onChange={() => handleToggleQuestion(q)} 
                                    className="mr-4 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="text-sm text-gray-800 flex-1">
                                    <ContentRenderer content={q.questionText} />
                                </div>
                                {selectedQuestionsWithCopies.some(item => item.id === q.id) && (
                                    <div className="ml-4 flex items-center">
                                        <label htmlFor={`copies-${q.id}`} className="sr-only">Number of Copies</label>
                                        <input
                                            id={`copies-${q.id}`}
                                            type="number"
                                            min="1"
                                            value={selectedQuestionsWithCopies.find(item => item.id === q.id)?.copies || 1}
                                            onChange={(e) => handleCopyChange(q.id, e.target.value)}
                                            className="w-20 p-1 border rounded-md text-center"
                                        />
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No questions found matching your criteria.</p>
                    )}
                </div>

                {/* Confirmation Button */}
                <div className="flex justify-end pt-4 border-t">
                     <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2">Cancel</button>
                    <button onClick={handleConfirmSelection} className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400" disabled={selectedQuestionsWithCopies.length === 0}>
                        Copy {selectedQuestionsWithCopies.length} Question{selectedQuestionsWithCopies.length !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </Modal>
    );
}