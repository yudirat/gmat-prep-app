// This component is responsible for rendering various types of content blocks.
import React from 'react';
import MathText from './MathText';

/**
 * ContentRenderer component takes a content object (or string) and renders it appropriately.
 * It supports rendering text (with LaTeX), images, and tables.
 */
export default function ContentRenderer({ content }) {
    // Parse the content: it can be a JSON string, an array of blocks, or a plain string.
    let parsedContent = [];
    if (typeof content === 'string') {
        try {
            // Attempt to parse as JSON (array of blocks)
            parsedContent = JSON.parse(content);
        } catch (e) {
            // If JSON parsing fails, treat it as a plain text block
            return <MathText text={content} />;
        }
    } else if (Array.isArray(content)) {
        // If it's already an array, use it directly
        parsedContent = content;
    }

    // Fallback for unexpected content types
    if (!Array.isArray(parsedContent)) {
        return <MathText text={String(parsedContent)} />;
    }

    return (
        <div className="space-y-2">
            {parsedContent.map((block, index) => {
                if (block.type === 'text') {
                    // Render text blocks using MathText for LaTeX support
                    return <MathText key={index} text={block.value} />;
                }
                if (block.type === 'image') {
                    // Render image blocks
                    return <img key={index} src={block.value} alt={`Content ${index}`} className="max-w-full h-auto rounded mx-auto" />;
                }
                if (block.type === 'table') {
                    // Render table blocks
                    return (
                        <table key={index} className="w-full text-sm my-2 border-collapse">
                            <tbody>
                                {(block.value || []).map((row, rIndex) => (
                                    <tr key={rIndex}>
                                        {(row || []).map((cell, cIndex) => (
                                            <td key={cIndex} className="p-2 border border-gray-300">
                                                <MathText text={cell} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    );
                }
                return null; // Ignore unknown block types
            })}
        </div>
    );
}