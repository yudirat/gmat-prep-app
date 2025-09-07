// This component provides a form for creating table classification questions.
import React from 'react';

/**
 * Component for creating table classification questions.
 * This form allows the creator to define items and classify them into different categories.
 */
export default function TableClassificationForm({ question, index, onSubQuestionChange }) {
    const items = question.itemsToClassify || [''];
    const labels = question.classificationLabels || [''];
    const answers = question.correctAnswers || [];

    /**
     * Handles changes to an item to be classified.
     * @param {number} itemIndex - The index of the item.
     * @param {string} value - The new item text.
     */
    const handleItemChange = (itemIndex, value) => {
        const newItems = [...items];
        newItems[itemIndex] = value;
        onSubQuestionChange(index, 'itemsToClassify', newItems);
    };

    /**
     * Handles changes to a classification label (column).
     * @param {number} labelIndex - The index of the label.
     * @param {string} value - The new label text.
     */
    const handleLabelChange = (labelIndex, value) => {
        const newLabels = [...labels];
        newLabels[labelIndex] = value;
        onSubQuestionChange(index, 'classificationLabels', newLabels);
    };

    /**
     * Sets the correct classification for an item.
     * @param {number} itemIndex - The index of the item.
     * @param {number} labelIndex - The index of the selected label.
     */
    const handleAnswerChange = (itemIndex, labelIndex) => {
        const newAnswers = [...answers];
        newAnswers[itemIndex] = labelIndex;
        onSubQuestionChange(index, 'correctAnswers', newAnswers);
    };

    /**
     * Adds a new item to be classified.
     */
    const addItem = () => {
        onSubQuestionChange(index, 'itemsToClassify', [...items, '']);
        onSubQuestionChange(index, 'correctAnswers', [...answers, 0]);
    };

    /**
     * Removes an item to be classified.
     * @param {number} itemIndex - The index of the item to remove.
     */
    const removeItem = (itemIndex) => {
        onSubQuestionChange(index, 'itemsToClassify', items.filter((_, i) => i !== itemIndex));
        onSubQuestionChange(index, 'correctAnswers', answers.filter((_, i) => i !== itemIndex));
    };

    /**
     * Adds a new classification label (column).
     */
    const addLabel = () => {
        onSubQuestionChange(index, 'classificationLabels', [...labels, '']);
    };

    /**
     * Removes a classification label (column).
     * @param {number} labelIndex - The index of the label to remove.
     */
    const removeLabel = (labelIndex) => {
        onSubQuestionChange(index, 'classificationLabels', labels.filter((_, i) => i !== labelIndex));
        // When a column is removed, reset answers that pointed to it or higher indices
        const newAnswers = answers.map(ans => ans === labelIndex ? 0 : ans > labelIndex ? ans - 1 : ans);
        onSubQuestionChange(index, 'correctAnswers', newAnswers);
    };

    return (
        <div>
            <div className="p-3 bg-white rounded border mb-4">
                <label className="block text-gray-700 text-xs font-bold mb-2">Classification Labels (Columns)</label>
                {labels.map((label, labelIndex) => (
                    <div key={labelIndex} className="flex items-center mb-1">
                        <input 
                            type="text" 
                            value={label} 
                            onChange={e => handleLabelChange(labelIndex, e.target.value)} 
                            className="flex-grow p-1 border rounded" 
                            placeholder={`Category ${labelIndex + 1}`}
                        />
                        {labels.length > 1 && 
                            <button type="button" onClick={() => removeLabel(labelIndex)} className="ml-2 text-red-400 hover:text-red-600">&times;</button>
                        }
                    </div>
                ))}
                <button type="button" onClick={addLabel} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Label</button>
            </div>

            <div className="p-3 bg-white rounded border">
                <label className="block text-gray-700 text-xs font-bold mb-2">Items to Classify & Correct Answers</label>
                {items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center mb-2">
                        <input 
                            type="text" 
                            value={item} 
                            onChange={e => handleItemChange(itemIndex, e.target.value)} 
                            className="w-1/3 p-1 border rounded" 
                            placeholder={`Item ${itemIndex + 1}`} 
                        />
                        <div className="flex-grow flex justify-around">
                            {labels.map((_, labelIndex) => (
                                <label key={labelIndex} className="flex items-center space-x-1">
                                    <input 
                                        type="radio" 
                                        name={`q${index}item${itemIndex}`} 
                                        checked={answers[itemIndex] === labelIndex} 
                                        onChange={() => handleAnswerChange(itemIndex, labelIndex)} 
                                    />
                                </label>
                            ))}
                        </div>
                        {items.length > 1 && 
                            <button type="button" onClick={() => removeItem(itemIndex)} className="text-red-400 hover:text-red-600">&times;</button>
                        }
                    </div>
                ))}
                <button type="button" onClick={addItem} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Item</button>
            </div>
        </div>
    );
}