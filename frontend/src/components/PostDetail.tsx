import React, { useState, useEffect, useRef } from 'react';
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  FlagIcon,
  ArrowPathIcon,
  FaceSmileIcon,
  PaperClipIcon,
  PhotoIcon,
  LinkIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  HashtagIcon,
  PaperAirplaneIcon,
  StarIcon as StarOutlineIcon,
  ChatBubbleLeftIcon,
  PlayIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import EmojiPicker from './EmojiPicker';
import CommentCard from './CommentCard';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { extractNumericPostId } from '../utils/postId';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
  badges?: string[];
  isOnline?: boolean;
  personalityTags?: {
    name: string;
    color: string;
  }[];
}

interface Reply {
  id: number;
  comment: {
    id: number;
    post: {
      id: number;
      community: {
        slug: string;
      };
    };
  };
  author: User;
  content: string;
  created_at: string;
  updated_at: string;
  rating: number;
  total_ratings: number;
  hasRated: boolean;
  user_rating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface Comment {
  id: number;
  post: {
    id: number;
    community: {
      slug: string;
    };
  };
  author: User;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  rating: number;
  total_ratings: number;
  hasRated: boolean;
  user_rating: number | null;
  replies: Reply[];
  reply_count: number;
  is_top_comment?: boolean;
  author_role?: string;
}

interface PostMedia {
  id: number;
  type: 'image' | 'video';
  file: string;
  thumbnail?: string;
  order: number;
}

interface Topic {
  name: string;
  color?: string;
}

function isTopicObject(topic: string | Topic): topic is Topic {
  return typeof topic === 'object' && topic !== null && 'name' in topic;
}

interface Post {
  id: number;
  community: {
    id: number;
    name: string;
    slug: string;
  };
  author: User;
  author_role: string;
  title: string;
  content: string;
  is_personal: boolean;
  is_pinned: boolean;
  is_edited: boolean;
  media: PostMedia[];
  topics: (string | Topic)[];
  view_count: number;
  rating: number;
  total_ratings: number;
  comment_count: number;
  comments: Comment[];
  user_rating: number | null;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
}

// Add WebSocket types
interface WebSocketMessage {
  type: 'rating_update';
  data: {
    post_id: number;
    rating: number;
    total_ratings: number;
    user_rating: number | null;
  };
}

// Default avatar fallback
const DEFAULT_AVATAR = '/default.jpg';  // Points to frontend/public/default.jpg

// Helper function to get avatar URL with fallback
const getAvatarUrl = (avatarUrl: string | null | undefined): string => {
  if (!avatarUrl || avatarUrl === '') {
    return DEFAULT_AVATAR;
  }
  return avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_API_URL}${avatarUrl}`;
};

const PostDetail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'top' | 'newest' | 'all'>('top');
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id, type } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const slug = queryParams.get('slug');
  const { isDarkMode } = useTheme();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const rateButtonRef = useRef<HTMLButtonElement>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [showCongrats, setShowCongrats] = useState(false);
  const [fallingStars, setFallingStars] = useState<{ id: number; left: number; delay: number }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Smileys & People');
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isCommunityAdmin, setIsCommunityAdmin] = useState(false);
  const [isCommunityModerator, setIsCommunityModerator] = useState(false);
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const postMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [showFullContent, setShowFullContent] = useState(false);
  const CONTENT_PREVIEW_LENGTH = 200;

  const isPersonal = type === 'personal';
  const numericId = id;

  // Filter comments based on activeTab
  const filteredComments = React.useMemo(() => {
    if (!comments) return [];
    
    const sortedComments = [...comments];
    
    switch (activeTab) {
      case 'top':
        // Sort by rating (highest first) and then by total_ratings as a tiebreaker
        return sortedComments.sort((a, b) => {
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.total_ratings || 0) - (a.total_ratings || 0);
        });
      case 'newest':
        // Sort by creation date (newest first)
        return sortedComments.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
      case 'all':
        // Show all comments in their original order
        return sortedComments;
      default:
        return sortedComments;
    }
  }, [comments, activeTab]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('Post ID is missing');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching post:', {
          id,
          slug
        });
        
        let response;
        if (slug) {
          // Community post
          response = await axios.get(
            `${API_BASE_URL}/api/communities/${slug}/posts/${id}/`
          );
        } else {
          // Personal post
          response = await axios.get(
            `${API_BASE_URL}/api/posts/${id}/`
          );
        }

        console.log('Post API response:', response.data);

        // Workaround: reconstruct community if missing for community posts
        let community = response.data.community;
        if (slug && !community) {
          community = {
            id: null, // ID is unknown
            slug: slug,
            name: slug.charAt(0).toUpperCase() + slug.slice(1)
          };
        }

        // Transform the post data to ensure author name and personality tags are properly set
        const transformedPost = {
          ...response.data,
          author: {
            ...response.data.author,
            name: response.data.author?.first_name && response.data.author?.last_name
              ? `${response.data.author.first_name} ${response.data.author.last_name}`
              : response.data.author?.name || 'Anonymous User',
            personalityTags: Array.isArray(response.data.author?.personality_tags) 
              ? response.data.author.personality_tags.map((tag: any) => ({
                  name: typeof tag === 'string' ? tag : tag.name || '',
                  color: typeof tag === 'string' ? 'bg-purple-500 text-white' : tag.color || 'bg-purple-500 text-white'
                }))
              : []
          },
          // Ensure rating data is properly set
          rating: response.data.rating || 0,
          total_ratings: response.data.total_ratings || 0,
          user_rating: response.data.user_rating || 0,
          comment_count: response.data.comment_count || 0,
          is_personal: !slug,
          // Use reconstructed community if needed
          community: !slug ? {
            id: 'personal',
            slug: 'personal',
            name: 'Personal'
          } : community
        };

        console.log('Transformed post data:', transformedPost);
        
        setPost(transformedPost);
        setSelectedRating(transformedPost.user_rating || 0);
        setLoading(false);
        
        // Fetch comments after post is loaded
        await fetchComments();
      } catch (err) {
        console.error('Error fetching post:', err);
        if (axios.isAxiosError(err)) {
          console.error('Axios error details:', {
            status: err.response?.status,
            data: err.response?.data,
            headers: err.response?.headers
          });
          if (err.response?.status === 404) {
            setError('Post not found');
          } else {
            setError('Failed to load post. Please try again later.');
          }
        } else {
          setError('An unexpected error occurred');
        }
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, slug]);

  // Move fetchComments outside useEffect
  const fetchComments = async () => {
    if (!post) return;

    setIsLoadingComments(true);
    try {
      const isPersonal = post.is_personal;
      const numericId = extractNumericPostId(post.id);
      
      const response = await axios.get(
        isPersonal
          ? `${API_BASE_URL}/api/posts/${numericId}/comments/`
          : `${API_BASE_URL}/api/communities/${post.community?.slug}/posts/${numericId}/comments/`
      );
      
      // Transform comments to include rating data
      const transformedComments = response.data.map((comment: any) => ({
        ...comment,
        user_rating: comment.user_rating || 0,
        hasRated: comment.user_rating !== null,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          hasRated: reply.user_rating !== null,
          user_rating: reply.user_rating || 0
        }))
      }));
      
      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments. Please try again.');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Add effect to refetch comments when post changes
  useEffect(() => {
    if (post) {
      fetchComments();
    }
  }, [post?.id]);

  // Update checkSavedStatus to handle missing endpoint
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!post) return;

      try {
        const numericId = extractNumericPostId(post.id);
        // Temporarily disable saved posts check until API is implemented
        setIsSaved(false);
      } catch (error) {
        console.error('Error checking saved status:', error);
        setIsSaved(false);
      }
    };

    checkSavedStatus();
  }, [post]);

  // Update fetchMemberRole to handle missing endpoint
  useEffect(() => {
    const fetchMemberRole = async () => {
      if (!post?.community?.slug || !user?.id) return;
      
      try {
        // Temporarily set default roles until API is implemented
        setIsCommunityAdmin(false);
        setIsCommunityModerator(false);
      } catch (error) {
        console.error('Error fetching member role:', error);
        setIsCommunityAdmin(false);
        setIsCommunityModerator(false);
      }
    };

    fetchMemberRole();
  }, [post?.community?.slug, user?.id]);

  // Update refreshToken to handle missing endpoints
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.error('No refresh token found');
        return null;
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
        refresh: refreshToken
      });

      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        return response.data.access;
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  // WebSocket connection setup
  useEffect(() => {
    let isComponentMounted = true;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const MAX_RECONNECT_DELAY = 30000; // 30 seconds

    const connectWebSocket = async () => {
      if (!post || !isComponentMounted) return;

      try {
        const token = await refreshToken();
        if (!token) {
          console.error('No token available for WebSocket connection');
          return;
        }

        const numericId = extractNumericPostId(post.id);
        const wsUrl = post.is_personal
          ? `${import.meta.env.VITE_API_URL.replace(/^http/, 'ws')}/ws/personal/posts/${numericId}/?token=${token}`
          : `${import.meta.env.VITE_API_URL.replace(/^http/, 'ws')}/ws/community/posts/${numericId}/?token=${token}`;

        console.log('Connecting to WebSocket:', {
          url: wsUrl,
          postId: numericId,
          isPersonal: post.is_personal,
          token: token ? 'present' : 'missing'
        });

        // Close existing connection if any
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isComponentMounted) {
            ws.close();
            return;
          }
          console.log('WebSocket connected successfully', {
            readyState: ws.readyState,
            url: wsUrl
          });
          setWsConnected(true);
          reconnectAttempts = 0;
        };

        ws.onclose = (event) => {
          if (!isComponentMounted) return;

          console.log('WebSocket disconnected:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            url: wsUrl
          });
          setWsConnected(false);

          // Only attempt to reconnect if the component is still mounted
          // and we haven't exceeded max attempts
          if (isComponentMounted && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`, {
              url: wsUrl,
              code: event.code,
              reason: event.reason
            });
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isComponentMounted) {
                reconnectAttempts += 1;
                connectWebSocket();
              }
            }, delay);
          }
        };

        ws.onerror = (error) => {
          if (!isComponentMounted) return;

          console.error('WebSocket error:', {
            error,
            url: wsUrl,
            readyState: ws.readyState
          });
          setWsConnected(false);
        };

        ws.onmessage = (event) => {
          if (!isComponentMounted) return;

          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            // Handle different message types
            switch (data.type) {
              case 'comment_added':
              case 'comment_updated':
              case 'comment_deleted':
                // Refresh comments when there are changes
                fetchComments();
                break;
              case 'error':
                console.error('WebSocket error message:', data.message);
                break;
              default:
                console.log('Unhandled WebSocket message type:', data.type);
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Error setting up WebSocket connection:', error);
        setWsConnected(false);
      }
    };

    // Connect to WebSocket when component mounts
    connectWebSocket();

    // Cleanup function
    return () => {
      isComponentMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [post, fetchComments]); // Add fetchComments to dependency array

  // Add click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const renderStarRating = (rating: number | null | undefined) => {
    // Ensure rating is a number and within valid range
    const validRating = typeof rating === 'number' ? Math.min(Math.max(rating, 0), 5) : 0;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-400">
            {star <= Math.floor(validRating) ? (
              <StarIconSolid className="w-5 h-5" />
            ) : star - 0.5 <= validRating ? (
              <div className="relative">
                <StarIcon className="w-5 h-5" />
                <StarIconSolid className="w-5 h-5 absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }} />
              </div>
            ) : (
              <StarIcon className="w-5 h-5" />
            )}
          </span>
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{validRating.toFixed(1)}</span>
      </div>
    );
  };

  // Helper for formatting counts
  const formatCount = (count: number): string => {
    if (!count) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return count.toString();
  };

  const handleRateClick = () => setIsRatingModalOpen(true);
  const handleStarHover = (rating: number) => setHoverRating(rating);
  const handleStarClick = async (rating: number) => {
    if (!post) {
      toast.error('Post data is not available');
      return;
    }

    try {
      console.log('Attempting to rate post:', {
        postId: post.id,
        isPersonal: post.is_personal,
        rating,
        currentRating: selectedRating
      });

      // Get the numeric ID from the post ID
      const numericId = extractNumericPostId(post.id);

      // If clicking the same rating or zero, unrate
      if (rating === selectedRating || rating === 0) {
        console.log('Unrating post...');
        await axios.delete(
          post.is_personal
            ? `${API_BASE_URL}/api/posts/${numericId}/rate/`
            : `${API_BASE_URL}/api/communities/${post.community.slug}/posts/${numericId}/rate/`
        );
        setPost(prev => {
          if (!prev) return null;
          return {
            ...prev,
            rating: 0,
            total_ratings: prev.total_ratings > 0 ? prev.total_ratings - 1 : 0,
            user_rating: 0
          };
        });
        setSelectedRating(0);
        setIsRatingModalOpen(false);
        return;
      }

      console.log('Rating post...');
      const response = await axios.post(
        post.is_personal
          ? `${API_BASE_URL}/api/posts/${numericId}/rate/`
          : `${API_BASE_URL}/api/communities/${post.community.slug}/posts/${numericId}/rate/`,
        { rating }
      );
      console.log('Rate response:', response.data);
      
      setPost(prev => {
        if (!prev) return null;
        const postData = response.data.post || response.data;
        console.log('Updating post with rate data:', postData);
        return {
          ...prev,
          rating: postData.rating ?? prev.rating,
          total_ratings: postData.total_ratings ?? prev.total_ratings,
          user_rating: postData.user_rating ?? prev.user_rating
        };
      });
      setSelectedRating(rating);
      setIsRatingModalOpen(false);

      // Show congratulations for ratings of 3 or more
      if (rating >= 3) {
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
    } catch (error) {
      console.error('Error saving rating:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        toast.error(error.response?.data?.detail || 'Failed to save rating. Please try again.');
      } else {
        toast.error('Failed to save rating. Please try again.');
      }
    }
  };

  // Add connection status indicator
  const renderConnectionStatus = () => {
    if (!wsConnected) {
      return (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Connection lost. Please refresh the page.
        </div>
      );
    }
    return null;
  };

  const handleCommentSubmit = async (content: string, commentId?: number, parentReplyId?: number) => {
    if (!post || !user) return;
    
    setIsSubmitting(true);
    try {
      const numericId = extractNumericPostId(post.id);
      let baseUrl = '';

      if (post.is_personal) {
        baseUrl = `${API_BASE_URL}/api/posts/${numericId}`;
      } else if (post.community && post.community.slug) {
        baseUrl = `${API_BASE_URL}/api/communities/${post.community.slug}/posts/${numericId}`;
      } else {
        console.error('Community information is missing in post:', post);
        toast.error('Community information is missing for this post.');
        setIsSubmitting(false);
        return;
      }

      let response;
      if (parentReplyId) {
        // Handle nested reply
        response = await axios.post(`${baseUrl}/comments/${commentId}/replies/`, {
          content: content.trim(),
          parent_reply: parentReplyId,
          comment: commentId
        });
      } else if (commentId) {
        // Handle reply to comment
        response = await axios.post(`${baseUrl}/comments/${commentId}/replies/`, {
          content: content.trim(),
          comment: commentId
        });
      } else {
        // Handle new comment
        response = await axios.post(`${baseUrl}/comments/`, {
          content: content.trim(),
          post: numericId
        });
      }
      
      // Show success message
      toast.success(parentReplyId ? 'Reply posted successfully!' : commentId ? 'Reply posted successfully!' : 'Comment posted successfully!');
      
      // Clear the input
      setNewComment('');
      
      // Refresh comments and update post
      const [commentsResponse, postResponse] = await Promise.all([
        axios.get(`${baseUrl}/comments/`),
        axios.get(`${baseUrl}/`)
      ]);

      // Update post with new comment count
      setPost(prev => prev ? {
        ...prev,
        comment_count: postResponse.data.comment_count
      } : null);

      // Update comments with actual data from backend
      setComments(commentsResponse.data);
    } catch (error) {
      console.error('Error posting comment/reply:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        toast.error(error.response?.data?.detail || 'Failed to post. Please try again.');
      } else {
        toast.error('Failed to post. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaClick = (index: number) => {
    setCurrentMediaIndex(index);
    setIsModalOpen(true);
  };

  const handlePrevious = () => {
    setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + post?.media.length!) % post?.media.length!);
  };

  const handleNext = () => {
    setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % post?.media.length!);
  };

  const handleReplyDelete = (commentId: number, replyId: number) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: comment.replies?.filter(reply => reply.id !== replyId)
          };
        }
        return comment;
      })
    );
  };

  // Update handleSavePost to handle missing endpoint
  const handleSavePost = async () => {
    if (!post) return;

    try {
      // Temporarily toggle saved state locally until API is implemented
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Post unsaved' : 'Post saved');
    } catch (error) {
      console.error('Error saving/unsaving post:', error);
      toast.error('Failed to save post. Please try again.');
    }
  };

  // Helper to map role to label and color
  const getRoleBadge = (role: string | null | undefined) => {
    if (!role) return null;
    const roleMap: Record<string, { label: string; color: string }> = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
      moderator: { label: 'Moderator', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
      member: { label: 'Member', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
    };
    const { label, color } = roleMap[role] || { label: role.charAt(0).toUpperCase() + role.slice(1), color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/20 dark:text-gray-300' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{label}</span>
    );
  };

  // Click outside to close post menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setShowPostMenu(false);
      }
    };
    if (showPostMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPostMenu]);

  // Delete post handler
  const handleDeletePost = async () => {
    if (!post) return;
    try {
      const numericId = extractNumericPostId(post.id);
      let url = '';
      if (post.is_personal) {
        url = `${API_BASE_URL}/api/posts/${numericId}/`;
      } else {
        url = `${API_BASE_URL}/api/communities/${post.community.slug}/posts/${numericId}/`;
      }
      await axios.delete(url);
      toast.success('Post deleted successfully');
      setShowDeleteModal(false);
      // Redirect after delete
      if (post.is_personal) {
        navigate('/dashboard');
      } else {
        navigate(`/communities/${post.community.slug}`);
      }
    } catch (error) {
      toast.error('Failed to delete post.');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg transition-colors duration-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg transition-colors duration-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {error || 'Post not found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please try again later or check if the post exists.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getTabButtonClass = (tabName: 'top' | 'newest' | 'all') => {
    return `px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-1.5 ${
      activeTab === tabName 
        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
        : 'bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-card-hover hover:border-gray-300 dark:hover:border-gray-600'
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg transition-colors duration-200 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-20">
              <Navigation />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Post Card */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Post Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={getAvatarUrl(post.author.avatar)}
                        alt={post.author.name}
                        className="w-12 h-12 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== DEFAULT_AVATAR) {
                            target.src = DEFAULT_AVATAR;
                          }
                        }}
                      />
                      {post.author.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-card"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{post.author.name}</h3>
                        {post.author.badges?.map((badge, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full"
                          >
                            {badge}
                          </span>
                        ))}
                        {post.author.personalityTags && post.author.personalityTags.length > 0 && (
                          <>
                            {post.author.personalityTags.map((tag, index) => (
                              <span
                                key={index}
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${tag.color}`}
                                style={{ backgroundColor: tag.color.startsWith('#') ? tag.color : undefined }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {!post.is_personal && getRoleBadge(post.author_role)}
                        {!post.is_personal && <span>•</span>}
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative" ref={postMenuRef}>
                    <button
                      className="p-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      onClick={() => setShowPostMenu((v) => !v)}
                    >
                      <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                    {showPostMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border py-1 z-50">
                        {(Number(user?.id) === Number(post.author.id) || isCommunityAdmin || isCommunityModerator) && (
                          <button
                            onClick={() => { setShowDeleteModal(true); setShowPostMenu(false); }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 rounded-lg"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete Post
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Title & Content */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">{post.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {showFullContent || !post.content || post.content.length <= CONTENT_PREVIEW_LENGTH
                    ? post.content
                    : `${post.content.slice(0, CONTENT_PREVIEW_LENGTH)}...`}
                </p>
                {post.content && post.content.length > CONTENT_PREVIEW_LENGTH && (
                  <button
                    className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium mt-1"
                    onClick={() => setShowFullContent((v) => !v)}
                  >
                    {showFullContent ? 'View Less' : 'View More'}
                  </button>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {post?.topics?.map((topic) => {
                    const topicName = isTopicObject(topic) ? topic.name : topic;
                    const topicColor = isTopicObject(topic) ? (topic.color || 'bg-purple-100 border border-purple-300 text-purple-800 dark:bg-gray-800 dark:text-gray-200') : 'bg-purple-100 border border-purple-300 text-purple-800 dark:bg-gray-800 dark:text-gray-200';
                    return (
                      <span
                        key={topicName}
                        className={`px-3 py-1 ${topicColor} rounded-full text-sm hover:bg-purple-200 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
                      >
                        #{topicName}
                      </span>
                    );
                  }) || []}
                </div>

                {/* Media */}
                {post?.media && post.media.length > 0 && (
                  <div className={`grid ${
                    post.media.length === 1 ? 'grid-cols-1' : 
                    post.media.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
                    'grid-cols-1 sm:grid-cols-2'
                  } gap-2 sm:gap-3 mt-4`}>
                    {post.media.slice(0, 4).map((item, index) => (
                      <div 
                        key={item.id} 
                        className={`rounded-lg overflow-hidden ${
                          post.media.length === 1 ? 'max-h-[300px] sm:max-h-[500px]' : 'max-h-[250px] sm:max-h-[300px]'
                        } cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative group`}
                        onClick={() => handleMediaClick(index)}
                      >
                        {item.type === 'image' ? (
                          <>
                            <img 
                              src={item.file} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {/* Show +X indicator on the last visible image */}
                            {index === 3 && post.media.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">
                                  +{post.media.length - 4}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="relative w-full h-full bg-black">
                            <video 
                              src={item.file}
                              className="w-full h-full object-contain"
                              poster={item.thumbnail}
                              controls
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <PlayIcon className="w-12 h-12 text-white" />
                            </div>
                            {/* Show +X indicator on the last visible video */}
                            {index === 3 && post.media.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">
                                  +{post.media.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Media Modal */}
                {isModalOpen && post?.media && (
                  <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                    <button
                      className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                    
                    {post.media.length > 1 && (
                      <>
                        <button
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                          onClick={handlePrevious}
                        >
                          <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                          onClick={handleNext}
                        >
                          <ChevronRightIcon className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    <div className="max-h-[90vh] max-w-[90vw] relative animate-scaleIn">
                      {post.media[currentMediaIndex].type === 'image' ? (
                        <img
                          src={post.media[currentMediaIndex].file}
                          alt={`Media ${currentMediaIndex + 1}`}
                          className="max-h-[90vh] max-w-[90vw] object-contain"
                        />
                      ) : (
                        <video
                          src={post.media[currentMediaIndex].file}
                          controls
                          className="max-h-[90vh] max-w-[90vw]"
                          poster={post.media[currentMediaIndex].thumbnail}
                        />
                      )}
                    </div>

                    {post.media.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white font-medium tracking-wider animate-fadeIn">
                        {currentMediaIndex + 1} / {post.media.length}
                      </div>
                    )}
                  </div>
                )}

                {/* Post Stats */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-yellow-400">
                            {star <= Math.floor(Number(selectedRating) || 0) ? (
                              <StarIconSolid className="w-5 h-5" />
                            ) : star - 0.5 <= (Number(selectedRating) || 0) ? (
                              <div className="relative">
                                <StarIcon className="w-5 h-5" />
                                <StarIconSolid className="w-5 h-5 absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }} />
                              </div>
                            ) : (
                              <StarOutlineIcon className="w-5 h-5" />
                            )}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{(Number(post?.rating) || 0).toFixed(1)}</span>
                      <button
                        ref={rateButtonRef}
                        onClick={handleRateClick}
                        className="ml-2 px-4 py-2 text-sm bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full transition-colors flex items-center space-x-2"
                      >
                        <StarIconSolid className={`w-5 h-5 ${post.user_rating ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <span>Rate</span>
                        <span className="text-xs bg-purple-100 dark:bg-purple-800/50 px-1.5 py-0.5 rounded-full">
                          {formatCount(post?.total_ratings)}
                        </span>
                      </button>
                    </div>
                    <button className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full transition-colors flex items-center space-x-1">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span className="text-xs bg-blue-100 dark:bg-blue-800/50 px-1.5 py-0.5 rounded-full">
                        {post?.comment_count}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700">
                      <BookmarkIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700">
                      <ShareIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700">
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                      <StarIcon className="w-5 h-5" />
                      Rate
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      Comment
                    </button>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                    <FlagIcon className="w-5 h-5" />
                    Report
                  </button>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-6 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comments</h2>
                    <span className="px-2.5 py-0.5 text-sm font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full">
                      {formatCount(comments.length)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className={getTabButtonClass('top')}
                      onClick={() => setActiveTab('top')}
                    >
                      <StarIcon className={`w-4 h-4 ${activeTab === 'top' ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                      Top
                    </button>
                    <button 
                      className={getTabButtonClass('newest')}
                      onClick={() => setActiveTab('newest')}
                    >
                      <ClockIcon className={`w-4 h-4 ${activeTab === 'newest' ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                      Newest
                    </button>
                    <button 
                      className={getTabButtonClass('all')}
                      onClick={() => setActiveTab('all')}
                    >
                      <ChatBubbleLeftRightIcon className={`w-4 h-4 ${activeTab === 'all' ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                      All
                    </button>
                  </div>
                </div>

                {/* Comment Input */}
                <div className="flex items-start gap-4 mb-8">
                  <img
                    src={getAvatarUrl(post.author.avatar)}
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full ring-2 ring-purple-500 dark:ring-purple-400"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== DEFAULT_AVATAR) {
                        target.src = DEFAULT_AVATAR;
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200">
                      <textarea
                        placeholder="Share your thoughts..."
                        className="w-full px-6 py-4 text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-dark-card border-none focus:outline-none resize-none text-base"
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={isSubmitting}
                      ></textarea>
                      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex items-center gap-2">
                          <div className="relative" ref={emojiPickerRef}>
                            <button 
                              className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 shadow-sm"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              disabled={isSubmitting}
                            >
                              <FaceSmileIcon className="w-5 h-5" />
                            </button>
                            {showEmojiPicker && (
                              <div className="fixed transform -translate-y-full -translate-x-1/2 left-1/2 bottom-0 z-[9999]">
                                <div className="mb-2">
                                  <EmojiPicker onEmojiSelect={handleEmojiSelect} isDarkMode={isDarkMode} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCommentSubmit(newComment, 0)}
                          disabled={isSubmitting || !newComment.trim()}
                          className={`relative px-6 py-2.5 text-sm font-medium text-white rounded-xl transition-all overflow-hidden group shadow-sm ${
                            (isSubmitting || !newComment.trim()) 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-100 group-hover:opacity-90 transition-opacity" />
                          <span className="relative flex items-center gap-2">
                            {isSubmitting ? (
                              <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <PaperAirplaneIcon className="w-4 h-4" />
                                Post Comment
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="mt-6 space-y-6">
                  {isLoadingComments ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredComments.length > 0 ? (
                    filteredComments.map((comment) => (
                      <CommentCard
                        key={comment.id}
                        comment={{
                          ...comment,
                          user_rating: comment.user_rating || 0,
                          hasRated: comment.user_rating !== null,
                          replies: comment.replies?.map(reply => ({
                            ...reply,
                            comment: {
                              id: comment.id,
                              post: {
                                id: comment.post.id,
                                community: {
                                  slug: comment.post.community.slug
                                }
                              }
                            },
                            hasRated: reply.user_rating !== null,
                            user_rating: reply.user_rating || 0,
                            sentiment: 'neutral' // Default sentiment if not provided
                          }))
                        }}
                        onReply={(content, commentId, parentReplyId) => handleCommentSubmit(content, commentId, parentReplyId)}
                        onDelete={(commentId) => {
                          setComments(prevComments => prevComments.filter(c => c.id !== commentId));
                        }}
                        onReplyDelete={(commentId, replyId) => handleReplyDelete(commentId, replyId)}
                        isCommunityAdmin={isCommunityAdmin}
                        isCommunityModerator={isCommunityModerator}
                        onRatingChange={(commentId, rating) => {
                          setComments(prevComments => prevComments.map(c =>
                            c.id === commentId
                              ? { ...c, user_rating: rating, hasRated: true, rating: rating, total_ratings: c.total_ratings } // Optionally update total_ratings if available
                              : c
                          ));
                        }}
                        onReplyRatingChange={(commentId, replyId, rating) => {
                          setComments(prevComments => prevComments.map(c => {
                            if (c.id === commentId) {
                              return {
                                ...c,
                                replies: c.replies?.map(r =>
                                  r.id === replyId
                                    ? { ...r, user_rating: rating, hasRated: true, rating: rating, total_ratings: r.total_ratings }
                                    : r
                                )
                              };
                            }
                            return c;
                          }));
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-20 space-y-6">
              {/* Engagement Stats */}
              <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Engagement</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Engagement</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{post.view_count + post.comment_count + post.total_ratings}</span>
                        <span className="text-green-500 text-sm">+{Math.round((post.view_count / (post.view_count + post.comment_count + post.total_ratings)) * 100)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <div 
                        className="h-2 bg-purple-500 rounded-full"
                        style={{ width: `${Math.round((post.view_count / (post.view_count + post.comment_count + post.total_ratings)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <ChartBarIcon className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{post.view_count}</span>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <UserGroupIcon className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Unique</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{Math.round(post.view_count * 0.7)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <button 
                    className={`w-full flex items-center gap-2 px-4 py-2 ${
                      isSaved 
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/40' 
                        : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover hover:text-gray-700 dark:hover:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } rounded-lg transition-all border`}
                    onClick={handleSavePost}
                  >
                    <BookmarkIcon className={`w-5 h-5 ${isSaved ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                    {isSaved ? 'Saved' : 'Save for Later'}
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                    <LinkIcon className="w-5 h-5" />
                    Copy Link
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                    <FlagIcon className="w-5 h-5" />
                    Report Post
                  </button>
                </div>
              </div>

              {/* Post Analytics */}
              <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytics</h2>
                  <button className="p-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                    <ArrowPathIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Time Spent</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">2m 34s</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <HashtagIcon className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Top Tag</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      #{isTopicObject(post?.topics?.[0]) ? post.topics[0].name : post?.topics?.[0] || 'AI'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserGroupIcon className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {Math.round((post.comment_count / post.view_count) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {isRatingModalOpen && post && (
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
                    onMouseLeave={() => handleStarHover(post?.user_rating || 0)}
                    onClick={() => handleStarClick(0)}
                  >
                    <span className={`text-sm font-medium ${post?.user_rating === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>0</span>
                  </button>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="p-0.5 transition-transform hover:scale-110"
                      onMouseEnter={() => handleStarHover(star)}
                      onMouseLeave={() => handleStarHover(post?.user_rating || 0)}
                      onClick={() => handleStarClick(star)}
                    >
                      {star <= (hoverRating || (post?.user_rating || 0)) ? (
                        <StarIconSolid className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-6 h-6 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hoverRating === 0 ? 'Unrate' : hoverRating ? `Rate ${hoverRating} stars` : post?.user_rating ? `Your rating: ${post.user_rating} stars` : 'Select your rating'}
                </p>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <ChevronDownIcon className="w-4 h-4 text-white dark:text-dark-card" />
              </div>
            </div>
          </div>
        </div>
      )}
      {renderConnectionStatus()}

      {/* Delete Post Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-xl border border-gray-200 dark:border-dark-border w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Delete Post?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeletePost}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail; 