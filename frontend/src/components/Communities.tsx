import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  SparklesIcon,
  HashtagIcon,
  PlusIcon,
  StarIcon,
  UsersIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import Navigation from './Navigation';
import CreateCommunityModal, { CreateCommunityData } from './CreateCommunityModal';
import api from '../utils/axios';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

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

// CardContainer for consistent UI
const CardContainer: FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm transition-colors duration-200 ${className}`}>
    {children}
  </div>
);

const Communities: FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discoverCommunities, setDiscoverCommunities] = useState<Community[]>([]);
  const [joiningCommunityIds, setJoiningCommunityIds] = useState<Set<string>>(new Set());
  const [joinError, setJoinError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserCommunities();
    fetchDiscoverCommunities();
  }, []);

  const fetchUserCommunities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.USER_COMMUNITIES);
      console.log('=== User Communities API Response ===');
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      const communities = response.data.map((community: any) => {
        console.log('=== Processing Community ===');
        console.log('Community name:', community.name);
        console.log('Raw community data:', community);
        console.log('members_count:', community.members_count);
        console.log('total_members:', community.total_members);
        
        const processedCommunity = {
          ...community,
          bannerUrl: community.banner || null,
          total_members: community.members_count || community.total_members || 0,
          active_members: community.active_members || 0,
          isJoined: true
        };
        
        console.log('Processed community:', processedCommunity);
        return processedCommunity;
      });
      
      console.log('=== Final Processed Communities ===');
      console.log(communities);
      setUserCommunities(communities);
    } catch (error) {
      console.error('Error fetching user communities:', error);
      setError('Failed to load your communities. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscoverCommunities = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DISCOVER_COMMUNITIES);
      console.log('=== Discover Communities API Response ===');
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      const communities = response.data.map((community: any) => {
        console.log('=== Processing Community ===');
        console.log('Community name:', community.name);
        console.log('Raw community data:', community);
        console.log('members_count:', community.members_count);
        console.log('total_members:', community.total_members);
        
        const processedCommunity = {
          ...community,
          bannerUrl: community.banner || null,
          total_members: community.members_count || community.total_members || 0,
          active_members: community.active_members || 0,
          isJoined: false
        };
        
        console.log('Processed community:', processedCommunity);
        return processedCommunity;
      });
      
      console.log('=== Final Processed Communities ===');
      console.log(communities);
      setDiscoverCommunities(communities);
    } catch (error) {
      console.error('Error fetching discover communities:', error);
    }
  };

  const handleViewCommunity = (communitySlug: string) => {
    // Navigate to the community page using the slug
    navigate(`/communities/${communitySlug}`);
  };

  const getTopicColor = (topic: string): string => {
    // Light mode: light gradient with purple text; Dark mode: purple-pink gradient with white text
    return 'bg-gradient-to-r from-purple-50 via-pink-50 to-white text-purple-600 border border-purple-200 dark:bg-gradient-to-r dark:from-purple-900 dark:via-purple-700 dark:to-pink-900 dark:text-white dark:border-purple-700/40';
  };

  const categories = [
    { id: 'all', name: 'All', icon: SparklesIcon },
    { id: 'tech', name: 'Technology', icon: HashtagIcon },
    { id: 'science', name: 'Science', icon: GlobeAltIcon },
    { id: 'art', name: 'Art', icon: StarIcon },
  ];

  const filteredUserCommunities = activeCategory === 'all' 
    ? userCommunities 
    : userCommunities.filter(community => community.category === activeCategory);

  const handleCreateCommunity = async (data: CreateCommunityData) => {
    try {
      // Create FormData from the community data
      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('is_private', data.isPrivate.toString());
      
      // Add topics as individual form fields
      data.topics.forEach((topic, index) => {
        formData.append(`topics[${index}]`, topic);
      });
      
      // Add rules as individual form fields
      data.rules.forEach((rule, index) => {
        formData.append(`rules[${index}]`, rule);
      });
      
      // Handle category
      if (data.isNewCategory) {
        formData.append('category', data.newCategory);
      } else {
        formData.append('category', data.category);
      }

      // Handle images
      if (data.icon instanceof File) {
        formData.append('icon', data.icon);
      }
      if (data.banner instanceof File) {
        formData.append('banner', data.banner);
      }

      const response = await api.post(API_ENDPOINTS.COMMUNITIES, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add the new community to the user's communities list
      const newCommunity = {
        id: response.data.id,
        slug: response.data.slug,
        name: response.data.name,
        description: response.data.description,
        total_members: 1,
        active_members: 0,
        icon: response.data.icon || '🌟',
        bannerUrl: response.data.banner,
        category: response.data.category,
        isJoined: true,
        activity: 0,
        topics: response.data.topics,
      };

      setUserCommunities(prev => [newCommunity, ...prev]);
      
      // Navigate to the new community
      navigate(`/communities/${response.data.slug}`);
    } catch (error) {
      console.error('Error creating community:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', (error as any).response?.data);
        console.error('Response status:', (error as any).response?.status);
        throw new Error((error as any).response?.data?.detail || 'Failed to create community');
      }
      throw error;
    }
  };

  const handleJoinCommunity = async (community: Community) => {
    if (!community.slug) return;
    setJoiningCommunityIds(prev => new Set(prev).add(community.id));
    setJoinError(null);
    try {
      const response = await api.post(`${API_ENDPOINTS.COMMUNITIES}/${community.slug}/join/`);
      if (response.status === 200 || response.status === 201) {
        setDiscoverCommunities(prev => prev.map(c =>
          c.id === community.id
            ? { ...c, isJoined: true, total_members: c.total_members + 1 }
            : c
        ));
        // Optionally, navigate(`/communities/${community.slug}`);
      }
    } catch (error: any) {
      console.error('Error joining community:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to join community. Please try again.';
      setJoinError(errorMessage);
      alert(errorMessage);
    } finally {
      setJoiningCommunityIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(community.id);
        return newSet;
      });
    }
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

          {/* Main Content - Communities */}
          <div className="lg:col-span-6 order-2 lg:order-2">
            <div className="space-y-4">
              {/* Header */}
              <CardContainer>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Communities</h1>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Community
                </button>
              </div>

              {/* Category Navigation */}
                <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 mt-4">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm'
                          : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <category.icon className="w-5 h-5" />
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
              </CardContainer>

              {/* Your Communities */}
              <CardContainer>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                  Your Communities
                </h2>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 mb-4">
                    {error}
                  </div>
                )}
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                          <div className="flex gap-2">
                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full w-20" />
                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full w-20" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userCommunities.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                      You haven't joined any communities yet
                    </div>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                    >
                      Create your first community
                    </button>
                  </div>
                ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredUserCommunities.map(community => (
                    <div
                      key={community.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
                    >
                      <div className="h-32 relative">
                        <img
                          src={community.bannerUrl}
                          alt={community.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/default_community_banner.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                          <h3 className="text-lg font-medium text-white">{community.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 text-sm flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                              <ChartBarIcon className="w-4 h-4" />
                                {community.active_members}% active
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{community.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {community.topics.map(topic => (
                            <span
                              key={topic}
                              className={`text-xs px-3 py-1.5 rounded-full font-medium ${getTopicColor(topic)}`}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                              {community.total_members.toLocaleString()} members
                          </span>
                          <button 
                            onClick={() => handleViewCommunity(community.slug)}
                            className="px-4 py-1.5 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg font-medium transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContainer>

              {/* Discover Communities */}
              <CardContainer>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-6 h-6 text-purple-600" />
                  Discover Communities
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {discoverCommunities.map(community => (
                    <div
                      key={community.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
                    >
                      <div className="h-32 relative">
                        <img
                          src={community.bannerUrl}
                          alt={community.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/default_community_banner.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                          <h3 className="text-lg font-medium text-white">{community.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 text-sm flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                              <ChartBarIcon className="w-4 h-4" />
                              {community.active_members}% active
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{community.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {community.topics.map(topic => (
                            <span
                              key={topic}
                              className={`text-xs px-3 py-1.5 rounded-full font-medium ${getTopicColor(topic)}`}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            {community.total_members.toLocaleString()} members
                          </span>
                          <div className="flex gap-2">
                            <button
                              className="px-4 py-1.5 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg font-medium transition-colors"
                              onClick={() => handleViewCommunity(community.slug)}
                            >
                              View
                            </button>
                            {community.isJoined ? (
                              <button
                                className="px-4 py-1.5 bg-green-500 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md cursor-not-allowed"
                                disabled
                              >
                                Joined
                              </button>
                            ) : (
                              <button
                                className={`px-4 py-1.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md ${joiningCommunityIds.has(community.id) ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white'}`}
                                disabled={joiningCommunityIds.has(community.id)}
                                onClick={() => handleJoinCommunity(community)}
                              >
                                {joiningCommunityIds.has(community.id) ? 'Joining...' : 'Join'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContainer>
          </div>
        </div>

          {/* Right Sidebar - Community Stats and Features - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3 order-3 lg:order-3">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
              <div className="space-y-4">
              {/* Stats Card */}
                <CardContainer>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Community Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Communities</span>
                      <span className="text-gray-900 dark:text-white font-medium">{userCommunities.length + discoverCommunities.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Your Communities</span>
                      <span className="text-gray-900 dark:text-white font-medium">{userCommunities.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Active Now</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">1.2k members</span>
                  </div>
                </div>
                </CardContainer>

              {/* Trending Topics */}
                <CardContainer>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Trending Topics</h2>
                <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">#ArtificialIntelligence</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">1.2k posts</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Trending in Tech</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">#QuantumComputing</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">856 posts</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Trending in Science</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">#Web3</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">623 posts</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Trending in Tech</div>
                    </div>
                  </div>
                </CardContainer>

              {/* Quick Actions */}
                <CardContainer>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="space-y-3">
                    <button className="w-full flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Create New Community
                  </button>
                    <button className="w-full flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg transition-colors">
                    <UserGroupIcon className="w-5 h-5" />
                    Browse All Communities
                  </button>
                    <button className="w-full flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg transition-colors">
                    <SparklesIcon className="w-5 h-5" />
                    Discover More
                  </button>
                </div>
                </CardContainer>

              {/* Activity Feed */}
                <CardContainer>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <img src="https://i.pravatar.cc/32?img=1" alt="User" className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">Sarah Chen</span> posted in{' '}
                        <span className="text-purple-600 dark:text-purple-400">AI Enthusiasts</span>
                      </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 minutes ago</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <img src="https://i.pravatar.cc/32?img=2" alt="User" className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">Alex Morgan</span> joined{' '}
                        <span className="text-purple-600 dark:text-purple-400">Quantum Computing</span>
                      </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">15 minutes ago</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <img src="https://i.pravatar.cc/32?img=3" alt="User" className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">Emma Wilson</span> created a new topic in{' '}
                        <span className="text-purple-600 dark:text-purple-400">Web3 Developers</span>
                      </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-4 px-4 py-1.5 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 rounded-lg font-medium transition-colors">
                  View All Activity
                </button>
                </CardContainer>

              {/* Popular Members */}
                <CardContainer>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Popular Members</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                      <img src="https://i.pravatar.cc/40?img=4" alt="User" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dr. Lisa Zhang</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">AI Ethics Researcher</p>
                    </div>
                      <button className="px-3 py-1 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-medium transition-colors">
                      Follow
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                      <img src="https://i.pravatar.cc/40?img=5" alt="User" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Michael Chen</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ML Engineer</p>
                    </div>
                      <button className="px-3 py-1 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-medium transition-colors">
                      Follow
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                      <img src="https://i.pravatar.cc/40?img=6" alt="User" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Emily Brown</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Quantum Researcher</p>
                    </div>
                      <button className="px-3 py-1 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-medium transition-colors">
                      Follow
                    </button>
                  </div>
                </div>
                  <button className="w-full mt-4 px-4 py-1.5 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg font-medium transition-colors">
                  View All Members
                </button>
                </CardContainer>

              {/* Upcoming Events */}
                <CardContainer>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Events</h2>
                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">15</span>
                        <span className="text-purple-600 dark:text-purple-400 text-xs">MAY</span>
                      </div>
                      <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Ethics Workshop</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Online • 2:00 PM EST</p>
                      </div>
                        <button className="px-3 py-1 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-medium transition-colors">
                        RSVP
                      </button>
                    </div>
                  </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">18</span>
                        <span className="text-blue-600 dark:text-blue-400 text-xs">MAY</span>
                      </div>
                      <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Web3 Hackathon</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Virtual • 10:00 AM EST</p>
                      </div>
                        <button className="px-3 py-1 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-medium transition-colors">
                        Join
                      </button>
                    </div>
                  </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">20</span>
                        <span className="text-green-600 dark:text-green-400 text-xs">MAY</span>
                      </div>
                      <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">ML Research Meetup</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hybrid • 3:00 PM EST</p>
                      </div>
                        <button className="px-3 py-1 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-sm font-medium transition-colors">
                        RSVP
                      </button>
                    </div>
                  </div>
                </div>
                  <button className="w-full mt-4 px-4 py-1.5 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg font-medium transition-colors">
                  View All Events
                </button>
                </CardContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCommunity}
      />
    </div>
  );
};

export default Communities; 