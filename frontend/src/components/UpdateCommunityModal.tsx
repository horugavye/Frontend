import { FC, useState, useRef, useEffect } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { CreateCommunityData } from './CreateCommunityModal';

interface UpdateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCommunityData) => Promise<void>;
  initialData: {
    name: string;
    description: string;
    category: string;
    topics: string[];
    rules: string[];
    isPrivate: boolean;
    icon: string | null;
    banner: string | null;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

const DEFAULT_CATEGORIES = [
  { id: 'tech', name: 'Technology' },
  { id: 'science', name: 'Science' },
  { id: 'art', name: 'Art' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'music', name: 'Music' },
  { id: 'sports', name: 'Sports' },
  { id: 'education', name: 'Education' },
  { id: 'other', name: 'Other' },
];

const UpdateCommunityModal: FC<UpdateCommunityModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<CreateCommunityData>({
    name: initialData.name,
    description: initialData.description,
    category: initialData.category,
    isNewCategory: !DEFAULT_CATEGORIES.some(cat => cat.id === initialData.category),
    newCategory: !DEFAULT_CATEGORIES.some(cat => cat.id === initialData.category) ? initialData.category : '',
    topics: initialData.topics,
    rules: initialData.rules,
    isPrivate: initialData.isPrivate,
    icon: null,
    banner: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [communityImagePreview, setCommunityImagePreview] = useState<string | null>(initialData.icon);
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialData.banner);
  const communityImageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Add validation state
  const [validation, setValidation] = useState({
    name: { isValid: true, message: '' },
    description: { isValid: true, message: '' },
    category: { isValid: true, message: '' },
    topics: { isValid: true, message: '' },
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        category: initialData.category,
        isNewCategory: !DEFAULT_CATEGORIES.some(cat => cat.id === initialData.category),
        newCategory: !DEFAULT_CATEGORIES.some(cat => cat.id === initialData.category) ? initialData.category : '',
        topics: initialData.topics,
        rules: initialData.rules,
        isPrivate: initialData.isPrivate,
        icon: null,
        banner: null,
      });
      setCommunityImagePreview(initialData.icon);
      setBannerPreview(initialData.banner);
      setError(null);
      setTopicInput('');
      setRuleInput('');
    }
  }, [isOpen, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    if (type === 'icon') {
      setCommunityImagePreview(previewUrl);
      setFormData(prev => ({ ...prev, icon: file }));
    } else {
      setBannerPreview(previewUrl);
      setFormData(prev => ({ ...prev, banner: file }));
    }
  };

  const handleDeleteImage = (type: 'icon' | 'banner') => {
    if (type === 'icon') {
      setCommunityImagePreview(null);
      setFormData(prev => ({ ...prev, icon: null }));
    } else {
      setBannerPreview(null);
      setFormData(prev => ({ ...prev, banner: null }));
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newValidation = {
      name: { isValid: true, message: '' },
      description: { isValid: true, message: '' },
      category: { isValid: true, message: '' },
      topics: { isValid: true, message: '' },
    };

    // Validate name
    if (!formData.name.trim()) {
      newValidation.name = { isValid: false, message: 'Community name is required' };
    } else if (formData.name.length < 3) {
      newValidation.name = { isValid: false, message: 'Name must be at least 3 characters' };
    } else if (formData.name.length > 50) {
      newValidation.name = { isValid: false, message: 'Name must be less than 50 characters' };
    }

    // Validate description
    if (!formData.description.trim()) {
      newValidation.description = { isValid: false, message: 'Description is required' };
    } else if (formData.description.length < 10) {
      newValidation.description = { isValid: false, message: 'Description must be at least 10 characters' };
    } else if (formData.description.length > 500) {
      newValidation.description = { isValid: false, message: 'Description must be less than 500 characters' };
    }

    // Validate category
    if (formData.isNewCategory && !formData.newCategory.trim()) {
      newValidation.category = { isValid: false, message: 'New category name is required' };
    }

    // Validate topics
    if (formData.topics.length === 0) {
      newValidation.topics = { isValid: false, message: 'At least one topic is required' };
    }

    setValidation(newValidation);
    return Object.values(newValidation).every(v => v.isValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create the data object in the expected format
      const communityData: CreateCommunityData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isPrivate: formData.isPrivate,
        topics: formData.topics,
        rules: formData.rules,
        category: formData.isNewCategory ? formData.newCategory.trim() : formData.category,
        isNewCategory: formData.isNewCategory,
        newCategory: formData.newCategory,
        icon: formData.icon,
        banner: formData.banner
      };

      await onSubmit(communityData);
      onClose();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to update community');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTopic = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, topicInput.trim()]
      }));
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const handleAddRule = () => {
    if (ruleInput.trim() && !formData.rules.includes(ruleInput.trim())) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, ruleInput.trim()]
      }));
      setRuleInput('');
    }
  };

  const handleRemoveRule = (ruleToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule !== ruleToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-dark-card rounded-3xl shadow-xl max-w-xl w-full p-4 transform transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Update Community
              </h2>
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-0.5">
                Modify your community settings and details
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-dark-card-hover rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Image Upload Section */}
            <div className="grid grid-cols-2 gap-3">
              {/* Community Image Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                  Community Image
                </label>
                <div 
                  onClick={() => communityImageInputRef.current?.click()}
                  className="relative aspect-[3/1] w-full border border-dashed border-gray-300 dark:border-dark-border rounded-2xl hover:border-purple-500 dark:hover:border-purple-500 cursor-pointer transition-all overflow-hidden group bg-gray-50 dark:bg-dark-card-hover hover:bg-gray-100 dark:hover:bg-dark-card-hover/80"
                >
                  {communityImagePreview ? (
                    <div className="relative w-full h-full group-hover:opacity-90 transition-opacity">
                      <img 
                        src={communityImagePreview} 
                        alt="Community image preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
                          Change Image
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage('icon');
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-dark-text-secondary group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                      <PhotoIcon className="w-8 h-8 mb-1 transform group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium">Upload image</span>
                      <span className="text-[10px] mt-0.5">1200x400px</span>
                    </div>
                  )}
                  <input
                    ref={communityImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'icon')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Banner Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                  Community Banner
                </label>
                <div 
                  onClick={() => bannerInputRef.current?.click()}
                  className="relative aspect-[3/1] w-full border border-dashed border-gray-300 dark:border-dark-border rounded-2xl hover:border-purple-500 dark:hover:border-purple-500 cursor-pointer transition-all overflow-hidden group bg-gray-50 dark:bg-dark-card-hover hover:bg-gray-100 dark:hover:bg-dark-card-hover/80"
                >
                  {bannerPreview ? (
                    <div className="relative w-full h-full group-hover:opacity-90 transition-opacity">
                      <img 
                        src={bannerPreview} 
                        alt="Community banner preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
                          Change Banner
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage('banner');
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-dark-text-secondary group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                      <PhotoIcon className="w-8 h-8 mb-1 transform group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium">Upload banner</span>
                      <span className="text-[10px] mt-0.5">1200x400px</span>
                    </div>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'banner')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                  Community Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    setValidation(prev => ({ ...prev, name: { isValid: true, message: '' } }));
                  }}
                  className={`w-full px-3 py-1.5 text-sm bg-white dark:bg-dark-card border ${
                    validation.name.isValid 
                      ? 'border-gray-200 dark:border-dark-border focus:border-purple-500' 
                      : 'border-red-300 dark:border-red-800 focus:border-red-500'
                  } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-dark-text-secondary`}
                  placeholder="Enter community name"
                />
                {!validation.name.isValid && (
                  <p className="text-xs text-red-500 dark:text-red-400">{validation.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                  Category
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isNewCategory: false }))}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                      !formData.isNewCategory
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'
                        : 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                    }`}
                  >
                    Select Existing Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isNewCategory: true }))}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                      formData.isNewCategory
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'
                        : 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                    }`}
                  >
                    Create New Category
                  </button>
                </div>

                {formData.isNewCategory ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.newCategory}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, newCategory: e.target.value }));
                          setValidation(prev => ({ ...prev, category: { isValid: true, message: '' } }));
                        }}
                        className={`w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-dark-card border ${
                          validation.category.isValid 
                            ? 'border-gray-200 dark:border-dark-border focus:border-purple-500' 
                            : 'border-red-300 dark:border-red-800 focus:border-red-500'
                        } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-dark-text-secondary`}
                        placeholder="Enter new category name"
                        required
                      />
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    {!validation.category.isValid && (
                      <p className="text-xs text-red-500 dark:text-red-400">{validation.category.message}</p>
                    )}
                    <p className="text-[10px] text-gray-500 dark:text-dark-text-secondary">
                      Create a unique category for your community
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                      >
                        {DEFAULT_CATEGORIES.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7l.621-.621A2 2 0 018.379 7H7zm0 0v-.879A2 2 0 016 4.121V7zm0 0v8.879A2 2 0 008.379 19H17a2 2 0 002-2V7a2 2 0 00-2-2H7zm8 5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-dark-text-secondary">
                      Choose from our existing categories
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                Description
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  setValidation(prev => ({ ...prev, description: { isValid: true, message: '' } }));
                }}
                className={`w-full px-3 py-1.5 text-sm bg-white dark:bg-dark-card border ${
                  validation.description.isValid 
                    ? 'border-gray-200 dark:border-dark-border focus:border-purple-500' 
                    : 'border-red-300 dark:border-red-800 focus:border-red-500'
                } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-dark-text-secondary resize-none`}
                rows={2}
                placeholder="Describe your community"
              />
              {!validation.description.isValid && (
                <p className="text-xs text-red-500 dark:text-red-400">{validation.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                Topics
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-dark-text-secondary"
                  placeholder="Add a topic"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  Add
                </button>
              </div>
              {!validation.topics.isValid && (
                <p className="text-xs text-red-500 dark:text-red-400">{validation.topics.message}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {formData.topics.map(topic => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium shadow-sm"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic)}
                      className="hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                Community Rules
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-dark-text-secondary"
                  placeholder="Add a rule"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {formData.rules.map(rule => (
                  <span
                    key={rule}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium shadow-sm"
                  >
                    {rule}
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule)}
                      className="hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-dark-card-hover rounded-2xl border border-gray-200 dark:border-dark-border">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded-lg transition-colors"
              />
              <div>
                <label htmlFor="isPrivate" className="text-xs font-medium text-gray-700 dark:text-dark-text">
                  Make this community private
                </label>
                <p className="text-[10px] text-gray-500 dark:text-dark-text-secondary mt-0.5">
                  Requires approval for new members
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-dark-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-sm bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="relative px-6 py-1.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none overflow-hidden group"
                style={{
                  background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-1.5">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Community'
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateCommunityModal; 