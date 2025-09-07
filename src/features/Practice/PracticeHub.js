// This component provides a practice interface for users to review questions.
import React, { useState, useEffect } from 'react';
import ContentRenderer from '../../components/ContentRenderer';

/**
 * Component for practicing questions with filtering and navigation capabilities.
 */
export default function PracticeHub({ allQuestions }) {
    // State for filters, filtered questions, current question index, and answer display
    const [filters, setFilters] = useState({
        section: 'All',
        category: 'All',
        difficulty: 'All'
    });
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState(null);

    // Predefined categories for Quantitative questions
    const quantCategories = ['Arithmetic', 'Algebra', 'Geometry', 'Word Problems'];

    // Effect to filter and shuffle questions based on selected criteria
    useEffect(() => {
        // Start with only single questions (not associated with passages, MSR, etc.)
        let questions = allQuestions.filter(q => !q.passageId && !q.msrSetId && !q.graphicStimulusId && !q.tableStimulusId);

        if (filters.section !== 'All') {
            questions = questions.filter(q => q.type === filters.section);
        }
        if (filters.section === 'Quant' && filters.category !== 'All') {
            questions = questions.filter(q => q.categories && q.categories.includes(filters.category));
        }
        if (filters.difficulty !== 'All' && filters.difficulty !== 'Random') {
            questions = questions.filter(q => q.difficulty === parseInt(filters.difficulty));
        }
        
        if (filters.difficulty === 'Random') {
            // Fisher-Yates shuffle algorithm for randomizing questions
            for (let i = questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questions[i], questions[j]] = [questions[j], questions[i]];
            }
        }
        
        setFilteredQuestions(questions);
        setCurrentIndex(0);
        setShowAnswer(false);
        setUserAnswer(null);
    }, [filters, allQuestions]);

    /**
     * Handles changes to the filter selections.
     * @param {string} filterName - The name of the filter being changed (e.g., 'section', 'category').
     * @param {string} value - The new value for the filter.
     */
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value, category: filterName === 'section' ? 'All' : prev.category }));
    };

    const currentQuestion = filteredQuestions[currentIndex];

    /**
     * Handles the submission of an answer.
     * @param {number} answerIndex - The index of the selected answer.
     */
    const handleAnswerSubmit = (answerIndex) => {
        setUserAnswer(answerIndex);
        setShowAnswer(true);
    };
    
    /**
     * Navigates to the next question in the filtered list.
     */
    const goToNext = () => {
        if (currentIndex < filteredQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
            setUserAnswer(null);
        }
    };
    
    /**
     * Navigates to the previous question in the filtered list.
     */
    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setShowAnswer(false);
            setUserAnswer(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Practice Hub</h1>
            
            {/* Filter controls for section, difficulty, and category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-white rounded-lg shadow">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Section</label>
                    <select value={filters.section} onChange={e => handleFilterChange('section', e.target.value)} className="w-full p-2 border rounded-md">
                        <option value="All">All Sections</option>
                        <option value="Quant">Quantitative</option>
                        <option value="Verbal">Verbal</option>
                        <option value="Data Insights">Data Insights</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select value={filters.difficulty} onChange={e => handleFilterChange('difficulty', e.target.value)} className="w-full p-2 border rounded-md">
                        <option value="All">All Difficulties</option>
                        <option value="Random">Random</option>
                        {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                {filters.section === 'Quant' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="w-full p-2 border rounded-md">
                            <option value="All">All Categories</option>
                            {quantCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Question display area */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
                {filteredQuestions.length > 0 && currentQuestion ? (
                    <div>
                        <p className="text-sm text-gray-500 mb-4">Question {currentIndex + 1} of {filteredQuestions.length}</p>
                        <div className="text-lg text-gray-800 mb-6">
                           <ContentRenderer content={currentQuestion.questionText} />
                        </div>
                        <div className="space-y-4">
                            {(currentQuestion.options || []).map((option, index) => {
                                const correctAnswer = Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer];
                                const isCorrect = correctAnswer.includes(index);
                                const isSelected = index === userAnswer;
                                let buttonClass = "w-full text-left p-4 bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-start space-x-3 ";
                                
                                if (showAnswer) {
                                    if (isCorrect) buttonClass += "bg-green-100 border-green-300";
                                    else if (isSelected) buttonClass += "bg-red-100 border-red-300";
                                } else {
                                     buttonClass += "hover:bg-indigo-100 hover:border-indigo-300";
                                }

                                return (
                                    <button key={index} onClick={() => !showAnswer && handleAnswerSubmit(index)} disabled={showAnswer} className={buttonClass}>
                                        <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                                        <div className="flex-1"><ContentRenderer content={option} /></div>
                                    </button>
                                );
                            })}
                        </div>
                        {showAnswer && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold">Explanation:</h3>
                                <p>The correct answer is <span className="font-bold">{String.fromCharCode(65 + currentQuestion.correctAnswer)}</span>.</p>
                            </div>
                        )}
                        <div className="flex justify-between mt-8">
                            <button onClick={goToPrev} disabled={currentIndex === 0} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Previous</button>
                            <button onClick={goToNext} disabled={currentIndex === filteredQuestions.length - 1} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Next</button>
                        </div>
                    </div>
                ) : (
                    <p>No questions found matching your criteria. Please broaden your search.</p>
                )}
            </div>
        </div>
    );
}