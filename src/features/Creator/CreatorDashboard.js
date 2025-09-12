import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useDataFromContext as useData } from '../../contexts/DataContext';
import { useUser } from '../../contexts/UserContext';
import TestCreator from './TestCreator';
import QuestionBankManager from './QuestionBankManager';

/**
 * CreatorDashboard component displays an overview for content creators.
 * It shows statistics about questions by section and category, and provides navigation to content creation and management.
 */
export default function CreatorDashboard() {
    const { questions, isLoading } = useData();
    const { user } = useUser();
    const [view, setView] = useState('dashboard'); // 'dashboard', 'createForm', 'questionBank'
    const [editingQuestionId, setEditingQuestionId] = useState(null);

    const handleEditQuestion = (questionId) => {
        setEditingQuestionId(questionId);
        setView('createForm');
    };

    
    
    // Prepare data for the Pie Chart: number of questions per section
    const sectionData = [
        { name: 'Quant', value: questions.filter(q => q.type === 'Quant').length, color: '#4f46e5' },
        { name: 'Verbal', value: questions.filter(q => q.type === 'Verbal').length, color: '#7c3aed' },
        { name: 'Data Insights', value: questions.filter(q => q.type === 'Data Insights').length, color: '#0d9488' },
    ];

    const quantCategories = ['Arithmetic', 'Algebra', 'Geometry', 'Word Problems'];
    const verbalFormats = ['mcq', 'either-or', 'table-classification', 'two-part-analysis'];
    const dataInsightsTypes = ['Single', 'MSR', 'Graphics Interpretation', 'Table Analysis'];

    // Prepare data for the Bar Chart: number of Quantitative questions per category
    const quantData = quantCategories.map(cat => ({
        name: cat,
        count: questions.filter(q => q.type === 'Quant' && q.categories?.includes(cat)).length
    }));

    const verbalData = verbalFormats.map(format => ({
        name: format,
        count: questions.filter(q => q.type === 'Verbal' && q.format === format).length
    }));

    const dataInsightsData = dataInsightsTypes.map(type => {
        let count = 0;
        if (type === 'Single') {
            count = questions.filter(q => q.type === 'Data Insights' && !q.msrSetId && !q.graphicStimulusId && !q.tableStimulusId).length;
        } else if (type === 'MSR') {
            count = questions.filter(q => q.type === 'Data Insights' && q.msrSetId).length;
        } else if (type === 'Graphics Interpretation') {
            count = questions.filter(q => q.type === 'Data Insights' && q.graphicStimulusId).length;
        } else if (type === 'Table Analysis') {
            count = questions.filter(q => q.type === 'Data Insights' && q.tableStimulusId).length;
        }
        return {
            name: type,
            count: count
        };
    });

    if (isLoading) {
        return <div>Loading dashboard...</div>;
    }

    if (view === 'createForm') {
        return <TestCreator user={user} editingQuestionId={editingQuestionId} setEditingQuestionId={setEditingQuestionId} setView={setView} />;
    }

    if (view === 'questionBank') {
        return <QuestionBankManager questions={questions} handleEditQuestion={handleEditQuestion} setView={setView} />;
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Creator Dashboard</h2>
                {/* Action buttons for content creation and management */}
                <div className="space-x-4">
                    <button onClick={() => setView('createForm')} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                        + Add New Content
                    </button>
                    <button onClick={() => setView('questionBank')} className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700">
                        Manage Question Bank
                    </button>
                    <button onClick={() => alert('Mock Test Creator coming soon!')} className="bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700">
                        Create Full Mock Test
                    </button>
                </div>
            </div>
            {/* Layout for charts displaying question statistics */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Questions by Section</h3>
                <div className="flex justify-center">
                    {/* Pie Chart for questions by section */}
                    <ResponsiveContainer width="50%" height={300}>
                        <PieChart>
                            <Pie data={sectionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {sectionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Quant Questions by Category</h3>
                    {/* Bar Chart for Quantitative questions by category */}
                    <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={quantData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Verbal Questions by Format</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={verbalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Data Insights Questions by Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dataInsightsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#ffc658" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}