import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

interface ExperienceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  experienceId?: string;
  initialData?: {
    id?: string;
    company: string;
    role: string;
    duration: string;
    highlights: string[];
    employment_type: string;
    skills: string[];
    team_size: number;
    projects_count: number;
    impact_score: number;
    endorsements: any[];
    endorsement_count: number;
  };
}

interface ExperienceData {
  id?: string;
  company: string;
  role: string;
  duration: string;
  highlights: string[];
  employment_type: string;
  skills: string[];
  team_size: number;
  projects_count: number;
  impact_score: number;
  endorsements: any[];
  endorsement_count: number;
}

const ExperienceForm: React.FC<ExperienceFormProps> = ({ 
  onSuccess, 
  onCancel,
  experienceId,
  initialData 
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<ExperienceData>({
    company: '',
    role: '',
    duration: '',
    highlights: [''],
    employment_type: 'full-time',
    skills: [],
    team_size: 0,
    projects_count: 0,
    impact_score: 0,
    endorsements: [],
    endorsement_count: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleHighlightChange = (index: number, value: string) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData(prev => ({
      ...prev,
      highlights: newHighlights
    }));
  };

  const addHighlight = () => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, '']
    }));
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const url = experienceId 
        ? `${API_URL}/auth/work-experience/${experienceId}/`
        : `${API_URL}/auth/work-experience/`;

      const method = experienceId ? 'PATCH' : 'POST';

      // Remove empty highlights
      const dataToSend = {
        ...formData,
        highlights: formData.highlights.filter(h => h.trim() !== '')
      };

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios({
        method,
        url,
        data: dataToSend,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving experience:', err);
      setError('Failed to save experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm px-4 py-6 w-full">
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            placeholder="e.g., Google, Microsoft"
            className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Role</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            placeholder="e.g., Software Engineer, Product Manager"
            className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Duration</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="e.g., Jan 2020 - Present"
            className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Employment Type</label>
          <select
            name="employment_type"
            value={formData.employment_type}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-gray-100"
            required
          >
            <option value="full-time" className="text-gray-900 dark:text-gray-100">Full-time</option>
            <option value="part-time" className="text-gray-900 dark:text-gray-100">Part-time</option>
            <option value="contract" className="text-gray-900 dark:text-gray-100">Contract</option>
            <option value="internship" className="text-gray-900 dark:text-gray-100">Internship</option>
            <option value="freelance" className="text-gray-900 dark:text-gray-100">Freelance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Skills</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              className="flex-1 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-xl"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(index)}
                  className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Highlights</label>
          {formData.highlights.map((highlight, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={highlight}
                onChange={(e) => handleHighlightChange(index, e.target.value)}
                placeholder="Add a highlight"
                className="flex-1 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => removeHighlight(index)}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addHighlight}
            className="mt-2 px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl transition-colors"
          >
            Add Highlight
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Team Size</label>
            <input
              type="number"
              name="team_size"
              value={formData.team_size}
              onChange={handleNumberInputChange}
              min="0"
              className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Projects Count</label>
            <input
              type="number"
              name="projects_count"
              value={formData.projects_count}
              onChange={handleNumberInputChange}
              min="0"
              className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Impact Score</label>
            <input
              type="number"
              name="impact_score"
              value={formData.impact_score}
              onChange={handleNumberInputChange}
              min="0"
              max="100"
              className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Experience'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExperienceForm; 