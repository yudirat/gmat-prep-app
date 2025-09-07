// This component displays a modal for previewing a question.
import React from 'react';
import Modal from '../../components/Modal';
import ContentRenderer from '../../components/ContentRenderer';

/**
 * QuestionPreviewModal component displays a modal with a preview of a question.
 * It shows the question prompt, options (highlighting correct answers), difficulty, type, and categories.
 */
export default function QuestionPreviewModal({ isOpen, onClose, question }) {
    if (!question) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Question Preview">
            <div className="space-y-4">
                {/* Question Prompt Section */}
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Question Prompt:</h3>
                    <div className="p-4 bg-gray-50 rounded-md">
                        <ContentRenderer content={question.questionText} />
                    </div>
                </div>
                {/* Options Section */}
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
                {/* Question Details Section */}
                 <div className="text-sm text-gray-600 mt-4">
                    <p><strong>Difficulty:</strong> {question.difficulty}</p>
                    <p><strong>Type:</strong> {question.type}</p>
                    {question.categories && question.categories.length > 0 && (
                        <p><strong>Categories:</strong> {question.categories.join(', ')}</p>
                    )}
                </div>
            </div>
        </Modal>
    );
}