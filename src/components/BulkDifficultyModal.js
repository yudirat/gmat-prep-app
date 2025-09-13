// src/components/BulkDifficultyModal.js - (New File)

import React, { useState } from 'react';

const BulkDifficultyModal = ({ isOpen, onClose, onConfirm, selectedCount }) => {
  const [newDifficulty, setNewDifficulty] = useState(3); // Default to Medium

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(newDifficulty);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Change Difficulty</h2>
        <p className="mb-4 text-sm text-gray-600">
          Select a new difficulty level to apply to the <strong>{selectedCount}</strong> selected questions.
        </p>
        
        <label htmlFor="difficulty-select" className="block text-sm font-medium text-gray-700">New Difficulty Level</label>
        <select
          id="difficulty-select"
          value={newDifficulty}
          onChange={(e) => setNewDifficulty(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {[1, 2, 3, 4, 5].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Apply Change
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDifficultyModal;