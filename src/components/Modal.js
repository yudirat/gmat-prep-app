// This component provides a reusable modal dialog.
import React from 'react';

/**
 * Modal component displays a customizable modal dialog.
 * It takes `isOpen` to control visibility, `onClose` for closing, `title` for the header, and `children` for content.
 */
export default function Modal({ isOpen, onClose, title, children }) {
    // If the modal is not open, render nothing.
    if (!isOpen) return null;

    return (
        // Modal backdrop: fixed, semi-transparent black background
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            {/* Modal content area: white background, rounded corners, shadow */}
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl m-4">
                {/* Modal header: displays title and an optional close button */}
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    {/* Close button, only rendered if onClose prop is provided */}
                    {onClose && <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>}
                </div>
                {/* Modal body: renders children passed to the component */}
                <div>{children}</div>
            </div>
        </div>
    );
};