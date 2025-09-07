function TestCreator({ user, onDataUpdated }) {
    const [contentType, setContentType] = useState('Quant');
    const [diType, setDiType] = useState('Single');
    const [quantCategories, setQuantCategories] = useState([]);
    const [questionText, setQuestionText] = useState([{ type: 'text', value: '' }]);
    const [options, setOptions] = useState([[{type: 'text', value: ''}], [{type: 'text', value: ''}]]);
    const [isMultipleCorrect, setIsMultipleCorrect] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState([0]);
    const [difficulty, setDifficulty] = useState(3);
    const [passageText, setPassageText] = useState('');
    const [msrTabs, setMsrTabs] = useState([{ title: 'Tab 1', content: [{ type: 'text', value: '' }] }]);
    const [graphicStimulus, setGraphicStimulus] = useState({ image: '', blurb: '' });
    const [tableStimulus, setTableStimulus] = useState({ headers: [''], rows: [['']] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const quantCategoryOptions = ['Arithmetic', 'Algebra', 'Geometry', 'Word Problems'];

    const resetForm = () => {
        setQuestionText([{ type: 'text', value: '' }]);
        setOptions([[{type: 'text', value: ''}], [{type: 'text', value: ''}]]);
        setCorrectAnswer([0]);
        setDifficulty(3);
        setPassageText('');
        setMsrTabs([{ title: 'Tab 1', content: [{ type: 'text', value: '' }] }]);
        setGraphicStimulus({ image: '', blurb: '' });
        setTableStimulus({ headers: [''], rows: [['']] });
        setQuantCategories([]);
        setIsMultipleCorrect(false);
    };
    
    const handleQuantCategoryChange = (category) => {
        setQuantCategories(prev => 
            prev.includes(category) 
                ? prev.filter(c => c !== category) 
                : [...prev, category]
        );
    };

    const handleAddOption = () => {
        setOptions([...options, [{ type: 'text', value: '' }]]);
    };

    const handleRemoveOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        const newCorrectAnswer = correctAnswer.filter(ans => ans < newOptions.length);
        setCorrectAnswer(newCorrectAnswer.length > 0 ? newCorrectAnswer : [0]);
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index][0].value = value;
        setOptions(newOptions);
    };

    const handleCorrectAnswerChange = (index) => {
        if (isMultipleCorrect) {
            const newAnswers = correctAnswer.includes(index)
                ? correctAnswer.filter(i => i !== index)
                : [...correctAnswer, index];
            setCorrectAnswer(newAnswers);
        } else {
            setCorrectAnswer([index]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        const questionData = {
            creatorId: user.uid,
            type: contentType,
            difficulty: Number(difficulty),
            format: 'mcq',
            questionText,
            options,
            correctAnswer: isMultipleCorrect ? correctAnswer.sort((a,b) => a - b) : correctAnswer[0],
            isMultipleCorrect,
            categories: contentType === 'Quant' ? quantCategories : [],
        };

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/questions`), questionData);
            setSuccess("Question added successfully!");
            resetForm();
            onDataUpdated();
        } catch (err) {
            setError("Failed to add content. Please try again.");
            console.error(err);
        }
        setIsSubmitting(false);
    };

    return (
        <div style={{maxWidth: '48rem', margin: '0 auto', backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
            <h2 style={{fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem'}}>Create New Content</h2>
            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                <div>
                    <label style={{display: 'block', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>Content Type</label>
                    <select value={contentType} onChange={e => setContentType(e.target.value)} style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: '#f9fafb'}}>
                        <option value="Quant">Quantitative Reasoning</option>
                        <option value="Verbal">Verbal Reasoning</option>
                        <option value="Data Insights">Data Insights</option>
                    </select>
                </div>
                
                {contentType === 'Quant' && 
                    <div>
                        <label style={{display: 'block', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>Categories</label>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem'}}>
                            {quantCategoryOptions.map(cat => (
                                <label key={cat} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                    <input type="checkbox" checked={quantCategories.includes(cat)} onChange={() => handleQuantCategoryChange(cat)} />
                                    <span>{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                }

                <div>
                    <label style={{display: 'block', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>Question Text</label>
                    <textarea value={questionText[0].value} onChange={e => setQuestionText([{type: 'text', value: e.target.value}])} style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem'}} rows="4"></textarea>
                </div>

                <div>
                    <label style={{display: 'block', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>Options</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                        <input type="checkbox" id="multipleCorrect" checked={isMultipleCorrect} onChange={e => { setIsMultipleCorrect(e.target.checked); setCorrectAnswer([]); }} />
                        <label htmlFor="multipleCorrect">Allow Multiple Correct Answers</label>
                    </div>
                    {options.map((opt, index) => (
                        <div key={index} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                            <input 
                                type={isMultipleCorrect ? 'checkbox' : 'radio'} 
                                name="correctAnswer" 
                                checked={correctAnswer.includes(index)} 
                                onChange={() => handleCorrectAnswerChange(index)} 
                            />
                            <input 
                                type="text" 
                                value={opt[0].value} 
                                onChange={e => handleOptionChange(index, e.target.value)} 
                                style={{flexGrow: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem'}} 
                                placeholder={`Option ${index + 1}`} 
                            />
                            {options.length > 2 && <button type="button" onClick={() => handleRemoveOption(index)} style={{color: '#ef4444', background: 'none', border: 'none', fontSize: '1.25rem'}}>&times;</button>}
                        </div>
                    ))}
                    <button type="button" onClick={handleAddOption} style={{color: '#4f46e5', fontWeight: '600', background: 'none', border: 'none', marginTop: '0.5rem'}}>+ Add Option</button>
                </div>

                <div>
                    <label style={{display: 'block', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>Difficulty (1-5)</label>
                    <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{width: '100%'}} />
                    <div style={{textAlign: 'center'}}>{difficulty}</div>
                </div>

                <hr style={{margin: '2rem 0'}}/>
                {error && <p style={{color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem'}}>{error}</p>}
                {success && <p style={{color: '#16a34a', fontSize: '0.875rem', marginBottom: '1rem'}}>{success}</p>}
                <button type="submit" disabled={isSubmitting} style={{width: '100%', backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.375rem', border: 'none', fontSize: '1.125rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1}}>
                    {isSubmitting ? 'Submitting...' : 'Add Content to Bank'}
                </button>
            </form>
        </div>
    );
}