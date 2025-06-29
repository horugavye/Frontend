import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  StarIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  MapPinIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  HashtagIcon,
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  UserIcon,
  ClockIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import Navigation from './Navigation';
import styles from './UserProfile.module.css';
import ProfileForm from './ProfileForm.tsx';
import ExperienceForm from './ExperienceForm';
import CertificationForm from './CertificationForm';
import SkillForm from './SkillForm';
import EducationForm from './EducationForm';
import AchievementForm from './AchievementForm';
import axios from 'axios';
import { API_URL } from '../config';
import Modal from './Modal';
import PostCard from './PostCard';
import api from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';

interface Profile {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
  };
  username: string;
  name: string;
  avatar: string;
  bio: string;
  personalStory?: string;
  personal_story?: string;
  personality_tags: Array<{
    id: number
    name: string;
    color: string;
  }>;
  connectionStrength: number;
  followers: number;
  following: number;
  posts: number;
  personalPosts: number;
  communityPosts: number;
  rating: number;
  location: string;
  website: string;
  joinDate: string;
  interests: Array<{
    id: string;
    name: string;
    color?: string;
    background_color?: string;
    hover_color?: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    level: number;
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
  availability: {
    mentoring: boolean;
    collaboration: boolean;
    networking: boolean;
  };
  education: Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    year: string;
    gpa: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    duration: string;
    institution_type: string;
    description?: string;
    achievements?: string[];
    skills_learned?: string[];
    location?: string;
    website?: string;
    is_verified?: boolean;
  }>;
  workExperience: Array<{
    id: string;
    company: string;
    role: string;
    duration: string;
    highlights: string[];
    employment_type: string;
    skills: string[];
    team_size: number;
    projects_count: number;
    impact_score: number;
    endorsements: any[];
    endorsement_count: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    date: string;
    description: string;
    category: string;
    impact?: string;
    team?: string;
    link?: string;
  }>;
  isFollowing?: boolean;
  certifications?: Array<{
    id: string;
    name: string;
    issuing_organization: string;
    issue_date: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
  }>;
  cover_photo?: string;
  connectionStatus?: string;
  connectionRequestId?: string;
  private?: boolean; // <-- Add this line
}



interface Post {
  id: number;
  content: string;
  author: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  title: string;
  rating: number;
  totalRatings?: number;
  userRating?: number;
  commentCount: number;
  community?: string;
  communityName?: string;
  isPersonal?: boolean;
}

interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  total_members: number;
  active_members: number;
  icon: string;
  bannerUrl?: string;
  category: string;
  isJoined: boolean;
  activity: number;
  topics: string[];
}

interface Friend {
  id: string;
  user: {
  name: string;
    username: string;
    avatarUrl: string;
    personalityTags: { name: string; color: string }[];
    badges: { name: string; icon: string; color: string }[];
    lastActive: string;
    matchScore: number;
    connectionStrength: number;
  };
  message: string;
  timestamp: string;
  mutualConnections: number;
  status: 'pending' | 'accepted' | 'rejected' | 'suggested' | 'discover';
  commonInterests?: string[];
  interests?: { name: string; category?: string }[];
  lastInteraction?: string;
  location?: string;
  mutualFriends?: string[];
  connectionStatus?: 'connect' | 'pending' | 'connected';
  icebreakers?: string[];
  connectionRequestId?: number;
  is_alchy?: boolean;
}

interface Comment {
  id: number;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
}

interface Certification {
  id?: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string | null;
  credential_id?: string;
  credential_url?: string;
}

interface Skill {
  id: string;
  name: string;
  level: number;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  year: string;
  institution_type: string;
  duration: string;
  gpa: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description?: string;
  achievements?: string[];
  skills_learned?: string[];
  location?: string;
  website?: string;
  is_verified?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  impact?: string;
  team?: string;
  link?: string;
}

// First, add this helper function at the top of your component to handle achievement icons
const getAchievementIcon = (category: string) => {
  const iconClasses = "w-8 h-8 text-purple-600";
  
  switch (category?.toLowerCase()) {
    case 'award':
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        ),
        bgColor: 'bg-purple-500'
      };
    case 'innovation':
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        ),
        bgColor: 'bg-blue-500'
      };
    case 'speaking':
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        ),
        bgColor: 'bg-green-500'
      };
    case 'publication':
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        ),
        bgColor: 'bg-orange-500'
      };
    case 'leadership':
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        ),
        bgColor: 'bg-pink-500'
      };
    case 'certification':
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        ),
        bgColor: 'bg-teal-500'
      };
    case 'research':
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        ),
        bgColor: 'bg-indigo-500'
      };
    case 'patent':
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M21 8v13H3V8M1 3h22v5H1z M12 12h.01M16 12h.01M8 12h.01" />
        </svg>
        ),
        bgColor: 'bg-yellow-500'
      };
    case 'project':
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        ),
        bgColor: 'bg-pink-500'
      };
    default:
      return {
        icon: (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        ),
        bgColor: 'bg-purple-500'
      };
  }
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
    (typeof document !== 'undefined' && (() => {
      const s = document.createElement('span').style;
      s.color = color;
      return !!s.color;
    })())
  );
};

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      content: "Great post about AI development!",
      author: "Sarah Chen",
      createdAt: "2024-04-18T10:30:00Z",
      likes: 15
    },
    {
      id: 2,
      content: "Thanks for sharing your insights on machine learning!",
      author: "John Doe",
      createdAt: "2024-04-17T14:20:00Z",
      likes: 8
    }
  ]);
  
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [editingExperience, setEditingExperience] = useState<{
    company: string;
    role: string;
    duration: string;
    highlights: string[];
    employment_type: string;
    skills: string[];
    team_size: number;
    projects_count: number;
    impact_score: number;
    endorsements: any[];
    endorsement_count: number;
  } | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<any>(null);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const fetchProfileTimeoutRef = useRef<NodeJS.Timeout>();
  const [isDeletingCert, setIsDeletingCert] = useState<string | null>(null);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certificationToDelete, setCertificationToDelete] = useState<string | null>(null);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [showCertificationForm, setShowCertificationForm] = useState(false);
  const [showDeleteExperienceModal, setShowDeleteExperienceModal] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<string | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [showDeleteSkillModal, setShowDeleteSkillModal] = useState(false);
  const [editingEducation, setEditingEducation] = useState<any>(null);
  const [showDeleteEducationModal, setShowDeleteEducationModal] = useState(false);
  const [educationToDelete, setEducationToDelete] = useState<string | null>(null);
  const [showDeleteAchievementModal, setShowDeleteAchievementModal] = useState(false);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [showEditAchievementForm, setShowEditAchievementForm] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handlePostRate = async (rating: number, updatedPost: any) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === updatedPost.id) {
          // Optimistic update
          const previousUserRating = post.userRating || 0;
          let newTotalRatings = post.totalRatings || 0;
          let newRating = post.rating || 0;
          if (rating === 0) {
            // Unrate
            newTotalRatings = Math.max(0, newTotalRatings - 1);
            newRating = newTotalRatings > 0
              ? ((post.rating * (post.totalRatings || 0)) - previousUserRating) / newTotalRatings
              : 0;
          } else if (previousUserRating === 0) {
            // New rating
            newTotalRatings = newTotalRatings + 1;
            newRating = ((post.rating * (post.totalRatings || 0)) + rating) / newTotalRatings;
          } else {
            // Change rating
            newRating = ((post.rating * (post.totalRatings || 0)) - previousUserRating + rating) / newTotalRatings;
          }
          return {
            ...post,
            rating: Number(newRating.toFixed(1)),
            totalRatings: newTotalRatings,
            userRating: rating
          };
        }
        return post;
      })
    );

    // API call for rating/unrating
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token');
      const isPersonal = updatedPost.isPersonal;
      let postId = updatedPost.id;
      if (typeof postId === 'string') {
        postId = postId.replace(/^(personal_|community_)/, '');
      }
      let url = '';
      if (isPersonal) {
        url = `/api/posts/${postId}/rate/`;
      } else {
        // Use the correct endpoint for community posts
        const communitySlug = updatedPost.community;
        if (!communitySlug) {
          console.error('Cannot rate community post: missing community slug in post object', updatedPost);
          return;
        }
        url = `/api/communities/${communitySlug}/posts/${postId}/rate/`;
      }
      console.log('[handlePostRate] postId:', postId, 'isPersonal:', isPersonal, 'url:', url);
      if (rating === 0) {
        // Unrate
        await api.delete(url);
      } else {
        // Rate
        await api.post(url, { rating: Number(rating) });
      }
      // Optionally, you could fetch the updated post from the server here and update state
    } catch (error) {
      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === updatedPost.id
            ? post // revert to previous post object
            : post
        )
      );
      // Optionally show error toast
      // toast.error('Failed to save rating. Please try again.');
    }
  };

  const handleCommentAdded = (postId: string | number) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, commentCount: (post.commentCount || 0) + 1 }
          : post
      )
    );
  };

  // Handle scroll for header effects
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Debug logging before fetch
      console.log('[fetchProfile] currentUser:', currentUser);
      console.log('[fetchProfile] username param:', username);
      console.log('[fetchProfile] token:', localStorage.getItem('access_token'));
      console.log('[fetchProfile] API_URL:', API_URL);
      console.log('[fetchProfile] VITE_API_URL:', import.meta.env.VITE_API_URL);
      console.log('[fetchProfile] Environment:', import.meta.env.MODE);

      // Check if token exists
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in to view your profile');
        return;
      }
        
      // Check if viewing own profile
      if (currentUser && username === currentUser.username) {
        console.log('[fetchProfile] Fetching own profile');
        setIsOwnProfile(true);
        
        const profileUrl = `${API_URL}/auth/profile/`;
        console.log('[fetchProfile] Making request to:', profileUrl);
        
        // Make API call to get own profile
        const response = await axios.get(profileUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('[fetchProfile] Own profile response:', response.data);

        // Transform the data to match our frontend interface
        const transformedData = {
          ...response.data,
          personalityTags: response.data.personality_tags || response.data.personalityTags || [],
          workExperience: response.data.work_experience || [],
          skills: response.data.skills || [],
          certifications: response.data.certifications || [],
          connectionStatus: response.data.connection_status === undefined ? 'none' : response.data.connection_status,
          connectionRequestId: response.data.connection_request_id,
          private: response.data.private // <-- Ensure this is set
        };

        console.log('DEBUG - Connection Status:', {
          raw: response.data.connection_status,
          transformed: transformedData.connectionStatus,
          isNone: transformedData.connectionStatus === 'none',
          isNull: transformedData.connectionStatus === null,
          isUndefined: transformedData.connectionStatus === undefined
        });

        setProfile(transformedData);
        setIsFollowing(false);
      } else {
        console.log('[fetchProfile] Fetching other user profile:', username);
        setIsOwnProfile(false);
        // Make API call to get public profile
        console.log('Making request to backend for profile:', username);
        const response = await axios.get(`${API_URL}/auth/profile/${username}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Log the complete backend response
        console.log('Complete backend response:', {
          status: response.status,
          headers: response.headers,
          data: response.data,
          connection_status: response.data.connection_status,
          connection_request_id: response.data.connection_request_id,
          raw_response: response
        });

        // Transform the data to match our frontend interface
        const transformedData = {
          ...response.data,
          personalityTags: response.data.personality_tags || response.data.personalityTags || [],
          workExperience: response.data.work_experience || [],
          skills: response.data.skills || [],
          certifications: response.data.certifications || [],
          connectionStatus: response.data.connection_status === undefined ? 'none' : response.data.connection_status,
          connectionRequestId: response.data.connection_request_id,
          private: response.data.private // <-- Ensure this is set
        };

        console.log('Connection details:', {
          raw_status: response.data.connection_status,
          raw_type: typeof response.data.connection_status,
          transformed_status: transformedData.connectionStatus,
          transformed_type: typeof transformedData.connectionStatus,
          request_id: transformedData.connectionRequestId,
          is_null: transformedData.connectionStatus === null,
          is_undefined: transformedData.connectionStatus === undefined,
          is_none: transformedData.connectionStatus === 'none'
        });

        // Log what button should show
        console.log('Button visibility logic:', {
          should_show_connect: !transformedData.connectionStatus || transformedData.connectionStatus === 'none',
          should_show_pending: transformedData.connectionStatus === 'pending',
          should_show_message: ['connected', 'accepted'].includes(transformedData.connectionStatus || ''),
          current_status: transformedData.connectionStatus
        });

        setProfile(transformedData);
        setIsFollowing(transformedData.connectionStatus === 'pending');
      }
    } catch (err: any) {
      console.error('Profile fetch error:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
      // Debug logging after fetch
      console.log('[fetchProfile] After fetch, profile:', profile);
      console.log('[fetchProfile] isOwnProfile:', isOwnProfile);
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoadingPosts(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        setPosts([]);
        return;
      }
      // Fetch both personal and community posts
      const [personalResponse, communityResponse] = await Promise.all([
        axios.get(`${API_URL}/communities/posts/feed/`, {
          params: { type: 'personal' },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/communities/posts/feed/`, {
          params: { type: 'community' },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      // Get the profile user id or username
      const profileUserId = profile?.user?.id || profile?.id;
      const profileUsername = profile?.user?.username || profile?.username;
      // Combine and filter posts authored by the profile user
      const allPosts = [
        ...(personalResponse.data.posts || []),
        ...(communityResponse.data.posts || [])
      ].filter(post =>
        (post.author?.id && profileUserId && post.author.id === profileUserId) ||
        (post.author?.username && profileUsername && post.author.username === profileUsername)
      );
      // Format posts as before
      const formattedPosts = allPosts.map((post: any) => {
        const isPersonal = (
          post.type === 'personal' ||
          post.isPersonal === true ||
          (!post.community && !post.community_slug && !post.communitySlug)
        );
        const community = (
          post.community && typeof post.community === 'object'
            ? post.community.slug
            : typeof post.community === 'string'
              ? post.community
              : post.community_slug || post.communitySlug || ''
        );
        if (!community && !isPersonal) {
          console.warn('Community slug missing for community post:', post);
        }
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          author: post.author.username, // Fix: author should be a string
          author_role: post.author_role || 'User',
          timestamp: post.created_at,
          rating: post.rating || 0,
          totalRatings: post.total_ratings || 0,
          userRating: post.user_rating || 0,
          commentCount: post.comment_count || 0,
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          media: post.media?.map((m: any) => ({
            type: m.type,
            url: m.file,
            thumbnail: m.thumbnail
          })) || [],
          isPersonal,
          community,
          communityName: post.community?.name || community || '', // Use name for display
          topComment: post.top_comment ? {
            author: post.top_comment.author.username, // Fix: author should be a string
            content: post.top_comment.content,
            timestamp: post.top_comment.timestamp
          } : undefined
        };
      });
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username, currentUser]);

  useEffect(() => {
    if (profile) {
      fetchPosts();
    }
  }, [profile]);

  // Add console log to check profile state
  useEffect(() => {
    console.log('Current profile state:', profile);
    if (profile) {
      console.log('Profile data in state:', {
        personal_story: profile.personal_story,
        personalityTags: profile.personality_tags,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        workExperience: profile.workExperience
      });
    }
  }, [profile]);

  // Monitor profile state changes
  useEffect(() => {
    console.log('Profile state changed:', {
      hasProfile: !!profile,
      workExperience: profile?.workExperience,
      workExperienceLength: profile?.workExperience?.length
    });
  }, [profile]);

  // Monitor work experiences API call
  useEffect(() => {
    const fetchWorkExperiences = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        console.log('Fetching work experiences...');
        const response = await axios.get(`${API_URL}/auth/work-experience/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Work experiences API response:', {
          status: response.status,
          data: response.data,
          dataLength: response.data?.length
        });
      } catch (error) {
        console.error('Error fetching work experiences:', error);
      }
    };

    fetchWorkExperiences();
  }, []);

  const handleFollow = async () => {
    if (!profile || connectingIds.has(profile.id)) return;
    
    try {
      console.log('Attempting to send connection request:', {
        profile_id: profile.id,
        current_status: profile.connectionStatus,
        request_id: profile.connectionRequestId
      });

      // Add to connecting set
      setConnectingIds(prev => new Set([...prev, profile.id]));
      setConnectionError(null);
      
      // Update UI immediately
      setIsFollowing(true);

      // Send request to backend
      const response = await axios.post(`${API_URL}/connections/requests/`, {
        receiver_id: profile.id
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Connection request response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      // Update profile state with connection request ID
      setProfile(prev => {
        const newProfile = prev ? {
          ...prev,
          connectionStatus: 'pending',
          connectionRequestId: response.data.id
        } : null;
        
        console.log('Profile state after connection request:', {
          old_status: prev?.connectionStatus,
          new_status: newProfile?.connectionStatus,
          request_id: newProfile?.connectionRequestId
        });
        
        return newProfile;
      });

    } catch (error: any) {
      console.error('Connection request error:', {
        error_message: error.message,
        error_response: error.response?.data,
        error_status: error.response?.status,
        error_details: error.response?.data?.detail
      });
      
      // Only revert UI state if it's not a duplicate request error
      if (!error.response?.data?.detail?.includes('already exists')) {
        setIsFollowing(false);
      }

      // Show specific error message
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to send connection request. Please try again.';
      setConnectionError(errorMessage);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(profile.id);
        return newSet;
      });
    }
  };

  const handleCancelRequest = async () => {
    if (!profile?.connectionRequestId || connectingIds.has(profile.id)) return;
    
    try {
      console.log('Attempting to cancel connection request:', {
        profileId: profile.id,
        requestId: profile.connectionRequestId,
        currentStatus: profile.connectionStatus
      });

      setConnectingIds(prev => new Set([...prev, profile.id]));
      setConnectionError(null);
      
      // Call API to cancel the request
      const response = await axios.post(`${API_URL}/connections/requests/${profile.connectionRequestId}/cancel/`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Cancel request response:', {
        status: response.status,
        data: response.data
      });

      // Update profile state
      setProfile(prev => {
        const newProfile = prev ? {
          ...prev,
          connectionStatus: 'connect',
          connectionRequestId: undefined
        } : null;

        console.log('Updated profile state after cancel:', {
          oldStatus: prev?.connectionStatus,
          newStatus: newProfile?.connectionStatus,
          requestId: newProfile?.connectionRequestId
        });

        return newProfile;
      });
      setIsFollowing(false);

    } catch (error: any) {
      console.error('Cancel request error details:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        message: error.response?.data?.detail || error.message
      });

      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to cancel connection request. Please try again.';
      setConnectionError(errorMessage);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(profile.id);
        return newSet;
      });
    }
  };

  const getTabButtonClass = (tabName: string) => {
    return `px-4 py-2 font-medium rounded-lg transition-all border ${
      activeTab === tabName
        ? 'bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover'
        : 'bg-white dark:bg-dark-card-hover text-gray-500 dark:text-dark-text-secondary border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover'
    }`;
  };

  const handlePostClick = (postId: string, postObj?: any) => {
    if (postObj && postObj.isPersonal) {
      navigate(`/posts/personal/${postId}`);
    } else if (postObj && postObj.community) {
      // For community posts, pass the slug as a query param
      navigate(`/posts/community/${postId}?slug=${postObj.community}`);
    } else {
      // Fallback to personal
      navigate(`/posts/personal/${postId}`);
    }
  };

  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) return 'https://i.pravatar.cc/150?img=1';
    if (avatarPath.startsWith('http')) return avatarPath;
    if (avatarPath.includes('media/')) {
      const cleanPath = avatarPath.replace(/^.*?media\//, '');
      return `${import.meta.env.VITE_API_URL}/media/${cleanPath}`;
    }
    if (avatarPath.startsWith('avatars/')) {
      return `${import.meta.env.VITE_API_URL}/media/avatars/${avatarPath.replace('avatars/', '')}`;
    }
    const path = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
    return `${import.meta.env.VITE_API_URL}/api/${path}`;
  };

  const getTagGradient = (color: string) => {
    if (color.includes('from-') && color.includes('to-')) {
      return color;
    }
    const colorConfig = {
      'purple': 'from-purple-500 to-pink-500',
      'blue': 'from-blue-500 to-cyan-500',
      'green': 'from-green-500 to-emerald-500',
      'orange': 'from-orange-500 to-red-500',
      'pink': 'from-pink-500 to-rose-500'
    };
    return colorConfig[color as keyof typeof colorConfig] || 'from-purple-500 to-pink-500';
  };

  const handleMenuClick = (id: string, item: any) => {
    if (id === openMenuId) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(id);
    }
  };

  const handleUpdateExperience = (experienceId: string) => {
    // TODO: Implement update functionality
    console.log('Update experience:', experienceId);
    setOpenMenuId(null);
  };

  const handleEditExperience = (experienceId: string) => {
    console.log('Edit experience clicked:', experienceId);
    const experience = profile?.workExperience?.find(exp => exp.id === experienceId);
    console.log('Found experience:', experience);
    if (experience) {
      console.log('Setting editing experience:', experience);
      setEditingExperience(experience);
      setEditingExperienceId(experienceId);
      setShowExperienceForm(true);
      console.log('Experience form state after setting:', {
        showExperienceForm: true,
        editingExperience,
        editingExperienceId
      });
    } else {
      console.log('No experience found with id:', experienceId);
    }
    setOpenMenuId(null);
  };

  const handleExperienceFormSuccess = () => {
    setShowExperienceForm(false);
    setEditingExperience(null);
    setEditingExperienceId(null);
    fetchProfile();
  };

  const handleExperienceFormCancel = () => {
    setShowExperienceForm(false);
    setEditingExperience(null);
    setEditingExperienceId(null);
  };

  const handleDeleteExperience = async (experienceId: string) => {
    setExperienceToDelete(experienceId);
    setShowDeleteExperienceModal(true);
  };

  const confirmDeleteExperience = async () => {
    if (!experienceToDelete) return;
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch(`${API_URL}/auth/work-experience/${experienceToDelete}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete experience');
      }

      // Refresh the profile to update the experience list
      await fetchProfile();
    } catch (error) {
      console.error('Error deleting experience:', error);
    } finally {
      setShowDeleteExperienceModal(false);
      setExperienceToDelete(null);
    }
  };

  const cancelDeleteExperience = () => {
    setShowDeleteExperienceModal(false);
    setExperienceToDelete(null);
  };

  const handleAddCertification = () => {
    console.log('Add Certification button clicked');
    setShowCertificationModal(true);
    console.log('showCertificationModal set to true');
  };

  const handleCertificationSuccess = async () => {
    console.log('Certification form submitted successfully');
    setShowCertificationModal(false);
    try {
      await fetchProfile();
      console.log('Profile refreshed after certification update');
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const handleDeleteCertification = async (certificationId: string) => {
    if (!certificationId || certificationId.startsWith('temp-')) {
      console.error('Invalid certification ID for deletion');
      return;
    }
    console.log('Delete button clicked for certification:', certificationId);
    setIsDeletingCert(certificationId);
    console.log('isDeletingCert set to:', certificationId);
  };

  const confirmDeleteCertification = async () => {
    if (!isDeletingCert) {
      console.log('No certification ID to delete');
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Deleting certification:', isDeletingCert);
      await axios.delete(`${API_URL}/auth/certifications/${isDeletingCert}/delete/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Certification deleted successfully');
      await fetchProfile();
      setIsDeletingCert(null);
    } catch (error) {
      console.error('Error deleting certification:', error);
    }
  };

  const cancelDeleteCertification = () => {
    console.log('Canceling delete operation');
    setIsDeletingCert(null);
  };

  const debouncedFetchProfile = useCallback(() => {
    if (fetchProfileTimeoutRef.current) {
      clearTimeout(fetchProfileTimeoutRef.current);
    }
    fetchProfileTimeoutRef.current = setTimeout(() => {
      fetchProfile();
    }, 300);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchProfileTimeoutRef.current) {
        clearTimeout(fetchProfileTimeoutRef.current);
      }
    };
  }, []);

  // Add useEffect to monitor certification state changes
  useEffect(() => {
    console.log('Certification state changed:', {
      showModal: showCertificationModal,
      currentRefValue: selectedCertification
    });
  }, [showCertificationModal]);

  // Add click outside handler to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.certification-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleEditCertification = (cert: Certification) => {
    setEditingCertification(cert);
    setShowCertificationForm(true);
  };

  const handleCertificationFormClose = () => {
    setEditingCertification(null);
    setShowCertificationForm(false);
  };

  const handleCertificationFormSubmit = async (formData: Certification) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (editingCertification?.id) {
        // Update existing certification using PATCH
        await axios.patch(`${API_URL}/auth/certifications/${editingCertification.id}/`, formData, { headers });
      } else {
        // Create new certification
        await axios.post(`${API_URL}/auth/certifications/`, formData, { headers });
      }
      await fetchProfile(); // Refresh the profile data
      handleCertificationFormClose();
    } catch (error) {
      console.error('Error saving certification:', error);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!skillId) {
      console.error('Invalid skill ID for deletion');
      return;
    }
    console.log('Delete button clicked for skill:', skillId);
    setSkillToDelete(skillId);
    setShowDeleteSkillModal(true);
  };

  const confirmDeleteSkill = async () => {
    if (!skillToDelete) {
      console.log('No skill ID to delete');
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Deleting skill:', skillToDelete);
      await axios.delete(`${API_URL}/auth/skills/${skillToDelete}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Skill deleted successfully');
      await fetchProfile();
      setSkillToDelete(null);
      setShowDeleteSkillModal(false);
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  };

  const cancelDeleteSkill = () => {
    console.log('Canceling skill delete operation');
    setSkillToDelete(null);
    setShowDeleteSkillModal(false);
  };

  const formatInstitutionType = (type: string) => {
    switch (type) {
      case 'high_school':
        return 'High School';
      case 'college':
        return 'College';
      case 'university':
        return 'University';
      case 'bootcamp':
        return 'Bootcamp';
      case 'online_course':
        return 'Online Course';
      default:
        return 'University';
    }
  };

  const handleEditEducation = (education: Education) => {
    setEditingEducation(education);
    setShowEducationForm(true);
  };

  const handleDeleteEducation = async (educationId: string) => {
    setEducationToDelete(educationId);
    setShowDeleteEducationModal(true);
  };

  const confirmDeleteEducation = async () => {
    if (!educationToDelete) return;
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found');
        return;
      }

      await axios.delete(
        `${API_URL}/auth/education/${educationToDelete}/delete/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      await fetchProfile();
      setShowDeleteEducationModal(false);
      setEducationToDelete(null);
    } catch (error) {
      console.error('Error deleting education:', error);
      // You might want to show an error message to the user here
    }
  };

  const cancelDeleteEducation = () => {
    setShowDeleteEducationModal(false);
    setEducationToDelete(null);
  };

  const handleEditAchievement = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowEditAchievementForm(true);
  };

  const handleDeleteAchievement = (achievementId: string) => {
    setSelectedAchievementId(achievementId);
    setShowDeleteAchievementModal(true);
  };

  const confirmDeleteAchievement = async () => {
    if (!selectedAchievementId) return;
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token found');
        return;
      }

      await axios.delete(`${API_URL}/auth/achievements/${selectedAchievementId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      await fetchProfile();
      setShowDeleteAchievementModal(false);
      setSelectedAchievementId(null);
    } catch (error) {
      console.error('Error deleting achievement:', error);
    }
  };

  const cancelDeleteAchievement = () => {
    setShowDeleteAchievementModal(false);
    setSelectedAchievementId(null);
  };

  // Fetch user communities from backend
  const fetchUserCommunities = async () => {
    setIsLoadingCommunities(true);
    setCommunitiesError(null);
    try {
      const response = await api.get(API_ENDPOINTS.USER_COMMUNITIES);
      // Map backend fields to frontend Community interface
      const data = response.data.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        total_members: c.total_members || c.members_count || 0,
        active_members: c.active_members || 0,
        icon: c.icon || '🌟',
        bannerUrl: c.banner || '',
        category: c.category,
        isJoined: true,
        activity: c.activity_score || 0,
        topics: c.topics || [],
      }));
      setCommunities(data);
    } catch (err: any) {
      setCommunitiesError('Failed to load communities');
      setCommunities([]);
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  // Fetch communities when profile is loaded
  useEffect(() => {
    if (profile) {
      fetchUserCommunities();
    }
  }, [profile]);

  // Fetch user friends from backend
  const fetchUserFriends = async () => {
    setIsLoadingFriends(true);
    setFriendsError(null);
    try {
      const response = await api.get('connections/connections/friends/');
      const data = response.data.map((f: any) => ({
        id: f.id,
        user: {
          name: `${f.first_name || ''} ${f.last_name || ''}`.trim() || f.username,
          username: f.username,
          avatarUrl: getAvatarUrl(f.avatar),
          personalityTags: f.personality_tags || [],
          badges: f.badges || [],
          lastActive: f.last_active || 'Online',
          matchScore: 100,
          connectionStrength: f.connection_strength || 0,
        },
        message: `Connected ${f.connected_since ? new Date(f.connected_since).toLocaleDateString() : ''}`,
        timestamp: f.connected_at,
        mutualConnections: f.mutual_connections || 0,
        status: 'accepted',
        interests: f.interests || [],
        commonInterests: f.common_interests || [],
        location: f.location || 'Unknown Location',
        mutualFriends: [],
        connectionStatus: 'connected',
        lastInteraction: f.last_interaction,
      }));
      setFriends(data);
    } catch (err: any) {
      setFriendsError('Failed to load friends');
      setFriends([]);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Fetch friends when profile is loaded
  useEffect(() => {
    if (profile) {
      fetchUserFriends();
    }
  }, [profile]);

  const handleConnect = async (friendId: string) => {
    if (connectingIds.has(friendId)) return;
    try {
      setConnectingIds(prev => new Set([...prev, friendId]));
      setConnectionError(null);
      // Optimistically update UI
      setFriends(prevFriends =>
        prevFriends.map(friend =>
          friend.id === friendId
            ? { ...friend, connectionStatus: 'pending' }
            : friend
        )
      );
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');
      const response = await axios.post(
        `${API_URL}/connections/requests/`,
        { receiver_id: friendId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // Update with request ID if needed
      setFriends(prevFriends =>
        prevFriends.map(friend =>
          friend.id === friendId
            ? { ...friend, connectionStatus: 'pending', connectionRequestId: response.data.id }
            : friend
        )
      );
    } catch (error: any) {
      // Revert UI on error
      setFriends(prevFriends =>
        prevFriends.map(friend =>
          friend.id === friendId
            ? { ...friend, connectionStatus: 'connect' }
            : friend
        )
      );
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to send connection request. Please try again.';
      setConnectionError(errorMessage);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error || !profile) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error || 'Profile not found'}</div>;
  }

  // Keep only one userData declaration and merge the properties
  const userData: Profile = {
    ...profile, // Spread the profile data first
    followers: profile?.followers || 1234,
    following: profile?.following || 891,
    posts: profile?.posts || 456,
    personalPosts: profile?.personalPosts || 234,
    communityPosts: profile?.communityPosts || 222,
    rating: profile?.rating || 4.9,
    connectionStrength: profile?.connectionStrength || 85,
    skills: profile?.skills || [
      { id: '1', name: 'React.js', level: 95 },
      { id: '2', name: 'Node.js', level: 90 },
      { id: '3', name: 'TypeScript', level: 88 },
      { id: '4', name: 'Python', level: 85 },
      { id: '5', name: 'Machine Learning', level: 82 },
      { id: '6', name: 'AWS', level: 80 },
      { id: '7', name: 'Docker', level: 78 },
      { id: '8', name: 'GraphQL', level: 75 },
      { id: '9', name: 'MongoDB', level: 72 },
      { id: '10', name: 'PostgreSQL', level: 70 }
    ],
    languages: profile?.languages || [
      { name: 'English', proficiency: 'Native' },
      { name: 'Spanish', proficiency: 'Intermediate' },
      { name: 'Mandarin', proficiency: 'Basic' }
    ],
    availability: profile?.availability || {
      mentoring: true,
      collaboration: true,
      networking: true
    },
    education: (profile?.education || [
      {
        id: 'edu-1',
        school: 'Stanford University',
        degree: 'Master\'s',
        field: 'Computer Science',
        year: '2021',
        gpa: '3.9',
        start_date: '2019-09-01',
        end_date: '2021-06-01',
        is_current: false,
        duration: '2 years',
        institution_type: 'University',
        description: 'Master\'s degree in Computer Science with focus on AI and Machine Learning',
        achievements: ['Published research paper on ML algorithms', 'Teaching Assistant for Data Structures'],
        skills_learned: ['Machine Learning', 'AI', 'Advanced Algorithms'],
        location: 'Stanford, CA',
        website: 'https://stanford.edu',
        is_verified: true
      },
      {
        id: 'edu-2',
        school: 'UC Berkeley',
        degree: 'Bachelor\'s',
        field: 'Data Science',
        year: '2019',
        gpa: '3.8',
        start_date: '2015-09-01',
        end_date: '2019-06-01',
        is_current: false,
        duration: '4 years',
        institution_type: 'University',
        description: 'Bachelor\'s degree in Data Science with minor in Statistics',
        achievements: ['Dean\'s List all semesters', 'Led Data Science Club'],
        skills_learned: ['Data Analysis', 'Statistics', 'Python'],
        location: 'Berkeley, CA',
        website: 'https://berkeley.edu',
        is_verified: true
      }
    ]).map(edu => ({
      ...edu,
      description: edu.description !== undefined ? edu.description : '',
      achievements: edu.achievements !== undefined ? edu.achievements : [],
      skills_learned: edu.skills_learned !== undefined ? edu.skills_learned : [],
      location: edu.location !== undefined ? edu.location : '',
      website: edu.website !== undefined ? edu.website : '',
      is_verified: edu.is_verified !== undefined ? edu.is_verified : false
    })),
    workExperience: profile?.workExperience || [],
    achievements: profile?.achievements || [
      {
        id: 'ach-1',
        title: 'Best Paper Award',
        date: '2023-05-15',
        description: 'Received best paper award at ML Conference 2023',
        category: 'Academic',
        impact: 'Published in top-tier journal',
        team: 'Research Team Alpha',
        link: 'https://example.com/paper'
      },
      {
        id: 'ach-2',
        title: 'Open Source Contribution',
        date: '2023-08-20',
        description: 'Major contribution to TensorFlow library',
        category: 'Technical',
        impact: 'Improved performance by 25%',
        team: 'Open Source Community',
        link: 'https://github.com/tensorflow/tensorflow'
      }
    ],
    isFollowing: profile?.isFollowing || false,
    certifications: profile?.certifications || [
      {
        id: "cert-1",
        name: "AWS Certified Solutions Architect",
        issuing_organization: "Amazon Web Services",
        issue_date: "2023-06-15",
        expiry_date: "2026-06-15",
        credential_id: "AWS-123456",
        credential_url: "https://aws.amazon.com/verification"
      },
      {
        id: "cert-2",
        name: "Google Cloud Professional",
        issuing_organization: "Google Cloud",
        issue_date: "2023-08-20",
        expiry_date: "2026-08-20",
        credential_id: "GCP-789012",
        credential_url: "https://google.com/cloud/verify"
      }
    ],
    cover_photo: profile?.cover_photo || '',
    username: profile?.username || 'username',
    name: profile?.name || 'User Name',
    avatar: profile?.avatar || '/default.jpg',
    bio: profile?.bio || 'No bio available.',
    location: profile?.location || 'Location',
    website: profile?.website || 'website.com',
    interests: profile?.interests || [],
    personality_tags: profile?.personality_tags || [
      { id: 1, name: 'Innovative', color: 'blue' },
      { id: 2, name: 'Creative', color: 'purple' },
      { id: 3, name: 'Leader', color: 'pink' }
    ],
    connectionStatus: profile?.connectionStatus || 'pending'
  };

  // Mock data for new sections
  const personalPosts: Post[] = [
    {
      id: 1,
      content: 'A deep dive into neural network architectures...',
      author: 'Sarah Chen',
      timestamp: '2 days ago',
      likes: 45,
      comments: 45,
      shares: 128,
      media: [
        { type: 'image', url: 'https://example.com/neural-networks.jpg' },
        { type: 'video', url: 'https://example.com/neural-networks-video.mp4' }
      ],
      title: 'Neural Network Architectures Deep Dive',
      rating: 4.7,
      commentCount: 45,
      isPersonal: true
    },
    {
      id: 2,
      content: 'Finding the right balance between work and personal life has been challenging but rewarding. Here are some tips that have helped me maintain harmony.',
      author: 'John Doe',
      timestamp: '5 days ago',
      likes: 23,
      comments: 23,
      shares: 89,
      media: [
        { type: 'image', url: 'https://example.com/work-life-balance.jpg' },
        { type: 'video', url: 'https://example.com/work-life-balance-video.mp4' }
      ],
      title: 'Work-Life Balance Tips',
      rating: 4.5,
      commentCount: 23,
      isPersonal: true
    },
    {
      id: 3,
      content: 'A collection of books that have inspired and educated me this year. From technical deep dives to personal development, these reads have been transformative.',
      author: 'Maria Garcia',
      timestamp: '1 week ago',
      likes: 45,
      comments: 45,
      shares: 156,
      media: [
        { type: 'image', url: 'https://example.com/favorite-books.jpg' },
        { type: 'video', url: 'https://example.com/favorite-books-video.mp4' }
      ],
      title: 'My Favorite Books of the Year',
      rating: 4.8,
      commentCount: 45,
      isPersonal: true
    }
  ];

  // Before rendering ProfileForm
  console.log('[render] currentUser:', currentUser);
  console.log('[render] username param:', username);
  console.log('[render] isOwnProfile:', isOwnProfile);
  console.log('[render] profile:', profile);

  // Compute stats from posts
  const personalPostsCount = posts.filter(p => Boolean(p.isPersonal)).length;
  const communityPostsCount = posts.filter(p => !p.isPersonal).length;
  const totalPostsCount = posts.length;
  const averageRating = posts.length > 0 ? (posts.reduce((sum, p) => sum + (p.rating || 0), 0) / posts.length) : 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg">
      {/* Cover Photo with Parallax Effect */}
      <div 
        className="h-48 sm:h-64 relative overflow-hidden w-full"
        style={{
          transform: `translateY(${isScrolled ? '-20px' : '0'})`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        <img
          src={profile?.cover_photo || "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=2400&auto=format&fit=crop&q=80"}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/50"></div>
        <div className="absolute bottom-4 right-4">
          <button className="bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover px-4 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2 transition-all duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Cover
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0 mb-6 lg:mb-0">
            <div className="sticky top-20">
              <Navigation />
            </div>
          </div>

          {/* Main Profile Content */}
          <div className="flex-1 w-full -mt-24">
            {/* Profile Info Card */}
            <div className="bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-dark-border">
              <div className="p-4 sm:p-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar.startsWith('http') ? profile.avatar : `${import.meta.env.VITE_API_URL}${profile.avatar}`}
                        alt={`${profile.username}'s profile`}
                        className="w-24 h-24 rounded-full border-4 border-white dark:border-dark-bg"
                        onError={(e) => {
                          console.log('Avatar load error:', e);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white dark:border-dark-bg bg-gray-200 dark:bg-dark-card-hover flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-gray-400 dark:text-dark-text-secondary" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-dark-bg"></div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                      {profile?.name || `${profile?.user?.first_name || ''} ${profile?.user?.last_name || ''}`}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">@{profile?.username}</p>
                  </div>
                  <p className="mt-2 text-gray-600 dark:text-dark-text-secondary max-w-lg">{profile?.bio || 'No bio available.'}</p>
                  
                  {/* User Info */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-gray-400 dark:text-dark-text-secondary">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{profile?.location || 'No location set'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GlobeAltIcon className="w-4 h-4" />
                      <a 
                        href={`https://${profile?.website}`} 
                        className="text-blue-400 hover:underline"
                      >
                        {profile?.website || 'No website set'}
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        Joined {profile?.user?.date_joined ? 
                          new Date(profile.user.date_joined).toLocaleDateString('en-US', { 
                              month: 'long',
                              year: 'numeric'
                          }) : 
                          'No date available'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Personality Tags */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {profile?.personality_tags?.map((tag, index) => (
                      <span
                        key={index}
                        className={`flex items-center gap-1 px-3 py-1 font-semibold rounded-full text-sm shadow-md`}
                        style={isValidCssColor(tag.color) ? { backgroundColor: tag.color, color: '#fff' } : undefined}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  {/* User Interests */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-3">Interests</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {userData.interests.map((interest) => (
                        <span
                          key={interest.id}
                          className="px-3 py-1 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/30 rounded-full text-sm font-medium border border-purple-100 dark:border-purple-900"
                        >
                          {interest.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    {isOwnProfile ? (
                      // Show Edit Profile button for own profile
                      <button 
                        onClick={() => setShowProfileForm(true)}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm hover:shadow-md"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      // Show appropriate buttons for other profiles
                      <>
                        {profile?.connectionStatus === 'connect' && profile?.id !== currentUser?.id ? (
                          // Show Connect button when status is 'connect' and not viewing own profile
                          <button 
                            onClick={handleFollow}
                            disabled={connectingIds.has(profile.id)}
                            className={`px-6 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md ${
                              connectingIds.has(profile.id) ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600'
                            }`}
                          >
                            {connectingIds.has(profile.id) ? (
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
                        ) : profile?.connectionStatus === 'pending' ? (
                          // If request is pending, show pending status and cancel button
                          <div className="flex items-center gap-2">
                            <button
                              disabled
                              className="px-6 py-2 bg-gray-100 dark:bg-dark-card-hover text-gray-500 dark:text-dark-text-secondary rounded-lg flex items-center gap-2 cursor-not-allowed"
                            >
                              <ClockIcon className="w-5 h-5" />
                              <span>Request Pending</span>
                            </button>
                            {profile.connectionRequestId && (
                              <button
                                onClick={handleCancelRequest}
                                disabled={connectingIds.has(profile.id)}
                                className={`px-6 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-all hover:scale-105 font-medium ${
                                  connectingIds.has(profile.id) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {connectingIds.has(profile.id) ? (
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
                            )}
                          </div>
                        ) : profile?.connectionStatus === 'accepted' ? (
                          // If connection is accepted, show message button
                          <button className="px-6 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg font-medium transition-all">
                            Message
                          </button>
                        ) : (
                          // Default to Connect button for any other status
                          <button 
                            onClick={handleFollow}
                            disabled={connectingIds.has(profile.id)}
                            className={`px-6 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md ${
                              connectingIds.has(profile.id) ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600'
                            }`}
                          >
                            {connectingIds.has(profile.id) ? (
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
                        {/* Only show Message button alongside Connect button when not connected */}
                        {profile?.connectionStatus === 'connect' && profile?.id !== currentUser?.id && (
                          <button className="px-6 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg font-medium transition-all">
                            Message
                          </button>
                        )}
                      </>
                    )}
                    {connectionError && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {connectionError}
                      </div>
                    )}
                  </div>

                  {/* Profile Completion */}
                  {isOwnProfile && (
                    <div className="mt-6 w-full max-w-sm mx-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-dark-text">Profile Completion</span>
                        <span className="text-sm font-medium text-purple-600">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <button 
                        onClick={() => setShowProfileForm(true)}
                        className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
                  <div className="text-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg p-3 transition-all duration-200">
                    <div className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                      <span className="group-hover:text-gray-700 dark:group-hover:text-dark-text">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(totalPostsCount)}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-dark-text-secondary group-hover:text-gray-700 dark:group-hover:text-dark-text">Total Posts</div>
                  </div>
                  <div className="text-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg p-3 transition-all duration-200">
                    <div className="flex items-center justify-center">
                      <StarIcon className="w-5 h-5 text-yellow-500 mr-1" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-dark-text">{averageRating.toFixed(1)}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-dark-text-secondary group-hover:text-gray-700 dark:group-hover:text-dark-text">Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Strength */}
            <div className="mt-6 bg-white dark:bg-dark-card rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-border">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Connection Strength</h2>
              <div className="w-full bg-gray-100 dark:bg-dark-card-hover rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2 rounded-full"
                  style={{ width: `${userData.connectionStrength}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-2">
                Based on your interactions and engagement with the community
              </p>
            </div>

            {/* Personal Story */}
            <div className="mt-6 bg-white dark:bg-dark-card rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-border">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Personal Story</h2>
              <p className="text-gray-600 dark:text-dark-text-secondary">{profile?.personal_story || profile?.personalStory || 'No personal story available.'}</p>
            </div>

            {/* Experience Section */}
            <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-6 border border-gray-200 dark:border-dark-border">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Experience</h2>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowExperienceForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Experience</span>
                  </button>
                )}
              </div>

              {/* Timeline */}
              <div className="relative">
                {profile?.workExperience?.map((experience, index) => (
                  <div key={experience.id} className="mb-12 relative group">
                    <div className="flex items-start gap-6">
                      {/* Timeline Line */}
                      <div className="absolute left-8 top-14 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>
                      
                      {/* Company Logo/Icon */}
                      <div className="relative z-10">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                          {experience.company.charAt(0)}
                        </div>
                      </div>
                      
                      {/* Experience Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">{experience.role}</h3>
                            <p className="text-purple-600 dark:text-purple-400 font-medium">{experience.company}</p>
                            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{experience.duration}</p>
                          </div>
                          
                          {isOwnProfile && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleEditExperience(experience.id)}
                                className="px-3 py-1.5 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteExperience(experience.id)}
                                className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Experience Highlights */}
                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-2">Highlights</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-dark-text-secondary space-y-1">
                              {experience.highlights.map((highlight, idx) => (
                                <li key={idx}>{highlight}</li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Skills Used */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {experience.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-dark-card-hover text-gray-700 dark:text-dark-text-secondary rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {/* Additional Stats */}
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="text-center p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Team Size</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-dark-text">{experience.team_size}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Projects</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-dark-text">{experience.projects_count}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Impact Score</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-dark-text">{experience.impact_score}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Certifications */}
            <div className="mt-6 bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Professional Certifications</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">Verified credentials and certifications</p>
                </div>
                {isOwnProfile && (
                  <button 
                    onClick={() => setShowCertificationModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Certification</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userData.certifications?.map((cert, index) => (
                  <div 
                    key={index} 
                    className="group relative bg-white dark:bg-dark-card rounded-xl border-2 border-gray-200 dark:border-dark-border transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="p-6">
                      {/* Certificate Header */}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                            <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text leading-6 group-hover:text-purple-700 transition-colors">
                            {cert.name}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
                            {cert.issuing_organization}
                          </p>
                        </div>

                        {/* Action Buttons - Only show for own profile */}
                        {isOwnProfile && (
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  if (!cert.id) {
                                    console.error('Cannot edit certification with no ID');
                                    return;
                                  }
                                  handleEditCertification(cert);
                                }}
                                className="p-2 rounded-xl hover:bg-blue-50 transition-all duration-200 opacity-0 group-hover:opacity-100 bg-white border border-blue-200 shadow-sm"
                              >
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (!cert.id) {
                                    console.error('Cannot delete certification with no ID');
                                    return;
                                  }
                                  handleDeleteCertification(cert.id.toString());
                                }}
                                className="p-2 rounded-xl hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100 bg-white border border-red-200 shadow-sm"
                              >
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Certificate Details */}
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="dark:text-dark-text-secondary">Issued {new Date(cert.issue_date).toLocaleDateString('en-US', { 
                              month: 'long',
                              year: 'numeric'
                            })}</span>
                          </div>
                          {cert.expiry_date && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-300 dark:text-dark-text-secondary">•</span>
                              <span className="dark:text-dark-text-secondary">Expires {new Date(cert.expiry_date).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric'
                              })}</span>
                            </div>
                          )}
                        </div>

                        {cert.credential_id && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-dark-text-secondary">
                            <HashtagIcon className="w-4 h-4 text-gray-400" />
                            <span>Credential ID: {cert.credential_id}</span>
                          </div>
                        )}
                      </div>

                      {/* Verify Button */}
                        {cert.credential_url && (
                        <div className="mt-6">
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-dark-card rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            Verify Certificate
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Progression */}
            <div className="mt-6 bg-white dark:bg-dark-card rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Skill Progression</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">Professional skills and expertise levels</p>
                </div>
                {isOwnProfile && (
                  <button 
                    onClick={() => setShowSkillForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add Skill
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {userData.skills
                  .slice(0, showAllSkills ? undefined : 5)
                  .map((skill: Skill, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-dark-text">{skill.name}</h3>
                        {/* Endorsements removed as requested */}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-base font-semibold text-gray-800 dark:text-dark-text">{skill.level}%</span>
                          <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">
                            {skill.level >= 90 ? 'Master' :
                             skill.level >= 70 ? 'Expert' :
                             skill.level >= 50 ? 'Advanced' :
                             skill.level >= 30 ? 'Intermediate' : 'Beginner'}
                          </p>
                        </div>
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="p-1.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-full text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-dark-card-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* See More/Less Button */}
              {userData.skills.length > 5 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowAllSkills(!showAllSkills)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-dark-card rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors duration-200"
                  >
                    {showAllSkills ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Show Less
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Show {userData.skills.length - 5} More Skills
                      </>
                    )}
                  </button>
                </div>
              )}
                      </div>

            {/* Education Timeline */}
            <div className="mt-6 bg-white dark:bg-dark-card rounded-3xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-dark-border">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Education Timeline</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">Your academic journey and achievements</p>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowEducationForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Education
                  </button>
                )}
              </div>

              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>

                {userData.education?.map((edu, index) => (
                  <div key={index} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transform -translate-x-1/2 z-10 ring-4 ring-white"></div>
                    
                    {/* Card dark mode */}
                    <div className="ml-12 p-6 bg-gray-50 dark:bg-dark-card-hover rounded-2xl transition-all duration-300 hover:shadow-md hover:bg-white dark:hover:bg-dark-card group-hover:border-purple-100 border border-transparent dark:border-dark-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text group-hover:text-purple-700 transition-colors">
                              {edu.school}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-dark-card text-purple-700 dark:text-purple-300 text-xs font-medium">
                              {edu.year}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-gray-600 dark:text-dark-text-secondary font-medium">{edu.degree}</span>
                            <span className="text-gray-400 dark:text-dark-text-secondary">•</span>
                            <span className="text-gray-600 dark:text-dark-text-secondary">{edu.field}</span>
                          </div>
                          
                          {/* Additional Details */}
                          <div className="mt-4 flex flex-wrap gap-3">
                            <div className="flex items-center gap-1.5 text-sm">
                              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="text-gray-600 dark:text-dark-text-secondary">{formatInstitutionType(edu.institution_type)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-600 dark:text-dark-text-secondary">{edu.duration || '4 years'}</span>
                            </div>
                            {edu.gpa && (
                              <div className="flex items-center gap-1.5 text-sm">
                                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-gray-600 dark:text-dark-text-secondary">GPA: {edu.gpa}/4.0</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 shadow-sm">
                            <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex flex-wrap gap-3">
                          {/* ... existing details ... */}
                        </div>
                        {isOwnProfile && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => handleEditEducation(edu)}
                              className="px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-dark-card-hover rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors flex items-center gap-1"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEducation(edu.id)}
                              className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-dark-card-hover rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors flex items-center gap-1"
                            >
                              <TrashIcon className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delete Education Modal */}
            {showDeleteEducationModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="rounded-full bg-red-100 p-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text text-center mb-2">Delete Education</h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary text-center mb-6">Are you sure you want to delete this education entry? This action cannot be undone.</p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={cancelDeleteEducation}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text bg-gray-100 dark:bg-dark-card-hover rounded-lg hover:bg-gray-200 dark:hover:bg-dark-card transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteEducation}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Education Form Modal */}
            {showEducationForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 relative border border-gray-200 dark:border-dark-border">
                  <button
                    onClick={() => {
                      setShowEducationForm(false);
                      setEditingEducation(null);
                    }}
                    className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                      {editingEducation ? 'Edit Education' : 'Add Education'}
                    </h2>
                  </div>
                  <EducationForm
                    onSuccess={() => {
                      setShowEducationForm(false);
                      setEditingEducation(null);
                      fetchProfile();
                    }}
                    onCancel={() => {
                      setShowEducationForm(false);
                      setEditingEducation(null);
                    }}
                    refreshProfile={fetchProfile}
                    initialData={editingEducation}
                  />
                </div>
              </div>
            )}

            {/* Professional Achievements */}
            <div className="mt-6 bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Professional Achievements</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">Notable accomplishments and recognition</p>
                </div>
                {isOwnProfile && (
                  <button 
                    onClick={() => setShowAchievementForm(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Achievement</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userData.achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    className="group relative bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-400 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-sm border border-gray-100 ${getAchievementIcon(achievement.category).bgColor}`}>
                            {React.cloneElement(getAchievementIcon(achievement.category).icon, { className: 'w-7 h-7 text-white' })}
                      </div>
                            <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text group-hover:text-purple-600 transition-colors">
                                {achievement.title}
                              </h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                {new Date(achievement.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="text-sm text-gray-400 dark:text-dark-text-secondary">•</span>
                              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
                              </span>
                            </div>
                              </div>
                            </div>

                        {/* Edit and Delete Buttons */}
                        {isOwnProfile && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => handleEditAchievement(achievement)}
                              className="p-2 rounded-xl border border-blue-200 bg-white dark:bg-dark-card hover:bg-blue-50 dark:hover:bg-blue-900 transition-all duration-200 shadow-sm"
                            >
                              <PencilSquareIcon className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteAchievement(achievement.id)}
                              className="p-2 rounded-xl border border-red-200 bg-white dark:bg-dark-card hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-200 shadow-sm"
                            >
                              <TrashIcon className="w-4 h-4 text-red-500" />
                        </button>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 dark:text-dark-text-secondary mb-4 line-clamp-3">
                          {achievement.description}
                        </p>

                      {(achievement.impact || achievement.team) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex flex-wrap gap-3">
                          {achievement.impact && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                                <span>{achievement.impact}</span>
                            </div>
                          )}
                          {achievement.team && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                                <span>{achievement.team}</span>
                            </div>
                          )}
                        </div>
                        </div>
                      )}

                        {achievement.link && (
                        <div className="mt-4">
                          <a 
                            href={achievement.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 transition-colors"
                          >
                            <span>View Details</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                        )}
                    </div>
                    </div>
                  ))}
                </div>

              {/* Delete Achievement Modal */}
              {showDeleteAchievementModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-md w-full mx-4">
                    <div className="flex items-center justify-center mb-4">
                      <div className="rounded-full bg-red-100 p-3">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
                  </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text text-center mb-2">Delete Achievement</h3>
                    <p className="text-gray-600 dark:text-dark-text-secondary text-center mb-6">Are you sure you want to delete this achievement? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                  <button
                        onClick={cancelDeleteAchievement}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteAchievement}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                  </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Tabs */}
            <div className="mt-6">
              <div className="sticky top-20 bg-white dark:bg-dark-card z-10 border-b border-gray-200 dark:border-dark-border">
                <nav className="flex space-x-4 px-4">
                  {(["posts", "communities", "friends"] as const)
                    .filter(tab => {
                      // Hide tabs if profile is private, viewer is not owner, and not a friend
                      if (
                        profile?.private &&
                        !isOwnProfile &&
                        profile?.connectionStatus !== "connected" &&
                        profile?.connectionStatus !== "accepted"
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={getTabButtonClass(tab)}
                      >
                        <span className="capitalize">{tab}</span>
                      </button>
                    ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'posts' && (
                  <div className="space-y-6">
                    {isLoadingPosts ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
                        No posts yet
                      </div>
                    ) : (
                      posts.map(post => (
                        <PostCard
                        key={post.id}
                          id={post.id}
                          title={post.title}
                          content={post.content}
                          author={{
                            name: userData.name,
                            avatarUrl: getAvatarUrl(userData.avatar),
                            personalityTags: userData.personality_tags || [],
                            role: 'User',
                            username: userData.username
                          }}
                          author_role="User"
                          timestamp={post.timestamp}
                          rating={post.rating}
                          totalRatings={post.totalRatings || 0}
                          userRating={post.userRating || 0}
                          commentCount={post.commentCount}
                          media={post.media}
                          community={post.community}
                          communityName={post.communityName}
                          isPersonal={post.isPersonal}
                          onRate={(rating: number) => {
                            // Handle rating
                            console.log('Rating:', rating);
                            handlePostRate(rating, post);
                          }}
                          onDescriptionClick={() => handlePostClick(post.id.toString(), post)}
                          onCommentAdded={() => handleCommentAdded(post.id.toString())}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'communities' && (
                  <div className={`space-y-6 ${styles.animateFadeIn}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isLoadingCommunities ? (
                        <div className="col-span-full text-center text-gray-400 py-8">Loading communities...</div>
                      ) : communitiesError ? (
                        <div className="col-span-full text-center text-red-500 py-8">{communitiesError}</div>
                      ) : communities.length === 0 ? (
                        <div className="col-span-full text-center text-gray-400 py-8">No communities joined yet.</div>
                      ) : (
                        communities.map(community => (
                          <div
                            key={community.id}
                            className="bg-gray-50 dark:bg-dark-card-hover rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-200 dark:border-dark-border"
                          >
                            <div className="h-32 relative">
                              <img
                                src={community.bannerUrl}
                                alt={community.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-white">{community.name}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-green-400 text-sm flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                                    <StarIcon className="w-4 h-4" />
                                    {community.active_members} active
                                    </span>
                                  </div>
                                </div>
                              </div>
                            <div className="p-4">
                              <p className="text-gray-600 dark:text-dark-text-secondary text-sm line-clamp-2">{community.description}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {community.topics.map(topic => (
                                  <span
                                    key={topic}
                                    className="text-xs px-3 py-1.5 rounded-full font-medium bg-gradient-to-r from-purple-50 via-pink-50 to-white text-purple-600 border border-purple-200 dark:bg-gradient-to-r dark:from-purple-900 dark:via-purple-700 dark:to-pink-900 dark:text-white dark:border-purple-700/40"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-4 flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-dark-text-secondary">
                                  {community.total_members.toLocaleString()} members
                                </span>
                                <button 
                                  onClick={() => navigate(`/communities/${community.slug}`)}
                                  className="px-4 py-1.5 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover rounded-lg font-medium transition-colors"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'friends' && (
                  <div className={`space-y-6 ${styles.animateFadeIn}`}>
                    {isLoadingFriends ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                        <p className="text-gray-600 dark:text-dark-text-secondary">Loading friends...</p>
                      </div>
                    ) : friendsError ? (
                      <div className="text-center py-12">
                        <div className="bg-white/90 dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
                          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4 max-w-md mx-auto">
                            <p className="font-medium">Error Loading Friends</p>
                            <p className="text-sm mt-1">{friendsError}</p>
                          </div>
                          <button
                            onClick={fetchUserFriends}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ArrowPathIcon className="w-5 h-5" />
                              <span>Try Again</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : friends.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="bg-white/90 dark:bg-dark-card rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-dark-border max-w-md mx-auto backdrop-blur-sm">
                          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserGroupIcon className="w-8 h-8 text-purple-500" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">No Friends Yet</h3>
                          <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                            Start connecting with other professionals to build your network!
                          </p>
                        </div>
                      </div>
                    ) : (
                      friends.map(friend => (
                        <div
                          key={friend.id}
                          className={`bg-white/90 dark:bg-dark-card rounded-2xl p-6 hover:bg-white dark:hover:bg-dark-card-hover transition-all duration-300 shadow-sm border border-gray-200 dark:border-dark-border hover:shadow-lg group relative overflow-hidden backdrop-blur-sm`}
                        >
                          {/* Avatar Section */}
                          <div className="flex items-start gap-4 relative">
                            <div className="relative cursor-pointer group/avatar">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full blur-md opacity-50 group-hover/avatar:opacity-75 transition-all duration-500"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full animate-pulse opacity-20"></div>
                                <img
                                  src={friend.user.avatarUrl}
                                  alt={friend.user.name}
                                  className="w-16 h-16 rounded-full border-2 border-white dark:border-dark-border shadow-lg transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:shadow-xl relative z-10"
                                />
                                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-border z-20 transition-all duration-300 ${friend.user.lastActive === 'Online' ? 'bg-green-500 ring-2 ring-green-200 dark:ring-green-900' : 'bg-gray-400'}`}></span>
                            </div>
                            </div>
                            {/* Content Section */}
                            <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                                <div>
                                  <h3 
                                    className="text-lg font-semibold text-gray-900 dark:text-dark-text cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300"
                                    onClick={() => navigate(`/profile/${friend.user.username}`)}
                                  >
                                    {friend.user.name}
                              </h3>
                                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary">@{friend.user.username}</p>
                          </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {friend.user.personalityTags?.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2.5 py-1 text-xs font-medium rounded-full text-white shadow-sm transition-transform duration-300 hover:scale-105"
                                      style={isValidCssColor(tag.color) ? { backgroundColor: tag.color, color: '#fff', boxShadow: `0 2px 4px ${tag.color}40` } : undefined}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                          </div>
                        </div>
                              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-dark-text-secondary">
                                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-dark-card-hover px-2.5 py-1 rounded-full">
                                  <MapPinIcon className="w-4 h-4 text-purple-500" />
                                  <span>{friend.location}</span>
                            </div>
                                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-dark-card-hover px-2.5 py-1 rounded-full">
                                  <UserGroupIcon className="w-4 h-4 text-purple-500" />
                                  <span>{friend.mutualConnections} mutual friends</span>
                        </div>
                      </div>
                            </div>
                          </div>
                          {/* Connect Button for other users */}
                          {friend.connectionStatus === 'connect' && (
                            <div className="mt-4 flex items-center">
                              <button
                                onClick={() => handleConnect(friend.id)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105 font-medium"
                              >
                                <UserPlusIcon className="w-5 h-5" />
                                <span>Connect</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar with Smooth Scroll */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-20 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-300 group">
                    <PlusIcon className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm text-gray-600 mt-2 group-hover:text-gray-900">New Post</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-300 group">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm text-gray-600 mt-2 group-hover:text-gray-900">Message</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Recent Activity</h2>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <ArrowPathIcon className="w-5 h-5 dark:text-dark-text-secondary" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 dark:group-hover:bg-purple-900/30 transition-colors">
                      <HashtagIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text transition-colors">Posted in <span className="text-purple-600 dark:text-purple-400">Technology</span></p>
                      <p className="text-sm text-gray-500 dark:text-dark-text-secondary">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-900/30 transition-colors">
                      <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text transition-colors">Commented in <span className="text-blue-600 dark:text-blue-400">Philosophy</span></p>
                      <p className="text-sm text-gray-500 dark:text-dark-text-secondary">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 dark:group-hover:bg-green-900/30 transition-colors">
                      <UserGroupIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text transition-colors">Joined <span className="text-green-600 dark:text-green-400">Digital Nomads</span></p>
                      <p className="text-sm text-gray-500 dark:text-dark-text-secondary">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Trending Topics</h2>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <ArrowPathIcon className="w-5 h-5 dark:text-dark-text-secondary" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 dark:group-hover:bg-purple-900/30 transition-colors">
                      <HashtagIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text transition-colors">#Technology</p>
                      <p className="text-sm text-gray-500 dark:text-dark-text-secondary">2.5k posts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-900/30 transition-colors">
                      <HashtagIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text transition-colors">#Philosophy</p>
                      <p className="text-sm text-gray-500 dark:text-dark-text-secondary">1.8k posts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 dark:group-hover:bg-green-900/30 transition-colors">
                      <HashtagIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-dark-text-secondary group-hover:text-gray-900 dark:group-hover:text-dark-text transition-colors">#Digital Nomads</p>
                      <p className="text-sm text-gray-500 dark:text-dark-text-secondary">1.2k posts</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
                <div className="space-y-4">
                  <div className="group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-900/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 dark:group-hover:bg-purple-900/30 transition-colors">
                        <CalendarIcon className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-gray-700 dark:text-dark-text font-medium group-hover:text-gray-900 dark:group-hover:text-dark-text transition-colors">Tech Meetup 2024</h3>
                        <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">March 15, 2024 • Online</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-2">
                            <img src="https://i.pravatar.cc/32?img=1" className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card" />
                            <img src="https://i.pravatar.cc/32?img=2" className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card" />
                            <img src="https://i.pravatar.cc/32?img=3" className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card" />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-dark-text-secondary">+42 attending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-900/30 transition-colors">
                        <CalendarIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-gray-700 dark:text-dark-text font-medium group-hover:text-gray-900 dark:group-hover:text-dark-text transition-colors">Web Development Workshop</h3>
                        <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">March 20, 2024 • Online</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-2">
                            <img src="https://i.pravatar.cc/32?img=4" className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card" />
                            <img src="https://i.pravatar.cc/32?img=5" className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card" />
                            <img src="https://i.pravatar.cc/32?img=6" className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card" />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-dark-text-secondary">+28 attending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form Modal */}
      {showProfileForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 relative border border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setShowProfileForm(false)}
              className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-colors"
            >
              Close
            </button>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Edit Profile</h2>
            </div>
            <ProfileForm
              onSuccess={() => {
                setShowProfileForm(false);
                fetchProfile();
              }}
              onCancel={() => setShowProfileForm(false)}
              refreshProfile={fetchProfile}
            />
          </div>
        </div>
      )}

      {/* Experience Form Modal */}
      {showExperienceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 relative max-h-[90vh] flex flex-col border border-gray-200 dark:border-dark-border">
            <button
              onClick={handleExperienceFormCancel}
              className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-colors z-10"
            >
              Close
            </button>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                {editingExperience ? 'Edit Experience' : 'Add Experience'}
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 pr-2">
              <ExperienceForm
                onSuccess={handleExperienceFormSuccess}
                onCancel={handleExperienceFormCancel}
                experienceId={editingExperienceId || undefined}
                initialData={editingExperience || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Certification Form Modal */}
      {showCertificationModal && (
        <Modal
          isOpen={showCertificationModal}
          onClose={() => {
            setShowCertificationModal(false);
          }}
          title="Add Certification"
        >
          <CertificationForm
            onSuccess={handleCertificationSuccess}
            onCancel={() => {
              setShowCertificationModal(false);
            }}
            refreshProfile={fetchProfile}
          />
        </Modal>
      )}

      {/* Skill Form Modal */}
      {showSkillForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 relative border border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setShowSkillForm(false)}
              className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-colors"
            >
              Close
            </button>
            <SkillForm
              onSuccess={() => {
                setShowSkillForm(false);
                fetchProfile();
              }}
              onCancel={() => setShowSkillForm(false)}
              refreshProfile={fetchProfile}
            />
          </div>
        </div>
      )}

      {/* Achievement Form Modal */}
      {showAchievementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 relative border border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setShowAchievementForm(false)}
              className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-colors"
            >
              Close
            </button>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Add Achievement</h2>
            </div>
            <AchievementForm
              onSuccess={() => {
                setShowAchievementForm(false);
                fetchProfile();
              }}
              onCancel={() => setShowAchievementForm(false)}
              refreshProfile={fetchProfile}
            />
          </div>
        </div>
      )}

      {/* Delete Certification Confirmation Modal */}
      {isDeletingCert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-md w-full mx-4 relative border border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text text-center mb-2">Delete Certification</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary text-center mb-6">
              Are you sure you want to delete this certification? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteCertification}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text bg-gray-100 dark:bg-dark-card-hover rounded-lg hover:bg-gray-200 dark:hover:bg-dark-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCertification}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Certification</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this certification? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteCertification}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCertification}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certification Form Modal */}
      {showCertificationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 relative border border-gray-200 dark:border-dark-border">
            <button
              onClick={handleCertificationFormClose}
              className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-colors"
            >
              Close
            </button>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                {editingCertification ? 'Edit Certification' : 'Add Certification'}
              </h2>
            </div>
            <CertificationForm
              onSuccess={handleCertificationFormClose}
              onCancel={handleCertificationFormClose}
              refreshProfile={fetchProfile}
              editingCertification={editingCertification}
            />
          </div>
        </div>
      )}

      {/* Delete Experience Confirmation Modal */}
      {showDeleteExperienceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text text-center mb-2">Delete Experience</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary text-center mb-6">Are you sure you want to delete this experience? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteExperience}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-dark-card-hover rounded-lg hover:bg-gray-200 dark:hover:bg-dark-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteExperience}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Skill Confirmation Modal */}
      {showDeleteSkillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-md w-full mx-4 relative border border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text text-center mb-2">Delete Skill</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary text-center mb-6">
              Are you sure you want to delete this skill? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteSkill}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text bg-gray-100 dark:bg-dark-card-hover rounded-lg hover:bg-gray-200 dark:hover:bg-dark-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSkill}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Achievement Form Modal */}
      {showEditAchievementForm && selectedAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-lg w-full mx-4 relative border border-gray-200 dark:border-dark-border">
            <button
              onClick={() => {
                setShowEditAchievementForm(false);
                setSelectedAchievement(null);
              }}
              className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-colors"
            >
              Close
            </button>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Edit Achievement</h2>
            </div>
            <AchievementForm
              onSuccess={() => {
                setShowEditAchievementForm(false);
                setSelectedAchievement(null);
                fetchProfile();
              }}
              onCancel={() => {
                setShowEditAchievementForm(false);
                setSelectedAchievement(null);
              }}
              refreshProfile={fetchProfile}
              initialData={selectedAchievement}
            />
          </div>
        </div>
      )}
    </div>
  );
} 