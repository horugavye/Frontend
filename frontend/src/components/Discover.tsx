import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FireIcon,
  UserGroupIcon,
  SparklesIcon,
  HashtagIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  RocketLaunchIcon,
  StarIcon,
  TrophyIcon,
  BoltIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  BellIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BookmarkIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import Navigation from './Navigation';
import CardContainer from './CardContainer';
import api from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';

// API base URL for media files
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to construct proper banner URLs
const getBannerUrl = (bannerPath: string | null): string | null => {
  if (!bannerPath) return null;
  
  // If it's already a full URL, return it as is
  if (bannerPath.startsWith('http')) {
    return bannerPath;
  }
  
  // If it starts with /media, add the base URL
  if (bannerPath.startsWith('/media')) {
    return `${API_BASE_URL}${bannerPath}`;
  }
  
  // For other paths, construct the full media URL
  const cleanPath = bannerPath.startsWith('/') ? bannerPath.substring(1) : bannerPath;
  return `${API_BASE_URL}/media/${cleanPath}`;
};

// Helper function to construct proper icon URLs
const getIconUrl = (iconPath: string | null): string | null => {
  if (!iconPath) return null;
  
  // If it's already a full URL, return it as is
  if (iconPath.startsWith('http')) {
    return iconPath;
  }
  
  // If it starts with /media, add the base URL
  if (iconPath.startsWith('/media')) {
    return `${API_BASE_URL}${iconPath}`;
  }
  
  // For other paths, construct the full media URL
  const cleanPath = iconPath.startsWith('/') ? iconPath.substring(1) : iconPath;
  return `${API_BASE_URL}/media/${cleanPath}`;
};

interface TrendingTopic {
  id: string;
  name: string;
  posts: number;
  category: string;
  trend: number;
  color: string;
  communityName: string;
}

interface PopularCommunity {
  id: string;
  name: string;
  description: string;
  members: number;
  icon: string;
  iconUrl: string | null;
  bannerUrl?: string;
  category: string;
  slug?: string;
  is_member?: boolean;
}

interface RecommendedConnection {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  mutualConnections: number;
  personalityTags: Array<{
    name: string;
    color: string;
  }>;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  color: string;
}

interface Event {
  id: string;
  title: string;
  type: 'community' | 'connection' | 'achievement' | 'recommendation';
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

const Discover: FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState('');
  const [expandedCommunity, setExpandedCommunity] = useState<string | null>(null);
  const [communities, setCommunities] = useState<PopularCommunity[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [joiningCommunities, setJoiningCommunities] = useState<Set<string>>(new Set());
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  
  // Fetch communities and trending topics on component mount
  useEffect(() => {
    fetchCommunities();
    fetchTrendingTopics();
  }, []);

  // Fetch trending topics from API
  const fetchTrendingTopics = async () => {
    try {
      setTopicsLoading(true);
      setTopicsError(null);
      
      const response = await api.get(API_ENDPOINTS.TRENDING_TOPICS);
      console.log('=== Trending Topics API Response ===');
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      const processedTopics = response.data.map((topic: any) => ({
        id: topic.id,
        name: topic.name,
        posts: topic.posts,
        category: topic.category,
        trend: topic.trend,
        color: topic.color,
        communityName: topic.community_name
      }));
      
      console.log('=== Processed Trending Topics ===');
      console.log(processedTopics);
      setTrendingTopics(processedTopics);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      setTopicsError('Failed to load trending topics. Please try again later.');
    } finally {
      setTopicsLoading(false);
    }
  };

  // Fetch communities from API
  const fetchCommunities = async () => {
    try {
      setCommunitiesLoading(true);
      setCommunitiesError(null);
      
      const response = await api.get(API_ENDPOINTS.DISCOVER_COMMUNITIES);
      console.log('=== Discover Communities API Response ===');
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      const processedCommunities = response.data.map((community: any) => ({
        id: community.id.toString(),
        name: community.name,
        description: community.description,
        members: community.members_count || community.total_members || 0,
        icon: community.icon || '🌟',
        iconUrl: getIconUrl(community.icon),
        bannerUrl: getBannerUrl(community.banner),
        category: community.category || 'general',
        slug: community.slug,
        is_member: community.is_member || false
      }));
      
      console.log('=== Processed Communities ===');
      console.log(processedCommunities);
      setCommunities(processedCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunitiesError('Failed to load communities. Please try again later.');
    } finally {
      setCommunitiesLoading(false);
    }
  };

  // Join community function
  const handleJoinCommunity = async (community: PopularCommunity) => {
    if (!community.slug) {
      console.error('No slug available for community:', community.name);
      return;
    }

    try {
      setJoiningCommunities(prev => new Set(prev).add(community.id));
      
      const response = await api.post(`${API_ENDPOINTS.COMMUNITIES}/${community.slug}/join/`);
      
      if (response.status === 200 || response.status === 201) {
        // Update the community in the list to show as joined
        setCommunities(prev => prev.map(c => 
          c.id === community.id 
            ? { ...c, is_member: true, members: c.members + 1 }
            : c
        ));
        
        // Navigate to the community page
        navigate(`/communities/${community.slug}`);
      }
    } catch (error: any) {
      console.error('Error joining community:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message ||
                          'Failed to join community. Please try again.';
      alert(errorMessage);
    } finally {
      setJoiningCommunities(prev => {
        const newSet = new Set(prev);
        newSet.delete(community.id);
        return newSet;
      });
    }
  };

  // Navigate to community page
  const handleViewCommunity = (community: PopularCommunity) => {
    if (community.slug) {
      navigate(`/communities/${community.slug}`);
    }
  };

  // Refresh communities
  const handleRefreshCommunities = async () => {
    await fetchCommunities();
  };

  // Refresh trending topics
  const handleRefreshTopics = async () => {
    await fetchTrendingTopics();
  };
  
  // Simulate loading state when changing categories
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const categories = [
    { id: 'all', name: 'All', icon: SparklesIcon },
    { id: 'tech', name: 'Technology', icon: RocketLaunchIcon },
    { id: 'philosophy', name: 'Philosophy', icon: GlobeAltIcon },
    { id: 'art', name: 'Art & Design', icon: HashtagIcon },
    { id: 'science', name: 'Science', icon: StarIcon },
  ];

  const recommendedConnections: RecommendedConnection[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      username: '@sarahchen',
      avatar: 'https://i.pravatar.cc/150?img=5',
      bio: 'AI researcher | Philosophy enthusiast | Building the future of human-AI interaction',
      mutualConnections: 12,
      personalityTags: [
        { name: 'Tech Expert', color: 'bg-blue-500' },
        { name: 'Deep Thinker', color: 'bg-purple-500' },
      ],
    },
    {
      id: '2',
      name: 'Marcus Rodriguez',
      username: '@marcusrodriguez',
      avatar: 'https://i.pravatar.cc/150?img=8',
      bio: 'Digital artist exploring the intersection of art and technology',
      mutualConnections: 8,
      personalityTags: [
        { name: 'Creative', color: 'bg-pink-500' },
        { name: 'Innovator', color: 'bg-green-500' },
      ],
    },
  ];

  const filteredTopics = activeCategory === 'all' 
    ? trendingTopics 
    : trendingTopics.filter(topic => topic.category === activeCategory);

  const filteredCommunities = activeCategory === 'all'
    ? communities
    : communities.filter(community => community.category === activeCategory);

  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'Connection Builder',
      description: 'Connect with 50 people in your field',
      icon: 'UserPlusIcon',
      progress: 35,
      total: 50,
      color: 'purple',
    },
    {
      id: '2',
      name: 'Community Leader',
      description: 'Create and grow a community to 100 members',
      icon: 'UserGroupIcon',
      progress: 78,
      total: 100,
      color: 'blue',
    },
    {
      id: '3',
      name: 'Engagement Star',
      description: 'Receive 100 ratings on your posts',
      icon: 'StarIcon',
      progress: 67,
      total: 100,
      color: 'yellow',
    },
  ];

  const recentEvents: Event[] = [
    {
      id: '1',
      title: 'New Achievement Unlocked!',
      type: 'achievement',
      description: 'You\'re halfway to becoming a Connection Builder!',
      timestamp: '2h ago',
      icon: 'TrophyIcon',
      color: 'purple',
    },
    {
      id: '2',
      title: 'Community Milestone',
      type: 'community',
      description: 'AI Enthusiasts reached 1,000 members!',
      timestamp: '5h ago',
      icon: 'UserGroupIcon',
      color: 'blue',
    },
    {
      id: '3',
      title: 'New Connection Match',
      type: 'recommendation',
      description: 'We found a perfect match for you in AI Ethics!',
      timestamp: '1d ago',
      icon: 'SparklesIcon',
      color: 'green',
    },
  ];

  const renderAchievementProgress = (achievement: Achievement) => {
    const percentage = (achievement.progress / achievement.total) * 100;
    return (
      <div className="mt-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-dark-text-secondary">{achievement.progress}/{achievement.total}</span>
          <span className="text-gray-600 dark:text-dark-text-secondary">{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-dark-card-hover rounded-full h-2.5">
          <div
            className={`bg-${achievement.color}-500 dark:bg-${achievement.color}-400 h-2.5 rounded-full transition-all duration-700 ease-in-out`}
            style={{ width: `${percentage}%` }}
          >
            <div className="animate-pulse-subtle bg-white/20 dark:bg-white/10 h-full" />
          </div>
        </div>
      </div>
    );
  };

  const renderTopicCard = (topic: TrendingTopic) => (
    <div
      key={topic.id}
      className="group bg-white dark:bg-dark-card rounded-lg p-5 hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-all duration-300 cursor-pointer border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {topic.name}
          </h3>
          {topic.communityName && (
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
              in {topic.communityName}
            </p>
          )}
        </div>
        <span className="text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-sm">
          <ArrowTrendingUpIcon className="w-4 h-4" />
          {topic.trend}%
        </span>
      </div>
      <p className="text-gray-600 dark:text-dark-text-secondary mt-2">{topic.posts.toLocaleString()} posts</p>
      <div className="mt-3 flex items-center gap-3">
        <button className="p-2 bg-white dark:bg-dark-card text-gray-400 dark:text-dark-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30">
          <BookmarkIcon className="w-5 h-5" />
        </button>
        <button className="p-2 bg-white dark:bg-dark-card text-gray-400 dark:text-dark-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30">
          <ShareIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderCommunityCard = (community: PopularCommunity) => {
    const isJoining = joiningCommunities.has(community.id);
    
    return (
      <div
        key={community.id}
        className={`bg-white dark:bg-dark-card rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30 transition-all duration-300 cursor-pointer ${
          expandedCommunity === community.id ? 'shadow-lg' : 'hover:shadow-md'
        }`}
        onClick={() => handleViewCommunity(community)}
      >
        {/* Banner Image */}
        <div className="relative h-32 sm:h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20">
          {community.bannerUrl ? (
            <>
              <img
                src={community.bannerUrl}
                alt={`${community.name} banner`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  // Fallback to gradient background if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </>
          ) : (
            // Default banner with community icon
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl sm:text-6xl mb-1 sm:mb-2 block">{community.icon}</span>
                <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
              </div>
            </div>
          )}
          
          {/* Community icon overlay */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white dark:bg-dark-card rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center border-2 border-white dark:border-dark-border">
              <img
                src={community.iconUrl}
                alt={`${community.name} icon`}
                className="w-full h-full object-cover rounded-lg sm:rounded-xl"
              />
            </div>
          </div>
        </div>
        
        <div className="p-3 sm:p-5">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-dark-text group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {community.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
                {community.members.toLocaleString()} members
              </p>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-dark-text-secondary text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
            {community.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-1 sm:-space-x-2">
              {[...Array(4)].map((_, i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/32?img=${i + 1}`}
                  alt="Member"
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-dark-border"
                />
              ))}
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 border-2 border-white dark:border-dark-border flex items-center justify-center">
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">+99</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {community.is_member ? (
                <button 
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-sm hover:shadow-md text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewCommunity(community);
                  }}
                >
                  View
                </button>
              ) : (
                <button 
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all shadow-sm hover:shadow-md text-xs sm:text-sm ${
                    isJoining 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600'
                  }`}
                  disabled={isJoining}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinCommunity(community);
                  }}
                  onMouseEnter={() => setShowTooltip(`join-${community.id}`)}
                  onMouseLeave={() => setShowTooltip('')}
                >
                  {isJoining ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      Joining...
                    </div>
                  ) : (
                    'Join'
                  )}
                </button>
              )}
              {showTooltip === `join-${community.id}` && !community.is_member && (
                <div className="absolute transform translate-y-8 bg-gray-900 dark:bg-dark-card text-white dark:text-dark-text text-xs px-2 py-1 rounded">
                  Join community
                </div>
              )}
              <button 
                className="p-1.5 sm:p-2 bg-white dark:bg-dark-card text-gray-400 dark:text-dark-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover"
                onClick={(e) => e.stopPropagation()}
              >
                <EllipsisHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

        {/* Main Content */}
          <div className="lg:col-span-6 order-2 lg:order-2">
            <div className="space-y-4">
          {/* Category Navigation */}
              <CardContainer>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              Discover
              <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-dark-text-secondary bg-gray-100 dark:bg-dark-card px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                Personalized for you
              </span>
            </h1>
            <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm'
                      : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                  }`}
                >
                  <category.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{category.name}</span>
                </button>
              ))}
            </div>
              </CardContainer>

            {/* Trending Topics */}
              <CardContainer>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
                    <FireIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 dark:text-orange-400" />
                    Trending Topics
                  </h2>
                  <button 
                    onClick={handleRefreshTopics}
                    disabled={topicsLoading}
                    className="p-1.5 sm:p-2 bg-white dark:bg-dark-card text-gray-400 dark:text-dark-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${topicsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                {topicsError && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 sm:p-4 rounded-xl border border-red-200 dark:border-red-800 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm">{topicsError}</span>
                      <button 
                        onClick={handleRefreshTopics}
                        className="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 underline text-xs sm:text-sm"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-3 sm:gap-4">
                  {topicsLoading ? (
                    // Loading skeleton
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 sm:h-24 bg-gray-100 dark:bg-dark-card-hover rounded-lg" />
                      </div>
                    ))
                  ) : filteredTopics.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <FireIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-dark-text mb-2">
                        No trending topics found
                      </h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-dark-text-secondary mb-3 sm:mb-4">
                        {activeCategory === 'all' 
                          ? 'No trending topics are available at the moment.'
                          : `No trending topics found in the ${activeCategory} category.`
                        }
                      </p>
                      <button 
                        onClick={handleRefreshTopics}
                        className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                      >
                        Refresh
                      </button>
                    </div>
                  ) : (
                    filteredTopics.map(renderTopicCard)
                  )}
                </div>
              </CardContainer>

              {/* Popular Communities */}
              <CardContainer>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
                      <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 dark:text-purple-400" />
                      Popular Communities
                    </h2>
                    <button 
                      onClick={handleRefreshCommunities}
                      disabled={communitiesLoading}
                      className="p-1.5 sm:p-2 bg-white dark:bg-dark-card text-gray-400 dark:text-dark-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${communitiesLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  {communitiesError && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 sm:p-4 rounded-xl border border-red-200 dark:border-red-800 mb-4 sm:mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm">{communitiesError}</span>
                        <button 
                          onClick={handleRefreshCommunities}
                          className="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 underline text-xs sm:text-sm"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-4 sm:gap-6">
                    {communitiesLoading ? (
                      // Loading skeleton
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-40 sm:h-48 bg-gray-100 dark:bg-dark-card-hover rounded-xl" />
                        </div>
                      ))
                    ) : filteredCommunities.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <UserGroupIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-dark-text mb-2">
                          No communities found
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-dark-text-secondary mb-3 sm:mb-4">
                          {activeCategory === 'all' 
                            ? 'No communities are available at the moment.'
                            : `No communities found in the ${activeCategory} category.`
                          }
                        </p>
                        <button 
                          onClick={handleRefreshCommunities}
                          className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                        >
                          Refresh
                        </button>
                      </div>
                    ) : (
                      filteredCommunities.map(renderCommunityCard)
                    )}
                  </div>
              </CardContainer>
              </div>
            </div>

            {/* Right Sidebar */}
          <div className="hidden lg:block lg:col-span-3 order-3 lg:order-3">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
              <div className="space-y-6">
                {/* AI Recommendations */}
                <CardContainer>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 dark:text-purple-400" />
                      AI Recommendations
                    </h2>
                    <button className="p-1.5 sm:p-2 bg-white dark:bg-dark-card text-gray-400 dark:text-dark-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30">
                      <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {recommendedConnections.map(connection => (
                      <div
                        key={connection.id}
                        className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-900/30"
                      >
                        <img
                          src={connection.avatar}
                          alt={connection.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-dark-border shadow-sm group-hover:shadow-md transition-all"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-dark-text group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {connection.name}
                            </h3>
                            <button className="text-gray-400 dark:text-dark-text-secondary hover:text-purple-600 dark:hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 sm:p-2 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30">
                              <UserPlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1 line-clamp-2">
                            {connection.bio}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <UserGroupIcon className="w-3 h-3 text-purple-500" />
                            <span className="text-xs text-gray-500 dark:text-dark-text-secondary">
                              {connection.mutualConnections} mutual connections
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {connection.personalityTags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className={`text-xs px-2 py-1 rounded-full ${tag.color}`}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContainer>

                {/* Achievements */}
                <CardContainer>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
                      <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 dark:text-yellow-400" />
                      Achievements
                    </h2>
                    <button className="p-1.5 sm:p-2 bg-white dark:bg-dark-card text-gray-400 dark:text-dark-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30">
                      <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {achievements.map(achievement => (
                      <div
                        key={achievement.id}
                        className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-900/30"
                      >
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${achievement.color} shadow-sm group-hover:shadow-md transition-all`}>
                          <span className="text-white text-xs sm:text-sm">{achievement.icon}</span>
                          </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-dark-text group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {achievement.name}
                            </h3>
                          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1 line-clamp-2">
                            {achievement.description}
                          </p>
                            {renderAchievementProgress(achievement)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContainer>

                {/* Recent Activity */}
                <CardContainer>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
                      <BoltIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400" />
                      Recent Activity
                    </h2>
                    <button className="p-1.5 sm:p-2 bg-white dark:bg-dark-card text-gray-400 dark:text-dark-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-dark-border hover:border-purple-200 dark:hover:border-purple-900/30">
                      <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {recentEvents.map(event => (
                      <div
                        key={event.id}
                        className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-900/30"
                      >
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${event.color} shadow-sm group-hover:shadow-md transition-all`}>
                          <span className="text-white text-xs sm:text-sm">{event.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-dark-text group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1 line-clamp-2">
                            {event.description}
                          </p>
                          <span className="text-xs text-gray-400 dark:text-dark-text-secondary mt-1">
                            {event.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;