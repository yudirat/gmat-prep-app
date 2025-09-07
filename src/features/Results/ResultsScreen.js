// This component displays the results of a completed test.
import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import MathText from '../../components/MathText';

/**
 * Component to display the results of a completed test.
 * It shows the score, time taken, accuracy, performance by difficulty, and a detailed question review.
 */
export default function ResultsScreen({ results, onRestart }) {
    if (!results) return <div>Loading results...</div>;
    const { answers, score, timeTaken, testType } = results;
    const correctCount = answers.filter(a => a.isCorrect).length;
    const chartData = answers.map((ans, index) => ({ name: `Q${index + 1}`, difficulty: ans.difficulty, correct: ans.isCorrect ? ans.difficulty : 0, incorrect: !ans.isCorrect ? ans.difficulty : 0 }));

    /**
     * Renders the detailed review for each question based on its format.
     * @param {object} ans - The answer object for a specific question.
     */
    const renderAnswerReview = (ans) => {
        switch(ans.format) {
            case 'either-or': {
                const labels = ans.labels || ['True', 'False'];
                return (
                    <div className="mt-2 space-y-1 text-sm">
                        {ans.statements.map((stmt, i) => (
                            <div key={i} className={`pl-4 border-l-2 ${ans.correctAnswers[i] === ans.selectedAnswer[i] ? 'border-green-500' : 'border-red-500'}`}>
                                <p className="text-gray-600"><MathText text={stmt} /></p>
                                <p>Your answer: <span className={ans.correctAnswers[i] === ans.selectedAnswer[i] ? 'text-green-700' : 'text-red-700'}>{ans.selectedAnswer[i] ? labels[0] : labels[1]}</span>. Correct: <span className="text-green-700">{ans.correctAnswers[i] ? labels[0] : labels[1]}</span></p>
                            </div>
                        ))}
                    </div>
                );
            }
            case 'table-classification': {
                return (
                    <table className="w-full text-sm border-collapse my-2">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 border border-gray-300 text-left">Item</th>
                                <th className="p-2 border border-gray-300 text-center">Your Answer</th>
                                <th className="p-2 border border-gray-300 text-center">Correct Answer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ans.itemsToClassify.map((item, i) => (
                                <tr key={i} className={ans.correctAnswers[i] === ans.selectedAnswer[i] ? 'bg-green-50' : 'bg-red-50'}>
                                    <td className="p-2 border border-gray-300"><MathText text={item} /></td>
                                    <td className="p-2 border border-gray-300 text-center"><MathText text={ans.classificationLabels[ans.selectedAnswer[i]]} /></td>
                                    <td className="p-2 border border-gray-300 text-center"><MathText text={ans.classificationLabels[ans.correctAnswers[i]]} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            }
            case 'two-part-analysis': {
                const part1Correct = ans.correctAnswers[0] === ans.selectedAnswer.part1;
                const part2Correct = ans.correctAnswers[1] === ans.selectedAnswer.part2;
                return (
                    <div className="mt-2 space-y-2 text-sm">
                        <div className={`p-2 rounded ${part1Correct ? 'bg-green-100' : 'bg-red-100'}`}>
                            <p className="font-semibold"><MathText text={ans.part1Prompt} /></p>
                            <p>Your answer: <MathText text={ans.part1Options[ans.selectedAnswer.part1]} /></p>
                            <p>Correct answer: <MathText text={ans.part1Options[ans.correctAnswers[0]]} /></p>
                        </div>
                        <div className={`p-2 rounded ${part2Correct ? 'bg-green-100' : 'bg-red-100'}`}>
                            <p className="font-semibold"><MathText text={ans.part2Prompt} /></p>
                            <p>Your answer: <MathText text={ans.part2Options[ans.selectedAnswer.part2]} /></p>
                            <p>Correct answer: <MathText text={ans.part2Options[ans.correctAnswers[1]]} /></p>
                        </div>
                    </div>
                );
            }
            case 'fill-in-the-blank': {
                 const correctAnswers = ans.dropdowns.map(d => d.correctAnswer);
                 return (
                    <div className="mt-2 text-sm">
                        Your Response: 
                        <div className="flex flex-wrap items-center gap-x-2 p-2 bg-gray-100 rounded">
                            {ans.questionParts.map((part, i) => 
                                part.type === 'text' ? 
                                    <span key={i}><MathText text={part.value} /></span> : 
                                    <span key={i} className={`px-2 py-1 rounded ${ans.selectedAnswer[part.value] === correctAnswers[part.value] ? 'bg-green-200' : 'bg-red-200'}`}>{ans.dropdowns[part.value].options[ans.selectedAnswer[part.value]]}</span>
                            )}
                        </div>
                        Correct Response: 
                        <div className="flex flex-wrap items-center gap-x-2 p-2 bg-green-50 rounded mt-1">
                            {ans.questionParts.map((part, i) => 
                                part.type === 'text' ? 
                                    <span key={i}><MathText text={part.value} /></span> : 
                                    <span key={i} className="px-2 py-1 rounded bg-green-200">{ans.dropdowns[part.value].options[correctAnswers[part.value]]}</span>
                            )}
                        </div>
                    </div>
                 );
            }
            default: // MCQ
                return (<p className="text-sm text-gray-600">Your answer: <span className={ans.isCorrect ? 'text-green-700' : 'text-red-700'}><MathText text={ans.options[ans.selectedAnswer]} /></span>. {!ans.isCorrect && <span> Correct: <span className="text-green-700"><MathText text={ans.options[ans.correctAnswer]} /></span></span>}</p>);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Test Results: {testType}</h2>
            {/* Display overall score */}
            <div className="text-center mb-8">
                <p className="text-5xl font-bold text-indigo-600">{score}</p>
                <p className="text-lg text-gray-600">Scaled Score (60-90)</p>
            </div>
            {/* Display key performance metrics */}
            <div className="grid md:grid-cols-3 gap-4 text-center mb-8">
                <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-2xl font-semibold">{correctCount} / {answers.length}</p>
                    <p className="text-gray-600">Correct Answers</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-2xl font-semibold">{Math.floor(timeTaken / 60)}m {timeTaken % 60}s</p>
                    <p className="text-gray-600">Time Taken</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-2xl font-semibold">{answers.length > 0 ? (correctCount / answers.length * 100).toFixed(1) : 0}%</p>
                    <p className="text-gray-600">Accuracy</p>
                </div>
            </div>
            {/* Performance by Question Difficulty Chart */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Performance by Question Difficulty</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 5]} label={{ value: 'Difficulty', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="correct" stackId="a" fill="#4ade80" name="Correct" />
                        <Bar dataKey="incorrect" stackId="a" fill="#f87171" name="Incorrect" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {/* Detailed Question Review */}
            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Question Review</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {answers.map((ans, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${ans.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                            {ans.format !== 'fill-in-the-blank' && <p className="font-semibold text-gray-800 mb-2">{index + 1}. <MathText text={ans.questionText} /></p>}
                            {renderAnswerReview(ans)}
                            <p className="text-xs text-gray-500 mt-1">Difficulty: {ans.difficulty}</p>
                        </div>
                    ))}
                </div>
            </div>
            {/* Back to Home button */}
            <div className="text-center mt-8">
                <button onClick={onRestart} className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors">Back to Home</button>
            </div>
        </div>
    );
}