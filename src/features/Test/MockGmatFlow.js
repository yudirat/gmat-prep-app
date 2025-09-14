import React, { useState } from 'react';
import useCollectionData from '../../hooks/useCollectionData';
import TestTaker from './TestTaker';
import ResultsScreen from '../Results/ResultsScreen';

const MockGmatFlow = () => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [testResults, setTestResults] = useState([]);
  const { data: allQuestions, loading, error } = useCollectionData('questions'); // Fetch all questions

  const sections = ['Quantitative', 'Verbal', 'Data Insights'];

  const handleFinishSection = (results) => {
    setTestResults(prev => [...prev, { section: sections[currentSectionIndex], results }]);
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      // Mark the test as finished
      setCurrentSectionIndex(-1); // Use -1 to indicate completion
    }
  };

  if (loading) {
    return <div>Loading questions, please wait...</div>;
  }

  if (error) {
    return <div>Error loading questions: {error.message}</div>;
  }

  // If the test is finished, show the results screen
  if (currentSectionIndex === -1) {
    return <ResultsScreen results={testResults} />;
  }

  return (
    <div>
      <h2>{sections[currentSectionIndex]} Section</h2>
      <TestTaker
        key={currentSectionIndex} // Use key to re-mount the component for each section
        section={sections[currentSectionIndex]}
        onFinishSection={handleFinishSection}
        allQuestions={allQuestions} // Pass all questions down as a prop
      />
    </div>
  );
};

export default MockGmatFlow;