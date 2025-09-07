// This component is used to create and edit graphics-based questions for the Data Insights section.
import React, { useState, useEffect } from 'react';
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import SubQuestionForm, { defaultSubQuestion } from './SubQuestionForm';
import BlockEditor from '../../components/BlockEditor';

/**
 * Component for creating and editing graphics-based questions.
 */
export default function GraphicsCreator({ user, onSave, initialData, allGraphicStimuli }) {
    // State for the graphic stimulus, sub-question, and form status
    const [graphicStimulus, setGraphicStimulus] = useState({ image: '', blurb: [{ type: 'text', value: '' }] });
    const [subQuestion, setSubQuestion] = useState({...defaultSubQuestion});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Effect to populate the form when editing an existing graphic question
    useEffect(() => {
        if (initialData && initialData.graphicStimulusId) {
            const parseContent = (content) => {
                if (typeof content === 'string') {
                    try { return JSON.parse(content); } catch (e) { return [{ type: 'text', value: content }]; }
                }
                return Array.isArray(content) ? content : [{ type: 'text', value: '' }];
            };

            const stimulus = allGraphicStimuli.find(g => g.id === initialData.graphicStimulusId);
            if (stimulus) {
                setGraphicStimulus({
                    image: stimulus.image || '',
                    blurb: parseContent(stimulus.blurb)
                });
            }
            
            setSubQuestion({
                ...initialData,
                questionText: parseContent(initialData.questionText),
                options: (initialData.options || []).map(opt => parseContent(opt)),
                correctAnswer: Array.isArray(initialData.correctAnswer) ? initialData.correctAnswer : [initialData.correctAnswer]
            });
        }
    }, [initialData, allGraphicStimuli]);

    /**
     * Handles pasting an image into the form.
     * @param {object} e - The paste event.
     * @param {function} callback - The callback to set the image data.
     */
    const handleImagePaste = (e, callback) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => { callback(event.target.result); };
                reader.readAsDataURL(blob);
                e.preventDefault();
                break;
            }
        }
    };

    /**
     * Handles changes to the associated sub-question.
     * @param {number} index - The index of the sub-question (always 0).
     * @param {string} field - The field to update.
     * @param {any} value - The new value.
     */
    const handleSubQuestionChange = (index, field, value) => { // index is always 0 here
        setSubQuestion(prev => ({ ...prev, [field]: value }));
    };

    /**
     * Handles the form submission.
     * Creates a batch write to Firestore to save the graphic stimulus and its question.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const batch = writeBatch(db);
            
            const graphicStimulusRef = doc(collection(db, `artifacts/${appId}/public/data/graphicStimuli`));
            batch.set(graphicStimulusRef, { 
                ...graphicStimulus, 
                blurb: JSON.stringify(graphicStimulus.blurb), // Stringify the blurb blocks
                creatorId: user.uid, 
                type: 'Data Insights',
                createdAt: Timestamp.now()
            });
            
            const questionRef = doc(collection(db, `artifacts/${appId}/public/data/questions`));
            batch.set(questionRef, { 
                ...subQuestion, 
                questionText: JSON.stringify(subQuestion.questionText),
                options: subQuestion.options.map(opt => JSON.stringify(opt)),
                creatorId: user.uid, 
                graphicStimulusId: graphicStimulusRef.id, 
                type: 'Data Insights' 
            });

            await batch.commit();
            setSuccess("Graphics Interpretation question added successfully!");
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
                <h3 className="text-xl font-semibold mb-4">Graphic Stimulus</h3>
                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Graph/Chart Image</label>
                    {/* Area to paste the image */}
                    <div onPaste={(e) => handleImagePaste(e, (data) => setGraphicStimulus({...graphicStimulus, image: data}))} className="p-4 border-2 border-dashed rounded text-center text-gray-500">
                        <p>Paste image here</p>
                        {graphicStimulus.image && <img src={graphicStimulus.image} alt="Pasted content" className="max-w-full h-auto mx-auto mt-2 rounded"/>}
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Text Blurb</label>
                    {/* Editor for the text blurb */}
                    <BlockEditor 
                        content={graphicStimulus.blurb} 
                        onContentChange={(newContent) => setGraphicStimulus({...graphicStimulus, blurb: newContent})} 
                    />
                </div>
            </div>
            <hr className="my-6"/>
            <h3 className="text-xl font-semibold mb-4">Associated Question</h3>
            {/* Form for the associated sub-question */}
            <SubQuestionForm 
                question={subQuestion}
                index={0}
                onSubQuestionChange={handleSubQuestionChange}
                isRemovable={false}
                contentType="Data Insights"
            />
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 text-lg mt-6">
                {isSubmitting ? 'Submitting...' : 'Save Graphics Content'}
            </button>
        </form>
    );
}