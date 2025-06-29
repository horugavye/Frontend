import React, { useState } from 'react';

const tagColors = [
  { name: 'purple', value: 'from-purple-500 to-pink-500' },
  { name: 'blue', value: 'from-blue-500 to-cyan-500' },
  { name: 'green', value: 'from-green-500 to-emerald-500' },
  { name: 'orange', value: 'from-orange-500 to-red-500' },
  { name: 'pink', value: 'from-pink-500 to-rose-500' }
];

const tagColorMap: Record<string, string> = {
  purple: '#a78bfa', // Tailwind purple-400
  blue: '#60a5fa',   // Tailwind blue-400
  green: '#34d399',  // Tailwind green-400
  orange: '#fb923c', // Tailwind orange-400
  pink: '#f472b6',   // Tailwind pink-400
};

interface PersonalityTagSelectorProps {
  open: boolean;
  onClose: () => void;
  value: string[];
  onChange: (tags: string[]) => void;
  onSessionTagsChange?: (tags: { name: string; color: string }[]) => void;
}

const PersonalityTagSelector: React.FC<PersonalityTagSelectorProps> = ({ open, onClose, value, onChange, onSessionTagsChange }) => {
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('purple');
  const [sessionTags, setSessionTags] = useState<{ name: string; color: string }[]>([]);
  const [error, setError] = useState('');

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (sessionTags.some(tag => tag.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Tag already added');
      return;
    }
    const updated = [...sessionTags, { name: trimmed, color: newTagColor }];
    setSessionTags(updated);
    onChange([...value, trimmed]);
    if (onSessionTagsChange) onSessionTagsChange(updated);
    setNewTag('');
    setNewTagColor('purple');
    setError('');
  };

  const handleRemoveTag = (tagName: string) => {
    const updated = sessionTags.filter(tag => tag.name !== tagName);
    setSessionTags(updated);
    onChange(value.filter(t => t !== tagName));
    if (onSessionTagsChange) onSessionTagsChange(updated);
  };

  // Keep sessionTags in sync with value (for editing)
  React.useEffect(() => {
    const filtered = sessionTags.filter(tag => value.includes(tag.name));
    if (filtered.length !== sessionTags.length) {
      setSessionTags(filtered);
      if (onSessionTagsChange) onSessionTagsChange(filtered);
    }
    // eslint-disable-next-line
  }, [value]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 border border-gray-200 dark:border-dark-border shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Create Your Personality Tags</h3>
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
              placeholder="Enter new tag name..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400 text-sm"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <select
                value={newTagColor}
                onChange={e => setNewTagColor(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-dark-text text-sm"
              >
                {tagColors.map(color => (
                  <option key={color.name} value={color.name}>
                    {color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddTag}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-colors duration-200"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Tags</h4>
          <div className="flex flex-wrap gap-2">
            {sessionTags.map(tag => (
              <div
                key={tag.name}
                className="flex items-center gap-1 px-3 py-1 font-semibold rounded-full text-sm shadow-md text-white"
                style={{ backgroundColor: tagColorMap[tag.color] || '#a78bfa' }}
              >
                <span>{tag.name}</span>
                <span
                  role="button"
                  onClick={() => handleRemoveTag(tag.name)}
                  className="cursor-pointer text-white/80 hover:text-white ml-1 leading-none"
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

export default PersonalityTagSelector; 