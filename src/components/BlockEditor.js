// This component provides a rich text editor that supports different types of content blocks (text, image, table).
import React from 'react';
import LatexToolbar from './LatexToolbar';

/**
 * BlockEditor component provides a flexible content editor supporting text, images, and tables.
 * It manages content as an array of blocks, allowing for rich and structured input.
 */
export default function BlockEditor({ content, onContentChange }) {
    // --- Content Parsing and Normalization ---
    // Ensures that the content prop is always treated as an array of blocks.
    let parsedContent = [];
    if (typeof content === 'string') {
        try {
            parsedContent = JSON.parse(content);
        } catch (e) {
            // If it's a non-JSON string (like from an older question), wrap it in the block structure.
            parsedContent = [{ type: 'text', value: content }];
        }
    } else if (Array.isArray(content)) {
        parsedContent = content;
    }
    // --- END OF Content Parsing ---

    // Ref to store textarea elements for toolbar integration
    const textRefs = React.useRef([]);

    /**
     * Handles changes to the value of a specific content block.
     * @param {number} index - The index of the block to update.
     * @param {string|Array} value - The new value for the block.
     */
    const handleBlockChange = (index, value) => {
        const newContent = [...parsedContent];
        newContent[index].value = value;
        onContentChange(newContent);
    };

    /**
     * Adds a new content block of a specified type.
     * @param {string} type - The type of block to add ('text', 'image', 'table').
     */
    const addBlock = (type) => {
        const newBlock = { type, value: type === 'table' ? [['', ''], ['', '']] : '' };
        onContentChange([...parsedContent, newBlock]);
    };

    /**
     * Removes a content block at a specific index.
     * @param {number} index - The index of the block to remove.
     */
    const removeBlock = (index) => {
        onContentChange(parsedContent.filter((_, i) => i !== index));
    };
    
    /**
     * Handles changes to a cell within a table block.
     * @param {number} blockIndex - The index of the table block.
     * @param {number} rowIndex - The row index of the cell.
     * @param {number} colIndex - The column index of the cell.
     * @param {string} value - The new value for the cell.
     */
    const handleTableCellChange = (blockIndex, rowIndex, colIndex, value) => {
        const newContent = [...parsedContent];
        newContent[blockIndex].value[rowIndex][colIndex] = value;
        onContentChange(newContent);
    };

    /**
     * Adds a new row to a table block.
     * @param {number} blockIndex - The index of the table block.
     */
    const addTableRow = (blockIndex) => {
        const newContent = [...parsedContent];
        const table = newContent[blockIndex].value;
        const newRow = Array(table[0].length).fill('');
        table.push(newRow);
        onContentChange(newContent);
    };

    /**
     * Adds a new column to a table block.
     * @param {number} blockIndex - The index of the table block.
     */
    const addTableCol = (blockIndex) => {
        const newContent = [...parsedContent];
        const table = newContent[blockIndex].value;
        table.forEach(row => row.push(''));
        onContentChange(newContent);
    };

    /**
     * Handles pasting an image into an image block.
     * @param {Event} e - The paste event.
     * @param {function} callback - Callback function to update the image value.
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

    return (
        <div className="space-y-2 p-2 border rounded-md bg-gray-50">
            {(parsedContent || []).map((block, index) => (
                <div key={index} className="p-2 border bg-white rounded relative">
                     {/* Button to remove the current block */}
                     <button type="button" onClick={() => removeBlock(index)} className="absolute top-1 right-1 text-xs text-gray-400 hover:text-red-500">remove</button>
                    {block.type === 'text' && (
                        <div>
                            {/* Toolbar for LaTeX insertion in text blocks */}
                            <LatexToolbar textareaRef={{ current: textRefs.current[index] }} onTextChange={(newValue) => handleBlockChange(index, newValue)} />
                            {/* Textarea for text content */}
                            <textarea 
                                ref={el => textRefs.current[index] = el}
                                value={block.value} 
                                onChange={e => handleBlockChange(index, e.target.value)} 
                                className="w-full p-2 border rounded" 
                                rows="3" 
                                placeholder="Enter text or LaTeX..."
                            />
                        </div>
                    )}
                    {block.type === 'image' && (
                        <div onPaste={(e) => handleImagePaste(e, (data) => handleBlockChange(index, data))} className="p-4 border-2 border-dashed rounded text-center text-gray-500">
                            <p>Paste image here</p>
                            {block.value && <img src={block.value} alt="Pasted content" className="max-w-full h-auto mx-auto mt-2 rounded"/>}
                        </div>
                    )}
                    {block.type === 'table' && (
                        <div>
                            {/* Table editor for table blocks */}
                            <table className="w-full text-sm my-2">
                                <tbody>
                                    {(block.value || []).map((row, rIndex) => (
                                        <tr key={rIndex}>
                                            {(row || []).map((cell, cIndex) => (
                                                <td key={cIndex} className="border p-0">
                                                    <input type="text" value={cell} onChange={e => handleTableCellChange(index, rIndex, cIndex, e.target.value)} className="w-full p-1 border-none focus:ring-0"/>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Buttons to add rows and columns to the table */}
                            <button type="button" onClick={() => addTableRow(index)} className="text-xs text-indigo-600 mr-2">+ Row</button>
                            <button type="button" onClick={() => addTableCol(index)} className="text-xs text-indigo-600">+ Col</button>
                        </div>
                    )}
                </div>
            ))}
            {/* Controls to add new blocks */}
            <div className="mt-2">
                <span className="text-sm font-semibold mr-2">Add:</span>
                <button type="button" onClick={() => addBlock('text')} className="text-xs bg-gray-200 px-2 py-1 rounded mr-1 hover:bg-gray-300">Text</button>
                <button type="button" onClick={() => addBlock('image')} className="text-xs bg-gray-200 px-2 py-1 rounded mr-1 hover:bg-gray-300">Image</button>
                <button type="button" onClick={() => addBlock('table')} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">Table</button>
            </div>
        </div>
    );
}