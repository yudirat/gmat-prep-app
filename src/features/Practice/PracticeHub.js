// src/features/Practice/PracticeHub.js - (Updated Code)
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // To navigate to the quiz
import useData from '../../hooks/useData'; // To fetch all questions
import { GMAT_TOPICS } from '../../constants/gmatTopics';

const PracticeHub = () => {
  const { data: allQuestions, loading } = useData('questions');
  const navigate = useNavigate();

  const [selectedSection, setSelectedSection] = useState('Quantitative');
  const [selectedTags, setSelectedTags] = useState([]);
  const [numQuestions, setNumQuestions] = useState(10);

  // Memoize the filtered questions available for selection
  const availableQuestions = useMemo(() => {
    if (!allQuestions) return [];
    return allQuestions.filter(q => {
      const sectionMatch = q.section === selectedSection;
      if (selectedTags.length === 0) return sectionMatch;
      // Question must have all the selected tags
      return sectionMatch && selectedTags.every(tag => q.tags?.includes(tag));
    });
  }, [allQuestions, selectedSection, selectedTags]);

  const handleTagChange = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleStartQuiz = () => {
    // Shuffle the available questions and take the number requested
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numQuestions);
    
    // Pass not just questions, but also the context (tags and section)
    navigate('/practice-quiz', { 
      state: { 
        questions: selected, 
        tags: selectedTags, 
        section: selectedSection 
      } 
    });
  };

  const getTagsForCurrentSection = () => {
    if (selectedSection === 'Quantitative') return Object.values(GMAT_TOPICS.Quantitative).flat();
    if (selectedSection === 'Verbal') return GMAT_TOPICS.Verbal;
    if (selectedSection === 'DataInsights') return GMAT_TOPICS.DataInsights;
    return [];
  };

  if (loading) return <p>Loading question bank...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Practice Hub</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Create a Custom Quiz</h2>
        
        {/* Step 1: Select Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
          <select 
            value={selectedSection} 
            onChange={e => { setSelectedSection(e.target.value); setSelectedTags([]); }}
            className="w-full p-2 border rounded-md"
          >
            <option value="Quantitative">Quantitative</option>
            <option value="Verbal">Verbal</option>
            <option value="DataInsights">Data Insights</option>
          </select>
        </div>

        {/* Step 2: Select Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Topics (select one or more)</label>
          <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-48 overflow-y-auto">
            {getTagsForCurrentSection().map(tag => (
              <button 
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-3 py-1 text-sm rounded-full ${selectedTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Number of Questions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions ({availableQuestions.length} available)</label>
          <input 
            type="number"
            value={numQuestions}
            onChange={e => setNumQuestions(Math.min(parseInt(e.target.value), availableQuestions.length))}
            max={availableQuestions.length}
            min="1"
            className="w-full p-2 border rounded-md"
          />
        </div>

        {/* Start Button */}
        <button 
          onClick={handleStartQuiz}
          disabled={availableQuestions.length === 0 || numQuestions <= 0}
          className="w-full bg-green-500 text-white font-bold py-3 rounded-lg disabled:bg-gray-400 hover:bg-green-600 transition-colors"
        >
          Start Practice Quiz
        </button>
      </div>
    </div>
  );
};

export default PracticeHub;