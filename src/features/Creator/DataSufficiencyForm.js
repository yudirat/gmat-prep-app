import React, { useState, useEffect } from 'react';
import { doc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import BlockEditor from '../../components/BlockEditor';
import QuestionPreviewModal from './QuestionPreviewModal';

const DATA_SUFFICIENCY_OPTIONS = [
  "Statement (1) ALONE is sufficient, but statement (2) ALONE is not sufficient.",
  "Statement (2) ALONE is sufficient, but statement (1) ALONE is not sufficient.",
  "BOTH statements TOGETHER are sufficient, but NEITHER statement ALONE is sufficient.",
  "EACH statement ALONE is sufficient.",
  "Statements (1) and (2) TOGETHER are NOT sufficient."
];

export default function DataSufficiencyForm({ user, onSave, initialData }) {
  const [questionStem, setQuestionStem] = useState([{ type: 'text', value: '' }]);
  const [statement1, setStatement1] = useState([{ type: 'text', value: '' }]);
  const [statement2, setStatement2] = useState([{ type: 'text', value: '' }]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [difficulty, setDifficulty] = useState(3);
  const [explanation, setExplanation] = useState([{ type: 'text', value: '' }]);
  const [diTags, setDiTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Pre-fill form if editing
      setQuestionStem(JSON.parse(initialData.questionText || '[{"type":"text","value":""}]'));
      setStatement1(JSON.parse(initialData.statement1 || '[{"type":"text","value":""}]'));
      setStatement2(JSON.parse(initialData.statement2 || '[{"type":"text","value":""}]'));
      setCorrectAnswer(initialData.correctAnswer || 0);
      setDifficulty(initialData.difficulty || 3);
      setExplanation(JSON.parse(initialData.explanation || '[{"type":"text","value":""}]'));
      setDiTags(initialData.diTags || []);
    }
  }, [initialData]);

  const handleTagChange = (tag) => {
    setDiTags(prevTags =>
        prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const questionPayload = {
      creatorId: user.uid,
      type: 'Data Insights',
      format: 'Data Sufficiency',
      difficulty: Number(difficulty),
      questionText: JSON.stringify(questionStem),
      statement1: JSON.stringify(statement1),
      statement2: JSON.stringify(statement2),
      correctAnswer: Number(correctAnswer),
      explanation: JSON.stringify(explanation),
      diTags: diTags,
      // No 'options' field is needed as they are static
    };

    try {
      if (initialData?.id) {
        await updateDoc(doc(db, `artifacts/${appId}/public/data/questions`, initialData.id), questionPayload);
        onSave("Question updated successfully!");
      } else {
        await addDoc(collection(db, `artifacts/${appId}/public/data/questions`), questionPayload);
        onSave("Data Sufficiency question added successfully!");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      onSave("Failed to save question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentQuestionState = () => {
    // For DS, the main text is a combination of the stem and statements.
    const combinedText = [
        ...questionStem,
        { type: 'text', value: '<br/><strong>Statement (1)</strong>' },
        ...statement1,
        { type: 'text', value: '</br><strong>Statement (2)</strong>' },
        ...statement2,
    ];
    // Options are static for DS questions.
    const dsOptions = DATA_SUFFICIENCY_OPTIONS.map(opt => ([{ type: 'text', value: opt }]));

    return {
        questionText: combinedText,
        options: dsOptions,
        correctAnswer: [correctAnswer],
        difficulty,
        type: 'Data Insights',
        format: 'Data Sufficiency',
        tags: diTags,
    };
  };

  return (
    <>
      {isPreviewOpen && (
        <QuestionPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            question={getCurrentQuestionState()}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Question Stem</label>
          <BlockEditor content={questionStem} onContentChange={setQuestionStem} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Statement (1)</label>
          <BlockEditor content={statement1} onContentChange={setStatement1} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Statement (2)</label>
          <BlockEditor content={statement2} onContentChange={setStatement2} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Correct Answer</label>
          <div className="space-y-2">
            {DATA_SUFFICIENCY_OPTIONS.map((opt, index) => (
              <label key={index} className="flex items-center p-2 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400">
                <input
                  type="radio"
                  name="correctAnswer"
                  value={index}
                  checked={correctAnswer === index}
                  onChange={(e) => setCorrectAnswer(Number(e.target.value))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Explanation</label>
          <BlockEditor content={explanation} onContentChange={setExplanation} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tags</label>
          <div className="flex space-x-4 mt-2">
              <label className="flex items-center">
                  <input
                      type="checkbox"
                      checked={diTags.includes('Math Related')}
                      onChange={() => handleTagChange('Math Related')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Math Related</span>
              </label>
              <label className="flex items-center">
                  <input
                      type="checkbox"
                      checked={diTags.includes('Non-Math Related')}
                      onChange={() => handleTagChange('Non-Math Related')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Non-Math Related</span>
              </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty (1-5)</label>
          <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full" />
          <div className="text-center">{difficulty}</div>
        </div>
        <div className="flex space-x-4 pt-4">
            <button type="button" onClick={() => onSave && onSave()} className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="button" onClick={() => setIsPreviewOpen(true)} className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600">
                Preview
            </button>
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                {isSubmitting ? 'Saving...' : (initialData ? 'Update Question' : 'Add to Bank')}
            </button>
        </div>
      </form>
    </>
  );
}
