import React, { FC, useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  PhotoIcon,
  FaceSmileIcon,
  PaperClipIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  VideoCameraIcon,
  UserIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';

interface MediaPreview {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface PostVisibility {
  type: 'personal';
  personalVisibility: 'personal_private' | 'personal_connections' | 'personal_public';
}

interface CreatePostProps {
  onPostCreated?: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const CreatePost: FC<CreatePostProps> = ({ onPostCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [postVisibility, setPostVisibility] = useState<PostVisibility>({
    type: 'personal',
    personalVisibility: 'personal_private'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `${file.name} is too large. Maximum size is 50MB` 
      };
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return { 
        isValid: false, 
        error: `${file.name} is not a supported file type. Supported types: JPG, PNG, GIF, WebP, MP4, WebM, MOV` 
      };
    }

    return { isValid: true };
  };

  const processFiles = (files: File[]) => {
    if (mediaFiles.length + files.length > MAX_FILES) {
      toast.error(`You can only upload up to ${MAX_FILES} files`);
      return;
    }

    const newMediaFiles: MediaPreview[] = [];
    const errors: string[] = [];
    
    files.forEach(file => {
      const { isValid, error } = validateFile(file);
      
      if (isValid) {
        const type = file.type.startsWith('image/') ? 'image' as const : 'video' as const;
        newMediaFiles.push({
          id: Math.random().toString(36).substring(7),
          file,
          preview: type === 'image' ? URL.createObjectURL(file) : 'video',
          type
        });
      } else if (error) {
        errors.push(error);
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (newMediaFiles.length > 0) {
    setMediaFiles(prev => [...prev, ...newMediaFiles]);
    }
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeMedia = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.type === 'image') {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create a post');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title for your post');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter some content for your post');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      
      // Set visibility to the selected personal visibility type
      formData.append('visibility', postVisibility.personalVisibility);
      
      // For personal posts, we don't need a community_slug
      formData.append('community_slug', '');

      if (selectedTopics.length > 0) {
        selectedTopics.forEach(topic => {
          formData.append('topics', topic);
        });
      }

      if (mediaFiles.length > 0) {
        mediaFiles.forEach((media) => {
          formData.append('media', media.file);
        });
      }

      console.log('Submitting post with data:', {
        title: title.trim(),
        content: content.trim(),
        visibility: postVisibility.personalVisibility,
        topics: selectedTopics,
        mediaCount: mediaFiles.length
      });

      const response = await axios.post(`/api/posts/personal/posts/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
        baseURL: API_BASE_URL
      });

      if (response.status === 201) {
        // Reset form
        setTitle('');
        setContent('');
        setMediaFiles([]);
        setSelectedTopics([]);
        setPostVisibility({
          type: 'personal',
          personalVisibility: 'personal_private'
        });
        setIsModalOpen(false);
        toast.success('Post created successfully!');
        
        // Call the onPostCreated callback to refresh the feed
        if (onPostCreated) {
          onPostCreated();
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to create post. Please try again.';
        toast.error(errorMessage);
        setError(errorMessage);
        
        // Log detailed error information for debugging
        console.error('Detailed error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      } else {
        toast.error('Failed to create post. Please try again.');
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup preview URLs when component unmounts or media files change
  useEffect(() => {
    return () => {
      mediaFiles.forEach(file => {
        if (file.type === 'image') {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [mediaFiles]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      setTitle('');
      setContent('');
      setMediaFiles([]);
      setSelectedTopics([]);
      setPostVisibility({
        type: 'personal',
        personalVisibility: 'personal_private'
      });
      setError(null);
    }
  }, [isModalOpen]);

  return (
    <>
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 space-y-6 shadow-lg border border-gray-100 dark:border-gray-800 mt-6 hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <img
              src={user?.avatar || "https://i.pravatar.cc/150?img=12"}
              alt="User avatar"
              className="relative w-12 h-12 rounded-full ring-2 ring-purple-500 dark:ring-purple-400 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-dark-card animate-pulse"></div>
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Share something with your network..."
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={() => setIsModalOpen(true)}
              readOnly
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
          <div className="flex items-center space-x-4">
            <button 
              className="group flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:scale-105"
              onClick={() => setIsModalOpen(true)}
            >
              <PhotoIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add Photo</span>
            </button>
            <div className="h-6 w-px bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
            <button
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:scale-105"
              onClick={() => setIsModalOpen(true)}
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:scale-105"
              onClick={() => setIsModalOpen(true)}
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>
          </div>
          <button 
            className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] relative group overflow-hidden"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="relative z-10">Post</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>

      {/* Create Post Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-dark-card p-6 shadow-xl transition-all backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Create New Post
                    </Dialog.Title>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card-hover transition-colors group hover:scale-110"
                    >
                      <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-dark-text-secondary group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {/* Post Visibility Options */}
                    <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-dark-card-hover rounded-xl border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-300">
                        <button
                          type="button"
                          onClick={() => setPostVisibility(prev => ({ ...prev, personalVisibility: 'personal_private' }))}
                        className={`p-3 rounded-lg text-center transition-all duration-300 transform hover:scale-105 ${
                            postVisibility.personalVisibility === 'personal_private'
                            ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800 shadow-md'
                              : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                          }`}
                        >
                        <div className="relative">
                          <UserIcon className="w-6 h-6 mx-auto mb-2" />
                          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                        </div>
                          <h4 className="font-medium">Only Me</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Private post</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPostVisibility(prev => ({ ...prev, personalVisibility: 'personal_connections' }))}
                        className={`p-3 rounded-lg text-center transition-all duration-300 transform hover:scale-105 ${
                            postVisibility.personalVisibility === 'personal_connections'
                            ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800 shadow-md'
                              : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                          }`}
                        >
                        <div className="relative">
                          <UserGroupIcon className="w-6 h-6 mx-auto mb-2" />
                          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                        </div>
                          <h4 className="font-medium">Connections</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">My network only</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPostVisibility(prev => ({ ...prev, personalVisibility: 'personal_public' }))}
                        className={`p-3 rounded-lg text-center transition-all duration-300 transform hover:scale-105 ${
                            postVisibility.personalVisibility === 'personal_public'
                            ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800 shadow-md'
                              : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                          }`}
                        >
                        <div className="relative">
                          <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                        </div>
                          <h4 className="font-medium">Everyone</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Public post</p>
                        </button>
                      </div>

                    <div className="space-y-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Title
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give your post a title..."
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary transition-all duration-200 hover:border-purple-200 dark:hover:border-purple-800 shadow-sm hover:shadow-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Content
                      </label>
                      <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind? Share your thoughts..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary resize-none transition-all duration-200 hover:border-purple-200 dark:hover:border-purple-800 shadow-sm hover:shadow-md"
                      />
                    </div>

                    {/* Media Upload Area */}
                    <div
                      ref={dropZoneRef}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
                        isDragging
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 scale-[1.02] shadow-lg'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-dark-card-hover/50'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleMediaSelect}
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                      />
                      
                      <div className="text-center">
                        <div className={`w-24 h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          isDragging 
                            ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 scale-110' 
                            : 'bg-gray-100 dark:bg-dark-card-hover'
                        }`}>
                          <ArrowUpTrayIcon className={`w-12 h-12 transition-all duration-300 ${
                            isDragging 
                              ? 'text-purple-600 dark:text-purple-400 scale-110' 
                              : 'text-gray-400 dark:text-dark-text-secondary'
                          }`} />
                        </div>
                        <p className="text-lg font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                          Drop your files here
                        </p>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                          or{' '}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium underline decoration-2 underline-offset-2 transition-colors hover:scale-105 inline-block"
                          >
                            browse files
                          </button>
                        </p>
                        <div className="mt-4 space-y-1">
                          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                            Up to {MAX_FILES} files, max 50MB each
                          </p>
                          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                            Supported formats: JPG, PNG, GIF, WebP, MP4, WebM, MOV
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Media Preview Grid */}
                    {mediaFiles.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                            Media Preview ({mediaFiles.length}/{MAX_FILES})
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {mediaFiles.map((media) => (
                            <div
                              key={media.id}
                              className="relative group aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                              {media.type === 'video' ? (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-card-hover dark:to-dark-card rounded-xl flex items-center justify-center">
                                  <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                                </div>
                              ) : (
                                <img
                                  src={media.preview}
                                  alt="Preview"
                                  className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => removeMedia(media.id)}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70 transform hover:scale-110"
                              >
                                <XMarkIcon className="w-4 h-4 text-white" />
                              </button>
                              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-full text-xs text-white backdrop-blur-sm">
                                {media.type === 'video' ? 'Video' : 'Image'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-dark-card pt-4 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2.5 rounded-xl bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-all duration-200 hover:scale-105"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative group overflow-hidden"
                      >
                        <span className="relative z-10">
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                          </span>
                        ) : (
                          'Create Post'
                        )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default CreatePost; 