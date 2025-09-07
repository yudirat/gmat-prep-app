// This component manages the flow of a full mock GMAT exam, presenting sections sequentially.
import React, { useState } from 'react';
import TestTaker from './TestTaker';
import { calculateTotalScore } from '../../utils';

/**
 * Component to manage the flow of a full mock GMAT exam.
 * It presents each section (Quant, Verbal, Data Insights) sequentially and calculates the final score.
 */
export default function MockGmatFlow({ user, questions, passages, msrSets, graphicStimuli, tableStimuli, onMockComplete }) {
    // State to track the current section and store results of completed sections
    const [currentSection, setCurrentSection] = useState(0);
    const [sectionResults, setSectionResults] = useState([]);
    // Define the order of sections in the mock exam
    const sections = ['Quant', 'Verbal', 'Data Insights'];

    /**
     * Handles the completion of a single section of the mock test.
     * Stores the results and either moves to the next section or calculates the final mock score.
     * @param {object} results - The results object for the completed section.
     */
    const handleSectionComplete = (results) => {
        const newResults = [...sectionResults, results];
        setSectionResults(newResults);
        if (currentSection < sections.length - 1) {
            setCurrentSection(currentSection + 1);
        } else {
            // Mock test is complete, calculate final score
            const quantScore = newResults.find(r => r.testType === 'Quant')?.score || 60;
            const verbalScore = newResults.find(r => r.testType === 'Verbal')?.score || 60;
            const diScore = newResults.find(r => r.testType === 'Data Insights')?.score || 60;
            
            // Simplified total score calculation
            const totalScore = calculateTotalScore(quantScore, verbalScore, diScore);

            onMockComplete({
                testType: 'Full Mock Exam',
                score: totalScore,
                sections: newResults,
                timeTaken: newResults.reduce((acc, r) => acc + r.timeTaken, 0)
            });
        }
    };
    
    // Display a message while calculating the final score after all sections are done
    if (currentSection >= sections.length) {
        return <div>Calculating final score...</div>
    }

    return (
        <div>
            {/* Render the TestTaker component for the current section */}
            <TestTaker 
                key={sections[currentSection]} // Key ensures component remounts for each section
                user={user} 
                questions={questions}
                passages={passages}
                msrSets={msrSets}
                graphicStimuli={graphicStimuli}
                tableStimuli={tableStimuli}
                onTestComplete={handleSectionComplete}
                testType={sections[currentSection]}
            />
        </div>
    );
}