// This component is used to create and edit table-based questions for the Data Insights section.
import React, { useState, useEffect } from 'react';
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import SubQuestionForm, { defaultSubQuestion } from './SubQuestionForm';

/**
 * Component for creating and editing table-based questions.
 */
export default function TableCreator({ user, onSave, initialData, allTableStimuli }) {
    // State for the table data, sub-question, and form status
    const [tableStimulus, setTableStimulus] = useState({ headers: [''], rows: [['']] });
    const [subQuestions, setSubQuestions] = useState([{...defaultSubQuestion}]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [, setError] = useState('');
    const [, setSuccess] = useState('');

    const addSubQuestion = () => setSubQuestions([...subQuestions, { ...defaultSubQuestion, id: Date.now().toString() }]);
    const removeSubQuestion = (index) => setSubQuestions(subQuestions.filter((_, i) => i !== index));

    // Effect to populate the form when editing an existing table question
    useEffect(() => {
        if (initialData && initialData.tableStimulusId) {
            const parseContent = (content) => {
                if (typeof content === 'string') {
                    try { return JSON.parse(content); } catch (e) { return [{ type: 'text', value: content }]; }
                }
                return Array.isArray(content) ? content : [{ type: 'text', value: '' }];
            };

            const stimulus = allTableStimuli.find(t => t.id === initialData.tableStimulusId);
            if (stimulus) {
                setTableStimulus(stimulus);
            }
            
            setSubQuestions([{
                ...initialData,
                questionText: parseContent(initialData.questionText),
                options: (initialData.options || []).map(opt => parseContent(opt)),
                correctAnswer: Array.isArray(initialData.correctAnswer) ? initialData.correctAnswer : [initialData.correctAnswer]
            }]);
        }
    }, [initialData, allTableStimuli]);

    /**
     * Handles changes to the table structure and content.
     * @param {string} type - The type of change (e.g., 'header', 'cell', 'addRow').
     * @param {string} value - The new value.
     * @param {number} rowIndex - The row index.
     * @param {number} colIndex - The column index.
     */
    const handleTableStimulusChange = (type, value, rowIndex, colIndex) => {
        const newTable = JSON.parse(JSON.stringify(tableStimulus)); // Deep copy

        if (type === 'header') {
            newTable.headers[colIndex] = value;
        }
        if (type === 'cell') {
            newTable.rows[rowIndex][colIndex] = value;
        }
        if (type === 'addRow') {
            newTable.rows.push(Array(newTable.headers.length).fill(''));
        }
        if (type === 'addCol') {
            newTable.headers.push('');
            newTable.rows.forEach(row => row.push(''));
        }
        if (type === 'removeRow' && newTable.rows.length > 1) {
            newTable.rows.splice(rowIndex, 1);
        }
        if (type === 'removeCol' && newTable.headers.length > 1) {
            newTable.headers.splice(colIndex, 1);
            newTable.rows.forEach(row => row.splice(colIndex, 1));
        }
        setTableStimulus(newTable);
    };

    /**
     * Handles changes to the associated sub-question.
     * @param {number} index - The index of the sub-question (always 0).
     * @param {string} field - The field to update.
     * @param {any} value - The new value.
     */
    const handleSubQuestionChange = (index, field, value) => {
        const newSubQuestions = [...subQuestions];
        newSubQuestions[index] = { ...newSubQuestions[index], [field]: value };
        setSubQuestions(newSubQuestions);
    };

    /**
     * Handles the form submission.
     * Creates a batch write to Firestore to save the table stimulus and its question.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const batch = writeBatch(db);
            
            const tableStimulusRef = doc(collection(db, `artifacts/${appId}/public/data/tableStimuli`));
            batch.set(tableStimulusRef, { 
                ...tableStimulus, 
                creatorId: user.uid, 
                type: 'Data Insights',
                createdAt: Timestamp.now()
            });
            
            for (const subQuestion of subQuestions) {
                const questionRef = doc(collection(db, `artifacts/${appId}/public/data/questions`));
                batch.set(questionRef, { 
                    ...subQuestion, 
                    questionText: JSON.stringify(subQuestion.questionText),
                    options: subQuestion.options.map(opt => JSON.stringify(opt)),
                    creatorId: user.uid, 
                    tableStimulusId: tableStimulusRef.id, 
                    type: 'Data Insights' 
                });
            }

            await batch.commit();
            setSuccess("Table Analysis question added successfully!");
            setTimeout(() => onSave(), 1000);

        } catch (err) {
            setError("Failed to add content. Please try again.");
            console.error(err);
        }
        setIsSubmitting(false);
    };
    
    

    return (
        <form onSubmit={handleSubmit}>
            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold mb-4">Table Stimulus</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                {tableStimulus.headers.map((h, i) => (
                                    <th key={i} className="p-0">
                                        <input 
                                            type="text" 
                                            value={h} 
                                            onChange={e => handleTableStimulusChange('header', e.target.value, null, i)} 
                                            className="p-2 border w-full"
                                            placeholder={`Header ${i + 1}`}
                                        />
                                    </th>
                                ))}
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableStimulus.rows.map((row, rI) => (
                                <tr key={rI}>
                                    {row.map((cell, cI) => (
                                        <td key={cI} className="p-0">
                                            <input 
                                                type="text" 
                                                value={cell} 
                                                onChange={e => handleTableStimulusChange('cell', e.target.value, rI, cI)} 
                                                className="p-2 border w-full"
                                            />
                                        </td>
                                    ))}
                                    <td>
                                        <button type="button" onClick={() => handleTableStimulusChange('removeRow', null, rI, null)} className="text-red-500 px-2">&times;</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2">
                    <button type="button" onClick={() => handleTableStimulusChange('addRow')} className="text-sm text-indigo-600 mr-4">+ Add Row</button>
                    <button type="button" onClick={() => handleTableStimulusChange('addCol')} className="text-sm text-indigo-600">+ Add Column</button>
                </div>
            </div>
            <hr className="my-6"/>
            <h3 className="text-xl font-semibold mb-4">Associated Questions</h3>
            {subQuestions.map((q, index) => (
                <SubQuestionForm 
                    key={q.id || index}
                    question={q}
                    index={index}
                    onSubQuestionChange={handleSubQuestionChange}
                    onRemove={removeSubQuestion}
                    isRemovable={subQuestions.length > 1}
                    contentType="Data Insights"
                />
            ))}
            <button type="button" onClick={addSubQuestion} className="text-indigo-600 font-semibold mt-4">+ Add Associated Question</button>
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 text-lg mt-6">
                {isSubmitting ? 'Submitting...' : 'Add Content to Bank'}
            </button>
        </form>
    );
}