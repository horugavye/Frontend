import React, { useState } from 'react';

interface InterestCreatorProps {
  open: boolean;
  onClose: () => void;
  value: string[];
  onChange: (interests: string[]) => void;
}

const InterestCreator: React.FC<InterestCreatorProps> = ({ open, onClose, value, onChange }) => {
  const [newInterest, setNewInterest] = useState('');
  const [error, setError] = useState('');

  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (!trimmed) return;
    if (value.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      setError('Interest already added');
      return;
    }
    onChange([...value, trimmed]);
    setNewInterest('');
    setError('');
  };

  const handleRemoveInterest = (interest: string) => {
    onChange(value.filter(i => i !== interest));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 border border-gray-200 dark:border-dark-border shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Add Your Interests</h3>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-dark-text bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-xl transition-colors duration-200"
          >
            Close
          </button>
        </div>
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Enter new interest..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400 text-sm"
              value={newInterest}
              onChange={e => setNewInterest(e.target.value)}
            />
            <button
              onClick={handleAddInterest}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-colors duration-200"
            >
              Add Interest
            </button>
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Interests</h4>
          <div className="flex flex-wrap gap-2">
            {value.map(interest => (
              <div key={interest} className="flex items-center gap-1 px-3 py-1 font-semibold rounded-full text-sm shadow-md bg-purple-100 text-purple-700">
                <span>{interest}</span>
                <span
                  role="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="cursor-pointer text-purple-400 hover:text-purple-600 ml-1 leading-none"
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestCreator; 