// This component renders text, automatically converting LaTeX math enclosed in $...$ into formatted math.
import React from 'react';

/**
 * MathText component renders text, automatically converting LaTeX math enclosed in $...$ into formatted math
 * using the KaTeX library. If KaTeX is not available, it falls back to rendering the raw LaTeX string.
 */
export default function MathText({ text }) {
    // If the text is not a string, render it directly.
    if (typeof text !== 'string') {
        return <span>{text}</span>;
    }

    // Split the text by '$' delimiters to identify LaTeX math sections.
    const parts = text.split('$');

    return (
        <span>
            {parts.map((part, index) => {
                // Odd-indexed parts are assumed to be LaTeX math expressions.
                if (index % 2 === 1) {
                    // Check if KaTeX library is loaded in the window object.
                    if (window.katex) {
                        // Render LaTeX using KaTeX and dangerouslySetInnerHTML for HTML insertion.
                        return <span key={index} dangerouslySetInnerHTML={{ __html: window.katex.renderToString(part, { throwOnError: false }) }} />;
                    }
                    // Fallback: if KaTeX is not loaded, render the raw LaTeX string with delimiters.
                    return <span key={index}>${part}$</span>;
                }
                // Even-indexed parts are plain text.
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};