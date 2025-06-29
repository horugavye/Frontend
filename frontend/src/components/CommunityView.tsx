import { FC, useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  SparklesIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BellIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BookmarkIcon,
  PencilIcon,
  FlagIcon,
  GlobeAltIcon,
  HashtagIcon,
  UserIcon,
  RocketLaunchIcon,
  ArrowTrendingUpIcon,
  FireIcon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  SpeakerXMarkIcon,
  SpeakerWaveIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  UserPlusIcon,
  EnvelopeIcon,
  FlagIcon as FlagIconSolid,
  ShieldExclamationIcon,
  UserMinusIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Navigation from './Navigation';
import api from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';
import UpdateCommunityModal from './UpdateCommunityModal';
import { toast } from 'react-hot-toast';
import CreatePostModal from './CreatePostModal';
import PostCard from './PostCard';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { PersonalityTag } from '../types';

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatarUrl: string;
    personalityTags: {
      name: string;
      color: string;
    }[];
    role: string;
    username: string;
  };
  author_role: string;  // Add this new field
  isPersonal?: boolean;
  timestamp: string;
  rating: number;
  totalRatings: number;
  commentCount: number;
  tags: PersonalityTag[];
  media?: MediaItem[];
  topComment?: Comment;
  userRating: number; // Add user's rating
}

interface Member {
  id: string;
  user_id: string;
  name: string;
  username: string;
  avatarUrl: string;
  personalityTags: {
    name: string;
    color: string;
  }[];
  role: 'admin' | 'moderator' | 'member';
  joinDate: string;
  contributions: number;
  badges: string[];
  isOnline: boolean;
  workplace: string;
  connectionStatus: 'connect' | 'pending' | 'accepted' | 'rejected' | 'canceled' | 'connected';
  status: 'suggested' | 'pending' | 'accepted' | 'rejected';
  connectionRequestId?: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'discussion' | 'ama' | 'challenge';
  participants: number;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  alt?: string;
}

interface Friend {
  id: string;
  user_id?: string;  // Make user_id optional
  name: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
  workplace?: string;
  role?: string;
  personalityTags?: Array<{
    name: string;
    color: string;
  }>;
  email?: string;
}

interface CreateCommunityData {
  name: string;
  description: string;
  icon?: File | null;
  banner?: File | null;
  isPrivate: boolean;
  topics: string[];
  rules: string[];
  category: string;
  isNewCategory: boolean;
  newCategory?: string;
}

interface CommunityData {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  banner: string | null;
  category: string;
  category_display: string;
  topics: string[];
  rules: string[];
  total_members: number;
  members_count: number;
  active_members: number;
  activity_score: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  is_member: boolean;
  member_role: string | null;
  online_count: number;
  stats: {
    posts_today: number;
    active_discussions: number;
    avg_rating: number;
  };
}

interface Community {
  id: string | undefined;
  name: string;
  description: string;
  bannerUrl: string;
  members: number;
  online: number;
  createdAt: string;
  category: string;
  topics: string[];
  rules: string[];
  stats: {
    postsToday: number;
    activeDiscussions: number;
    avgRating: number;
  };
  isPrivate: boolean;
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
    personalityTags: {
      name: string;
      color: string;
    }[];
    username: string;
  };
  content: string;
  timestamp: string;
  replies: any[];
  is_top_comment: boolean;
  rating: number;
  ratingCount: number;
  hasRated: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const VideoPlayer: FC<{ item: MediaItem }> = ({ item }): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, [videoRef.current]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="relative group w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        ref={videoRef}
        src={item.url}
        poster={item.thumbnail}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        muted={isMuted}
        loop
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Custom Video Controls */}
      <div className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${isHovered || isPlaying ? 'opacity-100' : 'opacity-0'}`}>
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
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="w-4 h-4" />
              ) : (
                <SpeakerWaveIcon className="w-4 h-4" />
              )}
            </button>
            <span className="text-white text-sm">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommunityView: FC = (): JSX.Element => {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'members' | 'events' | 'settings'>('posts');
  const [sortBy, setSortBy] = useState<'trending' | 'new' | 'top'>('trending');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<string | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [communityName, setCommunityName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | JSX.Element | null>(null);
  const [communityIcon, setCommunityIcon] = useState<string | null>(null);
  const [communityBanner, setCommunityBanner] = useState<string | null>(null);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [showAllAdmins, setShowAllAdmins] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [communityData, setCommunityData] = useState<CommunityData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(() => {
    const saved = localStorage.getItem('communityInviteModalOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(() => {
    const saved = localStorage.getItem('communityInviteEmail');
    return saved ? JSON.parse(saved) : '';
  });
  const [inviteMessage, setInviteMessage] = useState(() => {
    const saved = localStorage.getItem('communityInviteMessage');
    return saved ? JSON.parse(saved) : '';
  });
  const [inviteRole, setInviteRole] = useState<'member' | 'moderator'>(() => {
    const saved = localStorage.getItem('communityInviteRole');
    return saved ? JSON.parse(saved) : 'member';
  });
  const [inviteTemplate, setInviteTemplate] = useState(() => {
    const saved = localStorage.getItem('communityInviteTemplate');
    return saved ? JSON.parse(saved) : 'default';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Array<{id?: string, email: string, name?: string, username?: string}>>(() => {
    const saved = localStorage.getItem('communitySelectedRecipients');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    role: '',
    skills: [] as string[],
    location: '',
    experience: ''
  });
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const [isChangingRole, setIsChangingRole] = useState<string | null>(null);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<Array<{id: string, name: string, username: string}>>([]);
  const [allFriends, setAllFriends] = useState<Array<{id: string, name: string, username: string, avatar?: string}>>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  // Add new state for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'leave' | 'delete' | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const MAX_RECONNECT_ATTEMPTS = 5;
  const reconnectAttemptsRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const rateButtonRef = useRef<HTMLButtonElement>(null);
  const [currentPostId, setCurrentPostId] = useState<string>('');
  const [showCongrats, setShowCongrats] = useState(false);
  const [fallingStars, setFallingStars] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  const getTopicColor = (topic: string): string => {
    // Light mode: light gradient with purple text; Dark mode: purple-pink gradient with white text
    return 'bg-gradient-to-r from-purple-50 via-pink-50 to-white text-purple-600 border border-purple-200 dark:bg-gradient-to-r dark:from-purple-900 dark:via-purple-700 dark:to-pink-900 dark:text-white dark:border-purple-700/40';
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath || avatarPath.trim() === '') {
      return '/default.jpg';
    }
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
    return `${API_BASE_URL}/media/${cleanPath}`;
  };

  const getMediaUrl = (mediaPath: string | null) => {
    if (!mediaPath) return '';
    
    // If it's already a full URL, return it as is
    if (mediaPath.startsWith('http')) {
      return mediaPath;
    }

    // Remove any leading slashes
    const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
    
    // Construct the full URL
    return `${API_BASE_URL}/media/${cleanPath}`;
  };

  // Add this new function after the getAvatarUrl function
  const processMemberData = (member: any): Member => {
    return {
      id: member.id,
      user_id: member.user.id,
      name: member.user.first_name && member.user.last_name 
        ? `${member.user.first_name} ${member.user.last_name}`
        : member.user.username,
      username: member.user.username,
      avatarUrl: member.avatar,
      role: member.role,
      joinDate: member.joined_at,
      contributions: member.contributions,
      isOnline: member.is_active,
      workplace: member.user.workplace || 'Works at Superlink',
      personalityTags: member.user.personality_tags?.map((tag: any) => ({
        name: tag.name,
        color: tag.color || '#6366f1' // Default to indigo if no color provided
      })) || [],
      badges: member.user.badges || [],
      connectionStatus: member.connectionStatus || 'connect',
      status: member.status || 'suggested',
      connectionRequestId: member.connectionRequestId
    };
  };

  // Add this new function to fetch members
  const fetchMembers = async () => {
    if (!slug) return;
    
    try {
      console.log('[Frontend] Fetching members from:', `${API_ENDPOINTS.COMMUNITIES}/${slug}/members/`);
      const membersResponse = await api.get(`${API_ENDPOINTS.COMMUNITIES}/${slug}/members/`);
      console.log('[Frontend] Members API response:', membersResponse.data);
      
      if (membersResponse.data && Array.isArray(membersResponse.data)) {
        const membersData = membersResponse.data.map(processMemberData);
        console.log('[Frontend] Processed members data:', membersData);
        setMembers(membersData);
        setMembersCount(membersData.length);
      }
    } catch (error) {
      console.error('[Frontend] Error fetching members:', error);
      toast.error('Failed to load members');
    }
  };

  // Debug log when component mounts
  useEffect(() => {
    console.log('=== CommunityView Component Mount ===');
    console.log('Current slug:', slug);
    
    // Fetch current user data
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/profile/');
        console.log('[Frontend] Current user data:', response.data);
        setCurrentUser(response.data);
      } catch (error) {
        console.error('[Frontend] Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, [slug]);

  useEffect(() => {
    const fetchCommunityName = async () => {
      // Debug logs
      console.log('=== API Request Debug ===');
      console.log('API_ENDPOINTS.COMMUNITIES:', API_ENDPOINTS.COMMUNITIES);
      console.log('Current slug:', slug);
      
      if (!slug) {
        console.log('No slug found in URL');
        setError('No community specified');
        setIsLoading(false);
        return;
      }

      const apiUrl = `${API_ENDPOINTS.COMMUNITIES}/${slug}`;
      console.log('Full API URL:', apiUrl);
      
      try {
        setIsLoading(true);
        setError(null);
        console.log('Making API request to:', apiUrl);
        
        // Make the API request
        const response = await api.get(apiUrl);
        console.log('=== API Response Data ===');
        console.log('Full response:', response);
        console.log('Response data:', response.data);
        
        if (response.data) {
          console.log('Setting community data:', {
            name: response.data.name,
            icon: response.data.icon,
            banner: response.data.banner
          });
          setCommunityName(response.data.name);
          setCommunityIcon(response.data.icon || null);
          setCommunityBanner(response.data.banner || null);
          setCommunityData(response.data);
          
          // Calculate total members count from all member types
          console.log('[Frontend] Full API response data:', response.data);
          console.log('[Frontend] Raw total_members field:', response.data.total_members);
          console.log('[Frontend] Member stats:', response.data.member_stats);
          
          // First try to get the count from the API response
          let totalMembers = response.data.total_members;
          
          // If not available, try to calculate from member stats
          if (!totalMembers && response.data.member_stats) {
            totalMembers = (response.data.member_stats.admins || 0) +
                          (response.data.member_stats.moderators || 0) +
                          (response.data.member_stats.members || 0);
          }
          
          // If still not available, use 0 as fallback
          if (!totalMembers) {
            totalMembers = 0;
          }
          
          console.log('[Frontend] Calculated total members count:', totalMembers);
          setMembersCount(totalMembers);

          // Fetch members using the new function
          await fetchMembers();
        } else {
          console.error('No data found in response:', response.data);
          setError('Invalid community data received');
        }
      } catch (error: any) {
        console.error('=== API Error ===');
        console.error('Error details:', error);
        setError('Failed to load community data');
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
        }
      } finally {
        setIsLoading(false);
      }
    };

    console.log('useEffect triggered with slug:', slug);
    fetchCommunityName();
  }, [slug]);

  // Debug log for community name changes
  useEffect(() => {
    console.log('Community name updated:', communityName);
  }, [communityName]);

  // Debug log for members count changes
  useEffect(() => {
    console.log('[Frontend] Members count updated:', membersCount);
  }, [membersCount]);

  const getCommunityIconUrl = (iconPath: string | null) => {
    // Return fallback if no icon path provided
    if (!iconPath) {
      return '/default_community_icon.png';
    }
    
    // Return fallback if icon path is empty string
    if (iconPath.trim() === '') {
      return '/default_community_icon.png';
    }
    
    // Handle external URLs
    if (iconPath.startsWith('http')) {
      return iconPath;
    }
    
    // Handle relative paths
    const cleanPath = iconPath.startsWith('/') ? iconPath.substring(1) : iconPath;
    return `${API_BASE_URL}/media/${cleanPath}`;
  };

  const getCommunityBannerUrl = (bannerPath: string | null) => {
    // Return fallback if no banner path provided
    if (!bannerPath) {
      return '/default_community_banner.png';
    }
    
    // Return fallback if banner path is empty string
    if (bannerPath.trim() === '') {
      return '/default_community_banner.png';
    }
    
    // Handle external URLs
    if (bannerPath.startsWith('http')) {
      return bannerPath;
    }
    
    // Handle relative paths
    const cleanPath = bannerPath.startsWith('/') ? bannerPath.substring(1) : bannerPath;
    return `${API_BASE_URL}/media/${cleanPath}`;
  };

  // Mock data for the community
  const community: Community = {
    id: slug,
    name: isLoading ? 'Loading...' : error ? 'Error loading community' : communityName,
    description: communityData?.description || 'Loading community description...',
    bannerUrl: getCommunityBannerUrl(communityData?.banner || null),
    members: membersCount,
    online: communityData?.online_count || 0,
    createdAt: communityData?.created_at || '2023-01-15',
    category: communityData?.category_display || 'Technology',
    topics: communityData?.topics || ['Machine Learning', 'Neural Networks', 'AI Ethics', 'Deep Learning', 'Computer Vision'],
    rules: communityData?.rules || [
      'Be respectful and constructive in discussions',
      'No self-promotion without prior approval',
      'Keep content relevant to AI and technology',
      'Properly tag posts with appropriate flairs',
      'Credit sources when sharing research or articles'
    ],
    stats: {
      postsToday: communityData?.stats?.posts_today || 45,
      activeDiscussions: communityData?.stats?.active_discussions || 12,
      avgRating: communityData?.stats?.avg_rating || 4.5
    },
    isPrivate: communityData?.is_private || false
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-400">
            {star <= Math.floor(rating) ? (
              <StarIconSolid className="w-5 h-5" />
            ) : star - 0.5 <= rating ? (
              <div className="relative">
                <StarIcon className="w-5 h-5" />
                <StarIconSolid className="w-5 h-5 absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }} />
              </div>
            ) : (
              <StarIcon className="w-5 h-5" />
            )}
          </span>
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const handleMediaClick = (postId: string, index: number) => {
    setCurrentPost(postId);
    setCurrentMediaIndex(index);
    setIsModalOpen(true);
  };

  const handlePrevious = () => {
    const currentPostData = posts.find(p => p.id === currentPost) as Post;
    if (currentPostData?.media) {
      setCurrentMediaIndex((prev) => (prev === 0 ? currentPostData.media!.length - 1 : prev - 1));
    }
  };

  const handleNext = () => {
    const currentPostData = posts.find(p => p.id === currentPost) as Post;
    if (currentPostData?.media) {
      setCurrentMediaIndex((prev) => (prev === currentPostData.media!.length - 1 ? 0 : prev + 1));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) {
        if (e.key === 'ArrowLeft') handlePrevious();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'Escape') setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentPost, currentMediaIndex]);

  // Update the click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !isChangingRole) {
        const target = event.target as HTMLElement;
        // Don't close if clicking inside the menu or on a role change button
        if (!target.closest('.menu-content') && !target.closest('button[disabled]')) {
        setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId, isChangingRole]);

  const handleConnect = async (memberId: string) => {
    if (connectingIds.has(memberId)) return;
    
    try {
      setConnectingIds(prev => new Set([...prev, memberId]));
      setConnectionError(null);

      // Find the member to get their user ID
      const member = members.find(m => m.id === memberId);
      if (!member) {
        setConnectionError('Member not found');
        return;
      }

      // First verify the user exists using the correct endpoint
      try {
        await api.get(`/auth/profile/${member.username}/`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setConnectionError('Unable to connect: User no longer exists');
          return;
        }
        throw error; // Re-throw other errors
      }
      
      // Update UI optimistically
      setMembers(prevMembers => 
        prevMembers.map(m => 
          m.id === memberId 
            ? { 
                ...m, 
                connectionStatus: 'pending' as const,
                status: 'pending' as const
              }
            : m
        )
      );

      // Send connection request using the user's actual ID
      const response = await api.post('/connections/requests/', {
        receiver_id: member.user_id,
        validate_only: false,
        ensure_roles: true
      });

      // Update UI with the connection request ID
      setMembers(prevMembers => 
        prevMembers.map(m => 
          m.id === memberId 
            ? { 
                ...m, 
                connectionStatus: 'pending' as const,
                status: 'pending' as const,
                connectionRequestId: response.data.id
              }
            : m
        )
      );

    } catch (error: any) {
      // Handle database integrity error
      if (error.response?.status === 500 && 
          error.response?.data?.detail?.includes('violates foreign key constraint')) {
        setConnectionError('Unable to connect: User no longer exists');
        setMembers(prevMembers => 
          prevMembers.map(m => 
            m.id === memberId 
              ? { ...m, connectionStatus: 'connect' as const, status: 'suggested' as const }
              : m
          )
        );
        return;
      }
      
      // Check if the error is due to an existing request
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('already exists')) {
        try {
          const existingRequests = await api.get('/connections/requests/', {
            params: {
              sender: true,
              receiver: false,
              status: 'pending',
              exclude_self: true,
              current_user: 'sender'
            }
          });
          
          const existingRequest = existingRequests.data.find(
            (req: any) => req.receiver.id.toString() === members.find(m => m.id === memberId)?.user_id
          );
          
          if (existingRequest) {
            setMembers(prevMembers => 
              prevMembers.map(m => 
                m.id === memberId 
                  ? { 
                      ...m, 
                      connectionStatus: 'pending' as const,
                      status: 'pending' as const,
                      connectionRequestId: existingRequest.id
                    }
                  : m
              )
            );
            return;
          }
        } catch (fetchError) {
          // Handle error silently
        }
      }
      
      // Revert UI state on error
      setMembers(prevMembers => 
        prevMembers.map(m => 
          m.id === memberId 
            ? { ...m, connectionStatus: 'connect' as const, status: 'suggested' as const }
            : m
        )
      );

      const errorMessage = error.response?.data?.detail || 
                       error.response?.data?.message || 
                       'Failed to send connection request. Please try again.';
      setConnectionError(errorMessage);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    if (!requestId || connectingIds.has(requestId.toString())) return;
    
    try {
      setConnectingIds(prev => new Set([...prev, requestId.toString()]));
      
      await api.post(`/connections/requests/${requestId}/cancel/`);
      
      // Update UI to show connect button again
      setMembers(prevMembers => 
        prevMembers.map(m => 
          m.connectionRequestId === requestId
            ? { 
                ...m, 
                connectionStatus: 'connect' as const,
                status: 'suggested' as const,
                connectionRequestId: undefined
              }
            : m
        )
      );

      setConnectionError(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                       error.response?.data?.message || 
                       'Failed to cancel connection request. Please try again.';
      setConnectionError(errorMessage);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId.toString());
        return newSet;
      });
    }
  };

  const handleInviteMember = async () => {
    try {
      const recipients = selectedRecipients.map(recipient => ({
        email: recipient.email,
        role: 'member', // Set default role to 'member'
        message: inviteMessage
      }));

      console.log('[Frontend] Sending bulk invite request to:', `${API_ENDPOINTS.COMMUNITIES}/${slug}/invite/bulk/`);
      console.log('[Frontend] Request payload:', { recipients, template: inviteTemplate });

      const response = await api.post(`${API_ENDPOINTS.COMMUNITIES}/${slug}/invite/bulk/`, {
        recipients,
        template: inviteTemplate
      });
      
      console.log('[Frontend] Bulk invite response:', response);
      
      if (response.status === 200) {
        // Clear localStorage after successful invite
        localStorage.removeItem('communityInviteModalOpen');
        localStorage.removeItem('communitySelectedRecipients');
        localStorage.removeItem('communityInviteEmail');
        localStorage.removeItem('communityInviteMessage');
        localStorage.removeItem('communityInviteTemplate');
        
        setIsInviteModalOpen(false);
        setSelectedRecipients([]);
        setInviteEmail('');
        setInviteMessage('');
        setInviteTemplate('default');
        // Show success message
      }
    } catch (error: any) {
      console.error('[Frontend] Error inviting members:', error);
      console.error('[Frontend] Error response:', error.response);
      // Show error message
    }
  };

  const handleAddRecipient = (recipient: {id?: string, email: string, name?: string, username?: string}) => {
    if (!selectedRecipients.some(r => r.email === recipient.email)) {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setSelectedRecipients(selectedRecipients.filter(r => r.email !== email));
  };

  const handleAddMember = async (userId: string) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.COMMUNITIES}/${slug}/add_member/`, {
        user_id: userId,
        role: 'member'
      });
      
      if (response.status === 200) {
        setIsAddMemberModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        
        // Refresh members list using the new function
        await fetchMembers();
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'moderator' | 'member') => {
    try {
      setIsChangingRole(userId);
      setRoleChangeError(null);

      // Find the current user's role in the community
      const currentUserMember = members.find(m => m.user_id === currentUser?.id);
      if (!currentUserMember || currentUserMember.role !== 'admin') {
        setRoleChangeError('Only admins can change roles');
        return;
      }

      // Prevent changing own role
      if (userId === currentUser?.id) {
        setRoleChangeError('You cannot change your own role');
        return;
      }

      // Check if this is the last admin trying to change their role
      const adminCount = members.filter(m => m.role === 'admin').length;
      const targetMember = members.find(m => m.user_id === userId);
      
      if (targetMember?.role === 'admin' && adminCount <= 1) {
        setRoleChangeError('Cannot remove the last admin. Please promote another member to admin first.');
        return;
      }

      const response = await api.post(`${API_ENDPOINTS.COMMUNITIES}/${slug}/change_role/`, {
        user_id: userId,
        role: newRole
      });
      
      if (response.status === 200) {
        // Update the member's role in the local state
        setMembers(prevMembers => 
          prevMembers.map(member => 
            member.user_id === userId 
              ? { ...member, role: newRole }
              : member
          )
        );
        
        // Show success message
        toast.success(`Successfully changed role to ${newRole}`);
        
        // Don't close the menu immediately to show the success state
        setTimeout(() => {
          setOpenMenuId(null);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error changing role:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Failed to change role. Please try again.';
      setRoleChangeError(errorMessage);
    } finally {
      setIsChangingRole(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      // Find the current user's role in the community
      const currentUserMember = members.find(m => m.user_id === currentUser?.id);
      if (!currentUserMember || currentUserMember.role !== 'admin') {
        setRoleChangeError('Only admins can remove members');
        return;
      }

      // Prevent removing yourself
      if (userId === currentUser?.id) {
        setRoleChangeError('You cannot remove yourself from the community');
        return;
      }

      // Prevent removing other admins
      const targetMember = members.find(m => m.user_id === userId);
      if (targetMember?.role === 'admin') {
        setRoleChangeError('Admins cannot remove other admins');
        return;
      }

      // Use the correct backend endpoint
      const response = await api.delete(`${API_ENDPOINTS.COMMUNITIES}/${slug}/members/${userId}/`);
      
      if (response.status === 204) {
        // Remove the member from the local state
        setMembers(prevMembers => 
          prevMembers.filter(member => member.user_id !== userId)
        );
        // Update members count
        setMembersCount(prev => prev - 1);
        // Close the menu after successful removal
        setOpenMenuId(null);
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      setRoleChangeError(error.response?.data?.detail || error.response?.data?.error || 'Failed to remove member. Please try again.');
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search for all users, not just friends
      const response = await api.get(API_ENDPOINTS.SEARCH_PROFILES, {
        params: {
          q: query,
          friends_only: false, // Changed to false to search all users
          ...searchFilters
        }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  // Add useEffect hooks to persist state changes
  useEffect(() => {
    localStorage.setItem('communityInviteModalOpen', JSON.stringify(isInviteModalOpen));
  }, [isInviteModalOpen]);

  useEffect(() => {
    localStorage.setItem('communitySelectedRecipients', JSON.stringify(selectedRecipients));
  }, [selectedRecipients]);

  useEffect(() => {
    localStorage.setItem('communityInviteEmail', JSON.stringify(inviteEmail));
  }, [inviteEmail]);

  useEffect(() => {
    localStorage.setItem('communityInviteMessage', JSON.stringify(inviteMessage));
  }, [inviteMessage]);

  useEffect(() => {
    localStorage.setItem('communityInviteRole', JSON.stringify(inviteRole));
  }, [inviteRole]);

  useEffect(() => {
    localStorage.setItem('communityInviteTemplate', JSON.stringify(inviteTemplate));
  }, [inviteTemplate]);

  // Add cleanup function to clear localStorage when component unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem('communityInviteModalOpen');
      localStorage.removeItem('communitySelectedRecipients');
      localStorage.removeItem('communityInviteEmail');
      localStorage.removeItem('communityInviteMessage');
      localStorage.removeItem('communityInviteRole');
      localStorage.removeItem('communityInviteTemplate');
    };
  }, []);

  // Add this new function to fetch all friends
  const fetchAllFriends = async () => {
    setIsLoadingFriends(true);
    try {
      console.log('=== Starting fetchAllFriends ===');
      console.log('Current members state:', members);
      
      const response = await api.get('/connections/connections/friends/', {
        params: {
          include_profile: true,
          include_avatar: true,
          include_personality_tags: true
        }
      });
      
      console.log('Raw API response:', response.data);
      console.log('Sample friend avatar path:', response.data[0]?.avatar);
      
      // Get all friend data
      const friendsWithDetails = response.data.map((friend: any) => {
        console.log('Processing friend:', friend.username);
        console.log('Friend avatar path:', friend.avatar);
        
        const friendData = {
          id: friend.id,
          user_id: friend.user_id || friend.id,
          name: friend.first_name && friend.last_name 
            ? `${friend.first_name} ${friend.last_name}`
            : friend.username,
          username: friend.username,
          avatar: friend.avatar ? `${API_BASE_URL}${friend.avatar}` : null,
          personalityTags: friend.personality_tags || [],
          workplace: friend.workplace || 'Works at Superlink',
          role: friend.role || 'Member',
          isOnline: friend.is_active || false,
          email: friend.email
        };
        console.log('Processed friend data with avatar:', friendData.avatar);
        return friendData;
      });
      
      // Create a Set of existing member user IDs for efficient lookup
      const existingMemberIds = new Set(members.map(member => String(member.user_id)));
      
      console.log('=== Member Filtering Details ===');
      console.log('Current members:', members);
      console.log('Existing member IDs:', Array.from(existingMemberIds));
      console.log('All friends before filtering:', friendsWithDetails);
      
      // Filter out friends who are already members
      const filteredFriends = friendsWithDetails.filter((friend: Friend) => {
        const isExistingMember = existingMemberIds.has(String(friend.user_id));
        console.log(`Checking friend: ${friend.name}`);
        console.log(`- Friend ID: ${friend.id}`);
        console.log(`- Friend user_id: ${friend.user_id}`);
        console.log(`- Is existing member: ${isExistingMember}`);
        console.log(`- Existing member IDs: ${Array.from(existingMemberIds)}`);
        console.log('---');
        return !isExistingMember;
      });
      
      console.log('=== Filtering Results ===');
      console.log('Filtered friends:', filteredFriends);
      console.log('Number of friends before filtering:', friendsWithDetails.length);
      console.log('Number of friends after filtering:', filteredFriends.length);
      
      setAllFriends(filteredFriends);
    } catch (error) {
      console.error('Error in fetchAllFriends:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Add useEffect to fetch friends when modal opens
  useEffect(() => {
    if (isAddMemberModalOpen) {
      console.log('=== Modal Opened ===');
      console.log('Current members state:', members);
      
      // First fetch the latest members list
      const fetchLatestMembers = async () => {
        try {
          console.log('Fetching latest members...');
          const membersUrl = `${API_ENDPOINTS.COMMUNITIES}/${slug}/members/`;
          const membersResponse = await api.get(membersUrl);
          console.log('Latest members API response:', membersResponse.data);
          
          if (membersResponse.data && Array.isArray(membersResponse.data)) {
            const membersData = membersResponse.data.map((member: any) => ({
                id: member.id,
                user_id: member.user.id,
                name: member.user.first_name && member.user.last_name 
                  ? `${member.user.first_name} ${member.user.last_name}`
                  : member.user.username,
                username: member.user.username,
                avatarUrl: member.avatar,
                role: member.role,
                joinDate: member.joined_at,
                contributions: member.contributions,
                isOnline: member.is_active,
                workplace: member.user.workplace || 'Works at Superlink',
              personalityTags: member.user.personality_tags?.map((tag: any) => ({
                name: tag.name,
                color: tag.color || '#6366f1' // Default to indigo if no color provided
              })) || [],
                badges: member.user.badges || [],
                connectionStatus: member.connectionStatus || 'connect',
                status: member.status || 'suggested',
                connectionRequestId: member.connectionRequestId
            }));
            console.log('Setting new members data:', membersData);
            setMembers(membersData);
          }
        } catch (error) {
          console.error('Error fetching latest members:', error);
        }
      };

      fetchLatestMembers().then(() => {
        console.log('Latest members fetched, now fetching friends...');
        fetchAllFriends();
      });
    }
  }, [isAddMemberModalOpen, slug]);

  // Add function to handle friend selection
  const handleFriendSelection = (friend: {id: string, name: string, username: string}) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.id === friend.id);
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };

  // Add function to handle adding multiple friends
  const handleAddMultipleFriends = async () => {
    try {
      for (const friend of selectedFriends) {
        await handleAddMember(friend.id);
      }
      setSelectedFriends([]);
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error('Error adding friends:', error);
    }
  };

  // Add confirmation modal handlers
  const openConfirmModal = (action: 'leave' | 'delete') => {
    setConfirmAction(action);
    setIsConfirmModalOpen(true);
    // Don't close the settings modal when opening the confirm modal
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !slug) return;
    
    setIsActionLoading(true);
    try {
      if (confirmAction === 'leave') {
        // Find the current user's member data
        const currentUserMember = members.find(m => m.user_id === currentUser?.id);
        
        // If current user is admin, check if they are the last admin
        if (currentUserMember?.role === 'admin') {
          const otherAdmins = members.filter(m => m.role === 'admin' && m.user_id !== currentUser?.id);
          
          if (otherAdmins.length === 0) {
            setError(
              <div className="space-y-3">
                <p className="text-red-600 dark:text-red-400">
                  As the last admin, you must transfer admin rights before leaving. Please:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsConfirmModalOpen(false);
                      setActiveTab('members');
                      // Find a non-admin member to suggest as admin
                      const potentialAdmin = members.find(m => m.role !== 'admin');
                      if (potentialAdmin) {
                        setOpenMenuId(potentialAdmin.id);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Transfer Admin Rights
                  </button>
                  <button
                    onClick={() => {
                      setIsConfirmModalOpen(false);
                      openConfirmModal('delete');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Community
                  </button>
                </div>
              </div>
            );
            setIsActionLoading(false);
            return;
          }
        }

        try {
          const response = await api.post(`${API_ENDPOINTS.COMMUNITIES}/${slug}/leave/`);
          
          if (response.status === 200) {
            // Update UI state
            setIsSubscribed(false);
            // Remove current user from members list
            setMembers(prevMembers => prevMembers.filter(member => member.user_id !== currentUser?.id));
            // Update members count
            setMembersCount(prev => prev - 1);
            // Close both modals
            setIsConfirmModalOpen(false);
            setOpenMenuId(null);
            setConfirmAction(null);
            // Show success message
            toast.success('Successfully left the community');
          }
        } catch (leaveError: any) {
          // Handle leave error...
        }
      } else if (confirmAction === 'delete') {
        // Check if user is admin
        const currentUserMember = members.find(m => m.user_id === currentUser?.id);
        if (!currentUserMember || currentUserMember.role !== 'admin') {
          setError('Only admins can delete the community');
          setIsActionLoading(false);
          return;
        }

        try {
          const response = await api.delete(`${API_ENDPOINTS.COMMUNITIES}/${slug}/delete_community/`);
          
          if (response.status === 200) {
            // Show success message
            toast.success('Community successfully deleted');
            // Navigate to communities page
            navigate('/communities');
          }
        } catch (deleteError: any) {
          const errorMessage = deleteError.response?.data?.error || 
                             deleteError.response?.data?.detail || 
                             'Failed to delete community. Please try again.';
            setError(errorMessage);
          }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                       error.response?.data?.detail || 
                         'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add join community handler
  const handleJoinCommunity = async () => {
    if (!slug) return;
    
    setIsJoining(true);
    setJoinError(null);
    
    try {
      const response = await api.post(`${API_ENDPOINTS.COMMUNITIES}/${slug}/join/`);
      
      if (response.status === 200 || response.status === 201) {
        setIsSubscribed(true);
        
        // Refresh members list using the new function
        await fetchMembers();
      }
    } catch (error: any) {
      console.error('Error joining community:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message ||
                          'Failed to join community. Please try again.';
      setJoinError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  // WebSocket connection setup
  useEffect(() => {
    const connectWebSocket = async () => {
      if (isConnectingRef.current || !slug) return;
      
      try {
        isConnectingRef.current = true;
        // Get the auth token from localStorage or your auth context
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        // Close existing connection if any
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }

        // Create new WebSocket connection using the current window location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const ws = new WebSocket(`${protocol}//${host}/ws/community/${slug}/?token=${token}`);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
          isConnectingRef.current = false;
          
          // Subscribe to community updates
          ws.send(JSON.stringify({
            type: 'subscribe_community'
          }));
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          setIsConnected(false);
          isConnectingRef.current = false;
          
          // Only attempt to reconnect if the connection was not closed intentionally
          if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              connectWebSocket();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          isConnectingRef.current = false;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);

            switch (data.type) {
              case 'community_updated':
                // Update community data
                if (data.data) {
                  setCommunityData(prev => ({
                    ...prev,
                    ...data.data
                  }));
                }
                break;

              case 'member_updated':
                // Update members list
                if (data.data) {
                  setMembers(prev => {
                    const updatedMembers = [...prev];
                    const index = updatedMembers.findIndex(m => m.id === data.data.id);
                    if (index !== -1) {
                      updatedMembers[index] = { ...updatedMembers[index], ...data.data };
                    }
                    return updatedMembers;
                  });
                }
                break;

              case 'event_updated':
                // Update events list
                if (data.data) {
                  const { action, event, event_id, participant } = data.data;
                  
                  switch (action) {
                    case 'create':
                      setEvents(prev => [...prev, {
                        id: event.id,
                        title: event.title,
                        description: event.description,
                        date: event.start_date,
                        type: event.event_type,
                        participants: 1
                      }]);
                      break;
                      
                    case 'update':
                      setEvents(prev => prev.map(e => 
                        e.id === event.id ? {
                          ...e,
                          title: event.title,
                          description: event.description,
                          date: event.start_date,
                          type: event.event_type
                        } : e
                      ));
                      break;
                      
                    case 'participant_join':
                      setEvents(prev => prev.map(e => 
                        e.id === event_id ? {
                          ...e,
                          participants: e.participants + 1
                        } : e
                      ));
                      break;
                      
                    case 'participant_leave':
                      setEvents(prev => prev.map(e => 
                        e.id === event_id ? {
                          ...e,
                          participants: Math.max(0, e.participants - 1)
                        } : e
                      ));
                      break;
                  }
                }
                break;

              case 'post_updated':
                // Update posts list
                if (data.data) {
                  const { action, post } = data.data;
                  switch (action) {
                    case 'create':
                      setPosts(prev => [post, ...prev]);
                      break;
                    case 'update':
                      setPosts(prev => prev.map(p => 
                        p.id === post.id ? { ...p, ...post } : p
                      ));
                      break;
                    case 'delete':
                      setPosts(prev => prev.filter(p => p.id !== post.id));
                      break;
                  }
                }
                break;

              case 'role_updated':
                // Update member role
                if (data.data) {
                  const { member_id, new_role } = data.data;
                  setMembers(prev => prev.map(member => 
                    member.id === member_id 
                      ? { ...member, role: new_role }
                      : member
                  ));
                }
                break;

              case 'settings_updated':
                // Update community settings
                if (data.data) {
                  setCommunityData(prev => ({
                    ...prev,
                    ...data.data
                  }));
                }
                break;

              case 'connection_updated':
                // Update member connection status
                if (data.data) {
                  const { member_id, status, connectionRequestId } = data.data;
                  setMembers(prev => prev.map(member => 
                    member.id === member_id 
                      ? { 
                          ...member, 
                          connectionStatus: status,
                          connectionRequestId: connectionRequestId
                        }
                      : member
                  ));
                }
                break;

              case 'comment_updated':
                // Update post comments
                if (data.data) {
                  const { action, post_id, comment } = data.data;
                  console.log('Received comment update:', { action, post_id, comment });
                  setPosts(prev => prev.map(post => {
                    if (post.id === post_id) {
                      switch (action) {
                        case 'create':
                          return {
                            ...post,
                            commentCount: (post.commentCount || 0) + 1,
                            topComment: comment
                          };
                        case 'update':
                          return {
                            ...post,
                            topComment: comment
                          };
                        case 'delete':
                          return {
                            ...post,
                            commentCount: Math.max(0, (post.commentCount || 0) - 1)
                          };
                        default:
                          return post;
                      }
                    }
                    return post;
                  }));
                }
                break;

              default:
                console.log('Unknown message type:', data.type);
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        socketRef.current = ws;
        setSocket(ws);
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        isConnectingRef.current = false;
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [slug]); // Only reconnect when slug changes

  const handleUpdateCommunity = async (data: CreateCommunityData) => {
    if (!slug) {
      toast.error('Community slug is missing');
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Validate required fields
      if (!data.name || !data.description) {
        toast.error('Name and description are required');
        return;
      }

      // Validate topics and rules length
      if (data.topics.length > 10) {
        toast.error('Maximum 10 topics allowed');
        return;
      }

      if (data.rules.length > 20) {
        toast.error('Maximum 20 rules allowed');
        return;
      }

      // Create FormData from the community data
      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('is_private', data.isPrivate.toString());
      
      // Add topics and rules as individual form fields
      data.topics.forEach((topic, index) => {
        formData.append(`topics[${index}]`, topic);
      });
      
      data.rules.forEach((rule, index) => {
        formData.append(`rules[${index}]`, rule);
      });
      
      // Handle category
      formData.append('category', data.category);

      // Handle images - only append if they are new files
      if (data.icon instanceof File) {
        formData.append('icon', data.icon);
      } else if (data.icon === null) {
        // If icon is explicitly set to null, it means we want to remove it
        formData.append('icon', '');
      }
      
      if (data.banner instanceof File) {
        formData.append('banner', data.banner);
      } else if (data.banner === null) {
        // If banner is explicitly set to null, it means we want to remove it
        formData.append('banner', '');
      }

      // Use the /update/ endpoint for updating community settings
      const response = await api.put(`${API_ENDPOINTS.COMMUNITIES}/${slug}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        // Update the community data in the local state
        setCommunityData((prevData) => {
          if (!prevData) return null;
          return {
            ...prevData,
            name: response.data.name,
            description: response.data.description,
            icon: response.data.icon,
            banner: response.data.banner,
            category_display: response.data.category_display,
            topics: response.data.topics,
            rules: response.data.rules,
            is_private: response.data.is_private,
          };
        });

        // Update other related state
        setCommunityName(response.data.name);
        setCommunityIcon(response.data.icon || null);
        setCommunityBanner(response.data.banner || null);

        // Close the modal
        setIsUpdateModalOpen(false);

        // Show success message
        toast.success('Community updated successfully');
      } else {
        throw new Error('Failed to update community');
      }
    } catch (error: any) {
      console.error('Error updating community:', error);
      
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            // Handle validation errors
            if (data.name) {
              toast.error(`Name error: ${data.name.join(', ')}`);
            } else if (data.description) {
              toast.error(`Description error: ${data.description.join(', ')}`);
            } else if (data.topics) {
              toast.error(`Topics error: ${data.topics.join(', ')}`);
            } else if (data.rules) {
              toast.error(`Rules error: ${data.rules.join(', ')}`);
            } else {
              toast.error(data.detail || 'Invalid data provided');
            }
            break;
          case 401:
            toast.error('You must be logged in to update the community');
            break;
          case 403:
            toast.error('You do not have permission to update this community');
            break;
          case 404:
            toast.error('Community not found');
            break;
          case 413:
            toast.error('Image file size too large. Maximum size is 5MB');
            break;
          default:
            toast.error(data.detail || data.message || 'Failed to update community');
        }
      } else if (error.request) {
        // Network error
        toast.error('Network error. Please check your connection');
      } else {
        // Other errors
        toast.error(error.message || 'Failed to update community');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    topics: string[];
    media?: File[];
    formData: FormData;
  }) => {
    try {
      console.log('Creating post with data:', postData);
      
      // Use the FormData object directly from the modal
      const response = await api.post(`${API_ENDPOINTS.COMMUNITIES}/${slug}/posts`, postData.formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Post creation response:', response.data);

      // Refresh posts after successful creation
      await fetchPosts();
      setIsCreatePostModalOpen(false);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    }
  };

  const fetchPosts = async () => {
    if (!slug) {
      console.error('No slug available for fetching posts');
      return;
    }
    
    try {
      setIsLoadingPosts(true);
      console.log('=== Starting to fetch posts ===');
      const apiUrl = `${API_ENDPOINTS.COMMUNITIES}/posts/feed/`;
      console.log('API URL:', apiUrl);
      console.log('Auth Token:', localStorage.getItem('access_token'));
      
      const response = await api.get(apiUrl, {
        params: {
          type: 'community',
          community: slug,
          ordering: sortBy === 'new' ? '-created_at' : 
                   sortBy === 'top' ? '-rating' : 
                   '-rating,-created_at' // trending: combination of rating and recency
        }
      });
      console.log('=== API Response Received ===');
      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);
      console.log('Raw Response Data:', response.data);
      console.log('Number of posts received:', response.data.posts?.length || 0);
      
      // Transform the API response to match our Post interface
      console.log('=== Starting Post Transformation ===');
      const transformedPosts = response.data.posts
        .filter((post: any) => post.community?.slug === slug) // Filter posts by current community
        .map((post: any, index: number) => {
          console.log(`\nProcessing post ${index + 1}:`, {
            id: post.id,
            title: post.title,
            content: post.content,
            author: post.author,
            timestamp: post.created_at,
            rating: post.rating,
            totalRatings: post.total_ratings,
            userRating: post.user_rating || 0,
            commentCount: post.comment_count,
            media: post.media,
            tags: post.topics || []
          });
          
          const transformedPost = {
            id: post.id,
            title: post.title,
            content: post.content,
            author: {
              name: post.author.name,
              avatarUrl: getAvatarUrl(post.author.avatar),
              personalityTags: post.author.personality_tags || [],
              role: post.author.role,
              username: post.author.username
            },
            author_role: post.author_role,
            timestamp: post.created_at,
            rating: post.rating,
            totalRatings: post.total_ratings,
            userRating: post.user_rating || 0,
            commentCount: typeof post.comment_count === 'number' ? post.comment_count : 0,
            media: post.media?.map((item: any) => ({
              type: item.type,
              url: getMediaUrl(item.file),
              thumbnail: item.thumbnail ? getMediaUrl(item.thumbnail) : undefined,
              alt: `Media for ${post.title}`
            })) || [],
            tags: (post.topics || []).map((topic: any) => {
              if (typeof topic === 'string') {
                return { id: undefined, name: topic, color: '#6366f1' };
              } else {
                return {
                  id: topic.id,
                  name: topic.name,
                  color: topic.color || '#6366f1',
                };
              }
            })
          };
          
          console.log(`Transformed post ${index + 1}:`, transformedPost);
          return transformedPost;
        });
      
      console.log('=== Post Transformation Complete ===');
      console.log('Final transformed posts:', transformedPosts);
      console.log('Number of transformed posts:', transformedPosts.length);
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error('=== Error Fetching Posts ===');
      console.error('Error object:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            params: error.config?.params
          }
        });
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          toast.error('Please log in to view posts');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to view these posts');
        } else if (error.response?.status === 404) {
          toast.error('Community not found');
        } else {
          toast.error('Failed to load posts. Please try again.');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoadingPosts(false);
      console.log('=== Fetch Posts Process Complete ===');
    }
  };

  // Add useEffect to refetch posts when sortBy changes
  useEffect(() => {
    fetchPosts();
  }, [slug, sortBy]); // Add sortBy to the dependency array

  // Fix the friend mapping type issue
  const renderFriend = (friend: { id: string; name: string; username: string; avatar?: string }) => {
    const isSelected = selectedFriends.some(f => f.id === friend.id);
    const isExistingMember = members.some(m => m.user_id === friend.id);
    
    return (
      <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <img
            src={friend.avatar || getAvatarUrl(null)}
            alt={friend.name}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-dark-text">{friend.name}</p>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">@{friend.username}</p>
          </div>
        </div>
        <button
          onClick={() => handleFriendSelection(friend)}
          disabled={isSelected || isExistingMember}
          className={`px-3 py-1 rounded-lg text-sm font-medium ${
            isSelected
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
              : isExistingMember
              ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isSelected ? 'Selected' : isExistingMember ? 'Already Member' : 'Select'}
        </button>
      </div>
    );
  };

  const handlePostRate = async (postId: string, rating: number, updatedPost: any) => {
    try {
      console.log('handlePostRate called with:', { postId, rating, updatedPost });
      
      // If this is a WebSocket message, use the data directly
      if (updatedPost.rating !== undefined && updatedPost.total_ratings !== undefined) {
        console.log('Processing WebSocket rating update:', updatedPost);
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            console.log('Updating post from WebSocket:', { 
              oldRating: post.rating, 
              newRating: updatedPost.rating,
              oldTotalRatings: post.totalRatings,
              newTotalRatings: updatedPost.total_ratings,
              userRating: post.userRating // Keep existing user rating
            });
            return {
              ...post,
              rating: updatedPost.rating,
              totalRatings: updatedPost.total_ratings
            };
          }
          return post;
        }));
        return;
      }

      // For direct API responses, update with the new rating
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          console.log('Updating post from API:', { 
            oldRating: post.rating, 
            newRating: updatedPost.rating,
            oldTotalRatings: post.totalRatings,
            newTotalRatings: updatedPost.total_ratings,
            userRating: rating
          });
          return {
            ...post,
            rating: updatedPost.rating,
            totalRatings: updatedPost.total_ratings || 0,
            userRating: rating // Update the user's rating
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error updating post rating:', error);
      toast.error('Failed to update rating');
    }
  };

  const handlePostClick = (postId: string) => {
    navigate(`/communities/${slug}/posts/${postId}`);
  };

  const handleStarHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleStarClick = async (rating: number) => {
    if (!currentPostId) return;
    console.log('handleStarClick called with:', { currentPostId, rating });

    try {
      // Optimistically update the UI
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === currentPostId) {
          const newRating = post.rating + (rating - (post.userRating || 0)) / (post.totalRatings + 1);
          console.log('Optimistic update:', {
            postId: currentPostId,
            oldRating: post.rating,
            newRating,
            oldUserRating: post.userRating,
            newUserRating: rating,
            oldTotalRatings: post.totalRatings,
            newTotalRatings: post.totalRatings + 1
          });
          return {
            ...post,
            userRating: rating,
            rating: newRating,
            totalRatings: post.totalRatings + 1
          };
        }
        return post;
      }));

      const response = await api.post(`/posts/${currentPostId}/rate/`, { rating });
      const updatedPost = response.data;

      // Update with the actual server response
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === currentPostId) {
          return {
            ...post,
            rating: updatedPost.rating,
            totalRatings: updatedPost.total_ratings,
            userRating: rating
          };
        }
        return post;
      }));

      setIsRatingModalOpen(false);
      setCurrentPostId('');
      setHoverRating(0);
      toast.success('Rating submitted successfully');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
      
      // Revert the optimistic update on error
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === currentPostId) {
          return {
            ...post,
            userRating: post.userRating || 0,
            rating: post.rating,
            totalRatings: post.totalRatings
          };
        }
        return post;
      }));
    }
  };

  const handleRateClick = async (postId: string) => {
    try {
      if (!slug) return;
      
      // Fetch the current post data including user's rating
      const response = await axios.get(`/api/communities/${slug}/posts/${postId}/`);
      const postData = response.data;
      
      // Set the current post ID and user's rating
      setCurrentPostId(postId);
      setSelectedRating(postData.user_rating || 0);
      setHoverRating(postData.user_rating || 0); // Set hover rating to current user rating
      setIsRatingModalOpen(true);
    } catch (error) {
      console.error('Error fetching post data:', error);
      toast.error('Failed to load rating data. Please try again.');
    }
  };

  const handleCommentAdded = (newComment: Comment) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === newComment.post.id) {
          return {
            ...post,
            commentCount: post.commentCount + 1,
            topComment: newComment.is_top_comment ? newComment : post.topComment
          };
        }
        return post;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6 mt-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-56 flex-shrink-0 mb-6 lg:mb-0">
            <div className="sticky top-20">
              <Navigation />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full">
            {/* Community Header */}
            <div className="bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-dark-border mb-4">
              <div className="h-36 relative">
                {communityBanner ? (
                  <img
                    src={getCommunityBannerUrl(communityBanner)}
                    alt={community.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default_community_banner.png';
                    }}
                  />
                ) : (
                  <img
                    src={getCommunityBannerUrl(null)}
                    alt="Default Community Banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default_community_banner.png';
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              
              <div className="p-4 -mt-12 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 rounded-xl bg-white dark:bg-dark-card p-1.5 shadow-lg">
                      <div className="w-full h-full rounded-lg flex items-center justify-center overflow-hidden">
                        {communityIcon ? (
                          <img
                            src={getCommunityIconUrl(communityIcon)}
                            alt={community.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/default_community_icon.png';
                            }}
                          />
                        ) : (
                          <img
                            src={getCommunityIconUrl(null)}
                            alt="Default Community Icon"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/default_community_icon.png';
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="pt-8">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">{community.name}</h1>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-dark-text-secondary">
                        <span className="flex items-center gap-1">
                          <UserGroupIcon className="w-4 h-4" />
                          {community.members.toLocaleString()} members
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {community.online} online
                        </span>
                        <span className="flex items-center gap-1">
                          <StarIcon className="w-4 h-4" />
                          {community.stats.avgRating} rating
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-8 flex items-center gap-2">
                    {(() => {
                      const currentUserMember = members.find(m => m.user_id === currentUser?.id);
                      const isMember = currentUserMember?.role === 'member' || currentUserMember?.role === 'moderator' || currentUserMember?.role === 'admin';

                      if (!isMember) {
                        return (
                          <button
                            onClick={handleJoinCommunity}
                            disabled={isJoining}
                            className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 text-sm ${
                              isSubscribed
                                ? 'bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm hover:shadow-md'
                            } ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isJoining ? (
                              <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                <span>Joining...</span>
                              </>
                            ) : isSubscribed ? (
                              <>
                                <CheckIcon className="w-4 h-4" />
                                <span>Joined</span>
                              </>
                            ) : (
                              <>
                                <UserPlusIcon className="w-4 h-4" />
                                <span>Join Community</span>
                              </>
                            )}
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <button className="p-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-all group">
                      <BellIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="p-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-all group">
                      <ShareIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-4 border-t border-gray-200 dark:border-dark-border">
                <div className="flex flex-wrap gap-2 py-2">
                  {(['posts', 'about', 'members', 'events', 'settings'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        activeTab === tab
                          ? 'bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                          : 'bg-white dark:bg-dark-card text-gray-500 dark:text-dark-text-secondary border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                      }`}
                    >
                      <span className="capitalize">{tab}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content and Right Sidebar Container */}
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Main Content Area */}
              <div className="flex-1 min-w-0 w-full">
            {/* Tab Content */}
                {activeTab === 'posts' && (
                  <div className="space-y-4">
                    {/* Posts Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSortBy('trending')}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            sortBy === 'trending'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                        >
                          <FireIcon className="w-4 h-4 inline-block mr-1.5" />
                          Trending
                        </button>
                        <button
                          onClick={() => setSortBy('new')}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            sortBy === 'new'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                        >
                          <ClockIcon className="w-4 h-4 inline-block mr-1.5" />
                          New
                        </button>
                        <button
                          onClick={() => setSortBy('top')}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            sortBy === 'top'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                        >
                          <StarIcon className="w-4 h-4 inline-block mr-1.5" />
                          Top
                        </button>
                      </div>
                      {(() => {
                        const currentUserMember = members.find(m => m.user_id === currentUser?.id);
                        const isMember = currentUserMember?.role === 'member' || currentUserMember?.role === 'moderator' || currentUserMember?.role === 'admin';
                        if (!isMember) return null;
                        return (
                          <button
                            onClick={() => setIsCreatePostModalOpen(true)}
                            className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            <PlusIcon className="w-4 h-4 mr-1.5" />
                            Create Post
                          </button>
                        );
                      })()}
                    </div>

                    {/* Posts List */}
                    {isLoadingPosts ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No posts yet. Be the first to create one!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <PostCard
                            key={post.id}
                            id={post.id}
                            title={post.title}
                            content={post.content}
                            author={post.author}
                            author_role={post.author_role}
                            community={slug}
                            timestamp={post.timestamp}
                            rating={post.rating}
                            totalRatings={post.totalRatings}
                            commentCount={post.commentCount}
                            media={post.media}
                            topComment={post.topComment}
                            isPersonal={post.isPersonal}
                            userRating={post.userRating}
                            tags={post.tags}
                            onRate={(rating, updatedPost) => handlePostRate(post.id, rating, updatedPost)}
                            onDescriptionClick={() => handlePostClick(post.id)}
                            onCommentAdded={handleCommentAdded}
                          />
                        ))}
                      </div>
                    )}
                                </div>
                              )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* About Section */}
                <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">About Community</h2>
                  <p className="text-gray-600 dark:text-dark-text-secondary mb-6">{community.description}</p>
                  
                  {/* Community Details */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-dark-text-secondary mb-1">
                        <GlobeAltIcon className="w-5 h-5" />
                        <span className="text-sm">Category</span>
                                  </div>
                      <p className="font-medium text-gray-900 dark:text-dark-text">{community.category}</p>
                                </div>
                    <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-dark-text-secondary mb-1">
                        <UserGroupIcon className="w-5 h-5" />
                        <span className="text-sm">Members</span>
                              </div>
                      <p className="font-medium text-gray-900 dark:text-dark-text">{community.members.toLocaleString()}</p>
                                      </div>
                    <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-dark-text-secondary mb-1">
                        <CalendarIcon className="w-5 h-5" />
                        <span className="text-sm">Created</span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-dark-text">
                        {new Date(community.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-dark-text-secondary mb-1">
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span className="text-sm">Privacy</span>
                                  </div>
                      <p className="font-medium text-gray-900 dark:text-dark-text">
                        {community.isPrivate ? 'Private' : 'Public'}
                      </p>
                                </div>
                            </div>

                  {/* Topics */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-3">Topics</h3>
                        <div className="flex flex-wrap gap-2">
                      {community.topics.map((topic) => (
                            <span
                              key={topic}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getTopicColor(topic)}`}
                            >
                          #{topic}
                            </span>
                          ))}
                        </div>
                      </div>

                  {/* Community Rules */}
                      <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-3">Community Rules</h3>
                    <div className="space-y-2">
                      {community.rules.map((rule, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg"
                        >
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                              {index + 1}
                          </span>
                            <p className="text-gray-600 dark:text-dark-text-secondary">{rule}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-6">
                  {/* Members Header */}
                  <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-200 dark:border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowAllAdmins(!showAllAdmins)}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm ${
                            showAllAdmins
                              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white'
                              : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                          }`}
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                          Admins
                          <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                            showAllAdmins
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                          }`}>
                            {members.filter(m => m.role === 'admin').length}
                          </span>
                        </button>
                        <button
                          onClick={() => setShowAllMembers(!showAllMembers)}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm ${
                            showAllMembers
                              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white'
                              : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                          }`}
                        >
                          <UserGroupIcon className="w-4 h-4" />
                          All Members
                          <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                            showAllMembers
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                          }`}>
                            {members.length}
                          </span>
                        </button>
                      </div>
                      {(() => {
                        const currentUserMember = members.find(m => m.user_id === currentUser?.id);
                        const isAdmin = currentUserMember?.role === 'admin';

                        if (!isAdmin) return null;
                        
                          return (
                          <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsInviteModalOpen(true)}
                              className="flex items-center px-3 py-1.5 text-sm bg-white dark:bg-dark-card text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                              <EnvelopeIcon className="w-4 h-4 mr-1.5" />
                              Invite Members
                        </button>
                        <button
                          onClick={() => setIsAddMemberModalOpen(true)}
                              className="flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                        >
                              <UserPlusIcon className="w-4 h-4 mr-1.5" />
                              Add Members
                        </button>
                      </div>
                          );
                      })()}
                    </div>

                    {/* Search and Filter */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search members..."
                          className="w-full px-3 py-1.5 pl-9 text-sm bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                        />
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                      </div>
                              <button 
                        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              >
                        <EllipsisHorizontalIcon className="w-4 h-4" />
                              </button>
                          </div>

                    {/* Advanced Search Filters */}
                    {showAdvancedSearch && (
                      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                        <select className="px-2.5 py-1.5 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400">
                          <option value="">All Roles</option>
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderator</option>
                          <option value="member">Member</option>
                        </select>
                        <select className="px-2.5 py-1.5 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400">
                          <option value="">All Status</option>
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                        </select>
                        <select className="px-2.5 py-1.5 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400">
                          <option value="">Sort By</option>
                          <option value="recent">Recently Joined</option>
                          <option value="contributions">Most Contributions</option>
                          <option value="name">Name</option>
                        </select>
                        <button className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                          Apply Filters
                        </button>
                            </div>
                          )}
                  </div>

                  {/* Members List */}
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
                    <div className="divide-y divide-gray-200 dark:divide-dark-border">
                      {members.map((member) => {
                        const isCurrentUser = member.user_id === currentUser?.id;
                        const isAdmin = member.role === 'admin';
                        const isModerator = member.role === 'moderator';
                        const showMember = (showAllAdmins && isAdmin) || (showAllMembers && !isAdmin) || (!showAllAdmins && !showAllMembers);

                        if (!showMember) return null;

                        return (
                          <div key={member.id} className="p-4 hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <img
                                    src={getAvatarUrl(member.avatarUrl)}
                                    alt={member.name} 
                                    className="w-12 h-12 rounded-full border-2 border-white dark:border-dark-card shadow-sm"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = '/default.jpg';
                                    }}
                                  />
                                    {member.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-card" />
                                    )}
                                  </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                    <Link 
                                      to={`/profile/${member.username}`}
                                      className="font-medium text-gray-900 dark:text-dark-text hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                    >
                                      {member.name}
                                    </Link>
                                    {isAdmin && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                                        Admin
                                      </span>
                                    )}
                                    {isModerator && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full">
                                        Moderator
                                      </span>
                                    )}
                                    </div>
                                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary">@{member.username}</p>
                                  
                                  {/* Personality Tags */}
                                    {member.personalityTags && member.personalityTags.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                      {member.personalityTags.map((tag, index) => (
                                          <span 
                                            key={index}
                                          className="px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 transition-all hover:scale-105 text-white"
                                          style={{
                                            backgroundColor: tag.color,
                                            boxShadow: `0 2px 4px ${tag.color}40`
                                          }}
                                          >
                                            {tag.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                              <div className="flex items-center gap-3">
                                {/* Connection Status */}
                                {!isCurrentUser && (
                                  <div className="relative">
                                    {member.connectionStatus === 'connect' && (
                                    <button
                                      onClick={() => handleConnect(member.id)}
                                      disabled={connectingIds.has(member.id)}
                                        className={`px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md transform hover:scale-105 font-medium ${
                                        connectingIds.has(member.id) ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    >
                                      {connectingIds.has(member.id) ? (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                          <span>Connecting...</span>
                                        </>
                                      ) : (
                                        <>
                                            <UserPlusIcon className="w-5 h-5" />
                                          <span>Connect</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {member.connectionStatus === 'pending' && (
                                      <div className="flex items-center gap-2">
                                        <span className="px-4 py-2 bg-gray-100 dark:bg-dark-card-hover text-gray-600 dark:text-dark-text rounded-xl flex items-center gap-2">
                                          <ClockIcon className="w-5 h-5" />
                                          <span>Pending</span>
                                        </span>
                                    <button
                                      onClick={() => member.connectionRequestId && handleCancelRequest(member.connectionRequestId)}
                                          disabled={connectingIds.has(member.id)}
                                          className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
                                    >
                                          {connectingIds.has(member.id) ? (
                                        <>
                                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                          <span>Canceling...</span>
                                        </>
                                      ) : (
                                        <>
                                              <XMarkIcon className="w-5 h-5" />
                                          <span>Cancel Request</span>
                                        </>
                                      )}
                                    </button>
                                      </div>
                                  )}
                                  {member.connectionStatus === 'connected' && (
                                      <span className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center gap-2">
                                        <CheckIcon className="w-5 h-5" />
                                      <span>Connected</span>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Member Actions Menu */}
                                {(() => {
                                  const currentUserMember = members.find(m => m.user_id === currentUser?.id);
                                  const isCurrentUser = member.user_id === currentUser?.id;
                                  const isAdmin = currentUserMember?.role === 'admin';
                                  const isTargetAdmin = member.role === 'admin';
                                  
                                  // Only show menu if:
                                  // 1. Current user is an admin
                                  // 2. Target user is not an admin
                                  // 3. Target user is not the current user
                                  if (!isAdmin || isTargetAdmin || isCurrentUser) return null;
                                  
                                  return (
                                    <div className="relative">
                                      <button 
                                        onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                      >
                                        <EllipsisHorizontalIcon className="w-4 h-4" />
                                      </button>
                                      
                                      {openMenuId === member.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border py-1 z-10 menu-content">
                                          {isAdmin && (
                                            <>
                                              <button 
                                                onClick={() => handleChangeRole(member.user_id, 'admin')}
                                                disabled={isChangingRole === member.user_id || member.role === 'admin'}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                {isChangingRole === member.user_id ? (
                                                  <span className="flex items-center gap-2">
                                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                    Changing...
                                                  </span>
                                                ) : (
                                                  'Make Admin'
                                                )}
                                              </button>
                                              <button 
                                                onClick={() => handleChangeRole(member.user_id, 'moderator')}
                                                disabled={isChangingRole === member.user_id || member.role === 'moderator'}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                {isChangingRole === member.user_id ? (
                                                  <span className="flex items-center gap-2">
                                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                    Changing...
                                                  </span>
                                                ) : (
                                                  'Make Moderator'
                                                )}
                                              </button>
                                              <button 
                                                onClick={() => handleChangeRole(member.user_id, 'member')}
                                                disabled={isChangingRole === member.user_id || member.role === 'member'}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                {isChangingRole === member.user_id ? (
                                                  <span className="flex items-center gap-2">
                                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                    Changing...
                                                  </span>
                                                ) : (
                                                  'Make Member'
                                                )}
                                              </button>
                                              <div className="border-t border-gray-200 dark:border-dark-border my-1"></div>
                                              <button 
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                disabled={member.role === 'admin'}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                Remove Member
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                                </div>

                            {/* Member Details */}
                            <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 dark:text-dark-text-secondary">
                              <span className="flex items-center gap-1">
                                <ChartBarIcon className="w-4 h-4" />
                                {member.contributions} contributions
                              </span>
                              </div>

                            {/* Badges */}
                            {member.badges && member.badges.length > 0 && (
                              <div className="mt-4 flex items-center gap-2">
                                {member.badges.map((badge, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                                  >
                                    {badge}
                                  </span>
                            ))}
                          </div>
                            )}
                        </div>
                      );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-6">
                {/* Events content */}
                {/* ... existing events content ... */}
                </div>
              )}

              {activeTab === 'settings' && (
                  <div className="space-y-6">
                  {/* Settings Header */}
                  <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-200 dark:border-dark-border">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">Community Settings</h2>
                    
                    {/* Settings Sections */}
                    {(() => {
                      const currentUserMember = members.find(m => m.user_id === currentUser?.id);
                      if (!currentUserMember) {
                        return (
                          <div className="p-6 bg-gray-50 dark:bg-dark-card-hover rounded-lg text-center">
                            <p className="text-gray-600 dark:text-dark-text-secondary">
                              You must be a member to view community settings.
                            </p>
                            <button
                              onClick={handleJoinCommunity}
                              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Join Community
                            </button>
                          </div>
                        );
                      }
                      
                      return (
                    <div className="space-y-6">
                      {/* General Settings */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">General Settings</h3>
                          {(() => {
                            const currentUserMember = members.find(m => m.user_id === currentUser?.id);
                            if (currentUserMember?.role === 'admin') {
                              return (
                                <button
                                  onClick={() => setIsUpdateModalOpen(true)}
                                  className="flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                  <PencilIcon className="w-4 h-4 mr-1.5" />
                                  Update
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                              Community Name
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={community.name}
                                className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                readOnly
                              />
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                              Category
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={community.category}
                                className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                            Description
                          </label>
                          <p className="text-gray-600 dark:text-dark-text-secondary">
                            {community.description}
                          </p>
                        </div>
                      </div>

                      {/* Topics and Rules */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">Topics & Rules</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-2">Topics</h4>
                            <div className="flex flex-wrap gap-2">
                              {community.topics.map((topic) => (
                                <span
                                  key={topic}
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${getTopicColor(topic)}`}
                                >
                                  #{topic}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-2">Community Rules</h4>
                            <div className="space-y-2">
                              {community.rules.map((rule, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-dark-text-secondary"
                                >
                                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                                    {index + 1}
                                  </span>
                                  <span>{rule}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Privacy Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">Privacy Settings</h3>
                        <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-dark-text">Private Community</h4>
                              <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
                                Only approved members can join and view content
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                community.isPrivate
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {community.isPrivate ? 'Private' : 'Public'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Member Management */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">Member Management</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-dark-text">Total Members</span>
                              <span className="text-lg font-semibold text-gray-900 dark:text-dark-text">{community.members}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Online Now</span>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">{community.online}</span>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-dark-text">Admins</span>
                              <span className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                                {members.filter(m => m.role === 'admin').length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 dark:text-dark-text-secondary">Moderators</span>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {members.filter(m => m.role === 'moderator').length}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-dark-text">Regular Members</span>
                              <span className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                                {members.filter(m => m.role === 'member').length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 dark:text-dark-text-secondary">New Today</span>
                              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">+3</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-red-700 dark:text-red-300">Leave Community</h4>
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                You will no longer be a member of this community
                              </p>
                            </div>
                            <button
                              onClick={() => openConfirmModal('leave')}
                              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                            >
                              Leave
                            </button>
                          </div>
                        </div>
                        {(() => {
                          const currentUserMember = members.find(m => m.user_id === currentUser?.id);
                          if (currentUserMember?.role === 'admin') {
                            return (
                              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-medium text-red-700 dark:text-red-300">Delete Community</h4>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                      This action cannot be undone. All data will be permanently deleted.
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => openConfirmModal('delete')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                      );
                    })()}
                  </div>
                                  </div>
              )}
            </div>

            {/* Right Sidebar */}
              <div className="hidden xl:block w-full xl:w-72 flex-shrink-0 mt-6 xl:mt-0">
              <div className="sticky top-8 space-y-6">
                {/* Community Stats */}
                  <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-200 dark:border-dark-border">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Community Stats</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <span className="text-gray-600 dark:text-dark-text-secondary text-sm">Posts Today</span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">{community.stats.postsToday}</span>
                    </div>
                      <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-gray-600 dark:text-dark-text-secondary text-sm">Active Discussions</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{community.stats.activeDiscussions}</span>
                    </div>
                      <div className="flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-gray-600 dark:text-dark-text-secondary text-sm">Average Rating</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">{community.stats.avgRating}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                  <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-200 dark:border-dark-border">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-3">Quick Actions</h2>
                    <div className="space-y-2">
                      <button
                        onClick={() => setIsCreatePostModalOpen(true)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Create Post
                      </button>
                      {(() => {
                        const currentUserMember = members.find(m => m.user_id === currentUser?.id);
                        const isAdmin = currentUserMember?.role === 'admin';
                        if (!isAdmin) return null;
                        return (
                          <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <UserPlusIcon className="w-5 h-5" />
                            Invite Users
                          </button>
                        );
                      })()}
                  </div>
                </div>

                {/* Topics */}
                  <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-200 dark:border-dark-border">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-3">Popular Topics</h2>
                    <div className="space-y-2">
                    {community.topics.map((topic: string, index: number) => (
                      <div
                        key={topic}
                          className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-dark-card-hover rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card-hover/80 transition-colors cursor-pointer border border-gray-200 dark:border-dark-border"
                      >
                          <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">#{topic}</span>
                          <span className="text-gray-500 dark:text-dark-text-secondary text-xs">{150 - index * 20} posts</span>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isCreatePostModalOpen && communityData && (
        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          onSubmit={handleCreatePost}
          communityTopics={communityData.topics}
          communitySlug={communityData.slug}
        />
      )}

      {isUpdateModalOpen && (
        <UpdateCommunityModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onSubmit={handleUpdateCommunity}
          initialData={{
            name: communityData?.name || '',
            description: communityData?.description || '',
            icon: communityData?.icon || null,
            banner: communityData?.banner || null,
            isPrivate: communityData?.is_private || false,
            topics: communityData?.topics || [],
            rules: communityData?.rules || [],
            category: communityData?.category || ''
          }}
        />
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 animate-fadeIn">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl p-3 sm:p-5 relative animate-slideUp mx-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Members</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Select friends to add to the community
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedFriends.length > 0 && (
                  <button
                    onClick={() => {
                      console.log('Clearing all selected friends');
                      setSelectedFriends([]);
                    }}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search friends by name, username, or workplace..."
                value={searchQuery}
                onChange={(e) => {
                  console.log('Search query changed:', e.target.value);
                  setSearchQuery(e.target.value);
                  // Filter friends list based on search query
                  const filteredFriends = allFriends.filter((friend: Friend) => 
                    friend.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                    friend.username.toLowerCase().includes(e.target.value.toLowerCase()) ||
                    (friend.workplace && friend.workplace.toLowerCase().includes(e.target.value.toLowerCase()))
                  );
                  setSearchResults(filteredFriends);
                }}
                className="w-full px-3 py-1.5 pl-9 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Filter Options */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => {
                  console.log('Toggling advanced search:', !showAdvancedSearch);
                  setShowAdvancedSearch(!showAdvancedSearch);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-sm rounded-lg transition-colors ${
                  showAdvancedSearch 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-dark-card border border-gray-200 dark:border-dark-border'
                }`}
              >
                <EllipsisHorizontalIcon className="w-4 h-4" />
                Filters
              </button>
              {showAdvancedSearch && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={searchFilters.location}
                    onChange={(e) => {
                      console.log('Location filter changed:', e.target.value);
                      setSearchFilters(prev => ({ ...prev, location: e.target.value }));
                    }}
                    className="px-2 py-1 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                  >
                    <option value="">All Locations</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                  </select>
                  <select
                    value={searchFilters.experience}
                    onChange={(e) => {
                      console.log('Experience filter changed:', e.target.value);
                      setSearchFilters(prev => ({ ...prev, experience: e.target.value }));
                    }}
                    className="px-2 py-1 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                  >
                    <option value="">All Experience Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                  </select>
                  <button
                    onClick={() => {
                      console.log('Clearing all filters');
                      setSearchFilters({ role: '', skills: [], location: '', experience: '' });
                    }}
                    className="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Friends List */}
            <div className="mb-3 max-h-80 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800">
              {isLoadingFriends ? (
                <div className="flex items-center justify-center py-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 dark:border-purple-400"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading friends...</p>
                  </div>
                </div>
              ) : (searchQuery ? searchResults : allFriends).length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500">
                    <UserGroupIcon className="w-full h-full" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No friends found matching your search' : 'No friends available to add'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {searchQuery ? 'Try adjusting your search' : 'All your friends are already members of this community'}
                  </p>
                </div>
              ) : (
                (searchQuery ? searchResults : allFriends).map((friend) => {
                  const isSelected = selectedFriends.some(f => f.id === friend.id);
                  const isExistingMember = members.some(m => m.user_id === friend.id);
                  
                  return (
                    <div
                      key={friend.id}
                      className={`flex items-center justify-between p-2 hover:bg-white dark:hover:bg-dark-card border border-transparent hover:border-gray-200 dark:hover:border-dark-border rounded-lg transition-all ${
                        isSelected ? 'bg-purple-50 dark:bg-purple-900/30' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFriendSelection(friend)}
                          disabled={isExistingMember}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
                        />
                        <div className="relative">
                          <img
                            src={friend.avatar || getAvatarUrl(null)}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
                            onError={(e) => {
                              console.log('Avatar load error for:', friend.name);
                              console.log('Attempted avatar URL:', friend.avatar);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {friend.isOnline && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{friend.name}</p>
                            {friend.role && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                                {friend.role}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">@{friend.username}</p>
                          {friend.workplace && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                              {friend.workplace}
                            </p>
                          )}
                        </div>
                      </div>
                      {friend.personalityTags && friend.personalityTags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {friend.personalityTags.slice(0, 2).map((tag: { name: string; color: string }, index: number) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 text-xs font-medium rounded-full text-white hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: tag.color,
                                boxShadow: `0 2px 4px ${tag.color}40`
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {friend.personalityTags.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                              +{friend.personalityTags.length - 2}
                        </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Buttons with Loading State */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={() => {
                  console.log('Canceling add member operation');
                  setIsAddMemberModalOpen(false);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-dark-card border border-transparent hover:border-gray-200 dark:hover:border-dark-border rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Adding multiple friends:', selectedFriends);
                  handleAddMultipleFriends();
                }}
                disabled={selectedFriends.length === 0 || isActionLoading}
                className={`px-3 py-1.5 rounded-lg text-sm text-white font-medium transition-all flex items-center gap-1.5 ${
                  selectedFriends.length === 0 || isActionLoading
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-500 dark:hover:to-pink-500 shadow-sm hover:shadow-md transform hover:scale-105'
                }`}
              >
                {isActionLoading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-4 h-4" />
                    Add {selectedFriends.length > 0 ? `(${selectedFriends.length})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Members Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 animate-fadeIn">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl p-3 sm:p-5 relative animate-slideUp mx-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invite Members</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Search and select users to invite to the community
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedRecipients.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedRecipients([]);
                    }}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search users by name, username, or workplace..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchUsers(e.target.value);
                }}
                className="w-full px-3 py-1.5 pl-9 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 dark:border-purple-400"></div>
                </div>
              )}
            </div>

            {/* Filter Options */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`flex items-center gap-1 px-2.5 py-1 text-sm rounded-lg transition-colors ${
                  showAdvancedSearch 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-dark-card border border-gray-200 dark:border-dark-border'
                }`}
              >
                <EllipsisHorizontalIcon className="w-4 h-4" />
                Filters
                {Object.values(searchFilters).some(value => value !== '') && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full">
                    Active
                  </span>
                )}
              </button>
              {showAdvancedSearch && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={searchFilters.location}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="px-2 py-1 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                  >
                    <option value="">All Locations</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                  </select>
                  <select
                    value={searchFilters.experience}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, experience: e.target.value }))}
                    className="px-2 py-1 text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                  >
                    <option value="">All Experience Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                  </select>
                  <button
                    onClick={() => setSearchFilters({ role: '', skills: [], location: '', experience: '' })}
                    className="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Search Results */}
            <div className="mb-3 max-h-80 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800">
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 dark:border-purple-400"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Searching users...</p>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500">
                    <UserGroupIcon className="w-full h-full" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No users found matching your search' : 'Search for users to invite'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {searchQuery ? 'Try adjusting your search or filters' : 'Enter a name, username, or workplace to search'}
                  </p>
                </div>
              ) : (
                searchResults.map((user: any) => {
                  const isSelected = selectedRecipients.some(r => r.id === user.id);
                  const isExistingMember = members.some(m => m.user_id === user.id);
                  
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-2 hover:bg-white dark:hover:bg-dark-card border border-transparent hover:border-gray-200 dark:hover:border-dark-border rounded-lg transition-all ${
                        isSelected ? 'bg-purple-50 dark:bg-purple-900/30' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedRecipients(prev => prev.filter(r => r.id !== user.id));
                            } else {
                              setSelectedRecipients(prev => [...prev, {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                username: user.username
                              }]);
                            }
                          }}
                          disabled={isExistingMember}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
                        />
                        <div className="relative">
                          <img
                            src={user.avatar || undefined}
                            alt={user.name}
                            className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {user.isOnline && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</p>
                            {user.role && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                                {user.role}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                          {user.workplace && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {user.workplace}
                            </p>
                          )}
                        </div>
                      </div>
                      {user.personalityTags && user.personalityTags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {user.personalityTags.slice(0, 2).map((tag: { name: string; color: string }, index: number) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 text-xs font-medium rounded-full text-white hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: tag.color,
                                boxShadow: `0 2px 4px ${tag.color}40`
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {user.personalityTags.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{user.personalityTags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Template */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message Template
              </label>
              <select
                value={inviteTemplate}
                onChange={(e) => setInviteTemplate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm text-gray-900 dark:text-white"
              >
                <option value="default">Default Template</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="custom">Custom Message</option>
              </select>
            </div>

            {/* Custom Message */}
            {inviteTemplate === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Message
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Enter your custom invitation message..."
                  className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm text-gray-900 dark:text-white h-24 resize-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setSelectedRecipients([]);
                  setSearchQuery('');
                  setInviteMessage('');
                  setInviteTemplate('default');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-dark-card border border-transparent hover:border-gray-200 dark:hover:border-dark-border rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMember}
                disabled={selectedRecipients.length === 0}
                className={`px-3 py-1.5 rounded-lg text-sm text-white font-medium transition-all flex items-center gap-1.5 ${
                  selectedRecipients.length === 0
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-500 dark:hover:to-pink-500 shadow-sm hover:shadow-md transform hover:scale-105'
                }`}
              >
                <EnvelopeIcon className="w-4 h-4" />
                Send Invitations ({selectedRecipients.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}} />

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 animate-fadeIn">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg p-3 sm:p-5 relative animate-slideUp mx-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {confirmAction === 'leave' ? 'Leave Community' : 'Delete Community'}
              </h2>
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setConfirmAction(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              {error ? (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  {error}
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ShieldExclamationIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Warning</p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                          {confirmAction === 'leave' 
                            ? 'You will lose access to all community content and discussions. You can rejoin later if you change your mind.'
                            : 'This action cannot be undone. All community data, posts, and member information will be permanently deleted.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {confirmAction === 'leave' 
                      ? 'Are you sure you want to leave this community?'
                      : 'Are you sure you want to delete this community?'}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setConfirmAction(null);
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg transition-all"
              >
                Cancel
              </button>
              {!error && (
                <button
                  onClick={handleConfirmAction}
                  disabled={isActionLoading}
                  className={`px-4 py-2 text-sm text-white font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    confirmAction === 'leave' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isActionLoading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      {confirmAction === 'leave' ? 'Leaving...' : 'Deleting...'}
                    </>
                  ) : (
                    confirmAction === 'leave' ? 'Leave Community' : 'Delete Community'
                  )}
                </button>
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
                    onMouseLeave={() => handleStarHover(0)}
                    onClick={() => handleStarClick(0)}
                  >
                    <span className={`text-sm font-medium ${selectedRating === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>0</span>
                  </button>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="p-0.5 transition-transform hover:scale-110"
                      onMouseEnter={() => handleStarHover(star)}
                      onMouseLeave={() => handleStarHover(selectedRating)}
                      onClick={() => handleStarClick(star)}
                    >
                      {star <= (hoverRating || selectedRating) ? (
                        <StarIconSolid className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-6 h-6 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hoverRating === 0 ? 'Unrate' : hoverRating ? `Rate ${hoverRating} stars` : selectedRating ? `Your rating: ${selectedRating} stars` : 'Select your rating'}
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
  );
};

export default CommunityView; 