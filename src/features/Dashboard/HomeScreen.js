// This component serves as the home screen of the application, providing navigation to different test and practice sections.
import React, { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, appId } from '../../firebase';

/**
 * HomeScreen component acts as the main landing page for the application.
 * It displays options to start different types of tests (mock, sectional) and navigate to the practice hub,
 * with buttons enabled/disabled based on available questions and user attempt limits.
 */
export default function HomeScreen({ userRole, onStartTest, onStartPractice, onStartMock, appSettings, questions, userProfile }) {
    // State for test limits and loading status
    const [testLimits, setTestLimits] = useState(null);
    const [loadingLimits, setLoadingLimits] = useState(true);

    // Effect to fetch the test limits from Firestore
    useEffect(() => {
        const limitsRef = doc(db, `artifacts/${appId}/public/data/appSettings`, 'testLimits');
        const unsubscribe = onSnapshot(limitsRef, (docSnap) => {
            if (docSnap.exists()) {
                setTestLimits(docSnap.data());
            } else {
                // Set default limits if none are found in the database
                setTestLimits({ quantLimit: 5, verbalLimit: 5, diLimit: 5, mockLimit: 3 });
            }
            setLoadingLimits(false);
        });
        return () => unsubscribe();
    }, []);

    // --- Check for Test Readiness ---
    // Minimum number of unseen questions required to start a test section
    const MIN_QUANT_QUESTIONS = 21;
    const MIN_VERBAL_QUESTIONS = 23;
    const MIN_DI_QUESTIONS = 20;

    // Filter out questions already seen by the user
    const seenIds = userProfile?.seenQuestionIds || [];
    const unseenQuestions = questions.filter(q => !seenIds.includes(q.id));

    // Count available unseen questions for each section
    const quantCount = unseenQuestions.filter(q => q.type === 'Quant').length;
    const verbalCount = unseenQuestions.filter(q => q.type === 'Verbal').length;
    const diCount = unseenQuestions.filter(q => q.type === 'Data Insights').length;

    // Check if enough unseen questions are available for each section
    const hasEnoughQuant = quantCount >= MIN_QUANT_QUESTIONS;
    const hasEnoughVerbal = verbalCount >= MIN_VERBAL_QUESTIONS;
    const hasEnoughDI = diCount >= MIN_DI_QUESTIONS;

    // Check user's remaining attempt limits for each test type
    const attempts = userProfile?.testAttempts || {};
    const quantAttemptsLeft = (testLimits?.quantLimit || 0) - (attempts.Quant || 0) > 0;
    const verbalAttemptsLeft = (testLimits?.verbalLimit || 0) - (attempts.Verbal || 0) > 0;
    const diAttemptsLeft = (testLimits?.diLimit || 0) - (attempts['Data Insights'] || 0) > 0;
    const mockAttemptsLeft = (testLimits?.mockLimit || 0) - (attempts['Full Mock Exam'] || 0) > 0;

    // Determine if test start buttons should be enabled based on question availability and attempt limits
    const isQuantReady = hasEnoughQuant && quantAttemptsLeft;
    const isVerbalReady = hasEnoughVerbal && verbalAttemptsLeft;
    const isDiReady = hasEnoughDI && diAttemptsLeft;
    const isMockReady = hasEnoughQuant && hasEnoughVerbal && hasEnoughDI && mockAttemptsLeft;

    // --- Tooltip Messages ---
    /**
     * Generates a tooltip message for disabled test buttons.
     * @param {boolean} hasEnough - True if enough questions are available.
     * @param {boolean} attemptsLeft - True if attempts are remaining.
     * @param {number|string} required - The number of required questions or 'all' for mock.
     * @param {string} type - The type of section (e.g., 'Quant', 'Verbal', 'sections').
     * @returns {string} The tooltip message.
     */
    const getTooltip = (hasEnough, attemptsLeft, required, type) => {
        if (!attemptsLeft) return "You have reached the maximum number of attempts for this test.";
        if (!hasEnough) return `Not enough new questions available. Requires ${required} unseen ${type} questions.`;
        return "Start the test";
    };
    
    if (loadingLimits) {
        return <div>Loading test settings...</div>;
    }

    return (
        <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to GMAT Focus Adaptive Prep</h1>
            <p className="text-lg text-gray-600 mb-8">Your role is: <span className="font-semibold text-indigo-600">{userRole}</span></p>
            
            {/* Full Length Mock Exam Section */}
            {appSettings.isMockTestActive && (
                <div className="max-w-md mx-auto mb-12">
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                         <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Full Length Mock Exam</h2>
                         <p className="text-gray-600 mb-6">Simulate the complete GMAT Focus Edition experience.</p>
                         <button 
                             onClick={onStartMock} 
                             disabled={!isMockReady} 
                             className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors text-lg disabled:bg-gray-400 disabled:cursor-not-allowed" 
                             title={getTooltip(isMockReady, mockAttemptsLeft, 'all', 'sections')}
                         >
                             Start Full Mock Test
                         </button>
                    </div>
                </div>
            )}

            {/* Sectional Tests Section */}
            {appSettings.isSectionalTestActive && (
                <>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">Or, focus on a specific section:</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                            <h2 className="text-xl font-semibold text-indigo-700 mb-4">Quantitative Reasoning</h2>
                            <button 
                                onClick={() => onStartTest('Quant')} 
                                disabled={!isQuantReady} 
                                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" 
                                title={getTooltip(hasEnoughQuant, quantAttemptsLeft, MIN_QUANT_QUESTIONS, 'Quant')}
                            >
                                Start Quant Section
                            </button>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                            <h2 className="text-xl font-semibold text-purple-700 mb-4">Verbal Reasoning</h2>
                            <button 
                                onClick={() => onStartTest('Verbal')} 
                                disabled={!isVerbalReady} 
                                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" 
                                title={getTooltip(hasEnoughVerbal, verbalAttemptsLeft, MIN_VERBAL_QUESTIONS, 'Verbal')}
                            >
                                Start Verbal Section
                            </button>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                            <h2 className="text-xl font-semibold text-teal-700 mb-4">Data Insights</h2>
                            <button 
                                onClick={() => onStartTest('Data Insights')} 
                                disabled={!isDiReady} 
                                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" 
                                title={getTooltip(hasEnoughDI, diAttemptsLeft, MIN_DI_QUESTIONS, 'Data Insights')}
                            >
                                Start DI Section
                            </button>
                        </div>
                    </div>
                </>
            )}
            {/* Practice Hub Section */}
             {appSettings.isPracticeHubActive && (
                <div className="mt-12">
                    <button onClick={onStartPractice} className="bg-gray-700 text-white py-3 px-8 rounded-md hover:bg-gray-800 transition-colors text-lg">
                        Go to Practice Hub
                    </button>
                </div>
             )}
        </div>
    );
}