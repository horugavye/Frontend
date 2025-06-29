import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { API_URL } from '../config';

interface SkillFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  refreshProfile: () => void;
}

interface SkillFormData {
  name: string;
  level: number;
}

const SkillForm: React.FC<SkillFormProps> = ({ onSuccess, onCancel, refreshProfile }) => {
  const [formData, setFormData] = useState<SkillFormData>({
    name: '',
    level: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'level' ? parseInt(value) : value
    }));
  };

  const getSkillLevelLabel = (percentage: number) => {
    if (percentage >= 90) return 'Master';
    if (percentage >= 70) return 'Expert';
    if (percentage >= 50) return 'Advanced';
    if (percentage >= 30) return 'Intermediate';
    return 'Beginner';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/skills/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          name: formData.name,
          level: formData.level
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add skill');
      }

      await refreshProfile();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-dark-text">Add New Skill</h2>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">Skill Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g. JavaScript, Python, Project Management"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text">Skill Level</label>
            <span className="text-sm text-gray-500 dark:text-dark-text-secondary">
              {formData.level}% - {getSkillLevelLabel(formData.level)}
            </span>
          </div>
          <input
            type="range"
            name="level"
            min="0"
            max="100"
            value={formData.level}
            onChange={handleInputChange}
            className="w-full h-2 bg-gray-200 dark:bg-dark-card-hover rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-dark-text-secondary mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg text-gray-400 dark:text-dark-text-secondary hover:text-gray-600 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5" />
                Add Skill
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SkillForm; 