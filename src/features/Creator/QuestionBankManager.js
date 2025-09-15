// src/features/Creator/QuestionBankManager.js - (Fully Upgraded)
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, writeBatch, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useUser } from '../../contexts/UserContext'; // Import the useUser hook
import { GMAT_TOPICS } from '../../constants/gmatTopics';
import BulkDifficultyModal from '../../components/BulkDifficultyModal';
import BulkAddTagsModal from '../../components/BulkAddTagsModal';

// Helper to restructure flat Firestore data into a nested object for the UI
const restructureQuestionData = (doc) => {
  const data = doc.data();
  if (data.content) {
    return { id: doc.id, ...data };
  }

  try {
    return {
      id: doc.id,
      ...data,
      content: {
        questionText: JSON.parse(data.questionText || '[]'),
        options: (data.options || []).map(opt => JSON.parse(opt)),
        correctAnswer: data.correctAnswer,
      },
    };
  } catch (error) {
    console.error(`Failed to parse question structure for ID: ${doc.id}`, error);
    return null;
  }
};

// Helper to flatten the nested question object for saving to Firestore
const flattenQuestionData = (question) => {
  const { content, ...rest } = question;
  const dataToSave = {
    ...rest,
    questionText: JSON.stringify(content.questionText || '[]'),
    options: (content.options || []).map(opt => JSON.stringify(opt)),
    correctAnswer: content.correctAnswer,
  };
  delete dataToSave.id;
  return dataToSave;
};

const QuestionBankManager = () => {
  const { user, isAuthReady } = useUser(); // Get user and auth status
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({});
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [isDifficultyModalOpen, setIsDifficultyModalOpen] = useState(false);
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedTags, setSelectedTags] = useState([]);

  const questionsCollectionPath = `artifacts/${appId}/public/data/questions`;

  useEffect(() => {
    // Wait for authentication to be ready before fetching data
    if (!isAuthReady || !user) {
      setLoading(false); // Stop loading if user is not authenticated
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch and restructure questions
        const qSnapshot = await getDocs(collection(db, questionsCollectionPath));
        const questionsData = qSnapshot.docs.map(restructureQuestionData).filter(Boolean);
        setQuestions(questionsData);

        // Fetch and compute analytics
        const analyticsSnapshot = await getDocs(collection(db, 'practice_sessions'));
        const stats = {};
        analyticsSnapshot.forEach(doc => {
          const session = doc.data();
          session.questionsAttempted.forEach(attempt => {
            const { questionId, isCorrect, timeSpent } = attempt;
            if (!stats[questionId]) {
              stats[questionId] = { answered: 0, correct: 0, totalTime: 0 };
            }
            stats[questionId].answered += 1;
            stats[questionId].correct += isCorrect ? 1 : 0;
            stats[questionId].totalTime += timeSpent || 0;
          });
        });
        setAnalyticsData(stats);
      } catch (error) {
        console.error("Error fetching question bank data:", error);
        // Optionally set an error state to show in the UI
      }
      setLoading(false);
    };

    fetchData();
  }, [isAuthReady, user]); // Re-run effect when auth state changes

  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      const sectionMatch = selectedSection === 'All' || question.section === selectedSection;
      const difficultyMatch = difficultyFilter === 'All' || question.difficulty === parseInt(difficultyFilter);
      const searchMatch = searchTerm === '' || JSON.stringify(question.content).toLowerCase().includes(searchTerm.toLowerCase());
      const tagsMatch = selectedTags.length === 0 || selectedTags.every(tag => question.tags && question.tags.includes(tag));
      
      return sectionMatch && difficultyMatch && searchMatch && tagsMatch;
    });
  }, [questions, selectedSection, selectedTags, difficultyFilter, searchTerm]);

  const handleSelectQuestion = (id) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedQuestionIds.length === filteredQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(filteredQuestions.map(q => q.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestionIds.length === 0 || !window.confirm(`Delete ${selectedQuestionIds.length} questions? This cannot be undone.`)) return;
    
    const batch = writeBatch(db);
    selectedQuestionIds.forEach(id => {
      batch.delete(doc(db, questionsCollectionPath, id));
    });
    
    await batch.commit();
    setQuestions(prev => prev.filter(q => !selectedQuestionIds.includes(q.id)));
    setSelectedQuestionIds([]);
    alert(`${selectedQuestionIds.length} questions deleted.`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteDoc(doc(db, questionsCollectionPath, id));
        setQuestions(questions.filter(q => q.id !== id));
        alert('Question deleted.');
      } catch (error) {
        console.error("Error deleting question: ", error);
        alert('Failed to delete question.');
      }
    }
  };

  const handleDuplicate = async (questionId) => {
    const originalQuestion = questions.find(q => q.id === questionId);
    if (!originalQuestion) return;

    const newQuestion = JSON.parse(JSON.stringify(originalQuestion));
    if (newQuestion.content.questionText[0]) {
      newQuestion.content.questionText[0].value += ' (Copy)';
    }

    const dataToSave = flattenQuestionData(newQuestion);
    
    await addDoc(collection(db, questionsCollectionPath), dataToSave);
    // Re-fetch after duplication
    if (isAuthReady && user) {
        const qSnapshot = await getDocs(collection(db, questionsCollectionPath));
        const questionsData = qSnapshot.docs.map(restructureQuestionData).filter(Boolean);
        setQuestions(questionsData);
    }
    alert('Question duplicated.');
  };

  const handleBulkDifficultyChange = async (newDifficulty) => {
    if (selectedQuestionIds.length === 0) return;

    const batch = writeBatch(db);
    selectedQuestionIds.forEach(id => {
      const questionRef = doc(db, questionsCollectionPath, id);
      batch.update(questionRef, { difficulty: newDifficulty });
    });

    await batch.commit();

    setQuestions(prev => prev.map(q => 
        selectedQuestionIds.includes(q.id) ? { ...q, difficulty: newDifficulty } : q
    ));
    
    setSelectedQuestionIds([]);
    alert(`${selectedQuestionIds.length} questions updated to difficulty ${newDifficulty}.`);
  };

  const handleBulkAddTags = async (tagsToAdd) => {
    if (selectedQuestionIds.length === 0 || tagsToAdd.length === 0) return;

    const batch = writeBatch(db);
    selectedQuestionIds.forEach(id => {
      const questionRef = doc(db, questionsCollectionPath, id);
      batch.update(questionRef, { tags: arrayUnion(...tagsToAdd) });
    });

    await batch.commit();
    
    setQuestions(prev => prev.map(q => {
      if (selectedQuestionIds.includes(q.id)) {
        const newTags = new Set([...(q.tags || []), ...tagsToAdd]);
        return { ...q, tags: Array.from(newTags) };
      }
      return q;
    }));

    setSelectedQuestionIds([]);
    alert(`${tagsToAdd.length} tag(s) added to ${selectedQuestionIds.length} questions.`);
  };

  if (loading) return <p>Loading questions...</p>;
  if (!user) return <p>Please log in to manage the question bank.</p>; // Show a message if not logged in

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Question Bank Manager</h2>
      
      {selectedQuestionIds.length > 0 && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded-md flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold">{selectedQuestionIds.length} selected</span>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsDifficultyModalOpen(true)} className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm">
                    Change Difficulty
                </button>
                <button 
                    onClick={() => setIsAddTagsModalOpen(true)} 
                    disabled={selectedSection === 'All'}
                    className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title={selectedSection === 'All' ? "Please filter by a single section to add tags" : ""}
                >
                    Add Tags
                </button>
                <button onClick={handleBulkDelete} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm">
                    Delete Selected
                </button>
            </div>
        </div>
      )}

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Search question text..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-md"/>
            <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="p-2 border rounded-md">
                <option value="All">All Difficulties</option>
                {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
             <select onChange={(e) => setSelectedSection(e.target.value)} value={selectedSection} className="p-2 border rounded-md">
                <option>All</option>
                <option>Quantitative</option>
                <option>Verbal</option>
                <option>DataInsights</option>
            </select>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center p-2 bg-gray-100 font-semibold rounded-t-lg">
            <input type="checkbox" onChange={handleSelectAll} checked={selectedQuestionIds.length === filteredQuestions.length && filteredQuestions.length > 0} className="mr-4"/>
            <div className="flex-1">Question</div>
            <div className="w-48 text-center">Info</div>
            <div className="w-24 text-right">Actions</div>
        </div>
      
        {filteredQuestions.map(question => {
            const stats = analyticsData[question.id];
            const accuracy = stats && stats.answered > 0 ? (stats.correct / stats.answered) * 100 : null;
            const avgTime = stats && stats.answered > 0 ? (stats.totalTime / stats.answered) : null;

            return (
                <div key={question.id} className="flex items-center p-2 border-b hover:bg-gray-50">
                    <input type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={() => handleSelectQuestion(question.id)} className="mr-4"/>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{question.content?.questionText?.map(t => t.value).join('')}</p>
                         <div className="flex flex-wrap gap-1 mt-1">
                          {question.tags?.map(tag => <span key={tag} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">{tag}</span>)}
                        </div>
                    </div>
                    <div className="w-48 text-center text-xs text-gray-500">
                        <p>Answered: {stats?.answered || 0} times</p>
                        {accuracy !== null && <p>Accuracy: {accuracy.toFixed(0)}%</p>}
                        {avgTime !== null && <p>Avg. Time: {avgTime.toFixed(1)}s</p>}
                    </div>
                    <div className="w-24 text-right">
                        <button onClick={() => handleDuplicate(question.id)} className="text-blue-500 hover:text-blue-700 mr-2">Duplicate</button>
                        <button onClick={() => handleDelete(question.id)} className="text-red-500 hover:text-red-700">Delete</button>
                    </div>
                </div>
            );
        })}
      </div>

      <BulkAddTagsModal
        isOpen={isAddTagsModalOpen}
        onClose={() => setIsAddTagsModalOpen(false)}
        onConfirm={handleBulkAddTags}
        selectedCount={selectedQuestionIds.length}
        section={selectedSection}
      />
      <BulkDifficultyModal
            isOpen={isDifficultyModalOpen}
            onClose={() => setIsDifficultyModalOpen(false)}
            onConfirm={handleBulkDifficultyChange}
            selectedCount={selectedQuestionIds.length}
        />
    </div>
  );
};

export default QuestionBankManager;