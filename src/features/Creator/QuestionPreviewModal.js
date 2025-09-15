import React from 'react';
import Modal from '../../components/Modal';
import ContentRenderer from '../../components/ContentRenderer';

const DATA_SUFFICIENCY_OPTIONS = [
  "Statement (1) ALONE is sufficient, but statement (2) ALONE is not sufficient.",
  "Statement (2) ALONE is sufficient, but statement (1) ALONE is not sufficient.",
  "BOTH statements TOGETHER are sufficient, but NEITHER statement ALONE is sufficient.",
  "EACH statement ALONE is sufficient.",
  "Statements (1) and (2) TOGETHER are NOT sufficient."
];

/**
 * QuestionPreviewModal component displays a modal with a preview of a question.
 * It shows the question prompt, options (highlighting correct answers), difficulty, type, and categories.
 */
export default function QuestionPreviewModal({ isOpen, onClose, question }) {
    if (!question) return null;

    const renderContent = () => {
        switch (question.format) {
            case 'Two-Part Analysis':
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Main Prompt:</h3>
                            <div className="p-4 bg-gray-50 rounded-md">
                                <ContentRenderer content={question.questionText} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Question:</h3>
                            <table className="w-full text-center border">
                                <thead>
                                    <tr>
                                        <th className="p-2 border">Options</th>
                                        <th className="p-2 border">{question.part1Prompt || 'Column 1'}</th>
                                        <th className="p-2 border">{question.part2Prompt || 'Column 2'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(question.options || []).map((opt, optIndex) => (
                                        <tr key={optIndex}>
                                            <td className="p-2 border text-left">{opt}</td>
                                            <td className={`p-2 border ${question.correctAnswers && question.correctAnswers[0] === optIndex ? 'bg-green-100' : ''}`}>
                                                <input type="radio" name={`q_preview_part1`} checked={question.correctAnswers && question.correctAnswers[0] === optIndex} readOnly />
                                            </td>
                                            <td className={`p-2 border ${question.correctAnswers && question.correctAnswers[1] === optIndex ? 'bg-green-100' : ''}`}>
                                                <input type="radio" name={`q_preview_part2`} checked={question.correctAnswers && question.correctAnswers[1] === optIndex} readOnly />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'Data Sufficiency':
                const dsQuestionText = [
                    ...(Array.isArray(question.questionText) ? question.questionText : [{type: 'text', value: question.questionText}]),
                    { type: 'text', value: '<br/><p><strong>(1)</strong></p>' },
                    ...(Array.isArray(question.statement1) ? question.statement1 : [{type: 'text', value: question.statement1}]),
                    { type: 'text', value: '<br/><p><strong>(2)</strong></p>' },
                    ...(Array.isArray(question.statement2) ? question.statement2 : [{type: 'text', value: question.statement2}]),
                ];
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Question:</h3>
                            <div className="p-4 bg-gray-50 rounded-md">
                                <ContentRenderer content={dsQuestionText} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Options:</h3>
                            <div className="space-y-2">
                                {DATA_SUFFICIENCY_OPTIONS.map((opt, index) => (
                                    <div key={index} className={`p-3 border rounded-md ${question.correctAnswer === index ? 'bg-green-100 border-green-400' : 'bg-gray-50'}`}>
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'either-or':
                return (
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Statements</h3>
                        <div className="p-2 rounded-md bg-gray-50 space-y-2">
                            {(question.statements || []).map((stmt, index) => (
                                <div key={index} className={`p-2 border rounded-md ${question.correctAnswers[index] ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <p>{stmt}</p>
                                    <p className="text-xs font-bold">Correct Answer: {question.correctAnswers[index] ? question.labels[0] : question.labels[1]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'table-classification':
                return (
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Classification</h3>
                        <table className="w-full text-sm my-2 border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 border">Item</th>
                                    {(question.classificationLabels || []).map((label, index) => <th key={index} className="p-2 border">{label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {(question.itemsToClassify || []).map((item, itemIndex) => (
                                    <tr key={itemIndex}>
                                        <td className="p-2 border">{item}</td>
                                        {(question.classificationLabels || []).map((_, labelIndex) => (
                                            <td key={labelIndex} className={`p-2 border text-center ${question.correctAnswers[itemIndex] === labelIndex ? 'bg-green-100' : ''}`}>
                                                {question.correctAnswers[itemIndex] === labelIndex && '✔'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'fill-in-the-blank':
                return (
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Question</h3>
                        <div className="p-4 bg-gray-50 rounded-md flex flex-wrap items-center gap-2">
                            {(question.questionParts || []).map((part, index) => {
                                if (part.type === 'text') {
                                    return <span key={index}>{part.value}</span>;
                                }
                                if (part.type === 'dropdown') {
                                    const dropdown = question.dropdowns[part.value];
                                    if (!dropdown) return null;
                                    const correctOpt = dropdown.options[dropdown.correctAnswer];
                                    return <span key={index} className="p-1 bg-green-100 border border-green-400 rounded">{correctOpt}</span>;
                                }
                                return null;
                            })}
                        </div>
                    </div>
                );

            default: // MCQ
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Question Prompt:</h3>
                            <div className="p-4 bg-gray-50 rounded-md">
                                <ContentRenderer content={question.questionText} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Options:</h3>
                            <div className="space-y-2">
                                {(question.options || []).map((opt, index) => (
                                    <div key={index} className={`p-3 border rounded-md flex items-center space-x-3 ${Array.isArray(question.correctAnswer) && question.correctAnswer.includes(index) ? 'bg-green-100 border-green-400' : 'bg-gray-50'}`}>
                                        <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                                        <ContentRenderer content={opt} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Question Preview">
            {renderContent()}
            <div className="text-sm text-gray-600 mt-4">
                <p><strong>Difficulty:</strong> {question.difficulty}</p>
                <p><strong>Type:</strong> {question.type}</p>
                {(question.tags || question.diTags) && (question.tags?.length > 0 || question.diTags?.length > 0) && (
                    <p><strong>Tags:</strong> {(question.tags || question.diTags).join(', ')}</p>
                )}
            </div>
        </Modal>
    );
}