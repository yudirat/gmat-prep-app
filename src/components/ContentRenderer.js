// This component is responsible for rendering various types of content blocks.
import React from 'react';
import MathText from './MathText';

/**
 * ContentRenderer component takes a content object (or string) and renders it appropriately.
 * It supports rendering text (with LaTeX), images, and tables.
 */
export default function ContentRenderer({ content }) {
    if (content === null || content === undefined) {
        console.error('ContentRenderer received null or undefined content');
        return <div className="text-red-600">Error: Content is missing</div>;
    }

    // Parse the content: it can be a JSON string, an array of blocks, or a plain string.
    let parsedContent = [];
    if (typeof content === 'string') {
        if (content.trim() === '') {
            return <div className="text-gray-400">Empty content</div>;
        }

        try {
            // Only attempt to parse if it looks like JSON
            if (content.startsWith('[') || content.startsWith('{')) {
                parsedContent = JSON.parse(content);
            } else {
                // If it doesn't look like JSON, treat as plain text
                return <MathText text={content} />;
            }
        } catch (e) {
            console.error('JSON parsing failed:', e);
            // If JSON parsing fails, treat it as a plain text block
            return <MathText text={content} />;
        }
    } else if (Array.isArray(content)) {
        // Validate array contents
        if (content.length === 0) {
            return <div className="text-gray-400">Empty content array</div>;
        }
        parsedContent = content;
    } else if (typeof content === 'object') {
        // Handle single block objects
        if ('type' in content && 'value' in content) {
            parsedContent = [content];
        } else {
            console.error('Invalid content object format:', content);
            return <div className="text-red-600">Error: Invalid content format</div>;
        }
    }

    // Fallback for unexpected content types
    if (!Array.isArray(parsedContent)) {
        console.error('Content parsing resulted in non-array:', parsedContent);
        return <MathText text={String(content)} />;
    }

    return (
        <div className="space-y-2">
            {parsedContent.map((block, index) => {
                if (!block || typeof block !== 'object') {
                    console.error(`Invalid block at index ${index}:`, block);
                    return null;
                }

                if (!block.type || !('value' in block)) {
                    console.error(`Block missing type or value at index ${index}:`, block);
                    return null;
                }

                try {
                    switch (block.type) {
                        case 'text':
                            if (typeof block.value !== 'string') {
                                console.error(`Invalid text block value at index ${index}:`, block.value);
                                return null;
                            }
                            return <MathText key={index} text={block.value} />;

                        case 'image':
                            if (typeof block.value !== 'string' || !block.value.startsWith('http')) {
                                console.error(`Invalid image URL at index ${index}:`, block.value);
                                return <div key={index} className="text-red-600">Invalid image URL</div>;
                            }
                            return (
                                <img
                                    key={index}
                                    src={block.value}
                                    alt={block.alt || `Content ${index}`}
                                    className="max-w-full h-auto rounded mx-auto"
                                    onError={(e) => {
                                        console.error(`Failed to load image: ${block.value}`);
                                        e.target.src = 'path/to/fallback/image.png';
                                        e.target.alt = 'Failed to load image';
                                    }}
                                />
                            );

                        case 'table':
                            if (!Array.isArray(block.value)) {
                                console.error(`Invalid table data at index ${index}:`, block.value);
                                return <div key={index} className="text-red-600">Invalid table data</div>;
                            }
                            return (
                                <table key={index} className="w-full text-sm my-2 border-collapse">
                                    <tbody>
                                        {block.value.map((row, rIndex) => {
                                            if (!Array.isArray(row)) {
                                                console.error(`Invalid table row at index ${rIndex}:`, row);
                                                return null;
                                            }
                                            return (
                                                <tr key={rIndex}>
                                                    {row.map((cell, cIndex) => (
                                                        <td key={cIndex} className="p-2 border border-gray-300">
                                                            {typeof cell === 'string' ? (
                                                                <MathText text={cell} />
                                                            ) : (
                                                                String(cell)
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            );

                        default:
                            console.warn(`Unknown block type "${block.type}" at index ${index}`);
                            return null;
                    }
                } catch (error) {
                    console.error(`Error rendering block at index ${index}:`, error);
                    return <div key={index} className="text-red-600">Error rendering content</div>;
                }
            })}
        </div>
    );
}