import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  impact?: string;
  team?: string;
  link?: string;
}

interface AchievementFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  refreshProfile?: () => Promise<void>;
  initialData?: Achievement;
}

interface AchievementData {
  title: string;
  date: string;
  description: string;
  category: string;
  impact?: string;
  team?: string;
  link?: string;
}

const AchievementForm: React.FC<AchievementFormProps> = ({ onSuccess, onCancel, refreshProfile, initialData }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<AchievementData>({
    title: '',
    date: '',
    description: '',
    category: 'award',
    impact: '',
    team: '',
    link: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        date: initialData.date || '',
        description: initialData.description || '',
        category: initialData.category || 'award',
        impact: initialData.impact || '',
        team: initialData.team || '',
        link: initialData.link || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any existing error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.date) {
      setError('Date is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Format the data before sending
      const formattedData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        impact: formData.impact?.trim() || null,
        team: formData.team?.trim() || null,
        link: formData.link?.trim() || null
      };

      if (initialData?.id) {
        // Update existing achievement
        await axios.patch(
          `${API_URL}/auth/achievements/${initialData.id}/`,
          formattedData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setSuccess('Achievement updated successfully!');
      } else {
        // Create new achievement
        await axios.post(
          `${API_URL}/auth/achievements/`,
          formattedData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setSuccess('Achievement added successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }

      if (refreshProfile) {
        await refreshProfile();
      }

      // Reset form after successful submission
      setFormData({
        title: '',
        date: '',
        description: '',
        category: 'award',
        impact: '',
        team: '',
        link: ''
      });
    } catch (err) {
      console.error('Error saving achievement:', err);
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(err.response.data.message || 'Failed to save achievement');
      } else {
        setError('Failed to save achievement. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm px-6 py-6 w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-xl mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text mb-1">
            Title*
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Innovation Award, Tech Leadership Summit Speaker"
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text mb-1">
            Category*
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
          >
            <option value="award">Award</option>
            <option value="innovation">Innovation</option>
            <option value="speaking">Speaking</option>
            <option value="publication">Publication</option>
            <option value="patent">Patent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text mb-1">
            Date*
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text mb-1">
            Description*
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your achievement and its significance"
            required
            rows={4}
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text mb-1">
            Impact
          </label>
          <input
            type="text"
            name="impact"
            value={formData.impact}
            onChange={handleInputChange}
            placeholder="e.g., 45% increase in engagement, 1000+ attendees"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text mb-1">
            Team
          </label>
          <input
            type="text"
            name="team"
            value={formData.team}
            onChange={handleInputChange}
            placeholder="e.g., AI Team, Research Team"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text mb-1">
            Link
          </label>
          <input
            type="url"
            name="link"
            value={formData.link}
            onChange={handleInputChange}
            placeholder="https://example.com/award"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 dark:border-dark-border rounded-2xl text-sm font-medium text-gray-900 dark:text-dark-text bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 border border-transparent rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {initialData ? 'Updating...' : 'Adding...'}
              </div>
            ) : (
              initialData ? 'Update Achievement' : 'Add Achievement'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AchievementForm; 