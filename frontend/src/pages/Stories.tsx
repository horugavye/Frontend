import { FC, useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatWebSocket } from '../context/ChatWebSocketContext';
import Navigation from '../components/Navigation';
import CardContainer from '../components/CardContainer';
import { 
  CameraIcon, 
  MapPinIcon, 
  ClockIcon, 
  UsersIcon, 
  SparklesIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  GlobeAltIcon,
  CalendarIcon,
  StarIcon,
  FireIcon,
  CpuChipIcon,
  SwatchIcon,
  ChevronDownIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  PlayIcon as PlaySolidIcon,
  PauseIcon as PauseSolidIcon,
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid';
import api from '../utils/api';
import React from 'react';
import _ from 'lodash';
import { getFileExtension, getFileCategory } from '../utils/fileUtils';
import { Message } from '../types/messenger';
import { useLocation } from 'react-router-dom';

interface Story {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text' | 'poll' | 'location' | 'timecapsule' | 'collaborative' | 'ai-remix' | 'story-thread';
  content: string;
  media_url?: string;
  media_file?: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    first_name?: string;
    last_name?: string;
    id: string;
  };
  created_at: string;
  timestamp: string; // (keep for compatibility, but use created_at)
  duration: number;
  theme: string;
  location?: {
    name: string;
    coordinates: [number, number];
  };
  collaborators?: string[];
  unlockDate?: string;
  isLiked: boolean;
  likes: number;
  shares: number;
  views_count: number;
  tags: string[];
  rating: number;
  totalRatings: number;
  userRating?: number;
  interactive?: {
    type: 'poll' | 'quiz' | 'game';
    options?: string[];
    correctAnswer?: number;
  };
  aiRemix?: {
    originalId: string;
    style: string;
    filters: string[];
  };
  storyThread?: {
    threadId: string;
    threadTitle: string;
    storyCount: number;
    stories: Story[];
  };
}

// Add this near the top of the file, after imports
const BACKEND_BASE_URL = import.meta.env.VITE_API_URL;

// Add this helper function near the top, after imports
function timeAgo(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const Stories: FC = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]); // stories from backend
  const [friends, setFriends] = useState<any[]>([]); // friends list
  const [loadingStories, setLoadingStories] = useState(true);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [viewMode, setViewMode] = useState<'chronological' | 'thematic' | 'collaborative'>('chronological');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLocationStories, setShowLocationStories] = useState(false);

  // Rating system state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [localRating, setLocalRating] = useState(0);
  const [localTotalRatings, setLocalTotalRatings] = useState(0);
  const [storyBeingRated, setStoryBeingRated] = useState<Story | null>(null);
  const rateButtonRef = useRef<HTMLButtonElement>(null);
  const modalRateButtonRef = useRef<HTMLButtonElement>(null);

  // Create story state
  const [newStory, setNewStory] = useState({
    content: '',
    type: 'image' as 'image' | 'video' | 'audio' | 'text' | 'poll' | 'location' | 'timecapsule' | 'collaborative' | 'ai-remix' | 'story-thread',
    theme: 'personal',
    duration: 15,
    tags: [] as string[],
    media_url: '',
    location: '',
    collaborators: [] as string[],
    unlockDate: '',
    interactive: {
      type: 'poll' as const,
      options: ['', '', '', '']
    },
    allow_comments: true,
    allow_sharing: true
  });
  const [tagInput, setTagInput] = useState('');
  const [collaboratorInput, setCollaboratorInput] = useState('');

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false); // NEW
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for story modal
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [activeUserStoryIndex, setActiveUserStoryIndex] = useState(0);

  // Modal-specific play state
  const [modalIsPlaying, setModalIsPlaying] = useState(true);
  const [modalCurrentTime, setModalCurrentTime] = useState(0);

  // Modal for viewing all stories by a user
  const [userStoriesModal, setUserStoriesModal] = useState<{
    isOpen: boolean;
    stories: Story[];
    activeIndex: number;
  }>({ isOpen: false, stories: [], activeIndex: 0 });

  // Add state for expanded content
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  // Add state for message input focus/expand
  const [isMessageInputActive, setIsMessageInputActive] = useState(false);
  const [messageInputValue, setMessageInputValue] = useState("");

  // Ref and state for positioning the rate modal above the button
  const [rateModalPosition, setRateModalPosition] = useState<{ top: number; left: number } | null>(null);

  // Add state for viewers modal
  const [viewersModal, setViewersModal] = useState<{ open: boolean; storyId: string | null; viewers: any[]; loading: boolean }>({ open: false, storyId: null, viewers: [], loading: false });

  // Add this near the top, after other refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  // Add for userStoriesModal
  const userStoriesVideoRef = useRef<HTMLVideoElement | null>(null);
  const [userStoriesVideoDuration, setUserStoriesVideoDuration] = useState<number | null>(null);

  const filteredStories = selectedTheme === 'all' 
    ? stories 
    : stories.filter(story => story.theme === selectedTheme);

  // Group stories by user (username)
  const groupedStories = React.useMemo(() => {
    const groups = _.values(
      _.groupBy(filteredStories, (story: Story) => story.author.username)
    );
    if (!user) return groups;
    // Find the current user's group
    const userIndex = groups.findIndex(group => group[0]?.author.username === user.username);
    if (userIndex > 0) {
      // Move the user's group to the front
      const [userGroup] = groups.splice(userIndex, 1);
      groups.unshift(userGroup);
    }
    return groups;
  }, [filteredStories, user]);

  const location = useLocation();

  // Open modal for user if user param is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('user');
    if (userId && groupedStories.length > 0) {
      const userIndex = groupedStories.findIndex(
        (group) => group[0]?.author?.id === userId
      );
      if (userIndex !== -1) {
        setActiveUserIndex(userIndex);
        setIsStoryModalOpen(true);
      }
    }
    // eslint-disable-next-line
  }, [location.search, groupedStories]);

  // Fetch stories from backend
  useEffect(() => {
    const fetchFriendsAndStories = async () => {
      setLoadingStories(true);
      try {
        // Fetch friends
        const friendsResponse = await api.get('/api/connections/connections/friends/');
        setFriends(friendsResponse.data);
        // Debug output
        console.log('Friends:', friendsResponse.data);
        // Fetch all stories
        const storiesResponse = await api.get('/api/stories/stories/');
        console.log('Stories:', storiesResponse.data);
        // Filter stories to only those from friends or the current user (normalize IDs to string)
        const userId = user ? String(user.id) : null;
        const friendIds = new Set(friendsResponse.data.map((f: any) => String(f.id)));
        const now = new Date();
        const filteredStories = storiesResponse.data.filter((story: any) => {
          const authorId = String(story.author.id);
          const createdAt = new Date(story.created_at);
          const isRecent = (now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000; // 24 hours in ms
          return (friendIds.has(authorId) || (userId && authorId === userId)) && isRecent;
        });
        setStories(filteredStories);
      } catch (error) {
        console.error('Failed to fetch friends or stories:', error);
        setStories([]);
      } finally {
        setLoadingStories(false);
      }
    };
    fetchFriendsAndStories();
  }, [user]);

  const themes = [
    { id: 'all', name: 'All Stories', icon: SparklesIcon, color: 'purple' },
    { id: 'travel', name: 'Travel', icon: GlobeAltIcon, color: 'blue' },
    { id: 'food', name: 'Food & Dining', icon: PhotoIcon, color: 'orange' },
    { id: 'art', name: 'Art & Creativity', icon: SwatchIcon, color: 'pink' },
    { id: 'wellness', name: 'Wellness', icon: HeartIcon, color: 'green' },
    { id: 'social', name: 'Social', icon: UsersIcon, color: 'yellow' },
    { id: 'personal', name: 'Personal', icon: StarIcon, color: 'indigo' }
  ];

  // Reset activeStoryIndex and modal timer when filtered stories change
  useEffect(() => {
    setActiveStoryIndex(0);
    setModalCurrentTime(0);
  }, [filteredStories]);

  const currentStory = filteredStories[activeStoryIndex] || filteredStories[0];

  // Modal timer logic: only runs when modal is open and playing (per-user modal)
  useEffect(() => {
    if (!isStoryModalOpen || activeUserIndex === null) return;
    const userStories = groupedStories[activeUserIndex];
    const story = userStories[activeUserStoryIndex];
    if (!story) return;
    if (!modalIsPlaying) return;
    if (story.type === 'video' && videoRef.current) {
      // For video, sync progress bar to video currentTime
      const video = videoRef.current;
      const onTimeUpdate = () => setModalCurrentTime(video.currentTime);
      const onEnded = () => {
        // Auto-advance to next story or next user
        if (activeUserStoryIndex < userStories.length - 1) {
          setActiveUserStoryIndex(i => i + 1);
        } else if (activeUserIndex < groupedStories.length - 1) {
          setActiveUserIndex(u => (u as number) + 1);
          setActiveUserStoryIndex(0);
        } else {
          setModalIsPlaying(false);
          setIsStoryModalOpen(false);
        }
      };
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('ended', onEnded);
      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('ended', onEnded);
      };
    } else {
      // For non-video, use timer
      const duration = story.duration;
      const timer = setInterval(() => {
        setModalCurrentTime(prev => {
          if (prev >= duration) {
            if (activeUserStoryIndex < userStories.length - 1) {
              setActiveUserStoryIndex(i => i + 1);
              return 0;
            } else if (activeUserIndex < groupedStories.length - 1) {
              setActiveUserIndex(u => (u as number) + 1);
              setActiveUserStoryIndex(0);
              return 0;
            } else {
              setModalIsPlaying(false);
              setIsStoryModalOpen(false);
              return prev;
            }
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isStoryModalOpen, modalIsPlaying, activeUserIndex, activeUserStoryIndex, groupedStories, videoDuration]);

  // Reset modal timer and video duration when switching stories in modal
  useEffect(() => {
    if (isStoryModalOpen) {
      setModalCurrentTime(0);
      setModalIsPlaying(true);
      setVideoDuration(null); // Reset video duration on story change
    }
  }, [activeUserIndex, activeUserStoryIndex, isStoryModalOpen]);

  // Reset timer and video duration for userStoriesModal
  useEffect(() => {
    if (userStoriesModal.isOpen) {
      setModalCurrentTime(0);
      setModalIsPlaying(true);
      setUserStoriesVideoDuration(null);
    }
  }, [userStoriesModal.activeIndex, userStoriesModal.isOpen]);

  // Modal timer logic for userStoriesModal (if it exists, similar to main modal)
  useEffect(() => {
    if (!userStoriesModal.isOpen) return;
    const story = userStoriesModal.stories[userStoriesModal.activeIndex];
    if (!story) return;
    if (!modalIsPlaying) return;
    if (story.type === 'video' && userStoriesVideoRef.current) {
      const video = userStoriesVideoRef.current;
      const onTimeUpdate = () => setModalCurrentTime(video.currentTime);
      const onEnded = () => {
        if (userStoriesModal.activeIndex < userStoriesModal.stories.length - 1) {
          setUserStoriesModal(modal => ({ ...modal, activeIndex: modal.activeIndex + 1 }));
        } else {
          setModalIsPlaying(false);
          setUserStoriesModal(modal => ({ ...modal, isOpen: false }));
        }
      };
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('ended', onEnded);
      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('ended', onEnded);
      };
    } else {
      const duration = story.duration;
      const timer = setInterval(() => {
        setModalCurrentTime(prev => {
          if (prev >= duration) {
            if (userStoriesModal.activeIndex < userStoriesModal.stories.length - 1) {
              setUserStoriesModal(modal => ({ ...modal, activeIndex: modal.activeIndex + 1 }));
              return 0;
            } else {
              setModalIsPlaying(false);
              setUserStoriesModal(modal => ({ ...modal, isOpen: false }));
              return prev;
            }
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [userStoriesModal.isOpen, userStoriesModal.activeIndex, userStoriesModal.stories, userStoriesVideoDuration, modalIsPlaying]);

  const handleLike = () => {
    // Toggle like functionality would go here
    if (currentStory) {
      console.log('Liked story:', currentStory.id);
    }
  };

  const handleShare = () => {
    // Share functionality would go here
    if (currentStory) {
      console.log('Sharing story:', currentStory.id);
    }
  };

  // Rating system functions
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleRateClick = (storyToRate: Story) => {
    if (storyToRate) {
      setStoryBeingRated(storyToRate);
      setSelectedRating(storyToRate.userRating || 0);
      setLocalRating(storyToRate.rating);
      setLocalTotalRatings(storyToRate.totalRatings);
      setIsRatingModalOpen(true);
      setHoverRating(storyToRate.userRating || 0);
      // Position the modal above the button
      if (modalRateButtonRef.current) {
        const rect = modalRateButtonRef.current.getBoundingClientRect();
        // Offset for modal height (now just 8px above button)
        setRateModalPosition({
          top: rect.top + window.scrollY - 8, // 8px above button
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }
    }
  };

  const handleStarHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleStarClick = async (rating: number) => {
    const storyToRate = storyBeingRated;
    if (!storyToRate) return;

    const previousRating = selectedRating;
    setSelectedRating(rating);
    setLocalRating(rating);
    const isNewRating = previousRating === 0 && rating > 0;
    const isUnrating = rating === 0 && previousRating > 0;
    setLocalTotalRatings(prev => {
      if (isNewRating) return prev + 1;
      if (isUnrating) return prev - 1;
      return prev;
    });

    try {
      let response;
      if (rating === 0) {
        response = await api.delete(`/api/stories/stories/${storyToRate.id}/rate/`);
      } else {
        response = await api.post(`/api/stories/stories/${storyToRate.id}/rate/`, { rating });
      }
      if (response && response.data) {
        const { rating: newRating, total_ratings, user_rating } = response.data;
        const updatedStory = {
          ...storyToRate,
          rating: newRating,
          totalRatings: total_ratings,
          userRating: user_rating
        };
        setStories(prevStories => prevStories.map(s => s.id === updatedStory.id ? updatedStory : s));
        setLocalRating(newRating);
        setLocalTotalRatings(total_ratings);
        setSelectedRating(user_rating);
      }
      setIsRatingModalOpen(false);
      setStoryBeingRated(null);
      // Re-fetch all stories to ensure all data is up to date
      const refreshed = await api.get('/api/stories/stories/');
      setStories(refreshed.data);
    } catch (error) {
      setSelectedRating(previousRating);
      setLocalRating(storyToRate.rating);
      setLocalTotalRatings(storyToRate.totalRatings);
      console.error('Error saving rating:', error);
      setStoryBeingRated(null);
    }
  };

  // Create story functions
  const handleAddTag = () => {
    if (tagInput.trim() && !newStory.tags.includes(tagInput.trim())) {
      setNewStory(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewStory(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddCollaborator = () => {
    if (collaboratorInput.trim() && !newStory.collaborators.includes(collaboratorInput.trim())) {
      setNewStory(prev => ({
        ...prev,
        collaborators: [...prev.collaborators, collaboratorInput.trim()]
      }));
      setCollaboratorInput('');
    }
  };

  const handleRemoveCollaborator = (collaboratorToRemove: string) => {
    setNewStory(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(collaborator => collaborator !== collaboratorToRemove)
    }));
  };

  const handleUpdateInteractiveOption = (index: number, value: string) => {
    setNewStory(prev => ({
      ...prev,
      interactive: {
        ...prev.interactive,
        options: prev.interactive.options.map((option, i) => i === index ? value : option)
      }
    }));
  };

  // Helper function to validate URLs
  function isValidUrl(url: string) {
    try {
      // Accept absolute URLs
      new URL(url);
      return true;
    } catch {
      // Accept relative URLs starting with '/'
      return url.startsWith('/');
    }
  }

  const handleCreateStory = async () => {
    if (!newStory.content.trim()) {
      alert('Please enter story content');
      return;
    }

    try {
      // Prepare FormData for story creation
      const formData = new FormData();
      formData.append('content', newStory.content);
      formData.append('type', newStory.type);
      formData.append('theme', newStory.theme);
      formData.append('duration', String(newStory.duration));
      if (newStory.tags && newStory.tags.length > 0) {
        formData.append('tags', JSON.stringify(newStory.tags));
      }
      if (newStory.collaborators && newStory.collaborators.length > 0) {
        formData.append('collaborators', JSON.stringify(newStory.collaborators));
      }
      if (newStory.location) {
        formData.append('location_name', newStory.location);
      }
      if (newStory.unlockDate) {
        formData.append('unlock_date', newStory.unlockDate);
      }
      if (newStory.type === 'poll' && newStory.interactive) {
        formData.append('interactive', JSON.stringify(newStory.interactive));
      }
      if (uploadedFile) {
        formData.append('media_file', uploadedFile);
      }
      formData.append('allow_comments', String(newStory.allow_comments));
      formData.append('allow_sharing', String(newStory.allow_sharing));

      setIsUploading(true);

      await api.post('/api/stories/stories/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset form and UI
      setNewStory({
        content: '',
        type: 'image',
        theme: 'personal',
        duration: 15,
        tags: [],
        media_url: '',
        location: '',
        collaborators: [],
        unlockDate: '',
        interactive: {
          type: 'poll',
          options: ['', '', '', '']
        },
        allow_comments: true,
        allow_sharing: true
      });
      removeFile();
      setShowCreateModal(false);
      setIsUploading(false);
      setUploadProgress(0);
      console.log('Story created and sent to backend with media file');
    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      if (error.response && error.response.data) {
        console.error('Backend error:', error.response.data);
        alert(JSON.stringify(error.response.data));
      } else {
        console.error('Error creating story:', error);
        alert('Failed to create story. Please try again.');
      }
    }
  };

  // File upload functions
  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const validAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg'];

    const isValidType = [...validImageTypes, ...validVideoTypes, ...validAudioTypes].includes(file.type);
    
    if (!isValidType) {
      alert('Please select a valid image, video, or audio file.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    setUploadedFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    
    // Update story type based on file type
    if (validImageTypes.includes(file.type)) {
      setNewStory(prev => ({ ...prev, type: 'image' }));
    } else if (validVideoTypes.includes(file.type)) {
      setNewStory(prev => ({ ...prev, type: 'video' }));
    } else if (validAudioTypes.includes(file.type)) {
      setNewStory(prev => ({ ...prev, type: 'audio' }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setUploadedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Media upload handler
  const handleUploadMedia = async () => {
    if (!uploadedFile) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setIsUploadComplete(false);
      const formData = new FormData();
      formData.append('media_file', uploadedFile);
      // You may need to adjust the endpoint if different
      const response = await api.post('/api/stories/media-upload/', formData, {
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
        headers: {
          'Content-Type': undefined // Let browser set it for FormData
        }
      });
      // Assume response.data.media_url contains the uploaded file URL
      if (response.data && response.data.media_url) {
        let url = response.data.media_url;
        if (url.startsWith('/')) {
          url = BACKEND_BASE_URL + url;
        }
        setNewStory(prev => ({ ...prev, media_url: url }));
        setIsUploadComplete(true);
      } else {
        alert('Upload failed: No media_url returned.');
      }
      setIsUploading(false);
    } catch (error) {
      setIsUploading(false);
      setIsUploadComplete(false);
      alert('Failed to upload media. Please try again.');
      console.error('Media upload error:', error);
    }
  };

  // Helper to get story type icon
  const getStoryTypeIcon = (type: string) => {
    switch (type) {
      case 'collaborative': return UsersIcon;
      case 'ai-remix': return CpuChipIcon;
      case 'location': return MapPinIcon;
      case 'audio': return MusicalNoteIcon;
      case 'timecapsule': return ClockIcon;
      case 'poll': return PuzzlePieceIcon;
      case 'video': return VideoCameraIcon;
      case 'text': return DocumentTextIcon;
      case 'story-thread': return SparklesIcon;
      default: return PhotoIcon;
    }
  };

  // Helper to get story type color
  const getStoryTypeColor = (type: string) => {
    switch (type) {
      case 'collaborative': return 'bg-blue-500';
      case 'ai-remix': return 'bg-purple-500';
      case 'location': return 'bg-green-500';
      case 'audio': return 'bg-pink-500';
      case 'timecapsule': return 'bg-orange-500';
      case 'poll': return 'bg-yellow-500';
      case 'video': return 'bg-red-500';
      case 'text': return 'bg-gray-500';
      case 'story-thread': return 'bg-indigo-500';
      default: return 'bg-purple-500';
    }
  };

  // Helper to render star rating (like PostCard)
  const renderStarRating = (rating: number, totalRatings?: number) => {
    if (typeof totalRatings === 'number' && totalRatings === 0) {
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon key={star} className="w-4 h-4 text-gray-300" />
          ))}
          <span className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500">0</span>
        </div>
      );
    }
    const rounded = Math.round(rating * 10) / 10;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-400">
            {star <= Math.floor(rating) ? (
              <StarSolidIcon className="w-4 h-4" />
            ) : star - 0.5 <= rating ? (
              <span className="relative">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <StarSolidIcon className="w-4 h-4 absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }} />
              </span>
            ) : (
              <StarIcon className="w-4 h-4 text-gray-300" />
            )}
          </span>
        ))}
        <span className="ml-1 text-xs font-medium text-gray-700 dark:text-gray-300">{rounded.toFixed(1)}</span>
      </div>
    );
  };

  // Add state for raters modal
  const [ratersModal, setRatersModal] = useState<{ open: boolean; storyId: string | null; raters: any[]; loading: boolean }>({ open: false, storyId: null, raters: [], loading: false });

  // Function to open raters modal and fetch raters
  const openRatersModal = async (storyId: string) => {
    setRatersModal({ open: true, storyId, raters: [], loading: true });
    try {
      const response = await api.get(`/api/stories/stories/${storyId}/raters/`);
      setRatersModal({ open: true, storyId, raters: response.data, loading: false });
    } catch (error) {
      setRatersModal({ open: true, storyId, raters: [], loading: false });
    }
  };

  // Function to open viewers modal and fetch viewers
  const openViewersModal = async (storyId: string) => {
    setViewersModal({ open: true, storyId, viewers: [], loading: true });
    try {
      const response = await api.get(`/api/stories/stories/${storyId}/viewers/`);
      setViewersModal({ open: true, storyId, viewers: response.data, loading: false });
    } catch (error) {
      setViewersModal({ open: true, storyId, viewers: [], loading: false });
    }
  };

  // Add this after the other useEffects, near the modal logic
  useEffect(() => {
    if (isStoryModalOpen && activeUserIndex !== null && user) {
      const story = groupedStories[activeUserIndex]?.[activeUserStoryIndex];
      if (story && story.id) {
        api.post('/api/stories/views/', {
          story: story.id
        }).catch(() => {});
      }
    }
  }, [isStoryModalOpen, activeUserIndex, activeUserStoryIndex, user]);

  const { sendMessage } = useChatWebSocket();

  // Add this function inside Stories component
  const handleSendStoryMessage = async () => {
    if (!isStoryModalOpen || activeUserIndex === null) return;
    const story = groupedStories[activeUserIndex][activeUserStoryIndex];
    if (!messageInputValue.trim() || !story) return;

    // Prevent messaging yourself
    if (user && story.author.id === user.id) {
      alert("You can't message yourself.");
      return;
    }

    let conversationId = null;
    try {
      // Get or create a direct conversation with the story author
      const response = await api.post('/api/chat/conversations/', {
        type: 'direct',
        other_user: story.author.id,
      });
      conversationId = response.data.id;
      if (!conversationId) {
        alert('Failed to get a valid conversation ID');
        return;
      }
    } catch (error) {
      console.error('Failed to get/create conversation:', error);
      alert('Failed to start conversation.');
      return;
    }

    // Prepare file attachment if story has media
    let files: NonNullable<Message['files']> = [];
    const fileUrl = getStoryFileUrl(story);
    if (fileUrl) {
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1] || 'story-media';
      const fileExtension = getFileExtension(fileName);
      let fileType = '';
      if (/\.(jpg|jpeg)$/i.test(fileName)) fileType = 'image/jpeg';
      else if (/\.(png|gif|webp)$/i.test(fileName)) fileType = 'image/' + fileExtension;
      else if (/\.(mp4|webm|ogg)$/i.test(fileName)) fileType = 'video/' + fileExtension;
      else if (/\.(mp3|wav|ogg)$/i.test(fileName)) fileType = 'audio/' + fileExtension;
      else fileType = 'application/octet-stream';
      let category = getFileCategory(fileType) as 'document' | 'image' | 'video' | 'audio' | 'other';
      if (category === 'other') category = 'document';
      console.log('Story file category:', category); // Debug log
      let base64Data = '';
      try {
        base64Data = await urlToBase64(fileUrl);
        console.log('Base64 string length:', base64Data.length);
      } catch (e) {
        console.error('Failed to convert file to base64:', e);
      }
      files = [{
        id: story.id + '-media',
        file: base64Data,
        file_name: fileName,
        file_type: fileType,
        file_size: 0,
        category,
        thumbnail: '',
        created_at: story.created_at,
        uploaded_by: String(story.author.id),
        url: fileUrl,
      }];
    }

    // Send message with conversation at root and also inside message object
    if (!user) return; // Ensure user is not null
    const messageToSend = {
      type: 'chat_message' as const,
      conversation: conversationId,
      message: {
        id: Math.random().toString(36).substr(2, 9),
        conversation: conversationId,
        sender: {
          id: user.id,
          username: user.username,
        },
        content: messageInputValue,
        message_type: (files.length === 1 ? 'file' : files.length > 1 ? 'mixed' : 'text') as 'file' | 'mixed' | 'text',
        files,
        reactions: [],
        is_edited: false,
        is_pinned: false,
        is_forwarded: false,
        story: story.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    console.log('Sending message with files:', files, 'Full message:', messageToSend); // Debug log
    sendMessage(messageToSend);
    setMessageInputValue("");
    setIsMessageInputActive(false);
  };

  // Helper to get the full file URL from a story
  const getStoryFileUrl = (story: Story): string | null => {
    let fileUrl = story.media_url || story.media_file || '';
    if (!fileUrl) return null;
    if (fileUrl.startsWith('/')) return BACKEND_BASE_URL + fileUrl;
    return fileUrl;
  };

  // Helper to convert a file URL to base64
  async function urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Only return the base64 part after the comma
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div className="flex-1 bg-gray-100 dark:bg-dark-bg transition-colors duration-200 min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
              <CardContainer>
                <Navigation />
              </CardContainer>
            </div>
          </div>

          {/* Main Content - Stories */}
          <div className="lg:col-span-6 order-2 lg:order-2">
            <div className="space-y-4">
        {/* Header */}
              <CardContainer>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Next-Gen Stories
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Experience storytelling like never before with AI-powered features
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2 justify-center"
            >
              <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Create Story
            </button>
          </div>
              </CardContainer>

              {/* Theme Filter */}
              <CardContainer>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Browse by Theme</h3>
              <div className="space-y-1 sm:space-y-2">
                {themes.map((theme, idx) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.id + '-' + idx}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`w-full flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        selectedTheme === theme.id
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-${theme.color}-500`} />
                      {theme.name}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">View Mode</h3>
                <div className="space-y-1 sm:space-y-2">
                  {[
                    { id: 'chronological', name: 'Chronological', icon: ClockIcon },
                    { id: 'thematic', name: 'By Topic', icon: SparklesIcon },
                    { id: 'collaborative', name: 'Collaborative', icon: UsersIcon }
                  ].map((mode, idx) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id + '-' + idx}
                        onClick={() => setViewMode(mode.id as any)}
                        className={`w-full flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                          viewMode === mode.id
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                        {mode.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              </CardContainer>

              {/* Story Viewer */}
              <CardContainer>
            {loadingStories ? (
                  <div className="p-8 sm:p-12 text-center">
                <SparklesIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-3 sm:mb-4 animate-spin" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Loading friends' stories...
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                  Please wait while we fetch stories from your connections.
                </p>
              </div>
            ) : groupedStories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {groupedStories.map((userStories: Story[], idx: number) => {
                  const firstStory = userStories[0];
                  const url = firstStory.media_url || firstStory.media_file || '';
                  return (
                    <div
                      key={firstStory.author.username}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 sm:p-2 bg-white/80 dark:bg-dark-card/80 hover:shadow transition-all duration-200 max-w-md w-full mx-auto"
                      onClick={() => {
                        setIsStoryModalOpen(true);
                        setActiveUserIndex(idx);
                        setActiveUserStoryIndex(0);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="relative">
                        {/* Author profile overlay (avatar only, top-left) */}
                        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 z-10 bg-white/80 dark:bg-gray-900/80 p-0.5 sm:p-1 rounded-full shadow">
                          <img
                            src={
                              firstStory.author.avatar
                                ? (firstStory.author.avatar.startsWith('/')
                                    ? BACKEND_BASE_URL + firstStory.author.avatar
                                    : firstStory.author.avatar)
                                : BACKEND_BASE_URL + '/media/avatars/default.jpg'
                            }
                            alt={firstStory.author.name}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border"
                          />
                        </div>
                        {/* Story count badge (top-right) */}
                        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 z-10 bg-purple-600 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-lg">
                          {userStories.length}
                        </div>
                        {/* Author name overlay (bottom of media) */}
                        <div className="absolute bottom-0 left-0 w-full z-10 bg-gradient-to-t from-black/70 to-transparent px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center rounded-b">
                          <span className="text-xs sm:text-sm font-semibold text-white drop-shadow">
                            {`${firstStory.duration}s · `}
                            {(firstStory.author.first_name || firstStory.author.last_name
                              ? `${firstStory.author.first_name || ''} ${firstStory.author.last_name || ''}`.trim()
                              : firstStory.author.username)}
                            {' · '}{timeAgo(firstStory.created_at)}
                          </span>
                        </div>
                        {/* Story media and content */}
                        {(() => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                          const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                          const isAudio = /\.(mp3|wav|ogg)$/i.test(url);
                          const altText = firstStory.content || '';
                          if (isImage) {
                            return (
                              <img
                                src={url || ''}
                                alt={altText}
                                className="w-full h-48 sm:h-80 object-cover rounded"
                              />
                            );
                          } else if (isVideo) {
                            // Only show a static thumbnail (first frame) for video, no controls, no autoplay
                            return (
                              <video
                                src={url || ''}
                                className="w-full h-48 sm:h-80 object-cover rounded"
                                controls={false}
                                autoPlay={false}
                                loop={false}
                                muted
                                preload="metadata"
                                style={{ pointerEvents: 'none' }}
                                poster={undefined} // Optionally, you can set a poster image if available
                              />
                            );
                          } else if (isAudio) {
                            return (
                              <div className="flex items-center justify-center w-full h-48 sm:h-80 bg-black/60 rounded">
                                <audio
                                  src={url || ''}
                                  controls
                                  className="w-full max-w-md"
                                />
                              </div>
                            );
                          } else {
                            return (
                              <img
                                src={url || ''}
                                alt={altText}
                                className="w-full h-48 sm:h-80 object-cover rounded"
                              />
                            );
                          }
                        })()}
                      </div>
                      {/* Tags and Collaborators below the card */}
                      {(firstStory.tags && firstStory.tags.length > 0) || (firstStory.collaborators && firstStory.collaborators.length > 0) ? (
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-1.5 sm:mt-2 justify-center">
                          {firstStory.tags && firstStory.tags.map((tag, idx) => (
                            <span key={tag + '-' + idx} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-200/80 text-purple-800 rounded-full text-xs font-medium shadow-sm">#{tag}</span>
                          ))}
                          {firstStory.collaborators && firstStory.collaborators.map((collab, idx) => (
                            <span key={collab + '-' + idx} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-200/80 text-blue-800 rounded-full text-xs font-medium shadow-sm">@{collab}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
                  <div className="text-center py-8 sm:py-12">
                    <CameraIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No stories yet
                </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                      Be the first to create a story and share your moments with friends!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                      <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create Your First Story
                </button>
              </div>
            )}
              </CardContainer>
          </div>
        </div>

          {/* Right Sidebar - Story Stats and Features */}
          <div className="hidden lg:block lg:col-span-3 order-3 lg:order-3">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
              <div className="space-y-6">
                {/* Story Stats */}
                <CardContainer>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Story Stats</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <span className="text-gray-600 dark:text-dark-text-secondary text-sm">Total Stories</span>
                      <span className="text-gray-900 dark:text-dark-text font-medium text-sm">{stories.length}</span>
                  </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <span className="text-gray-600 dark:text-dark-text-secondary text-sm">Active Friends</span>
                      <span className="text-gray-900 dark:text-dark-text font-medium text-sm">{friends.length}</span>
                </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <span className="text-gray-600 dark:text-dark-text-secondary text-sm">Today's Stories</span>
                      <span className="text-gray-900 dark:text-dark-text font-medium text-sm">
                        {stories.filter(story => {
                          const today = new Date();
                          const storyDate = new Date(story.created_at);
                          return storyDate.toDateString() === today.toDateString();
                        }).length}
                      </span>
                    </div>
                  </div>
                </CardContainer>

                {/* Story Features */}
                <CardContainer>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Story Features</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-purple-500" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Remix</h3>
                        <p className="text-xs text-gray-600 dark:text-dark-text-secondary">Transform stories with AI</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <UsersIcon className="w-5 h-5 text-blue-500" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Collaborative</h3>
                        <p className="text-xs text-gray-600 dark:text-dark-text-secondary">Create stories together</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <MapPinIcon className="w-5 h-5 text-green-500" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Location Stories</h3>
                        <p className="text-xs text-gray-600 dark:text-dark-text-secondary">Stories based on location</p>
                      </div>
                    </div>
                  </div>
                </CardContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-dark-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-300 custom-modal-scrollbar">
            {/* Modal Header */}
            <div className="relative p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 via-pink-50 to-cyan-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-cyan-900/20 rounded-t-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 rounded-t-3xl"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <CameraIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Story</h2>
                      <p className="text-gray-600 dark:text-gray-300">Share your moments with the world</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Story Content */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                  Story Content *
                </label>
                <div className="relative">
                  <textarea
                    value={newStory.content}
                    onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="What's your story about? Share your thoughts, experiences, or creative ideas..."
                    className="w-full px-6 py-5 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-300 resize-none text-lg"
                    rows={4}
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                    {newStory.content.length}/500
                  </div>
                </div>
              </div>

              {/* Story Type and Theme Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                    Story Type
                  </label>
                  <div className="relative">
                    <select
                      value={newStory.type}
                      onChange={(e) => setNewStory(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-300 appearance-none bg-white dark:bg-gray-800 text-lg"
                    >
                      <option value="image">📸 Image Story</option>
                      <option value="video">🎥 Video Story</option>
                      <option value="audio">🎵 Audio Story</option>
                      <option value="text">📝 Text Story</option>
                      <option value="poll">📊 Poll Story</option>
                      <option value="location">📍 Location Story</option>
                      <option value="timecapsule">⏰ Time Capsule</option>
                      <option value="collaborative">👥 Collaborative Story</option>
                      <option value="ai-remix">🤖 AI Remix</option>
                      <option value="story-thread">🧵 Story Thread</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                    Theme
                  </label>
                  <div className="relative">
                    <select
                      value={newStory.theme}
                      onChange={(e) => setNewStory(prev => ({ ...prev, theme: e.target.value }))}
                      className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-300 appearance-none bg-white dark:bg-gray-800 text-lg"
                    >
                      <option value="personal">🌟 Personal</option>
                      <option value="travel">🌍 Travel</option>
                      <option value="food">🍽️ Food & Dining</option>
                      <option value="art">🎨 Art & Creativity</option>
                      <option value="wellness">🧘 Wellness</option>
                      <option value="social">👥 Social</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration and Media URL Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                    Duration (seconds)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newStory.duration}
                      onChange={(e) => setNewStory(prev => ({ ...prev, duration: parseInt(e.target.value) || 15 }))}
                      min="5"
                      max="60"
                      className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-300 text-lg"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                      sec
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                    Media URL (optional)
                  </label>
                  <input
                    type="url"
                    value={newStory.media_url}
                    onChange={(e) => setNewStory(prev => ({ ...prev, media_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-300 text-lg"
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                  Upload Media File
                </label>
                
                {!filePreview ? (
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                      isDragOver
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto">
                        <CameraIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Drop your file here or click to browse
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Supports images (JPG, PNG, GIF, WebP), videos (MP4, WebM, OGG), and audio (MP3, WAV, OGG)
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Maximum file size: 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,video/*,audio/*"
                        onChange={handleFileInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File Preview */}
                    <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 rounded-xl flex items-center justify-center">
                            {uploadedFile?.type.startsWith('image/') ? (
                              <PhotoIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            ) : uploadedFile?.type.startsWith('video/') ? (
                              <VideoCameraIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <MusicalNoteIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{uploadedFile?.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {uploadedFile?.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) : '0'} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeFile}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Preview */}
                      <div className="relative bg-white dark:bg-gray-700 rounded-xl overflow-hidden">
                        {uploadedFile?.type.startsWith('image/') ? (
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                        ) : uploadedFile?.type.startsWith('video/') ? (
                          <video
                            src={filePreview}
                            controls
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-r from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                            <MusicalNoteIcon className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                  Location (optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newStory.location}
                    onChange={(e) => setNewStory(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Central Park, New York"
                    className="w-full px-6 py-4 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-300 text-lg"
                  />
                  <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                  Tags
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 px-6 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-300 text-lg"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {newStory.tags.map((tag: string, idx: number) => (
                    <span
                      key={tag + '-' + idx}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Collaborators */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Collaborators (optional)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={collaboratorInput}
                    onChange={(e) => setCollaboratorInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCollaborator()}
                    placeholder="Add collaborator username and press Enter"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-200"
                  />
                  <button
                    onClick={handleAddCollaborator}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newStory.collaborators.map((collaborator: string, idx: number) => (
                    <span
                      key={collaborator + '-' + idx}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm"
                    >
                      @{collaborator}
                      <button
                        onClick={() => handleRemoveCollaborator(collaborator)}
                        className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Time Capsule Date */}
              {newStory.type === 'timecapsule' && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Unlock Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newStory.unlockDate}
                    onChange={(e) => setNewStory(prev => ({ ...prev, unlockDate: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-200"
                  />
                </div>
              )}

              {/* Poll Options */}
              {newStory.type === 'poll' && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Poll Options
                  </label>
                  <div className="space-y-3">
                    {newStory.interactive.options.map((option: string, index: number) => (
                      <div key={option + '-' + index} className="relative">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleUpdateInteractiveOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-200"
                        />
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 font-bold">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW: Allow Comments and Sharing toggles */}
              <div className="flex gap-8 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={newStory.allow_comments}
                    onChange={e => setNewStory(prev => ({ ...prev, allow_comments: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-purple-600"
                  />
                  Allow Comments
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={newStory.allow_sharing}
                    onChange={e => setNewStory(prev => ({ ...prev, allow_sharing: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-purple-600"
                  />
                  Allow Sharing
                </label>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStory}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl hover:from-purple-700 hover:to-cyan-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                  disabled={isUploading || !newStory.content.trim()}
                >
                  Create Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Modal */}
      {isStoryModalOpen && activeUserIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={e => {
            if (e.target === e.currentTarget) setIsStoryModalOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-5xl max-h-[80vh] bg-white dark:bg-dark-card shadow-lg p-6 overflow-hidden flex flex-col justify-center items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Progress Bar for user's stories */}
            <div className="absolute top-4 left-4 right-4 h-8">
              <div className="flex gap-1">
                {groupedStories[activeUserIndex].map((_: Story, index: number) => (
                  <div
                    key={'modal-progress-' + index}
                    className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                      index < activeUserStoryIndex
                        ? 'bg-purple-400'
                        : index === activeUserStoryIndex
                        ? 'bg-purple-400'
                        : 'bg-purple-200'
                    }`}
                  >
                    {index === activeUserStoryIndex && (
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-1000"
                        style={{
                          width: `${groupedStories[activeUserIndex][activeUserStoryIndex].type === 'video' && videoDuration ? (modalCurrentTime / videoDuration) * 100 : (modalCurrentTime / groupedStories[activeUserIndex][activeUserStoryIndex].duration) * 100}%`
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={() => setIsStoryModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 z-20"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            {/* Navigation for user's stories */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => {
                  if (activeUserIndex !== null) {
                    if (activeUserStoryIndex > 0) {
                      setActiveUserStoryIndex(i => i - 1);
                    } else if (activeUserIndex > 0) {
                      setActiveUserIndex((activeUserIndex as number) - 1);
                      setActiveUserStoryIndex(groupedStories[(activeUserIndex as number) - 1].length - 1);
                    }
                  }
                }}
                disabled={activeUserIndex === 0 && activeUserStoryIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 rounded-full p-2 disabled:opacity-50"
              >
                <BackwardIcon className="w-8 h-8 text-gray-700 dark:text-gray-200" />
              </button>
              <button
                onClick={() => {
                  if (activeUserIndex !== null) {
                    if (activeUserStoryIndex < groupedStories[activeUserIndex].length - 1) {
                      setActiveUserStoryIndex(i => i + 1);
                    } else if (activeUserIndex < groupedStories.length - 1) {
                      setActiveUserIndex((activeUserIndex as number) + 1);
                      setActiveUserStoryIndex(0);
                    }
                  }
                }}
                disabled={activeUserIndex === groupedStories.length - 1 && activeUserStoryIndex === groupedStories[activeUserIndex].length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 rounded-full p-2 disabled:opacity-50"
              >
                <ForwardIcon className="w-8 h-8 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
            {/* Story Content in Modal */}
            <div className="flex flex-col items-center justify-center h-full flex-1 min-h-0">
              {/* Media */}
              <div className="relative w-full h-[72vh] flex items-center justify-center mt-8">
                <div className="relative w-[90%] h-[72vh] flex items-center justify-center"
                  onMouseDown={() => setModalIsPlaying(false)}
                  onMouseUp={() => setModalIsPlaying(true)}
                  onMouseLeave={() => setModalIsPlaying(true)}
                  onTouchStart={() => setModalIsPlaying(false)}
                  onTouchEnd={() => setModalIsPlaying(true)}
                >
                  {(() => {
                    const story = groupedStories[activeUserIndex][activeUserStoryIndex];
                    const url = story.media_url || story.media_file || '';
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                    const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                    const isAudio = /\.(mp3|wav|ogg)$/i.test(url);
                    const altText = story.content || '';
                    if (isImage) {
                      return (
                        <img
                          src={url || ''}
                          alt={altText}
                          className="w-full h-full object-cover"
                        />
                      );
                    } else if (isVideo) {
                      return (
                        <video
                          ref={videoRef}
                          src={url || ''}
                          controls
                          className="w-full h-full object-cover"
                          onLoadedMetadata={e => {
                            const duration = e.currentTarget.duration;
                            if (!isNaN(duration) && duration > 0) {
                              setVideoDuration(duration);
                            }
                          }}
                        />
                      );
                    } else if (isAudio) {
                      return (
                        <div className="flex items-center justify-center w-full h-72 bg-black/60 rounded-xl mb-4">
                          <audio
                            src={url || ''}
                            controls
                            className="w-full max-w-md"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <img
                          src={url || ''}
                          alt={altText}
                          className="w-full h-full object-cover"
                        />
                      );
                    }
                  })()}
                  {/* Profile overlay top of media, constrained to media width */}
                  <div className="absolute top-0 left-0 w-full z-20 flex items-center gap-3 bg-black/60 rounded-t-2xl px-8 py-4 shadow-lg">
                    <img
                      src={
                        groupedStories[activeUserIndex][activeUserStoryIndex].author.avatar
                          ? (groupedStories[activeUserIndex][activeUserStoryIndex].author.avatar.startsWith('/')
                              ? BACKEND_BASE_URL + groupedStories[activeUserIndex][activeUserStoryIndex].author.avatar
                              : groupedStories[activeUserIndex][activeUserStoryIndex].author.avatar)
                          : BACKEND_BASE_URL + '/media/avatars/default.jpg'
                      }
                      alt={groupedStories[activeUserIndex][activeUserStoryIndex].author.name}
                      className="w-12 h-12 rounded-full border-2 border-white"
                    />
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {(groupedStories[activeUserIndex][activeUserStoryIndex].author.first_name || groupedStories[activeUserIndex][activeUserStoryIndex].author.last_name
                          ? `${groupedStories[activeUserIndex][activeUserStoryIndex].author.first_name || ''} ${groupedStories[activeUserIndex][activeUserStoryIndex].author.last_name || ''}`.trim()
                          : groupedStories[activeUserIndex][activeUserStoryIndex].author.username)}
                        {' · '}{timeAgo(groupedStories[activeUserIndex][activeUserStoryIndex].created_at)}
                      </h3>
                      <p className="text-gray-200 text-xs">@{groupedStories[activeUserIndex][activeUserStoryIndex].author.username}</p>
                    </div>
                  </div>
                  {/* Rating overlay (top right) */}
                  {user && groupedStories[activeUserIndex][activeUserStoryIndex].author.username === user.username && (
                    <div
                      className="absolute top-4 right-4 z-30 bg-white/90 dark:bg-gray-900/80 rounded-xl px-3 py-1 flex items-center gap-2 shadow-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-800/40"
                      onClick={() => openRatersModal(groupedStories[activeUserIndex][activeUserStoryIndex].id)}
                      title="View raters"
                    >
                      {renderStarRating(groupedStories[activeUserIndex][activeUserStoryIndex].rating, groupedStories[activeUserIndex][activeUserStoryIndex].totalRatings)}
                      <span className="text-xs text-gray-500 dark:text-gray-400">({formatCount(groupedStories[activeUserIndex][activeUserStoryIndex].totalRatings)})</span>
                    </div>
                  )}
                </div>
                {/* Story content overlay (no black gradient) */}
                <div className="absolute bottom-20 left-0 w-full px-8 py-6 z-20">
                  <h2 className="text-lg font-bold text-white text-center break-words">
                    {groupedStories[activeUserIndex][activeUserStoryIndex].content.length > 120 && !isContentExpanded ? (
                      <>
                        {groupedStories[activeUserIndex][activeUserStoryIndex].content.slice(0, 120)}...{' '}
                        <button className="underline text-purple-200" onClick={() => setIsContentExpanded(true)}>View more</button>
                      </>
                    ) : (
                      <>
                        {groupedStories[activeUserIndex][activeUserStoryIndex].content}
                        {groupedStories[activeUserIndex][activeUserStoryIndex].content.length > 120 && (
                          <button className="underline text-purple-200 ml-2" onClick={() => setIsContentExpanded(false)}>Show less</button>
                        )}
                      </>
                    )}
                  </h2>
                </div>
                {/* Message input container under content */}
                <div className="absolute bottom-0 left-0 w-3/4 left-1/2 -translate-x-1/2 px-2 pb-4 z-20 flex flex-col items-stretch gap-2">
                  <div className="flex flex-row items-end gap-4 w-full">
                    <div
                      className={`flex-1 flex items-end gap-2 transition-all duration-200 bg-white/80 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 shadow px-4 ${isMessageInputActive ? 'w-11/12' : 'w-3/5'} ${isMessageInputActive ? 'py-2' : 'py-2'} min-h-[40px]`}
                      onClick={() => setIsMessageInputActive(true)}
                      tabIndex={0}
                      onBlur={e => {
                        if (!e.currentTarget.contains(e.relatedTarget)) setIsMessageInputActive(false);
                      }}
                    >
                      {isMessageInputActive ? (
                        <textarea
                          autoFocus
                          value={messageInputValue}
                          onChange={e => setMessageInputValue(e.target.value)}
                          rows={1}
                          placeholder="Send a message..."
                          className="flex-1 bg-transparent text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 rounded-xl px-4 py-1 transition-all duration-200 shadow-sm placeholder-gray-400 dark:placeholder-gray-500 outline-none resize-none text-base min-h-[24px]"
                          onBlur={e => {
                            if (!e.currentTarget.parentElement?.contains(document.activeElement)) setIsMessageInputActive(false);
                          }}
                        />
                      ) : (
                        <input
                          value={messageInputValue}
                          onChange={e => setMessageInputValue(e.target.value)}
                          type="text"
                          placeholder="Send a message..."
                          className="flex-1 bg-transparent text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 rounded-xl px-4 py-1 transition-all duration-200 shadow-sm placeholder-gray-400 dark:placeholder-gray-500 outline-none text-base min-h-[24px] cursor-pointer"
                          readOnly
                        />
                      )}
                    </div>
                    {isMessageInputActive ? (
                      <button
                        className="rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 p-3 shadow-lg hover:scale-110 hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 focus:ring-2 focus:ring-purple-400 focus:outline-none flex items-center justify-center"
                        onMouseDown={e => e.preventDefault()} // Prevent input blur before click
                        onClick={e => {
                          e.stopPropagation();
                          handleSendStoryMessage();
                        }}
                        tabIndex={0}
                        aria-label="Send"
                      >
                        <PaperAirplaneIcon className="w-6 h-6 text-white" />
                      </button>
                    ) : null}
                    {!isMessageInputActive && (
                      <button
                        ref={modalRateButtonRef}
                        onClick={e => {
                          e.stopPropagation();
                          const group = groupedStories[activeUserIndex];
                          const storyInModal = group && group[activeUserStoryIndex];
                          if (storyInModal) {
                            handleRateClick(storyInModal);
                          }
                        }}
                        className="ml-2 px-4 py-2 text-sm bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full transition-colors flex items-center space-x-2"
                        tabIndex={-1}
                      >
                        <StarIcon className={`w-5 h-5 ${groupedStories[activeUserIndex]?.[activeUserStoryIndex]?.userRating > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <span>Rate</span>
                        {user && groupedStories[activeUserIndex]?.[activeUserStoryIndex]?.author.username === user.username && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-800/50 px-1.5 py-0.5 rounded-full">
                            {groupedStories[activeUserIndex]?.[activeUserStoryIndex]?.totalRatings ?? 0}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Story Info */}
              <div className="flex items-center justify-between w-full mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:underline" onClick={() => openViewersModal(groupedStories[activeUserIndex][activeUserStoryIndex].id)}>{groupedStories[activeUserIndex][activeUserStoryIndex].views_count} views</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{activeUserStoryIndex + 1} / {groupedStories[activeUserIndex].length}</span>
              </div>
            </div>
            {/* Rating Modal INSIDE story modal */}
            {isRatingModalOpen && rateModalPosition && (
              <div className="fixed inset-0 z-50 bg-transparent" onClick={() => setIsRatingModalOpen(false)}>
                <div
                  className="absolute"
                  style={{
                    top: rateModalPosition.top,
                    left: rateModalPosition.left,
                    transform: 'translate(-50%, -100%)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="relative bg-white dark:bg-dark-card rounded-lg p-6 shadow-xl border border-gray-200 dark:border-dark-border flex flex-col items-center">
                    <button onClick={() => setIsRatingModalOpen(false)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                      <XMarkIcon className="w-4 h-4 text-gray-500" />
                    </button>
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center space-x-0.5">
                        <button
                          className="p-0.5 transition-transform hover:scale-110"
                          onMouseEnter={() => handleStarHover(0)}
                          onMouseLeave={() => handleStarHover(selectedRating)}
                          onClick={() => handleStarClick(0)}
                        >
                          <span className={`text-sm font-medium ${selectedRating === 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            0
                          </span>
                        </button>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className="p-0.5 transition-transform hover:scale-110"
                            onMouseEnter={() => handleStarHover(star)}
                            onMouseLeave={() => handleStarHover(selectedRating)}
                            onClick={() => handleStarClick(star)}
                          >
                            <StarSolidIcon 
                              className={`w-6 h-6 ${
                                star <= (hoverRating || selectedRating) 
                                  ? 'text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {hoverRating === 0 ? 'Click to remove your rating' : 
                         hoverRating ? `Rate ${hoverRating} stars` : 
                         selectedRating ? `Your current rating: ${selectedRating} stars` : 
                         'Select your rating'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Stories Modal */}
      {userStoriesModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="relative w-full max-w-5xl max-h-[80vh] bg-white dark:bg-dark-card shadow-lg p-6 overflow-hidden flex flex-col justify-center items-center">
            <button
              onClick={() => setUserStoriesModal({ ...userStoriesModal, isOpen: false })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            {/* Navigation - Previous */}
            <button
              onClick={() => setUserStoriesModal(modal => ({ ...modal, activeIndex: Math.max(modal.activeIndex - 1, 0) }))}
              disabled={userStoriesModal.activeIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 rounded-full p-2 disabled:opacity-50"
            >
              <BackwardIcon className="w-8 h-8 text-gray-700 dark:text-gray-200" />
            </button>
            {/* Navigation - Next */}
            <button
              onClick={() => setUserStoriesModal(modal => ({ ...modal, activeIndex: Math.min(modal.activeIndex + 1, userStoriesModal.stories.length - 1) }))}
              disabled={userStoriesModal.activeIndex === userStoriesModal.stories.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 rounded-full p-2 disabled:opacity-50"
            >
              <ForwardIcon className="w-8 h-8 text-gray-700 dark:text-gray-200" />
            </button>
            {/* Progress Bar in Modal */}
            <div className="absolute top-4 left-4 right-4 h-8">
              <div className="flex gap-1">
                {userStoriesModal.stories.map((_: Story, index: number) => (
                  <div
                    key={'modal-progress-' + index}
                    className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                      index < userStoriesModal.activeIndex
                        ? 'bg-purple-400'
                        : index === userStoriesModal.activeIndex
                        ? 'bg-purple-400'
                        : 'bg-purple-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Story Content in Modal */}
            <div className="flex flex-col items-center justify-center h-full flex-1 min-h-0 mt-8">
              {/* Media */}
              <div className="relative w-full h-[72vh] flex items-center justify-center mt-8">
                <div className="relative w-[90%] h-[72vh] flex items-center justify-center"
                  onMouseDown={() => setModalIsPlaying(false)}
                  onMouseUp={() => setModalIsPlaying(true)}
                  onMouseLeave={() => setModalIsPlaying(true)}
                  onTouchStart={() => setModalIsPlaying(false)}
                  onTouchEnd={() => setModalIsPlaying(true)}
                >
                  {(() => {
                    const story = userStoriesModal.stories[userStoriesModal.activeIndex];
                    const url = story.media_url || story.media_file || '';
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                    const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                    const isAudio = /\.(mp3|wav|ogg)$/i.test(url);
                    const altText = story.content || '';
                    if (isImage) {
                      return (
                        <img
                          src={url || ''}
                          alt={altText}
                          className="w-full h-full object-cover"
                        />
                      );
                    } else if (isVideo) {
                      return (
                        <video
                          ref={userStoriesVideoRef}
                          src={url || ''}
                          controls
                          className="w-full h-full object-cover"
                          onLoadedMetadata={e => {
                            const duration = e.currentTarget.duration;
                            if (!isNaN(duration) && duration > 0) {
                              setUserStoriesVideoDuration(duration);
                            }
                          }}
                        />
                      );
                    } else if (isAudio) {
                      return (
                        <div className="flex items-center justify-center w-full h-72 bg-black/60 rounded-xl mb-4">
                          <audio
                            src={url || ''}
                            controls
                            className="w-full max-w-md"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <img
                          src={url || ''}
                          alt={altText}
                          className="w-full h-full object-cover"
                        />
                      );
                    }
                  })()}
                  {/* Profile overlay top of media, constrained to media width */}
                  <div className="absolute top-0 left-0 w-full z-20 flex items-center gap-3 bg-black/60 rounded-t-2xl px-8 py-4 shadow-lg">
                    <img
                      src={
                        userStoriesModal.stories[userStoriesModal.activeIndex].author.avatar
                          ? (userStoriesModal.stories[userStoriesModal.activeIndex].author.avatar.startsWith('/')
                              ? BACKEND_BASE_URL + userStoriesModal.stories[userStoriesModal.activeIndex].author.avatar
                              : userStoriesModal.stories[userStoriesModal.activeIndex].author.avatar)
                          : BACKEND_BASE_URL + '/media/avatars/default.jpg'
                      }
                      alt={userStoriesModal.stories[userStoriesModal.activeIndex].author.name}
                      className="w-12 h-12 rounded-full border-2 border-white"
                    />
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {(userStoriesModal.stories[userStoriesModal.activeIndex].author.first_name || userStoriesModal.stories[userStoriesModal.activeIndex].author.last_name
                          ? `${userStoriesModal.stories[userStoriesModal.activeIndex].author.first_name || ''} ${userStoriesModal.stories[userStoriesModal.activeIndex].author.last_name || ''}`.trim()
                          : userStoriesModal.stories[userStoriesModal.activeIndex].author.username)}
                        {' · '}{timeAgo(userStoriesModal.stories[userStoriesModal.activeIndex].created_at)}
                      </h3>
                      <p className="text-gray-200 text-xs">@{userStoriesModal.stories[userStoriesModal.activeIndex].author.username}</p>
                    </div>
                  </div>
                  {/* Rating overlay (top right) */}
                  {user && userStoriesModal.stories[userStoriesModal.activeIndex].author.username === user.username && (
                    <div
                      className="absolute top-4 right-4 z-30 bg-white/90 dark:bg-gray-900/80 rounded-xl px-3 py-1 flex items-center gap-2 shadow-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-800/40"
                      onClick={() => openRatersModal(userStoriesModal.stories[userStoriesModal.activeIndex].id)}
                      title="View raters"
                    >
                      {renderStarRating(userStoriesModal.stories[userStoriesModal.activeIndex].rating, userStoriesModal.stories[userStoriesModal.activeIndex].totalRatings)}
                      <span className="text-xs text-gray-500 dark:text-gray-400">({formatCount(userStoriesModal.stories[userStoriesModal.activeIndex].totalRatings)})</span>
                    </div>
                  )}
                </div>
                {/* Story content overlay (no black gradient) */}
                <div className="absolute bottom-20 left-0 w-full px-8 py-6 z-20">
                  <h2 className="text-lg font-bold text-white text-center break-words">
                    {userStoriesModal.stories[userStoriesModal.activeIndex].content.length > 120 && !isContentExpanded ? (
                      <>
                        {userStoriesModal.stories[userStoriesModal.activeIndex].content.slice(0, 120)}...{' '}
                        <button className="underline text-purple-200" onClick={() => setIsContentExpanded(true)}>View more</button>
                      </>
                    ) : (
                      <>
                        {userStoriesModal.stories[userStoriesModal.activeIndex].content}
                        {userStoriesModal.stories[userStoriesModal.activeIndex].content.length > 120 && (
                          <button className="underline text-purple-200 ml-2" onClick={() => setIsContentExpanded(false)}>Show less</button>
                        )}
                      </>
                    )}
                  </h2>
                </div>
                {/* Message input container under content */}
                <div className="absolute bottom-0 left-0 w-3/4 left-1/2 -translate-x-1/2 px-2 pb-4 z-20 flex flex-col items-stretch gap-2">
                  <div className="flex flex-row items-end gap-4 w-full">
                    <div
                      className={`flex-1 flex items-end gap-2 transition-all duration-200 bg-white/80 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 shadow px-4 ${isMessageInputActive ? 'w-11/12' : 'w-3/5'} ${isMessageInputActive ? 'py-2' : 'py-2'} min-h-[40px]`}
                      onClick={() => setIsMessageInputActive(true)}
                      tabIndex={0}
                      onBlur={e => {
                        if (!e.currentTarget.contains(e.relatedTarget)) setIsMessageInputActive(false);
                      }}
                    >
                      {isMessageInputActive ? (
                        <textarea
                          autoFocus
                          value={messageInputValue}
                          onChange={e => setMessageInputValue(e.target.value)}
                          rows={1}
                          placeholder="Send a message..."
                          className="flex-1 bg-transparent text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 rounded-xl px-4 py-1 transition-all duration-200 shadow-sm placeholder-gray-400 dark:placeholder-gray-500 outline-none resize-none text-base min-h-[24px]"
                          onBlur={e => {
                            if (!e.currentTarget.parentElement?.contains(document.activeElement)) setIsMessageInputActive(false);
                          }}
                        />
                      ) : (
                        <input
                          value={messageInputValue}
                          onChange={e => setMessageInputValue(e.target.value)}
                          type="text"
                          placeholder="Send a message..."
                          className="flex-1 bg-transparent text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 rounded-xl px-4 py-1 transition-all duration-200 shadow-sm placeholder-gray-400 dark:placeholder-gray-500 outline-none text-base min-h-[24px] cursor-pointer"
                          readOnly
                        />
                      )}
                    </div>
                    {isMessageInputActive ? (
                      <button
                        className="rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 p-3 shadow-lg hover:scale-110 hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 focus:ring-2 focus:ring-purple-400 focus:outline-none flex items-center justify-center"
                        onClick={e => {
                          e.stopPropagation();
                          handleSendStoryMessage();
                        }}
                        tabIndex={0}
                        aria-label="Send"
                      >
                        <PaperAirplaneIcon className="w-6 h-6 text-white" />
                      </button>
                    ) : null}
                    {!isMessageInputActive && (
                      <button
                        ref={modalRateButtonRef}
                        onClick={e => {
                          e.stopPropagation();
                          const storyInModal = userStoriesModal.stories[userStoriesModal.activeIndex];
                          if (storyInModal) {
                            handleRateClick(storyInModal);
                          }
                        }}
                        className="ml-2 px-4 py-2 text-sm bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full transition-colors flex items-center space-x-2"
                        tabIndex={-1}
                      >
                        <StarIcon className={`w-5 h-5 ${storyInModal && storyInModal.userRating > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <span>Rate</span>
                        {user && userStoriesModal.stories[userStoriesModal.activeIndex]?.author.username === user.username && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-800/50 px-1.5 py-0.5 rounded-full">
                            {userStoriesModal.stories[userStoriesModal.activeIndex]?.totalRatings ?? 0}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Story Info */}
              <div className="flex items-center justify-between w-full mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:underline" onClick={() => openViewersModal(userStoriesModal.stories[userStoriesModal.activeIndex].id)}>{userStoriesModal.stories[userStoriesModal.activeIndex].views_count} views</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{userStoriesModal.activeIndex + 1} / {userStoriesModal.stories.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raters Modal */}
      {ratersModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setRatersModal({ open: false, storyId: null, raters: [], loading: false })}>
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => setRatersModal({ open: false, storyId: null, raters: [], loading: false })}>
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Story Raters</h2>
            {ratersModal.loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
            ) : ratersModal.raters.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">No raters yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
                {ratersModal.raters.map((rater: any) => (
                  <li key={rater.id} className="flex items-center gap-3 py-3">
                    <img src={rater.avatar} alt={rater.username} className="w-10 h-10 rounded-full border" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{rater.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{rater.first_name || ''} {rater.last_name || ''}</div>
                    </div>
                    <div>{renderStarRating(rater.rating, rater.total_ratings)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      {viewersModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setViewersModal({ open: false, storyId: null, viewers: [], loading: false })}>
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => setViewersModal({ open: false, storyId: null, viewers: [], loading: false })}>
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Story Viewers</h2>
            {viewersModal.loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
            ) : viewersModal.viewers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">No viewers yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
                {viewersModal.viewers.map((viewer: any) => (
                  <li key={viewer.id} className="flex items-center gap-3 py-3">
                    <img src={viewer.avatar} alt={viewer.username} className="w-10 h-10 rounded-full border" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{viewer.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(viewer.viewed_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories;