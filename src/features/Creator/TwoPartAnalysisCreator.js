import React, { useState, useEffect } from 'react';
import { doc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import BlockEditor from '../../components/BlockEditor';
import QuestionPreviewModal from './QuestionPreviewModal';
import TwoPartAnalysisForm from './TwoPartAnalysisForm'; // Import the refactored form

export default function TwoPartAnalysisCreator({ user, onSave, initialData }) {
  // State managed by the creator
  const [questionData, setQuestionData] = useState({
    questionText: [{ type: 'text', value: '' }],
    part1Prompt: '',
    part2Prompt: '',
    options: ['', '', ''],
    correctAnswers: [null, null],
    explanation: [{ type: 'text', value: '' }],
    diTags: [],
    difficulty: 3,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setQuestionData({
        questionText: JSON.parse(initialData.questionText || '[{"type":"text","value":""}]'),
        part1Prompt: initialData.part1Prompt || '',
        part2Prompt: initialData.part2Prompt || '',
        options: initialData.options || ['', '', ''],
        correctAnswers: initialData.correctAnswers || [null, null],
        explanation: JSON.parse(initialData.explanation || '[{"type":"text","value":""}]'),
        diTags: initialData.diTags || [],
        difficulty: initialData.difficulty || 3,
      });
    }
  }, [initialData]);

  // Single handler to update any part of the question data
  const handleQuestionChange = (index, field, value) => {
    setQuestionData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleTagChange = (tag) => {
    setQuestionData(prevData => {
        const newTags = prevData.diTags.includes(tag)
            ? prevData.diTags.filter(t => t !== tag)
            : [...prevData.diTags, tag];
        return { ...prevData, diTags: newTags };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { difficulty, questionText, explanation, ...rest } = questionData;

    const questionPayload = {
      ...rest,
      creatorId: user.uid,
      type: 'Data Insights',
      format: 'Two-Part Analysis',
      difficulty: Number(difficulty),
      questionText: JSON.stringify(questionText),
      explanation: JSON.stringify(explanation),
    };

    try {
      if (initialData?.id) {
        await updateDoc(doc(db, `artifacts/${appId}/public/data/questions`, initialData.id), questionPayload);
        onSave("Question updated successfully!");
      } else {
        await addDoc(collection(db, `artifacts/${appId}/public/data/questions`), questionPayload);
        onSave("Two-Part Analysis question added successfully!");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      onSave("Failed to save question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isPreviewOpen && (
        <QuestionPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            question={questionData} // Pass the whole question data object
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* The refactored form is now used here */}
        <TwoPartAnalysisForm 
            question={questionData} 
            index={0} 
            onSubQuestionChange={handleQuestionChange} 
        />

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Explanation</label>
          <BlockEditor 
            content={questionData.explanation} 
            onContentChange={value => handleQuestionChange(0, 'explanation', value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tags</label>
          <div className="flex space-x-4 mt-2">
              <label className="flex items-center">
                  <input type="checkbox" checked={questionData.diTags.includes('Math Related')} onChange={() => handleTagChange('Math Related')} className="h-4 w-4 text-indigo-600" />
                  <span className="ml-2 text-sm text-gray-600">Math Related</span>
              </label>
              <label className="flex items-center">
                  <input type="checkbox" checked={questionData.diTags.includes('Non-Math Related')} onChange={() => handleTagChange('Non-Math Related')} className="h-4 w-4 text-indigo-600" />
                  <span className="ml-2 text-sm text-gray-600">Non-Math Related</span>
              </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty (1-5)</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={questionData.difficulty} 
            onChange={e => handleQuestionChange(0, 'difficulty', e.target.value)} 
            className="w-full" 
          />
          <div className="text-center">{questionData.difficulty}</div>
        </div>

        <div className="flex space-x-4 pt-4">
            <button type="button" onClick={() => onSave && onSave()} className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="button" onClick={() => setIsPreviewOpen(true)} className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600">
                Preview
            </button>
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700">
                {isSubmitting ? 'Saving...' : (initialData ? 'Update Question' : 'Add to Bank')}
            </button>
        </div>
      </form>
    </>
  );
}
