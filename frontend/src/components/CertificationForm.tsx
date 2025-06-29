import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import { ApiCertification } from '../types/certification';
import Modal from './Modal';

interface CertificationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  refreshProfile?: () => Promise<void>;
  editingCertification?: CertificationData | null;
}

interface CertificationData {
  id?: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string | null;
  credential_id?: string;
  credential_url?: string;
}

const CertificationForm: React.FC<CertificationFormProps> = ({ 
  onSuccess, 
  onCancel, 
  refreshProfile,
  editingCertification
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState<CertificationData>({
    name: editingCertification?.name || '',
    issuing_organization: editingCertification?.issuing_organization || '',
    issue_date: editingCertification?.issue_date || '',
    expiry_date: editingCertification?.expiry_date || null,
    credential_id: editingCertification?.credential_id || '',
    credential_url: editingCertification?.credential_url || ''
  });

  useEffect(() => {
    if (editingCertification) {
      setFormData({
        name: editingCertification.name,
        issuing_organization: editingCertification.issuing_organization,
        issue_date: editingCertification.issue_date,
        expiry_date: editingCertification.expiry_date,
        credential_id: editingCertification.credential_id,
        credential_url: editingCertification.credential_url
      });
    }
  }, [editingCertification]);

  const commonOrganizations = [
    'Amazon Web Services',
    'Microsoft',
    'Google',
    'Cisco',
    'Oracle',
    'IBM',
    'CompTIA',
    'Red Hat',
    'VMware',
    'Salesforce'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || '' // Ensure we never set null or undefined
    }));
  };

  const handleOrganizationSelect = (org: string) => {
    setFormData(prev => ({ ...prev, issuing_organization: org }));
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    // Small delay to allow click on dropdown items
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Certification name is required');
      return false;
    }
    if (!formData.issuing_organization.trim()) {
      setError('Issuing organization is required');
      return false;
    }
    if (!formData.issue_date) {
      setError('Issue date is required');
      return false;
    }
    if (formData.expiry_date && formData.expiry_date < formData.issue_date) {
      setError('Expiry date cannot be before issue date');
      return false;
    }
    if (formData.credential_url && !formData.credential_url.startsWith('http')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return false;
    }
    return true;
  }; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('No access token found. Please log in again.');
      }

      console.log('Token value:', accessToken);
      console.log('API URL:', API_URL);
      console.log('Form data:', formData);
      console.log('Editing certification ID:', editingCertification?.id);

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      console.log('Request headers:', headers);

      if (editingCertification?.id) {
        console.log('Making PATCH request to:', `${API_URL}/auth/certifications/${editingCertification.id}/`);
        await axios.patch(`${API_URL}/auth/certifications/${editingCertification.id}/`, formData, { headers });
      } else {
        // Create new certification
        console.log('Making POST request to:', `${API_URL}/auth/certifications/`);
        await axios.post(`${API_URL}/auth/certifications/`, formData, { headers });
      }

      if (refreshProfile) {
        await refreshProfile();
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving certification:', err);
      if (axios.isAxiosError(err)) {
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        console.error('Error headers:', err.response?.headers);
      }
      setError('Failed to save certification. Please try again.');
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Certification Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
            required
            placeholder="ex: AWS Certified Solutions Architect"
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Issuing Organization *
          </label>
          <div className="relative">
            <input
              type="text"
              name="issuing_organization"
              value={formData.issuing_organization}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
              required
              placeholder="ex: Amazon Web Services"
            />
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-full bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-10">
                <ul className="py-1 max-h-60 overflow-y-auto">
                  {commonOrganizations.map((org) => (
                    <li
                      key={org}
                      className="px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer text-gray-900 dark:text-dark-text hover:text-purple-700 dark:hover:text-purple-400 transition-colors duration-200"
                      onClick={() => handleOrganizationSelect(org)}
                    >
                      {org}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Issue Date *
          </label>
          <input
            type="date"
            name="issue_date"
            value={formData.issue_date}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
            required
            placeholder="ex: 2024-01-15"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Expiry Date
          </label>
          <input
            type="date"
            name="expiry_date"
            value={formData.expiry_date || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
            placeholder="ex: 2027-01-15"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Credential ID
          </label>
          <input
            type="text"
            name="credential_id"
            value={formData.credential_id || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="ex: AWS-123456789"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-1">
            Credential URL
          </label>
          <input
            type="url"
            name="credential_url"
            value={formData.credential_url || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-2xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="ex: https://www.credly.com/badges/123456789"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-dark-border rounded-2xl text-sm font-medium text-gray-700 dark:text-dark-text bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editingCertification ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              editingCertification ? 'Update Certification' : 'Add Certification'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CertificationForm; 