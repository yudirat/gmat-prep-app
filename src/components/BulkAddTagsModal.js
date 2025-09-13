// src/components/BulkAddTagsModal.js - (New File)

import React, { useState, useMemo } from 'react';
import { GMAT_TOPICS } from '../constants/gmatTopics';

const BulkAddTagsModal = ({ isOpen, onClose, onConfirm, selectedCount, section }) => {
  const [tagsToAdd, setTagsToAdd] = useState([]);

  // Determine which tags to display based on the selected section
  const availableTags = useMemo(() => {
    if (section === 'Quantitative') return Object.values(GMAT_TOPICS.Quantitative).flat();
    if (section === 'Verbal') return GMAT_TOPICS.Verbal;
    if (section === 'DataInsights') return GMAT_TOPICS.DataInsights;
    return [];
  }, [section]);

  if (!isOpen) return null;

  const handleTagChange = (tag) => {
    setTagsToAdd(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleConfirm = () => {
    if (tagsToAdd.length > 0) {
      onConfirm(tagsToAdd);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">Add Tags to Questions</h2>
        <p className="mb-4 text-sm text-gray-600">
          Select tags to add to the <strong>{selectedCount}</strong> selected questions. Existing tags will not be removed.
        </p>
        
        <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button 
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${tagsToAdd.includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={tagsToAdd.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            Add Tags
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAddTagsModal;