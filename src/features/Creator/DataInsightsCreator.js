// This component is a factory for creating different types of Data Insights questions.
import React, { useState, useEffect } from 'react';
import MSRCreator from './MSRCreator';
import GraphicsCreator from './GraphicsCreator';
import TableCreator from './TableCreator';
import DataSufficiencyForm from './DataSufficiencyForm';
import TwoPartAnalysisCreator from './TwoPartAnalysisCreator';

/**
 * Component for creating Data Insights questions.
 * It allows the user to select the type of Data Insights question to create and renders the appropriate form.
 */
export default function DataInsightsCreator({ user, onSave, initialData, allQuestions, allMsrSets, allGraphicStimuli, allTableStimuli }) {
    // State to manage the type of Data Insights question to create
    const [diType, setDiType] = useState('Data Sufficiency');

    // Effect to set the question type when editing an existing question
    useEffect(() => {
        if (initialData) {
            if (initialData.format === 'Data Sufficiency') setDiType('Data Sufficiency');
            else if (initialData.format === 'Two-Part Analysis') setDiType('Two-Part Analysis');
            else if (initialData.msrSetId) setDiType('MSR');
            else if (initialData.graphicStimulusId) setDiType('Graphics Interpretation');
            else if (initialData.tableStimulusId) setDiType('Table Analysis');
            // Default can be Data Sufficiency or another appropriate type
        }
    }, [initialData]);

    /**
     * Renders the appropriate creator component based on the selected Data Insights question type.
     */
    const renderDICreator = () => {
        switch(diType) {
            case 'MSR':
                return <MSRCreator user={user} onSave={onSave} initialData={initialData} allQuestions={allQuestions} allMsrSets={allMsrSets} />;
            case 'Graphics Interpretation':
                return <GraphicsCreator user={user} onSave={onSave} initialData={initialData} allQuestions={allQuestions} allGraphicStimuli={allGraphicStimuli} />;
            case 'Table Analysis':
                return <TableCreator user={user} onSave={onSave} initialData={initialData} allQuestions={allQuestions} allTableStimuli={allTableStimuli} />;
            case 'Data Sufficiency':
                return <DataSufficiencyForm user={user} onSave={onSave} initialData={initialData} />;
            case 'Two-Part Analysis':
                return <TwoPartAnalysisCreator user={user} onSave={onSave} initialData={initialData} />;
            default:
                return <DataSufficiencyForm user={user} onSave={onSave} initialData={initialData} />;
        }
    };

    return (
        <div>
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Data Insights Question Type</label>
                {/* Dropdown to select the type of Data Insights question */}
                <select 
                    value={diType} 
                    onChange={e => setDiType(e.target.value)} 
                    disabled={!!initialData} 
                    className="w-full p-3 border rounded bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                    <option value="Data Sufficiency">Data Sufficiency</option>
                    <option value="Two-Part Analysis">Two-Part Analysis</option>
                    <option value="MSR">Multi-Source Reasoning</option>
                    <option value="Graphics Interpretation">Graphics Interpretation</option>
                    <option value="Table Analysis">Table Analysis</option>
                </select>
            </div>
            <hr className="my-6"/>
            {/* Render the selected creator component */}
            {renderDICreator()}
        </div>
    );
}