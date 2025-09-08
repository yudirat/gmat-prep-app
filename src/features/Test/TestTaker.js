import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/Modal';
import MathText from '../../components/MathText';
import ContentRenderer from '../../components/ContentRenderer';
import { useDataFromContext as useData } from '../../contexts/DataContext';
import { useUser } from '../../contexts/UserContext';

/**
 * Component for taking a test section (Quant, Verbal, Data Insights).
 * Manages question presentation, answer handling, scoring, and test flow.
 */
export default function TestTaker({ onTestComplete, testType }) {
    const { user, userProfile } = useUser();
    const { questions, passages, msrSets, graphicStimuli, tableStimuli, isLoading } = useData();
    // State for test progression and data
    const [currentDifficulty, setCurrentDifficulty] = useState(3);
    const [answers, setAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
    const [isTestStarted, setIsTestStarted] = useState(false);
    const [showStartModal, setShowStartModal] = useState(true);
    const [testPlan, setTestPlan] = useState([]); // Array of questions/stimuli for the test
    const [planIndex, setPlanIndex] = useState(0); // Current position in the test plan
    const [currentItem, setCurrentItem] = useState(null); // The current question or stimulus set
    const [questionWithinItemIndex, setQuestionWithinItemIndex] = useState(0); // For multi-question items (e.g., passages)
    const [activeTab, setActiveTab] = useState(0); // For MSR questions with multiple tabs
    const [multiPartAnswers, setMultiPartAnswers] = useState({}); // For multi-part question formats
    const [sortedTable, setSortedTable] = useState(null); // For sortable tables in Data Insights
    const [newlySeenIds, setNewlySeenIds] = useState([]); // To track questions seen in this test session

    /**
     * Calculates the scaled score based on correct answers and their difficulties.
     * @param {Array} finalAnswers - Array of answered questions with correctness and difficulty.
     * @returns {number} The calculated scaled score (60-90).
     */
    const calculateScore = (finalAnswers) => {
        if(finalAnswers.length === 0) return 60;
        
        const rawScore = finalAnswers
            .filter(a => a.isCorrect)
            .reduce((sum, a) => sum + a.difficulty, 0);

        const maxRawScore = finalAnswers
            .reduce((sum, a) => sum + a.difficulty, 0);
        
        if (maxRawScore === 0) return 60;

        const percentageScore = rawScore / maxRawScore;
        const scaledScore = Math.round(60 + (percentageScore * 30));

        return scaledScore;
    };

    /**
     * Concludes the test, calculates the final score, and reports results.
     * @param {Array} finalAnswers - The answers to be used for scoring (defaults to current answers state).
     */
    const endTest = useCallback((finalAnswers = answers) => {
        if (!isTestStarted) return;
        setIsTestStarted(false);
        onTestComplete({ 
            answers: finalAnswers, 
            score: calculateScore(finalAnswers), 
            timeTaken: (45 * 60) - timeLeft, 
            testType: testType,
            seenQuestionIds: newlySeenIds 
        });
    }, [answers, isTestStarted, onTestComplete, timeLeft, testType, newlySeenIds]);

    // Effect to generate the test plan based on test type and unseen questions
    useEffect(() => {
        if (!isTestStarted || isLoading) return;
        
        const seenIds = userProfile?.seenQuestionIds || [];
        const unseenQuestions = questions.filter(q => !seenIds.includes(q.id));

        let availableItems = [];
        if (testType === 'Verbal') {
            const passageMap = new Map(passages.map(p => [p.id, { ...p, questions: [], itemType: 'passage' }]));
            unseenQuestions.filter(q => q.type === 'Verbal' && q.passageId).forEach(q => { if (passageMap.has(q.passageId)) passageMap.get(q.passageId).questions.push(q); });
            availableItems = Array.from(passageMap.values()).filter(p => p.questions.length > 0);
        } else if (testType === 'Data Insights' || testType === 'Quant') {
            const msrMap = new Map(msrSets.map(s => [s.id, { ...s, questions: [], itemType: 'msr' }]));
            unseenQuestions.filter(q => q.msrSetId).forEach(q => { if (msrMap.has(q.msrSetId)) msrMap.get(q.msrSetId).questions.push(q); });
            
            const graphicMap = new Map(graphicStimuli.map(g => [g.id, { ...g, questions: [], itemType: 'graphic' }]));
            unseenQuestions.filter(q => q.graphicStimulusId).forEach(q => { if (graphicMap.has(q.graphicStimulusId)) graphicMap.get(q.graphicStimulusId).questions.push(q); });

            const tableMap = new Map(tableStimuli.map(t => [t.id, { ...t, questions: [], itemType: 'table' }]));
            unseenQuestions.filter(q => q.tableStimulusId).forEach(q => { if (tableMap.has(q.tableStimulusId)) tableMap.get(q.tableStimulusId).questions.push(q); });

            const singleQuestions = unseenQuestions.filter(q => q.type === testType && !q.msrSetId && !q.passageId && !q.graphicStimulusId && !q.tableStimulusId).map(q => ({...q, itemType: 'single'}));
            
            availableItems = [
                ...Array.from(msrMap.values()).filter(s => s.questions.length > 0), 
                ...Array.from(graphicMap.values()).filter(g => g.questions.length > 0),
                ...Array.from(tableMap.values()).filter(t => t.questions.length > 0),
                ...singleQuestions
            ];
        }
        
        availableItems.forEach(item => {
            if(item.itemType !== 'single') item.difficulty = item.questions.reduce((acc, q) => acc + q.difficulty, 0) / item.questions.length;
        });
        setTestPlan(availableItems);
    }, [isTestStarted, questions, passages, msrSets, graphicStimuli, tableStimuli, testType, userProfile, isLoading]);

    /**
     * Selects the next item (question or stimulus set) from the test plan.
     * Ends the test if no more items or question limit is reached.
     */
    const selectNextItem = useCallback(() => {
        if (planIndex >= testPlan.length || answers.length >= 21) {
            endTest();
            return;
        }
        const nextItem = testPlan[planIndex];
        setCurrentItem(nextItem);
        setQuestionWithinItemIndex(0);
        setActiveTab(0);
        setSortedTable(null);
        const firstQuestion = nextItem.itemType === 'single' ? nextItem : nextItem.questions[0];
        if (firstQuestion && (firstQuestion.format !== 'mcq')) {
            setMultiPartAnswers({});
        }
    }, [testPlan, planIndex, answers, endTest]);

    // Effect to select the first item when the test starts and plan is ready
    useEffect(() => {
        if(isTestStarted && testPlan.length > 0){ selectNextItem(); }
    }, [isTestStarted, testPlan, selectNextItem]);
    
    // Effect to select the next item when the planIndex changes (i.e., question answered)
    useEffect(() => {
        if (isTestStarted && planIndex > 0) { selectNextItem(); }
    }, [planIndex, isTestStarted, selectNextItem]);

    // Effect for the test timer
    useEffect(() => {
        const timer = setInterval(() => { if (isTestStarted) setTimeLeft(prev => prev > 0 ? prev - 1 : 0); }, 1000);
        if (timeLeft === 0 && isTestStarted) endTest();
        return () => clearInterval(timer);
    }, [isTestStarted, timeLeft, endTest]);

    /**
     * Starts the test and closes the start modal.
     */
    const startTest = () => { setIsTestStarted(true); setShowStartModal(false); };

    /**
     * Handles a user's answer to the current question.
     * Updates answers, adjusts difficulty, and moves to the next question/item.
     * @param {any} selectedAnswer - The user's selected answer(s).
     */
    const handleAnswer = (selectedAnswer) => {
        const isComplexItem = currentItem.itemType !== 'single';
        const currentQuestion = isComplexItem ? currentItem.questions[questionWithinItemIndex] : currentItem;
        
        setNewlySeenIds(prev => [...prev, currentQuestion.id]);

        let isCorrect = false;
        if (currentQuestion.format === 'either-or' || currentQuestion.format === 'table-classification') {
            isCorrect = currentQuestion.correctAnswers.every((ans, i) => ans === selectedAnswer[i]);
        } else if (currentQuestion.format === 'fill-in-the-blank') {
            isCorrect = currentQuestion.dropdowns.every((dd, i) => dd.correctAnswer === selectedAnswer[i]);
        }
        else if (currentQuestion.format === 'two-part-analysis') {
            isCorrect = currentQuestion.correctAnswers[0] === selectedAnswer.part1 && currentQuestion.correctAnswers[1] === selectedAnswer.part2;
        } else {
            isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        }
        
        const newAnswers = [...answers, { ...currentQuestion, selectedAnswer, isCorrect }];
        setAnswers(newAnswers);

        // Adaptive difficulty adjustment logic
        const weight = currentQuestion.difficulty;
        const scalingFactor = 0.75;
        const difficultyAdjustment = isCorrect
            ? (weight / 5) * scalingFactor
            : -((6 - weight) / 5) * scalingFactor;

        const newDifficulty = Math.max(1, Math.min(5, currentDifficulty + difficultyAdjustment));
        setCurrentDifficulty(newDifficulty);

        // Move to the next question within a complex item or to the next item
        if (isComplexItem && questionWithinItemIndex < currentItem.questions.length - 1) {
            setQuestionWithinItemIndex(prev => prev + 1);
        } else {
            setPlanIndex(prev => prev + 1);
        }
    };
    
    /**
     * Renders a table from provided data.
     * @param {Array<Array<string>>} tableData - The 2D array representing the table.
     * @returns {JSX.Element} The rendered table.
     */
    const renderTable = (tableData) => {
        if (!Array.isArray(tableData) || !Array.isArray(tableData[0])) return null;
        return (
            <table className="w-full text-sm border-collapse my-2">
                <tbody>{tableData.map((row, i) => (<tr key={i} className={i===0 ? "bg-gray-200 font-semibold" : "bg-white"}>{row.map((cell, j) => <td key={j} className="p-2 border border-gray-300">{cell}</td>)}</tr>))}</tbody>
            </table>
        );
    };
    
    /**
     * Handles sorting of columns in a table stimulus.
     * @param {number} colIndex - The index of the column to sort.
     */
    const handleSort = (colIndex) => {
        const newSortedTable = { ...sortedTable };
        const currentDirection = newSortedTable.direction === 'asc' ? 'desc' : 'asc';
        
        const sortedRows = [...(sortedTable.rows || currentItem.rows)].sort((a, b) => {
            const valA = a[colIndex];
            const valB = b[colIndex];
            
            const numA = parseFloat(valA.replace(/[^0-9.-]+/g,""));
            const numB = parseFloat(valB.replace(/[^0-9.-]+/g,""));

            let comparison = 0;
            if (!isNaN(numA) && !isNaN(numB)) {
                comparison = numA > numB ? 1 : -1;
            } else {
                comparison = valA.localeCompare(valB);
            }
            return currentDirection === 'asc' ? comparison : -comparison;
        });

        setSortedTable({ rows: sortedRows, sortCol: colIndex, direction: currentDirection });
    };

    // Render start modal or loading screen if test not ready
    if (showStartModal) return <Modal isOpen={true} onClose={() => {}} title={`Prepare for ${testType} Test`}><p className="text-gray-700 mb-6">You will have 45 minutes to complete this section. The test is adaptive. Good luck!</p><button onClick={startTest} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">Start Test</button></Modal>;
    if (!currentItem || isLoading) return <div className="text-center p-8"><h2 className="text-2xl font-semibold">Loading Test...</h2><p>{testPlan.length > 0 ? "Getting your first question ready." : `There are no ${testType} questions yet.`}</p></div>;

    const { itemType } = currentItem;
    const currentQuestion = itemType === 'single' ? currentItem : currentItem.questions[questionWithinItemIndex];

    /**
     * Renders the main body of the question based on its format.
     */
    const renderQuestionBody = () => {
        switch(currentQuestion.format) {
            case 'either-or': {
                const labels = currentQuestion.labels || ['True', 'False'];
                const handleSubmit = () => { const submittedAnswers = currentQuestion.statements.map((_, i) => multiPartAnswers[i] === true); handleAnswer(submittedAnswers); };
                return (
                    <div>
                        <p className="text-lg text-gray-800 mb-6 whitespace-pre-wrap"><MathText text={currentQuestion.questionText} /></p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center font-semibold text-center text-sm text-gray-600">
                                <span></span>
                                <span>{labels[0]}</span>
                                <span>{labels[1]}</span>
                            </div>
                            {currentQuestion.statements.map((stmt, i) => (
                                <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center p-3 bg-gray-100 rounded-lg">
                                    <p><MathText text={stmt} /></p>
                                    <div className="text-center"><input type="radio" name={`stmt-${i}`} onChange={() => setMultiPartAnswers({...multiPartAnswers, [i]: true})} /></div>
                                    <div className="text-center"><input type="radio" name={`stmt-${i}`} onChange={() => setMultiPartAnswers({...multiPartAnswers, [i]: false})} /></div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSubmit} className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">Submit Answer</button>
                    </div>
                );
            }
            case 'table-classification': {
                const handleSubmit = () => { const submittedAnswers = currentQuestion.itemsToClassify.map((_, i) => multiPartAnswers[i] ?? 0); handleAnswer(submittedAnswers); }
                return (
                    <div>
                        <p className="text-lg text-gray-800 mb-6 whitespace-pre-wrap"><MathText text={currentQuestion.questionText} /></p>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="p-2 border border-gray-300 text-left"></th>
                                    {currentQuestion.classificationLabels.map((label, i) => <th key={i} className="p-2 border border-gray-300 text-center"><MathText text={label} /></th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {currentQuestion.itemsToClassify.map((item, itemIndex) => (
                                    <tr key={itemIndex}>
                                        <td className="p-2 border border-gray-300 font-semibold"><MathText text={item} /></td>
                                        {currentQuestion.classificationLabels.map((_, labelIndex) => (
                                            <td key={labelIndex} className="p-2 border border-gray-300 text-center"><input type="radio" name={`item-${itemIndex}`} onChange={() => setMultiPartAnswers({...multiPartAnswers, [itemIndex]: labelIndex})} /></td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={handleSubmit} className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">Submit Answer</button>
                    </div>
                );
            }
            case 'two-part-analysis': {
                const handleSubmit = () => { handleAnswer({part1: multiPartAnswers.part1, part2: multiPartAnswers.part2}); }
                return (
                    <div>
                        <p className="text-lg text-gray-800 mb-6 whitespace-pre-wrap"><MathText text={currentQuestion.questionText} /></p>
                        <div className="grid grid-cols-2 border border-gray-300">
                            <div className="p-2 border-r border-gray-300">
                                <h4 className="font-semibold text-center mb-2"><MathText text={currentQuestion.part1Prompt} /></h4>
                                <div className="space-y-2">
                                    {currentQuestion.part1Options.map((opt, i) => (
                                        <label key={i} className="flex items-center space-x-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-indigo-100">
                                            <input type="radio" name="part1" onChange={() => setMultiPartAnswers({...multiPartAnswers, part1: i})} />
                                            <span><MathText text={opt} /></span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="p-2">
                                <h4 className="font-semibold text-center mb-2"><MathText text={currentQuestion.part2Prompt} /></h4>
                                <div className="space-y-2">
                                    {currentQuestion.part2Options.map((opt, i) => (
                                        <label key={i} className="flex items-center space-x-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-indigo-100">
                                            <input type="radio" name="part2" onChange={() => setMultiPartAnswers({...multiPartAnswers, part2: i})} />
                                            <span><MathText text={opt} /></span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSubmit} className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">Submit Answer</button>
                    </div>
                );
            }
            case 'fill-in-the-blank': {
                const handleSubmit = () => {
                    const submittedAnswers = currentQuestion.dropdowns.map((_, i) => multiPartAnswers[i] ?? 0);
                    handleAnswer(submittedAnswers);
                }
                return (
                    <div>
                        <div className="text-lg text-gray-800 mb-6 flex flex-wrap items-center gap-x-2">
                            {currentQuestion.questionParts.map((part, i) => 
                                part.type === 'text' ? 
                                    <span key={i}><MathText text={part.value} /></span> : 
                                    <select key={i} className="p-1 border rounded" onChange={(e) => setMultiPartAnswers({...multiPartAnswers, [part.value]: Number(e.target.value)})}><option>Select...</option>{currentQuestion.dropdowns[part.value].options.map((opt, optIndex) => <option key={optIndex} value={optIndex}>{opt}</option>)}</select>
                            )}
                        </div>
                        <button onClick={handleSubmit} className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">Submit Answer</button>
                    </div>
                );
            }
            default: // MCQ
                return (
                    <div>
                        <div className="text-lg text-gray-800 mb-6">
                            {itemType !== 'single' && `(${questionWithinItemIndex + 1}/${currentItem.questions.length}) `}
                            <ContentRenderer content={currentQuestion.questionText} />
                        </div>
                        <div className="space-y-4">
                            {currentQuestion.options.map((option, index) => (
                                <button key={index} onClick={() => handleAnswer(index)} className="w-full text-left p-4 bg-gray-100 rounded-lg hover:bg-indigo-100 border border-gray-200 hover:border-indigo-300 transition-colors">
                                    <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                                    <ContentRenderer content={option} />
                                </button>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    /**
     * Renders the stimulus content (passage, MSR, graphic, or table) based on the item type.
     */
    const renderStimulus = () => {
        switch(itemType) {
            case 'passage': 
                return (
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="font-semibold mb-2 text-gray-500">Passage</h3>
                        <div className="text-sm text-gray-700 max-h-[60vh] overflow-y-auto pr-2">
                            <ContentRenderer content={currentItem.passageText} />
                        </div>
                    </div>
                );
            case 'msr': 
                return (
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="border-b border-gray-200 mb-4">
                            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                {currentItem.tabs.map((tab, index) => (
                                    <button 
                                        key={index} 
                                        onClick={() => setActiveTab(index)} 
                                        className={`${activeTab === index ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        {tab.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                            {currentItem.tabs[activeTab].content.map((block, index) => {
                                if (block.type === 'text') return <p key={index} className="text-sm text-gray-700 whitespace-pre-wrap">{block.value}</p>;
                                if (block.type === 'image') return <img key={index} src={block.value} onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/eee/ccc?text=Image+Not+Found'; }} alt="MSR Content" className="w-full h-auto rounded"/>;
                                if (block.type === 'table') return renderTable(block.value);
                                return null;
                            })}
                        </div>
                    </div>
                );
            case 'graphic': 
                return (
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <img src={currentItem.image} onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/eee/ccc?text=Image+Not+Found'; }} alt="Graphic Stimulus" className="w-full h-auto rounded mb-4"/>
                        <div className="text-sm text-gray-700 italic">
                            <ContentRenderer content={currentItem.blurb} />
                        </div>
                    </div>
                );
            case 'table': {
                const tableData = sortedTable ? sortedTable.rows : currentItem.rows;
                return (
                    <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    {currentItem.headers.map((h, i) => (
                                        <th key={i} className="p-2 border text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort(i)}>
                                            {h}
                                            {sortedTable && sortedTable.sortCol === i && (<span>{sortedTable.direction === 'asc' ? ' ▲' : ' ▼'}</span>)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((row, rI) => (
                                    <tr key={rI} className="border-t">
                                        {row.map((cell, cI) => <td key={cI} className="p-2 border">{cell}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            default: return null;
        }
    }

    return (
        <div>
            {/* Test header with section name, timer, and question count */}
            <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow">
                <div className="text-lg font-semibold">{testType} Section</div>
                <div className="text-lg font-mono bg-gray-200 px-3 py-1 rounded">{Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}</div>
                <div className="text-lg">Question {answers.length + 1} / 21</div>
            </div>
            {/* Main content area, aplit into stimulus and question body */}
            <div className={`grid gap-6 ${itemType !== 'single' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {renderStimulus()}
                <div className="bg-white p-8 rounded-lg shadow-lg">{renderQuestionBody()}</div>
            </div>
        </div>
    );
}