import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

interface EducationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  refreshProfile?: () => Promise<void>;
  initialData?: any;
}

interface EducationData {
  school: string;
  degree: string;
  field: string;
  year: string;
  institution_type: string;
  duration: string;
  gpa: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  achievements: string[];
  skills_learned: string[];
  location: string;
  website: string;
  is_verified: boolean;
}

const EducationForm: React.FC<EducationFormProps> = ({ onSuccess, onCancel, refreshProfile, initialData }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EducationData>({
    school: '',
    degree: '',
    field: '',
    year: '',
    institution_type: 'university',
    duration: '',
    gpa: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    achievements: [],
    skills_learned: [],
    location: '',
    website: '',
    is_verified: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        school: initialData.school || '',
        degree: initialData.degree || '',
        field: initialData.field || '',
        year: initialData.year || '',
        institution_type: initialData.institution_type || 'university',
        duration: initialData.duration || '',
        gpa: initialData.gpa || '',
        start_date: initialData.start_date || '',
        end_date: initialData.end_date || '',
        is_current: initialData.is_current || false,
        description: initialData.description || '',
        achievements: initialData.achievements || [],
        skills_learned: initialData.skills_learned || [],
        location: initialData.location || '',
        website: initialData.website || '',
        is_verified: initialData.is_verified || false
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'gpa') {
      const gpaValue = parseFloat(value);
      if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4) {
        return;
      }
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (name === 'start_date') {
      setFormData(prev => ({
        ...prev,
        start_date: value,
        year: value ? new Date(value).getFullYear().toString() : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.split(',').map(item => item.trim())
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Format the data before sending
      const formattedData = {
        ...formData,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        year: formData.start_date ? new Date(formData.start_date).getFullYear().toString() : '',
        achievements: formData.achievements || [],
        skills_learned: formData.skills_learned || [],
        start_date: formData.start_date || null,
        end_date: formData.is_current ? null : (formData.end_date || null)
      };

      if (initialData?.id) {
        // Update existing education
        await axios.put(
          `${API_URL}/auth/education/${initialData.id}/`,
          formattedData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Create new education
        await axios.post(
          `${API_URL}/auth/education/`,
          formattedData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (onSuccess) {
        onSuccess();
      }

      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err) {
      console.error('Error saving education:', err);
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(err.response.data.message || 'Failed to save education');
      } else {
        setError('Failed to save education');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm px-6 py-6 w-full max-h-[80vh] overflow-y-auto">
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            School*
          </label>
          <input
            type="text"
            name="school"
            value={formData.school}
            onChange={handleInputChange}
            placeholder="e.g., Stanford University"
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Institution Type*
          </label>
          <select
            name="institution_type"
            value={formData.institution_type}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
          >
            <option value="university">University</option>
            <option value="college">College</option>
            <option value="high_school">High School</option>
            <option value="bootcamp">Bootcamp</option>
            <option value="online_course">Online Course</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Degree*
          </label>
          <input
            type="text"
            name="degree"
            value={formData.degree}
            onChange={handleInputChange}
            placeholder="e.g., Bachelor's, Master's, PhD"
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Field of Study*
          </label>
          <input
            type="text"
            name="field"
            value={formData.field}
            onChange={handleInputChange}
            placeholder="e.g., Computer Science, Business Administration"
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              disabled={formData.is_current}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text disabled:bg-gray-100 dark:disabled:bg-dark-card-hover disabled:text-gray-500 dark:disabled:text-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_current"
            checked={formData.is_current}
            onChange={handleInputChange}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-dark-border rounded"
          />
          <label className="ml-2 block text-sm text-gray-700 dark:text-dark-text">
            I am currently studying here
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Duration
          </label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="e.g., 4 years, 2 years"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            GPA
          </label>
          <input
            type="number"
            name="gpa"
            value={formData.gpa}
            onChange={handleInputChange}
            placeholder="e.g., 3.8"
            step="0.01"
            min="0"
            max="4"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">Enter your GPA on a 4.0 scale</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Year
          </label>
          <input
            type="text"
            name="year"
            value={formData.year}
            readOnly
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-dark-text"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">Year is automatically set based on start date</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g., Stanford, CA"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Website
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="e.g., https://stanford.edu"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_verified"
            checked={formData.is_verified}
            onChange={handleInputChange}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-dark-border rounded"
          />
          <label className="ml-2 block text-sm text-gray-700 dark:text-dark-text">
            This education is verified
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your educational experience..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Achievements (comma-separated)
          </label>
          <textarea
            name="achievements"
            value={formData.achievements.join(', ')}
            onChange={handleArrayInputChange}
            placeholder="e.g., Dean's List, Research Assistant, Student Council President"
            rows={2}
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Skills Learned (comma-separated)
          </label>
          <textarea
            name="skills_learned"
            value={formData.skills_learned.join(', ')}
            onChange={handleArrayInputChange}
            placeholder="e.g., Machine Learning, Data Analysis, Project Management"
            rows={2}
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 dark:border-dark-border rounded-2xl text-sm font-medium text-gray-700 dark:text-dark-text bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
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
                {initialData?.id ? 'Updating...' : 'Adding...'}
              </div>
            ) : (
              initialData?.id ? 'Update Education' : 'Add Education'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EducationForm; 