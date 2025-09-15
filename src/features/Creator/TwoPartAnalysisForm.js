import React from 'react';
import BlockEditor from '../../components/BlockEditor';

export default function TwoPartAnalysisForm({ question, index, onSubQuestionChange }) {
    // Defensively handle different shapes of `options` data
    let currentOptions = question.options || [''];
    if (Array.isArray(currentOptions) && currentOptions.length > 0 && !currentOptions.every(item => typeof item === 'string')) {
        // If options are not a simple string array, reset to a default that works for this form.
        // This handles the case where the format was switched from another type like MCQ.
        currentOptions = ['', '', ''];
    }

    const options = currentOptions;
    const correctAnswers = question.correctAnswers || [null, null];

    const handleQuestionChange = (newContent) => {
        onSubQuestionChange(index, 'questionText', newContent);
    };

    const handleOptionChange = (optIndex, value) => {
        const newOptions = [...options];
        newOptions[optIndex] = value;
        onSubQuestionChange(index, 'options', newOptions);
    };

    const addOption = () => {
        onSubQuestionChange(index, 'options', [...options, '']);
    };

    const removeOption = (optIndex) => {
        const newOptions = options.filter((_, i) => i !== optIndex);
        onSubQuestionChange(index, 'options', newOptions);
        const newCorrect = [...correctAnswers];
        if (newCorrect[0] === optIndex) newCorrect[0] = null;
        if (newCorrect[1] === optIndex) newCorrect[1] = null;
        onSubQuestionChange(index, 'correctAnswers', newCorrect);
    };

    const handleCorrectAnswerChange = (partIndex, optIndex) => {
        const newAnswers = [...correctAnswers];
        newAnswers[partIndex] = optIndex;
        onSubQuestionChange(index, 'correctAnswers', newAnswers);
    };

    const handlePromptChange = (partIndex, value) => {
        const field = partIndex === 0 ? 'part1Prompt' : 'part2Prompt';
        onSubQuestionChange(index, field, value);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-gray-700 text-xs font-bold mb-1">Main Question Prompt</label>
                <BlockEditor 
                    content={Array.isArray(question.questionText) ? question.questionText : [{type: 'text', value: question.questionText || ''}]}
                    onContentChange={handleQuestionChange}
                />
            </div>

            <div className="p-3 bg-white rounded border">
                <label className="block text-gray-700 text-xs font-bold mb-2">Shared Answer Options</label>
                {options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center mb-1">
                        <input 
                            type="text" 
                            value={opt} 
                            onChange={e => handleOptionChange(optIndex, e.target.value)} 
                            className="flex-grow p-1 border rounded"
                            placeholder={`Option ${optIndex + 1}`}
                        />
                        {options.length > 1 && 
                            <button type="button" onClick={() => removeOption(optIndex)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
                        }
                    </div>
                ))}
                <button type="button" onClick={addOption} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Option</button>
            </div>

            <div>
                <label className="block text-gray-700 text-xs font-bold mb-2">Columns & Correct Answers</label>
                <table className="w-full text-center">
                    <thead>
                        <tr>
                            <th className="p-2 border">Options</th>
                            <th className="p-2 border">
                                <input type="text" value={question.part1Prompt || ''} onChange={e => handlePromptChange(0, e.target.value)} placeholder="Column 1" className="w-full p-1 text-center"/>
                            </th>
                            <th className="p-2 border">
                                <input type="text" value={question.part2Prompt || ''} onChange={e => handlePromptChange(1, e.target.value)} placeholder="Column 2" className="w-full p-1 text-center"/>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {options.map((opt, optIndex) => (
                            <tr key={optIndex}>
                                <td className="p-2 border text-left">{opt || `(Option ${optIndex + 1})`}</td>
                                <td className="p-2 border">
                                    <input 
                                        type="radio"
                                        name={`q${index}part1correct`}
                                        checked={correctAnswers[0] === optIndex}
                                        onChange={() => handleCorrectAnswerChange(0, optIndex)}
                                    />
                                </td>
                                <td className="p-2 border">
                                    <input 
                                        type="radio"
                                        name={`q${index}part2correct`}
                                        checked={correctAnswers[1] === optIndex}
                                        onChange={() => handleCorrectAnswerChange(1, optIndex)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}