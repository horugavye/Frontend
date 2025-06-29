import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface PublicationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PublicationForm: React.FC<PublicationFormProps> = ({ onSuccess, onCancel }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    journal: '',
    year: '',
    doi: '',
    url: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('/api/publications/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      onSuccess();
    } catch (err) {
      setError('Failed to add publication. Please try again.');
      console.error('Error adding publication:', err);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Publication title"
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Authors</label>
          <input
            type="text"
            name="authors"
            value={formData.authors}
            onChange={handleChange}
            placeholder="Author names (comma separated)"
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Journal</label>
          <input
            type="text"
            name="journal"
            value={formData.journal}
            onChange={handleChange}
            placeholder="Journal name"
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Year</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            placeholder="Publication year"
            min="1900"
            max={new Date().getFullYear()}
            required
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">DOI (Optional)</label>
          <input
            type="text"
            name="doi"
            value={formData.doi}
            onChange={handleChange}
            placeholder="Digital Object Identifier"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">URL (Optional)</label>
          <input
            type="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="Publication URL"
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm hover:shadow-md"
          >
            Add Publication
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicationForm; 