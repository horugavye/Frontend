import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { PhotoIcon, CameraIcon } from '@heroicons/react/24/outline';

interface PersonalityTag {
  id: string;
  name: string;
  color: string;
}

interface Interest {
  id: string;
  name: string;
  color: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  bio: string;
  personal_story: string;
  avatar: File | null;
  cover_photo: File | null;
  location: string;
  website: string;
  personality_tags: PersonalityTag[];
  interests: Interest[];
}

interface ProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  refreshProfile?: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL + '/api';

const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess, onCancel, refreshProfile }) => {
  const { user } = useAuth();
  const [error, setError] = useState<string>('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showInterestSelector, setShowInterestSelector] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    bio: '',
    personal_story: '',
    avatar: null,
    cover_photo: null,
    location: '',
    website: '',
    personality_tags: [],
    interests: []
  });
  const [existingTags, setExistingTags] = useState<PersonalityTag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('purple');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [newInterestColor, setNewInterestColor] = useState('blue');
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);

  // Add default image URLs
  const defaultCoverUrl = 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=2400&auto=format&fit=crop&q=80';

  const tagColors = [
    { name: 'purple', value: 'from-purple-500 to-pink-500' },
    { name: 'blue', value: 'from-blue-500 to-cyan-500' },
    { name: 'green', value: 'from-green-500 to-emerald-500' },
    { name: 'orange', value: 'from-orange-500 to-red-500' },
    { name: 'pink', value: 'from-pink-500 to-rose-500' }
  ];

  // Define base colors for interests
  const interestColors = ['emerald', 'blue', 'purple', 'amber', 'rose', 'teal'];

  const getTagGradient = (color: string) => {
    if (color.includes('from-') && color.includes('to-')) {
      return color;
    }
    const colorConfig = tagColors.find(c => c.name === color);
    if (colorConfig) {
      return colorConfig.value;
    }
    return 'from-purple-500 to-pink-500';
  };

  const getInterestColor = (index: number) => {
    const baseColor = interestColors[index % interestColors.length];
    return `from-${baseColor}-600 via-${baseColor}-500 to-${baseColor}-400 text-white hover:from-${baseColor}-500 hover:via-${baseColor}-400 hover:to-${baseColor}-300`;
  };

  // Utility to check if a string is a valid CSS color
  const isValidCssColor = (color: string) => {
    if (!color) return false;
    // Check for hex, rgb, rgba, hsl, or named color
    return (
      /^#([0-9A-F]{3}){1,2}$/i.test(color) ||
      /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/.test(color) ||
      /^rgba\((\s*\d+\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/.test(color) ||
      /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/.test(color) ||
      /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*(0|1|0?\.\d+)\s*\)$/.test(color) ||
      // Named color (basic check)
      (typeof document !== 'undefined' && (() => {
        const s = document.createElement('span').style;
        s.color = color;
        return !!s.color;
      })())
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/profile/`);
        setFormData(prev => ({
          ...prev,
          ...response.data
        }));

        // Handle avatar URL
        if (response.data.avatar) {
          const fullAvatarUrl = response.data.avatar.startsWith('http') 
            ? response.data.avatar 
            : `${API_URL}${response.data.avatar}`;
          setPreviewUrl(fullAvatarUrl);
        } else {
          setPreviewUrl(null);
        }

        // Handle cover photo URL
        if (response.data.cover_photo) {
          const fullCoverUrl = response.data.cover_photo.startsWith('http') 
            ? response.data.cover_photo 
            : `${API_URL}${response.data.cover_photo}`;
          setCoverPreviewUrl(fullCoverUrl);
        } else {
          setCoverPreviewUrl(defaultCoverUrl);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data');
        // Set default images on error
        setPreviewUrl(null);
        setCoverPreviewUrl(defaultCoverUrl);
      }
      setInitialLoading(false);
    };

    const fetchAllTags = async () => {
      try {
        // Get all available tags
        const allTagsResponse = await axios.get(`${API_URL}/auth/personality-tags/`);
        console.log('All personality tags:', allTagsResponse.data);
        setExistingTags(allTagsResponse.data);

        // Get user's selected tags
        const userTagsResponse = await axios.get(`${API_URL}/auth/user/personality-tags/`);
        console.log('User personality tags:', userTagsResponse.data);
        setFormData(prev => ({
          ...prev,
          personality_tags: userTagsResponse.data
        }));
      } catch (err: any) {
        console.error('Error fetching personality tags:', err);
      }
    };

    const fetchAvailableInterests = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/available-interests/`);
        setAvailableInterests(response.data);
      } catch (err) {
        console.error('Error fetching available interests:', err);
      }
    };

    if (user?.id) {
      fetchProfile();
      fetchAllTags();
      fetchAvailableInterests();
    } else {
      // If no user, set default images
      setPreviewUrl(null);
      setCoverPreviewUrl(defaultCoverUrl);
      setInitialLoading(false);
    }
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formDataToSend = new FormData();
    formDataToSend.append('bio', formData.bio);
    formDataToSend.append('personal_story', formData.personal_story);
    formDataToSend.append('location', formData.location);
    formDataToSend.append('website', formData.website);
    // Add username for backend permission check
    formDataToSend.append('username', user?.username || '');
    // Only append images if they've been changed and are a File
    if (formData.avatar instanceof File) {
      formDataToSend.append('avatar', formData.avatar);
    }
    if (formData.cover_photo instanceof File) {
      formDataToSend.append('cover_photo', formData.cover_photo);
    }

    try {
      console.log('Submitting form data:', {
        bio: formData.bio,
        personal_story: formData.personal_story,
        location: formData.location,
        website: formData.website,
        hasAvatar: !!formData.avatar,
        hasCoverPhoto: !!formData.cover_photo
      });

      // Add Authorization header
      const token = localStorage.getItem('access_token');
      let response;
      response = await axios.put(`${API_URL}/auth/profile/update/`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });

      console.log('Profile update response:', response.data);

      // Then update personality tags if they've changed
      if (formData.personality_tags.length > 0) {
        try {
          // First, get current tags
          const currentTagsResponse = await axios.get(`${API_URL}/auth/personality-tags/`);
          const currentTags = currentTagsResponse.data;

          // Remove tags that are no longer selected
          const tagsToRemove = currentTags.filter((tag: PersonalityTag) => 
            !formData.personality_tags.some(selectedTag => selectedTag.id === tag.id)
          );
          for (const tag of tagsToRemove) {
            await axios.delete(`${API_URL}/auth/personality-tags/${tag.id}/`);
          }

          // Add new tags
          const tagsToAdd = formData.personality_tags.filter(tag => 
            !currentTags.some((currentTag: PersonalityTag) => currentTag.id === tag.id)
          );
          for (const tag of tagsToAdd) {
            await axios.post(`${API_URL}/auth/personality-tags/`, { name: tag.name });
          }
        } catch (tagError: any) {
          console.error('Error updating personality tags:', tagError);
          // Don't fail the whole update if tag update fails
        }
      }

      if (refreshProfile) {
        await refreshProfile();
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      });
      // Show more detailed error message
      const errorMessage = err.response?.data?.error || 
                          (typeof err.response?.data === 'object' ? 
                            Object.entries(err.response?.data)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ') : 
                            'Failed to update profile. Please try again.');
      setError(errorMessage);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover_photo') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [type]: file
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'avatar') {
          setPreviewUrl(reader.result as string);
        } else {
          setCoverPreviewUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = async (type: 'avatar' | 'cover_photo') => {
    try {
      // Create a new FormData instance
      const formDataToSend = new FormData();
      // Add all existing form data
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('personal_story', formData.personal_story);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('website', formData.website);
      // Add username for backend permission check
      formDataToSend.append('username', user?.username || '');
      // Add the image field as null
      formDataToSend.append(type, '');

      // Add Authorization header
      const token = localStorage.getItem('access_token');
      let delResponse;
      delResponse = await axios.put(`${API_URL}/auth/profile/update/`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });

      // Update local state
      setFormData(prev => ({
        ...prev,
        [type]: null
      }));

      if (type === 'avatar') {
        setPreviewUrl(null);
      } else {
        setCoverPreviewUrl(defaultCoverUrl);
      }

      // Refresh profile if callback exists
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRemoveTag = async (index: number) => {
    const tagToRemove = formData.personality_tags[index];
    try {
      // Remove from user's profile only
      await axios.delete(`${API_URL}/auth/personality-tags/${tagToRemove.id}/`);
      
      // Update local state
      setFormData(prev => ({
        ...prev,
        personality_tags: prev.personality_tags.filter((_, i) => i !== index)
      }));
    } catch (err: any) {
      console.error('Error removing tag from profile:', err);
      setError('Failed to remove tag from profile. Please try again.');
    }
  };

  const handleAddTag = async (tag: PersonalityTag) => {
    try {
      // Add tag to user's profile
      await axios.post(`${API_URL}/auth/personality-tags/`, {
        name: tag.name,
        color: tag.color
      });
      
      // Update local state
      setFormData(prev => ({
        ...prev,
        personality_tags: [...prev.personality_tags, tag]
      }));
      
      setShowTagSelector(false);
    } catch (err: any) {
      console.error('Error adding tag to profile:', err);
      setError('Failed to add tag to profile. Please try again.');
    }
  };

  const handleTagSearch = (searchTerm: string) => {
    setNewTag(searchTerm);
    if (searchTerm.trim()) {
      const results = existingTags.filter(tag => 
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results.map(tag => tag.name));
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleCreateTag = async () => {
    if (newTag) {
      // Check if tag already exists
      const existingTag = existingTags.find(tag => 
        tag.name.toLowerCase() === newTag.toLowerCase()
      );

      if (existingTag) {
        // If tag exists, just add it to the user's profile
        handleAddTag(existingTag);
        setNewTag('');
        setNewTagColor('purple');
        setShowTagSelector(false);
        return;
      }

      try {
        const response = await axios.post(`${API_URL}/auth/personality-tags/`, {
          name: newTag,
          color: newTagColor
        });
        const newTagObj = response.data;
        console.log('New tag created:', newTagObj);
        
        // Add the new tag to the form data
        setFormData(prev => ({
          ...prev,
          personality_tags: [...prev.personality_tags, newTagObj]
        }));
        
        // Add the new tag to the existing tags list
        setExistingTags(prev => [...prev, newTagObj]);
        
        setNewTag('');
        setNewTagColor('purple');
        setShowTagSelector(false);
      } catch (err: any) {
        console.error('Error creating tag:', err);
        setError('Failed to create tag. Please try again.');
      }
    }
  };

  const handleDeleteTagFromDatabase = async (tagId: string) => {
    try {
      // Delete from database
      await axios.delete(`${API_URL}/auth/personality-tags/${tagId}/delete/`);
      
      // Remove from existing tags list
      setExistingTags(prev => prev.filter(tag => tag.id !== tagId));
      
      // Also remove from form data if it's selected
      setFormData(prev => ({
        ...prev,
        personality_tags: prev.personality_tags.filter(tag => tag.id !== tagId)
      }));
    } catch (err: any) {
      console.error('Error deleting tag from database:', err);
      setError('Failed to delete tag from database. Please try again.');
    }
  };

  const handleInterestSearch = (searchTerm: string) => {
    setNewInterest(searchTerm);
    if (searchTerm.trim()) {
      const results = availableInterests.filter(interest => 
        interest.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleAddInterest = async (interestName?: string) => {
    const nameToAdd = interestName || newInterest;
    if (!nameToAdd.trim()) {
      setError('Interest name cannot be empty');
      return;
    }
    
    try {
      // Select a random color from the base colors
      const randomColor = interestColors[Math.floor(Math.random() * interestColors.length)];
      
      const requestData = {
        name: nameToAdd.trim(),
        color: randomColor
      };
      
      console.log('Sending interest data:', requestData); // Debug log
      
      const response = await axios.post(`${API_URL}/auth/interests/`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Interest response:', response.data); // Debug log

      if (response.data && response.data.id) {
        // Update the form data with the new interest
        setFormData(prev => ({
          ...prev,
          interests: [...prev.interests, response.data]
        }));
        
        // Clear the input and close the modal
        setNewInterest('');
        setShowInterestSelector(false);
        setError(''); // Clear any previous errors
      } else {
        console.error('Invalid response data:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error adding interest:', err.response?.data || err.message);
      // Show more detailed error message
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to add interest. Please try again.';
      setError(errorMessage);
    }
  };

  const handleRemoveInterest = async (index: number) => {
    const interestToRemove = formData.interests[index];
    try {
      await axios.delete(`${API_URL}/auth/interests/${interestToRemove.id}/`);
      
      setFormData(prev => ({
        ...prev,
        interests: prev.interests.filter((_, i) => i !== index)
      }));
    } catch (err) {
      console.error('Error removing interest:', err);
      setError('Failed to remove interest. Please try again.');
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-dark-border">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-dark-card z-10 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Profile Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-800 p-3 rounded-lg mb-4 text-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-2 text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="relative h-40 rounded-2xl overflow-hidden mb-12 bg-gradient-to-r from-purple-600 to-pink-600">
          {coverPreviewUrl ? (
            <img
              src={coverPreviewUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={defaultCoverUrl}
              alt="Default Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex gap-2">
              <label
                htmlFor="cover-upload"
                className="cursor-pointer p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <CameraIcon className="h-6 w-6 text-white" />
                <input
                  id="cover-upload"
                  name="cover_photo"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, 'cover_photo')}
                  accept="image/*"
                />
              </label>
              {coverPreviewUrl !== defaultCoverUrl && (
                <button
                  type="button"
                  onClick={() => handleDeleteImage('cover_photo')}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-8 left-4">
            <div className="relative h-20 w-20 ring-4 ring-white rounded-full">
              {initialLoading ? (
                <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                </div>
              ) : (
                <>
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-md overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      >
                        <CameraIcon className="h-5 w-5 text-white" />
                        <input
                          id="avatar-upload"
                          name="avatar"
                          type="file"
                          className="hidden"
                          onChange={(e) => handleImageChange(e, 'avatar')}
                          accept="image/*"
                        />
                      </label>
                      {previewUrl !== null && (
                        <button
                          type="button"
                          onClick={() => handleDeleteImage('avatar')}
                          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Location (e.g., San Francisco, CA)"
              className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-dark-text bg-white dark:bg-dark-card-hover placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="Website"
              className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-dark-text bg-white dark:bg-dark-card-hover placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Write a short bio..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-dark-text bg-white dark:bg-dark-card-hover placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            />
          </div>

          <div>
            <textarea
              name="personal_story"
              value={formData.personal_story}
              onChange={handleInputChange}
              placeholder="Share your journey..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-dark-text bg-white dark:bg-dark-card-hover placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            />
          </div>

          {/* Personality Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personality Tags</label>
            <div className="flex flex-wrap gap-2">
              {formData.personality_tags.map((tag, index) => (
                <div
                  key={`${tag.id}-${index}`}
                  className={`flex items-center gap-1 px-3 py-1 font-semibold rounded-full text-sm shadow-md`}
                  style={isValidCssColor(tag.color) ? { backgroundColor: tag.color, color: '#fff' } : undefined}
                >
                  <span>{tag.name}</span>
                  <span
                    role="button"
                    onClick={() => handleRemoveTag(index)}
                    className="cursor-pointer text-white/80 hover:text-white ml-1 leading-none"
                  >
                    ×
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowTagSelector(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-colors duration-200"
              >
                + Add Tag
              </button>
            </div>
          </div>

          {/* Interests Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest) => (
                <div
                  key={interest.id}
                  className="flex items-center gap-1 px-3 py-1 text-purple-700 bg-purple-50/50 rounded-full text-sm font-medium border border-purple-100"
                >
                  <span>{interest.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(formData.interests.indexOf(interest))}
                    className="text-purple-400 hover:text-purple-600 bg-white rounded-full w-4 h-4 flex items-center justify-center transition-colors duration-200 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowInterestSelector(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-colors duration-200"
              >
                + Add Interest
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text bg-gray-50 dark:bg-dark-card-hover hover:bg-gray-100 dark:hover:bg-dark-card border border-gray-300 dark:border-dark-border rounded-xl transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-colors duration-200"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Tag Selector Modal */}
      {showTagSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 border border-gray-200 dark:border-dark-border shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Select or Create Personality Tags</h3>
              <button
                onClick={() => setShowTagSelector(false)}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-dark-text bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-xl transition-colors duration-200"
              >
                Close
              </button>
            </div>

            {/* Search/Create Tag Input */}
            <div className="mb-4">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Search or create new tag..."
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  value={newTag}
                  onChange={(e) => handleTagSearch(e.target.value)}
                />
                {isSearching && searchResults.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">Found {searchResults.length} matching tags:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {searchResults.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleAddTag({ id: '', name: tag, color: '' })}
                          className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors duration-200`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {newTag && (searchResults.length === 0 || !isSearching) && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">Create new tag:</p>
                    <div className="flex gap-2">
                      <select
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-dark-text text-sm"
                      >
                        {tagColors.map(color => (
                          <option key={color.name} value={color.name}>
                            {color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleCreateTag}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-colors duration-200"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Tags */}
            <div className="grid grid-cols-2 gap-2">
              {existingTags.map(tag => (
                <div key={tag.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddTag(tag)}
                    className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors duration-200`}
                    style={isValidCssColor(tag.color) ? { backgroundColor: tag.color, color: '#fff' } : undefined}
                  >
                    {tag.name}
                  </button>
                  <button
                    onClick={() => handleDeleteTagFromDatabase(tag.id)}
                    className="p-2 bg-white dark:bg-dark-card rounded-full hover:bg-gray-100 dark:hover:bg-dark-card-hover transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interest Selector Modal */}
      {showInterestSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 border border-gray-200 dark:border-dark-border shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Add Interest</h3>
              <button
                onClick={() => setShowInterestSelector(false)}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-dark-text bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-xl transition-colors duration-200"
              >
                Close
              </button>
            </div>

            <div className="mb-4">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => handleInterestSearch(e.target.value)}
                  placeholder="Search or enter a new interest..."
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-dark-card-hover text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
                />
                {isSearching && searchResults.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">Found {searchResults.length} matching interests:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {searchResults.map((interest, index) => {
                        const baseColor = interestColors[index % interestColors.length];
                        const colorClass = `bg-${baseColor}-500/10 text-${baseColor}-600 hover:bg-${baseColor}-500/20 transition-all duration-200`;
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => handleAddInterest(interest)}
                            className={`px-3 py-1 text-sm font-medium ${colorClass} rounded-md`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {newInterest && (searchResults.length === 0 || !isSearching) && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">Create new interest:</p>
                    <button
                      onClick={() => handleAddInterest()}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-colors duration-200"
                    >
                      Add "{newInterest}"
                    </button>
                  </div>
                )}
              </div>
            </div>

            {availableInterests.length > 0 && !isSearching && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Interests</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availableInterests.slice(0, 6).map((interest, index) => {
                    const baseColor = interestColors[index % interestColors.length];
                    const colorClass = `bg-${baseColor}-500/10 text-${baseColor}-600 hover:bg-${baseColor}-500/20 transition-all duration-200`;
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleAddInterest(interest)}
                        className={`px-3 py-1 text-sm font-medium ${colorClass} rounded-md`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileForm; 