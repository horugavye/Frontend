import { FC, useState, useEffect, useRef } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { 
  BookmarkIcon, 
  ShareIcon, 
  PaperAirplaneIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  SparklesIcon,
  ChevronDownIcon,
  FireIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow, parseISO } from 'date-fns';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';
import { useTheme } from '../context/ThemeContext';

// Default avatar fallback
const DEFAULT_AVATAR = '/default.jpg';

// Helper function to get avatar URL with fallback
const getAvatarUrl = (avatarUrl: string | null | undefined): string => {
  if (!avatarUrl || avatarUrl === '') {
    return DEFAULT_AVATAR;
  }
  return avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_API_URL}${avatarUrl}`;
};

interface PersonalityTag {
  name: string;
  color: string;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  alt?: string;
}

interface Reply {
  id: number;
  comment: number;
  author: {
    name: string;
    avatarUrl: string;
    personalityTags: PersonalityTag[];
    username: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
  nested_replies: Reply[];
}

interface Comment {
  id: number;
  post: {
    id: string;
    community: {
      slug: string;
    };
  };
  author: {
    name: string;
    avatarUrl: string;
    personalityTags: PersonalityTag[];
    username: string;
  };
  content: string;
  timestamp: string;
  replies: Reply[];
  is_top_comment: boolean;
  rating: number;
  ratingCount: number;
  hasRated: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface RecommendedUser {
  name: string;
  avatarUrl: string;
  personalityTags: PersonalityTag[];
}

interface PostCardProps {
  title: string;
  content: string;
  author: {
    name: string;
    avatarUrl: string;
    personalityTags: PersonalityTag[];
    role: string;
    username: string;
  };
  author_role: string;
  community?: string;
  communityName?: string;
  isPersonal?: boolean;
  timestamp: string;
  rating: number;
  totalRatings: number;
  commentCount: number;
  media?: MediaItem[];
  topComment?: Comment;
  recommendedUsers?: RecommendedUser[];
  id: string | number;
  originalId?: string;
  onRate?: (rating: number, post: any) => void;
  onDescriptionClick?: (postId: string) => void;
  userRating?: number;
  onCommentAdded?: (newComment: Comment) => void;
  tags?: PersonalityTag[];
}

interface VideoPlayerProps {
  item: MediaItem;
  inModal?: boolean;
  videoMaxHeight?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

const VideoPlayer: FC<VideoPlayerProps> = ({ item, inModal, videoMaxHeight, videoRef }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const actualVideoRef = videoRef || localVideoRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const defaultPoster = 'https://ui-avatars.com/api/?name=Video&background=random&color=fff';
  const [isFocused, setIsFocused] = useState(false);

  // Intersection Observer for auto play/pause on scroll (desktop only)
  useEffect(() => {
    if (isMobile || !actualVideoRef.current) return;
    const video = actualVideoRef.current;
    let observer: IntersectionObserver | null = null;
    let wasPlaying = false;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Play if at least 50% visible
          video.play();
          setIsPlaying(true);
        } else {
          // Pause if less than 50% visible
          wasPlaying = !video.paused;
          video.pause();
          setIsPlaying(false);
        }
      });
    };

    observer = new window.IntersectionObserver(handleIntersection, {
      threshold: [0, 0.5, 1],
    });
    observer.observe(video);

    return () => {
      if (observer && video) observer.unobserve(video);
    };
  }, [isMobile, actualVideoRef]);

  useEffect(() => {
    if (actualVideoRef.current) {
      setDuration(actualVideoRef.current.duration);
    }
  }, [actualVideoRef.current]);

  const handleTimeUpdate = () => {
    if (actualVideoRef.current) {
      setProgress((actualVideoRef.current.currentTime / actualVideoRef.current.duration) * 100);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (actualVideoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      actualVideoRef.current.currentTime = percentage * actualVideoRef.current.duration;
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actualVideoRef.current) {
      if (isPlaying) {
        actualVideoRef.current.pause();
      } else {
        actualVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actualVideoRef.current) {
      actualVideoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
    setIsLoading(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoading(false);
  };

  // Use native controls on mobile for better UX
  if (isMobile) {
    return (
      <div className="relative group w-full h-full">
        <video
          ref={actualVideoRef}
          src={item.url}
          poster={item.thumbnail || defaultPoster}
          className={`w-full h-full ${inModal ? 'object-contain' : 'object-cover'}`}
          controls
          muted={isMuted}
          loop
          aria-label="Post video"
          tabIndex={0}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
        >
          <source src={item.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold">
            Video failed to load.
          </div>
        )}
      </div>
    );
  }

  // Desktop: custom controls
  return (
    <div 
      className="relative group w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={-1}
    >
      <video
        ref={actualVideoRef}
        src={item.url}
        poster={item.thumbnail || defaultPoster}
        className={`w-full ${inModal ? 'object-contain' : 'object-cover'}${videoMaxHeight ? '' : ' h-full'}`}
        style={videoMaxHeight ? { maxHeight: videoMaxHeight, width: '100%' } : undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        muted={isMuted}
        loop
        onClick={inModal ? (e) => e.stopPropagation() : undefined}
        aria-label="Post video"
        tabIndex={0}
        onError={handleError}
      >
        <source src={item.url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold">
          Video failed to load.
        </div>
      )}
      {/* Custom Video Controls */}
      {!isLoading && !isError && (
        <div className={`absolute inset-0 flex flex-col justify-end z-50 pointer-events-none ${inModal ? '' : (isHovered ? '' : 'opacity-0')}`}
        >
          {/* Controls bar background for visibility */}
          <div className="w-full h-20 absolute bottom-0 left-0 bg-black bg-opacity-80 border-t-2 border-purple-500 shadow-lg z-50" />
          <div className="relative z-50 pointer-events-auto">
            {/* Progress bar */}
            <div 
              className="px-4 pb-2 cursor-pointer"
              onClick={handleProgressClick}
            >
              <div className="w-full h-1 bg-gray-600 rounded overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-4 h-4" />
                  ) : (
                    <PlayIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-4 h-4" />
                  ) : (
                    <SpeakerWaveIcon className="w-4 h-4" />
                  )}
                </button>
                <span className="text-white text-sm">
                  {formatTime(actualVideoRef.current?.currentTime || 0)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PostCard: FC<PostCardProps> = ({
  title = '',
  content = '',
  author,
  author_role = '',
  community = '',
  communityName = '',
  timestamp = '',
  rating = 0,
  totalRatings = 0,
  commentCount = 0,
  media = [],
  topComment: initialTopComment,
  recommendedUsers = [],
  isPersonal = false,
  id,
  originalId = '',
  onRate,
  onDescriptionClick,
  userRating = 0,
  onCommentAdded,
  tags = [],
}) => {
  console.log('PostCard received commentCount:', commentCount);
  console.log('PostCard received tags:', tags);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(userRating);
  const [localRating, setLocalRating] = useState(rating);
  const [localTotalRatings, setLocalTotalRatings] = useState(totalRatings);
  const [showCongrats, setShowCongrats] = useState(false);
  const [fallingStars, setFallingStars] = useState<Array<{ id: number; left: number; delay: number }>>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount || 0);
  console.log('PostCard localCommentCount state:', localCommentCount);
  const [topComment, setTopComment] = useState<Comment | undefined>(initialTopComment);
  const rateButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const COMMENT_PREVIEW_LENGTH = 150; // Characters to show in preview
  const [isSaved, setIsSaved] = useState(false);
  const { isDarkMode } = useTheme();
  // Ref for the feed video (only one video per post in feed is visible at a time)
  const feedVideoRef = useRef<HTMLVideoElement | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const CONTENT_PREVIEW_LENGTH = 200;

  // Fetch saved state on mount
  useEffect(() => {
    const fetchSavedState = async () => {
      try {
        const postId = originalId || (typeof id === 'string' ? id.replace(/^(personal_|community_)/, '') : id.toString());
        console.log('Fetching saved state for post:', postId);
        
        // Fetch all saved posts for the user
        const response = await api.get(`${API_ENDPOINTS.SAVED_POSTS}/`);
        const savedPosts = response.data;
        console.log('Fetched saved posts:', savedPosts);
        
        // Check if this post is in the saved posts list
        const found = Array.isArray(savedPosts) && savedPosts.some((sp: any) => {
          const savedPostId = sp.post?.id?.toString();
          console.log('Comparing saved post ID:', savedPostId, 'with current post ID:', postId);
          return savedPostId === postId;
        });
        
        console.log('Post saved state:', found);
        setIsSaved(found);
      } catch (error) {
        console.error('Error fetching saved state:', error);
        setIsSaved(false);
      }
    };

    fetchSavedState();
  }, [id, originalId]); // Add dependencies to ensure it runs when these values change

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Update local state when props change
  useEffect(() => {
    setLocalRating(rating);
    setLocalTotalRatings(totalRatings);
    setSelectedRating(userRating);
    setHoverRating(userRating);
  }, [rating, totalRatings, userRating]);

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  };

  const handleMediaClick = (index: number) => {
    // Pause the feed video if it's playing
    if (feedVideoRef.current && !feedVideoRef.current.paused) {
      feedVideoRef.current.pause();
    }
    setCurrentMediaIndex(index);
    setIsModalOpen(true);
  };

  const handlePrevious = () => {
    setCurrentMediaIndex((prev) => (prev === 0 ? (media?.length || 1) - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentMediaIndex((prev) => (prev === (media?.length || 1) - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isModalOpen) {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setIsModalOpen(false);
    }
  };

  // Add event listener for keyboard navigation
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      return relativeTime;
    } catch (error) {
      return timestamp;
    }
  };

  const handleRateClick = () => {
    setIsRatingModalOpen(true);
    setHoverRating(selectedRating); // Set hover rating to current user rating
  };

  const handleStarHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleStarClick = async (rating: number) => {
    // Log rating action for debugging
    console.log('[PostCard] Rating post', {
      id,
      community,
      isPersonal,
      rating,
      previousRating: selectedRating
    });
    // Store the previous rating before making any changes
    const previousRating = selectedRating;
    
    // Optimistic update - only increment if it's a new rating, not a change
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
      // Show congratulations for 5-star ratings
      if (rating === 5) {
        setShowCongrats(true);
        // Generate falling stars
        const stars = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 2
        }));
        setFallingStars(stars);
        
        // Hide the congratulations after 3 seconds
        setTimeout(() => {
          setShowCongrats(false);
          setFallingStars([]);
        }, 3000);
      }

      // Safely get the post ID
      let postId: string;
      if (originalId) {
        postId = originalId;
      } else if (typeof id === 'string') {
        postId = id.replace(/^(personal_|community_)/, '');
      } else if (typeof id === 'number') {
        postId = id.toString();
      } else {
        throw new Error('Invalid post ID');
      }

      // If unrating (rating = 0) or clicking the same rating, delete the rating
      if (rating === 0 || rating === previousRating) {
        const response = await api.delete(
          isPersonal 
            ? `/api/posts/${postId}/rate/`
            : `/api/communities/${community}/posts/${postId}/rate/`
        );

        // Update with actual server response
        if (onRate) {
          const unratedPost = {
            id,
            title,
            content,
            author,
            author_role,
            community,
            isPersonal,
            timestamp,
            rating: 0,
            totalRatings: localTotalRatings - 1,
            commentCount: localCommentCount,
            media,
            topComment,
            userRating: 0,
            tags
          };
          onRate(0, unratedPost);
        }
        setSelectedRating(0);
        setLocalRating(0);
        setIsRatingModalOpen(false);
        return;
      }

      // Make API call to save rating
      const response = await api.post(
        isPersonal 
          ? `/api/posts/${postId}/rate/`
          : `/api/communities/${community}/posts/${postId}/rate/`,
        {
          rating: Number(rating) // Ensure rating is a number
        }
      );

      // Update with actual server response
      if (onRate) {
        onRate(rating, response.data);
      }
      setIsRatingModalOpen(false);
    } catch (error) {
      // Revert optimistic update on error
      setSelectedRating(previousRating);
      setLocalRating(previousRating);
      setLocalTotalRatings(totalRatings);
      if (onRate) {
        // Create a temporary post object for error state
        const errorPost = {
          id,
          title,
          content,
          author,
          author_role,
          community,
          isPersonal,
          timestamp,
          rating: previousRating,
          totalRatings,
          commentCount: localCommentCount,
          media,
          topComment,
          userRating: previousRating,
          tags
        };
        onRate(previousRating, errorPost);
      }
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating. Please try again.');
    }
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post click event from firing
    console.log('Author data on click:', {
      name: author.name,
      username: author.username,
      fullAuthor: author
    });
    navigate(`/profile/${author.username}`);
  };

  const handlePostClick = () => {
    let postId: string;
    if (originalId) {
      postId = originalId;
    } else if (typeof id === 'string') {
      postId = id.replace(/^(personal_|community_)/, '');
    } else if (typeof id === 'number') {
      postId = id.toString();
    } else {
      console.error('Invalid post ID type:', id);
      return;
    }

    if (isPersonal) {
      navigate(`/posts/personal/${postId}`);
    } else {
      navigate(`/posts/community/${postId}?slug=${community}`);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post click event from firing
    let postId: string;
    
    if (originalId) {
      postId = originalId;
    } else if (typeof id === 'string') {
      postId = id.replace(/^(personal_|community_)/, '');
    } else if (typeof id === 'number') {
      postId = id.toString();
    } else {
      console.error('Invalid post ID type:', id);
      return;
    }

    if (isPersonal) {
      navigate(`/posts/${postId}`);
    } else {
      navigate(`/posts/${postId}?slug=${community}`);
    }
  };

  const handleCommunityClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post click event from firing
    if (community) {
      navigate(`/communities/${community}`);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const postId = originalId || (typeof id === 'string' ? id.replace(/^(personal_|community_)/, '') : id.toString());
      
      const response = await api.post(
        isPersonal 
          ? `/api/posts/${postId}/comments/`
          : `/api/communities/${community}/posts/${postId}/comments/`,
        {
          content: commentText.trim(),
          post: postId
        }
      );

      // Create a new comment object from the response
      const newComment: Comment = {
        id: response.data.id,
        post: {
          id: postId,
          community: {
            slug: community || ''
          }
        },
        author: {
          name: author.name,
          avatarUrl: author.avatarUrl,
          personalityTags: author.personalityTags,
          username: author.username
        },
        content: commentText.trim(),
        timestamp: new Date().toISOString(),
        replies: [],
        is_top_comment: false,
        rating: 0,
        ratingCount: 0,
        hasRated: false,
        sentiment: 'neutral'
      };

      // Clear the input
      setCommentText('');
      
      // Update local comment count
      setLocalCommentCount(prev => prev + 1);
      
      // Show success message
      toast.success('Comment posted successfully!');
      
      // Call the onCommentAdded callback if provided
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }

      // If there's no top comment, set this as the top comment
      if (!topComment) {
        setTopComment(newComment);
      } else {
        // If there is a top comment, update the comments list
        setTopComment(prev => {
          if (!prev) return newComment;
          // Keep the existing top comment but update its content
          return {
            ...prev,
            content: newComment.content,
            timestamp: newComment.timestamp
          };
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePost = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post click event from firing
    
    try {
      // Always extract just the numeric id for both personal and community posts
      let postId: string;
      if (originalId) {
        postId = originalId;
      } else if (typeof id === 'string') {
        postId = id.replace(/^(personal_|community_)/, '');
      } else if (typeof id === 'number') {
        postId = id.toString();
      } else {
        throw new Error('Invalid post ID');
      }
      console.log('Attempting to save/unsave post with ID:', postId);
      console.log('Current saved state:', isSaved);
      
      if (isSaved) {
        // Unsave post
        console.log('Attempting to unsave post...');
        const response = await api.post(`${API_ENDPOINTS.SAVED_POSTS}/unsave/`, { post_id: postId, is_personal: isPersonal });
        console.log('Unsave response:', response);
        setIsSaved(false);
        toast.success('Post unsaved');
      } else {
        try {
          // Save post
          console.log('Attempting to save post...');
          const response = await api.post(`${API_ENDPOINTS.SAVED_POSTS}/save/`, { post_id: postId, is_personal: isPersonal });
          console.log('Save response:', response);
          setIsSaved(true);
          toast.success('Post saved');
        } catch (error: any) {
          console.error('Save error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          // If the error is because the post is already saved, update the UI accordingly
          if (error.response?.data?.error === 'Post is already saved') {
            setIsSaved(true);
            toast.success('Post is already saved');
          } else {
            throw error; // Re-throw other errors
          }
        }
      }
    } catch (error: any) {
      console.error('Error saving/unsaving post:', {
        error,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      if (error.response?.data?.error === 'Post is already saved') {
        setIsSaved(true);
        toast.success('Post is already saved');
      } else {
        toast.error('Failed to save post. Please try again.');
      }
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-card rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow">
      {/* Falling Stars Animation */}
      {fallingStars.map((star) => (
        <div
          key={star.id}
          className="fixed z-50 animate-fallingStar"
          style={{
            left: `${star.left}%`,
            animationDelay: `${star.delay}s`
          }}
        >
          <StarIcon className="w-6 h-6 text-yellow-400" />
        </div>
      ))}

      {/* Congratulations Toast */}
      {showCongrats && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 animate-pulse" />
            <FireIcon className="w-5 h-5 animate-pulse" />
            <span className="font-medium">Amazing rating! You're awesome! 🎉</span>
          </div>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {/* Author info */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <img
            src={getAvatarUrl(author.avatarUrl)}
            alt={author.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full cursor-pointer"
            onClick={handleAuthorClick}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== DEFAULT_AVATAR) {
                target.src = DEFAULT_AVATAR;
              }
            }}
          />
          <div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span 
                className="text-gray-900 dark:text-gray-100 font-medium hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors text-sm sm:text-base"
                onClick={handleAuthorClick}
              >
                {author.name}
              </span>
              <div className="flex space-x-1">
                {author.personalityTags.map((tag) => (
                  <span
                    key={tag.name}
                    className="px-1.5 sm:px-2 py-0.5 rounded-full text-xs text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500">
              {/* Show community name for community posts */}
              {!isPersonal && communityName && (
                <span 
                  onClick={handleCommunityClick}
                  className="group px-1.5 sm:px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  <span className="group-hover:tracking-wide transition-all">{communityName}</span>
                </span>
              )}
              <span className="flex items-center space-x-1">
                <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{formatTimestamp(timestamp)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Post content */}
        <div 
          className="cursor-pointer p-3 sm:p-4 rounded-lg bg-white dark:bg-dark-card shadow-sm"
          onClick={() => onDescriptionClick ? onDescriptionClick(id.toString()) : handlePostClick()}
        >
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">{title}</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
            {showFullContent || !content || content.length <= CONTENT_PREVIEW_LENGTH
              ? content
              : `${content.slice(0, CONTENT_PREVIEW_LENGTH)}...`}
          </p>
          {content && content.length > CONTENT_PREVIEW_LENGTH && (
            <button
              className="text-purple-600 dark:text-purple-400 hover:underline text-xs sm:text-sm font-medium mt-1"
              onClick={e => { e.stopPropagation(); setShowFullContent(v => !v); }}
            >
              {showFullContent ? 'View Less' : 'View More'}
            </button>
          )}
        </div>

        {/* AI Recommended Connections */}
        {recommendedUsers && recommendedUsers.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3 lg:p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span className="text-gray-900 dark:text-gray-100 font-medium text-sm sm:text-base">AI Recommended Connections</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 lg:mb-4">
              Based on your interests in {community}, you might enjoy connecting with:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              {recommendedUsers.map((user, index) => (
                <div 
                  key={index} 
                  className="bg-white dark:bg-dark-card rounded-lg p-2 sm:p-2.5 lg:p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <img
                      src={getAvatarUrl(user.avatarUrl)}
                      alt={user.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full ring-2 ring-purple-500/20"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== DEFAULT_AVATAR) {
                          target.src = DEFAULT_AVATAR;
                        }
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-gray-900 dark:text-gray-100 font-medium truncate text-xs sm:text-sm lg:text-base">{user.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.personalityTags.map((tag) => (
                          <span
                            key={tag.name}
                            className="px-1 sm:px-1.5 lg:px-2 py-0.5 rounded-full text-xs text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-2 sm:mt-3 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium flex items-center justify-center space-x-1 shadow-sm hover:shadow-md">
                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Connect</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Gallery */}
        {media && media.length > 0 && (
          <div className={`grid ${
            media.length === 1 ? 'grid-cols-1' : 
            media.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
            'grid-cols-1 sm:grid-cols-2'
          } gap-2 sm:gap-3`}>
            {media.slice(0, 4).map((item, index) => (
              <div
                key={index}
                className={`rounded-lg overflow-hidden min-h-[200px] sm:min-h-[260px] lg:min-h-[340px] max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative group flex items-stretch`}
                onClick={() => handleMediaClick(index)}
              >
                <div className="w-full h-full relative group flex items-stretch">
                  {/* Video Player */}
                  {item.type === 'video' && (
                    <VideoPlayer item={item} inModal={false} videoRef={feedVideoRef} />
                  )}
                  
                  {/* Image */}
                  {item.type === 'image' && (
                    <>
                      <img
                        src={item.url}
                        alt={item.alt || `Media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                  )}
                  {/* Show +X indicator on the last visible image */}
                  {index === 3 && media.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        +{media.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Topics */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
            {tags.map((tag) => {
              // Always use a visible pastel background in light mode
              const pastelBg = '#f3e8ff'; // pastel purple, always visible on white
              const textColor = isDarkMode ? '#fff' : '#000';
              const fontWeight = isDarkMode ? 'normal' : 'bold';
              return (
                <span
                  key={tag.name}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200`}
                  style={{
                    background: isDarkMode ? tag.color || '#2d2d2d' : pastelBg,
                    color: textColor,
                    fontWeight: fontWeight,
                  }}
                >
                  #{tag.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Post actions */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={`star-${star}`} className="text-yellow-400">
                    {star <= Math.floor(Number(localRating) || 0) ? (
                      <StarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : star - 0.5 <= (Number(localRating) || 0) ? (
                      <div key={`half-star-${star}`} className="relative">
                        <StarOutlineIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }} />
                      </div>
                    ) : (
                      <StarOutlineIcon key={`outline-star-${star}`} className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </span>
                ))}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{(Number(localRating) || 0).toFixed(1)}</span>
              <button
                ref={rateButtonRef}
                onClick={handleRateClick}
                className="ml-1 sm:ml-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full transition-colors flex items-center space-x-1 sm:space-x-2"
              >
                <StarIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedRating > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />
                <span>Rate</span>
                <span className="text-xs bg-purple-100 dark:bg-purple-800/50 px-1 sm:px-1.5 py-0.5 rounded-full">
                  {formatCount(localTotalRatings)}
                </span>
              </button>
            </div>
            <button 
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full transition-colors flex items-center space-x-1"
              onClick={handleCommentClick}
            >
              <ChatBubbleLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs bg-blue-100 dark:bg-blue-800/50 px-1 sm:px-1.5 py-0.5 rounded-full">
                {localCommentCount}
              </span>
            </button>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
                isSaved 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/40' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700'
              }`}
              onClick={handleSavePost}
            >
              {isSaved ? (
                <BookmarkIconSolid className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            <button className="p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
              <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
              <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div 
          className="space-y-2 sm:space-y-3 lg:space-y-4 pt-2 sm:pt-3 lg:pt-4 border-t border-gray-200 dark:border-gray-700 cursor-pointer"
          onClick={handleCommentClick}
        >
          {/* Comment Input */}
          <div className="flex items-start space-x-2">
            <img
              src={getAvatarUrl(author.avatarUrl)}
              alt="Your avatar"
              className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== DEFAULT_AVATAR) {
                  target.src = DEFAULT_AVATAR;
                }
              }}
            />
            <div className="flex-1 relative">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent redirection when clicking input
                  className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none border border-gray-200 dark:border-gray-700"
                />
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent redirection when clicking submit
                    handleCommentSubmit();
                  }}
                  disabled={isSubmitting || !commentText.trim()}
                  className={`p-1 sm:p-1.5 lg:p-2 rounded-full transition-colors ${
                    isSubmitting || !commentText.trim()
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {isSubmitting ? (
                    <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Top Comment */}
          {topComment && (
            <div 
              className="flex space-x-2 sm:space-x-3"
              onClick={(e) => e.stopPropagation()} // Prevent redirection when clicking comment
            >
              <img
                src={getAvatarUrl(topComment.author.avatarUrl)}
                alt={topComment.author.name}
                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== DEFAULT_AVATAR) {
                    target.src = DEFAULT_AVATAR;
                  }
                }}
              />
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-2.5 lg:p-3">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                    <span 
                      className="text-gray-900 dark:text-gray-100 font-medium text-xs sm:text-sm lg:text-base hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${topComment.author.username}`);
                      }}
                    >
                      {topComment.author.name}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {topComment.author.personalityTags.map((tag) => (
                        <span
                          key={tag.name}
                          className="px-1.5 py-0.5 rounded-full text-xs text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 text-sm">
                    {topComment.content.length > COMMENT_PREVIEW_LENGTH && !isCommentExpanded ? (
                      <>
                        <p>{topComment.content.slice(0, COMMENT_PREVIEW_LENGTH)}...</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCommentExpanded(true);
                          }}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium mt-1"
                        >
                          Show more
                        </button>
                      </>
                    ) : (
                      <>
                        <p>{topComment.content}</p>
                        {topComment.content.length > COMMENT_PREVIEW_LENGTH && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCommentExpanded(false);
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium mt-1"
                          >
                            Show less
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs sm:text-sm text-gray-500 ml-2 mt-1 block flex items-center space-x-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>
                    {(() => {
                      try {
                        const date = new Date(topComment.timestamp);
                        if (isNaN(date.getTime())) {
                          return 'Invalid date';
                        }
                        return formatDistanceToNow(date, { addSuffix: false });
                      } catch (error) {
                        console.error('Error formatting date:', error);
                        return 'Invalid date';
                      }
                    })()}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Media Modal */}
        {isModalOpen && media && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-fadeIn"
            onClick={() => setIsModalOpen(false)} // Backdrop click closes modal
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal content wrapper: stop propagation so clicking inside doesn't close */}
            <div
              className="relative max-h-[90vh] max-w-[90vw] w-full flex flex-col items-center justify-center animate-scaleIn bg-transparent"
              style={{ minWidth: '320px' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Top bar: media index and close button */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center bg-black/60 px-4 py-1 rounded-full text-white font-medium tracking-wider animate-fadeIn text-sm z-10">
                {media.length > 1 && (
                  <span>{currentMediaIndex + 1} / {media.length}</span>
                )}
              </div>
            <button
                className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 z-20"
              onClick={() => setIsModalOpen(false)}
                aria-label="Close media viewer"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
              {/* Navigation arrows */}
            {media.length > 1 && (
              <>
                <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 z-20"
                  onClick={handlePrevious}
                    aria-label="Previous media"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 z-20"
                  onClick={handleNext}
                    aria-label="Next media"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </>
            )}

              {/* Media content with loading spinner */}
              <div className="flex items-center justify-center min-h-[340px] sm:min-h-[500px] max-h-[80vh] max-w-[90vw] w-full relative animate-scaleIn bg-black/0">
              {media[currentMediaIndex].type === 'image' ? (
                  <MediaWithLoader
                  src={media[currentMediaIndex].url}
                  alt={`Media ${currentMediaIndex + 1}`}
                />
              ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoWithLoader item={media[currentMediaIndex]} videoMaxHeight="calc(80vh - 80px)" />
                </div>
              )}
            </div>
              </div>
          </div>
        )}

        {/* Rating Modal */}
        {isRatingModalOpen && (
          <div className="fixed inset-0 z-50" onClick={() => setIsRatingModalOpen(false)}>
            <div className="absolute" style={{
              top: rateButtonRef.current ? rateButtonRef.current.getBoundingClientRect().top - 80 : 0,
              left: rateButtonRef.current ? rateButtonRef.current.getBoundingClientRect().left - 50 : 0,
            }}>
              <div className="relative bg-white dark:bg-dark-card rounded-lg p-2 shadow-xl border border-gray-200 dark:border-dark-border transform transition-all">
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
                        <StarIcon 
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
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <ChevronDownIcon className="w-4 h-4 text-white dark:text-dark-card" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components for media loading
const MediaWithLoader: FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <img
        src={src}
        alt={alt}
        className={`max-h-[80vh] max-w-[90vw] object-contain transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold">
          Image failed to load.
        </div>
      )}
    </div>
  );
};

const VideoWithLoader: FC<{ item: MediaItem; videoMaxHeight?: string }> = ({ item, videoMaxHeight }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <video
        src={item.url}
        poster={item.thumbnail}
        className={`max-h-[80vh] max-w-[90vw] object-contain transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        style={videoMaxHeight ? { maxHeight: videoMaxHeight, width: '100%' } : undefined}
        controls
        autoPlay
        onLoadedData={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      >
        <source src={item.url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold">
          Video failed to load.
        </div>
      )}
    </div>
  );
};

// Add fade/scaleIn animation to styles
const styles = `
  @keyframes slideDown {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  @keyframes fallingStar {
    0% {
      transform: translateY(-100vh) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .animate-scaleIn {
    animation: scaleIn 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .animate-slideDown {
    animation: slideDown 0.5s ease-out forwards;
  }
  .animate-fallingStar {
    animation: fallingStar 3s linear forwards;
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default PostCard; 