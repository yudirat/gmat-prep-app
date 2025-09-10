// This component provides a toolbar with common LaTeX commands for easy insertion into a textarea.
import React from 'react';
import { insertTextAtCursor } from '../utils';

/**
 * LatexToolbar component provides a set of buttons for inserting common LaTeX mathematical commands
 * into a specified textarea element.
 */
export default function LatexToolbar({ textareaRef, onTextChange }) {
    // Array defining the buttons in the toolbar, including their label, LaTeX value, and name.
    const toolbarButtons = [
        { label: 'x²', value: '^{}', name: 'Exponent' },
        { label: 'xₙ', value: '_{}', name: 'Subscript' },
        // eslint-disable-next-line no-useless-escape
        { label: '√x', value: '\sqrt{}', name: 'Square Root' },
        { label: 'a/b', value: '\frac{}{}', name: 'Fraction' },
        // eslint-disable-next-line no-useless-escape
        { label: 'log', value: '\log()', name: 'Logarithm' },
        // eslint-disable-next-line no-useless-escape
        { label: 'ln', value: '\ln()', name: 'Natural Log' },
        // eslint-disable-next-line no-useless-escape
        { label: '±', value: ' \pm ', name: 'Plus/Minus' },
        { label: '≠', value: ' \neq ', name: 'Not Equal' },
        // eslint-disable-next-line no-useless-escape
        { label: '≤', value: ' \leq ', name: 'Less/Equal' },
        // eslint-disable-next-line no-useless-escape
        { label: '≥', value: ' \geq ', name: 'Greater/Equal' },
        { label: '<', value: ' < ', name: 'Less Than' },
        { label: '>', value: ' > ', name: 'Greater Than' },
        // eslint-disable-next-line no-useless-escape
        { label: '°', value: '^{\circ}', name: 'Degree' },
    ];

    /**
     * Handles the insertion of a LaTeX command into the textarea.
     * It uses the `insertTextAtCursor` utility function to perform the insertion.
     * @param {string} textToInsert - The LaTeX command string to insert.
     */
    const handleInsert = (textToInsert) => {
        if (textareaRef.current) {
            const newValue = insertTextAtCursor(textareaRef.current, textToInsert);
            onTextChange(newValue);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-100 rounded-md mb-2">
            {/* Render each button from the toolbarButtons array */}
            {toolbarButtons.map(btn => (
                <button 
                    key={btn.name}
                    type="button" 
                    onClick={() => handleInsert(btn.value)}
                    title={btn.name}
                    className="px-3 py-1 bg-white border rounded-md hover:bg-gray-200"
                >
                    {btn.label}
                </button>
            ))}
            {/* Link to external LaTeX help documentation */}
            <a 
                href="https://en.wikibooks.org/wiki/LaTeX/Mathematics" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Opens a comprehensive LaTeX mathematics guide on Wikibooks in a new tab."
                className="text-xs text-blue-600 hover:underline ml-auto"
            >
                LaTeX Help
            </a>
        </div>
    );
}
