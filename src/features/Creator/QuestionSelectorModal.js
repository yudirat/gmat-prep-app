// This component provides a modal for selecting an existing question from the question bank.
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import ContentRenderer from '../../components/ContentRenderer';

/**
 * QuestionSelectorModal component allows users to select an existing question from a list.
 * It provides filtering options to narrow down the question selection.
 */
export default function QuestionSelectorModal({ isOpen, onClose, questions = [], onQuestionSelect }) {
    // State for filtered questions and filter criteria
    const [filteredQuestions, setFilteredQuestions] = useState(questions);
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
     * Handles the selection of a question.
     * Calls the `onQuestionSelect` callback with the selected question and closes the modal.
     * @param {object} question - The selected question object.
     */
    const handleSelect = (question) => {
        onQuestionSelect(question);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select a Question to Copy">
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
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredQuestions.length > 0 ? (
                        filteredQuestions.map(q => (
                            <div key={q.id} className="p-2 border rounded-lg flex justify-between items-center">
                                <div className="text-sm text-gray-800 flex-1">
                                    {/* Render the question text using ContentRenderer */}
                                    <ContentRenderer content={q.questionText} />
                                </div>
                                <button onClick={() => handleSelect(q)} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm ml-4">Select</button>
                            </div>
                        ))
                    ) : (
                        <p>No questions found matching your criteria.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
}