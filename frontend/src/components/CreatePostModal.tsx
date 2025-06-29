import React, { useState, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  TagIcon, 
  ArrowUpTrayIcon,
  ArrowsUpDownIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import axios from 'axios';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    topics: string[];
    media?: File[];
    formData: FormData;
  }) => void;
  communityTopics: string[];
  communitySlug: string;
}

interface MediaPreview {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploadProgress?: number;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  communityTopics,
  communitySlug,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  const processFiles = useCallback((files: File[]) => {
    if (mediaFiles.length + files.length > MAX_FILES) {
      toast.error(`You can only upload up to ${MAX_FILES} files`);
      return;
    }

    const newMediaFiles: MediaPreview[] = [];
    
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
      } else {
        toast.error(error);
      }
    });

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  }, [mediaFiles.length]);

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(mediaFiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setMediaFiles(items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Ensure at least one topic is selected
    if (selectedTopics.length === 0) {
      toast.error('Please select at least one topic for your post');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('community_slug', communitySlug);
      formData.append('visibility', 'community'); // Always set to community
      
      // Add topics as individual fields
      console.log('Selected topics before submission:', selectedTopics);
      selectedTopics.forEach(topic => {
        console.log('Adding topic to FormData:', topic);
        formData.append('topics', topic);
      });

      // Log the entire FormData contents
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Add media files if any
      if (mediaFiles.length > 0) {
        mediaFiles.forEach((media, index) => {
          formData.append('media', media.file);
        });
      }

      // Call the onSubmit callback with the form data
      await onSubmit({
        title,
        content,
        topics: selectedTopics,
        media: mediaFiles.map(f => f.file),
        formData
      });

      // Reset form
      setTitle('');
      setContent('');
      setSelectedTopics([]);
      setMediaFiles([]);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create post. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTopic = (topic: string) => {
    console.log('Toggling topic:', topic);
    console.log('Current selected topics:', selectedTopics);
    setSelectedTopics(prev => {
      const newTopics = prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic];
      console.log('New selected topics:', newTopics);
      return newTopics;
    });
  };

  // Add useEffect to monitor selectedTopics changes
  React.useEffect(() => {
    console.log('Selected topics updated:', selectedTopics);
  }, [selectedTopics]);

  // Cleanup preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      mediaFiles.forEach(file => {
        if (file.type === 'image') {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [mediaFiles]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-dark-card p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                    Create New Post
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card-hover transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-dark-text-secondary" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                  <div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Post title"
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary"
                    />
                  </div>

                  <div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What's on your mind?"
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary resize-none"
                    />
                  </div>

                  {/* Topics Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                        Topics
                      </label>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4 border border-purple-100 dark:border-purple-800">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                        <TagIcon className="w-4 h-4" />
                        Click on any topic below to select or deselect it. You can choose multiple topics for your post.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {communityTopics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleTopic(topic)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            selectedTopics.includes(topic)
                              ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/50'
                              : 'bg-gray-100 dark:bg-dark-card-hover text-gray-600 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-card-hover/80'
                          }`}
                        >
                          #{topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Media Upload Area */}
                  <div
                    ref={dropZoneRef}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                      isDragging
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 scale-[1.02] shadow-lg'
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
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
                        isDragging 
                          ? 'bg-purple-100 dark:bg-purple-900/20' 
                          : 'bg-gray-100 dark:bg-dark-card-hover'
                      }`}>
                        <ArrowUpTrayIcon className={`w-10 h-10 transition-colors ${
                          isDragging 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-gray-400 dark:text-dark-text-secondary'
                        }`} />
                      </div>
                      <p className="text-base font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                        Drop your files here
                      </p>
                      <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                        or{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium underline decoration-2 underline-offset-2"
                        >
                          browse files
                        </button>
                      </p>
                      <div className="mt-3 space-y-1">
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
                        <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                          Drag to reorder
                        </p>
                      </div>
                      
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="media-grid" direction="horizontal">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                            >
                              {mediaFiles.map((media, index) => (
                                <Draggable
                                  key={media.id}
                                  draggableId={media.id}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="relative group aspect-square"
                                    >
                                      {media.type === 'video' ? (
                                        <div className="w-full h-full bg-gray-100 dark:bg-dark-card-hover rounded-lg flex items-center justify-center">
                                          <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                      ) : (
                                        <img
                                          src={media.preview}
                                          alt="Preview"
                                          className="w-full h-full object-cover rounded-lg"
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeMedia(media.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                      >
                                        <XMarkIcon className="w-4 h-4 text-white" />
                                      </button>
                                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-full text-xs text-white">
                                        {media.type === 'video' ? 'Video' : 'Image'}
                                      </div>
                                      {media.uploadProgress !== undefined && media.uploadProgress < 100 && (
                                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                        </div>
                                      )}
                                      {media.error && (
                                        <div className="absolute inset-0 bg-red-500/50 rounded-lg flex items-center justify-center">
                                          <ExclamationCircleIcon className="w-8 h-8 text-white" />
                                        </div>
                                      )}
                                      <div className="absolute top-2 left-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowsUpDownIcon className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-dark-card pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Post'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreatePostModal; 