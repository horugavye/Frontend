import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import SuggestedCommunities from '../components/aisuggested';
import PostCard from '../components/PostCard';
import { UserPlusIcon, ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Helper function to handle avatar URLs with fallback to /default.png
const getAvatarUrl = (avatarPath: string) => {
  if (avatarPath && avatarPath.startsWith('http')) return avatarPath;
  return '/default.png';
};

// Helper function to handle community icon URLs with fallback
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
  
  // Handle relative paths - if it starts with /media/, it's already a full path
  if (iconPath.startsWith('/media/')) {
    return `${API_BASE_URL}${iconPath}`;
  }
  
  // Handle relative paths without /media/ prefix
  const cleanPath = iconPath.startsWith('/') ? iconPath.substring(1) : iconPath;
  return `${API_BASE_URL}/media/${cleanPath}`;
};

// Helper function to handle community banner URLs with fallback
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
  
  // Handle relative paths - if it starts with /media/, it's already a full path
  if (bannerPath.startsWith('/media/')) {
    return `${API_BASE_URL}${bannerPath}`;
  }
  
  // Handle relative paths without /media/ prefix
  const cleanPath = bannerPath.startsWith('/') ? bannerPath.substring(1) : bannerPath;
  return `${API_BASE_URL}/media/${cleanPath}`;
};

interface Person {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
  role: string;
  personality_tags: { name: string; color: string }[];
  connection_status?: 'connect' | 'pending' | 'connected' | 'received';
  connection_request_id?: number;
}
interface Community {
  id: number;
  name: string;
  description: string;
  slug: string;
  bannerUrl?: string;
  icon?: string;
  topics?: string[];
  total_members?: number;
}
interface Post {
  id: number | string;
  title: string;
  snippet: string;
  media: { type: string; url: string; alt: string }[];
  author?: {
    name: string;
    avatarUrl: string;
    personality_tags: { name: string; color: string }[];
    role: string;
    username: string;
  };
  rating: number;
  totalRatings: number;
  commentCount: number;
  created_at?: string;
  community?: {
    id: number;
    name: string;
    slug: string;
    is_private?: boolean;
    isPrivate?: boolean;
  };
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

type Tab = 'all' | 'people' | 'communities' | 'posts';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

// CardContainer for consistent UI
const CardContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm transition-colors duration-200 ${className}`}>
    {children}
  </div>
);

const Research: React.FC = () => {
  const [personStatus, setPersonStatus] = useState<{ [id: number]: 'connect' | 'pending' | 'connected' | 'received' }>({});
  const [connecting, setConnecting] = useState<{ [id: number]: boolean }>({});
  const [showAllPeople, setShowAllPeople] = useState(false);
  const [peopleSortBy, setPeopleSortBy] = useState<'name' | 'role' | 'relevance'>('relevance');
  const [peopleFilter, setPeopleFilter] = useState<string>('');

  const queryParam = useQuery().get('query') || '';
  const [query, setQuery] = useState(queryParam);
  const [tab, setTab] = useState<Tab>('all');

  const [people, setPeople] = useState<Person[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    setShowAllPeople(false);
  }, [query, tab]);

  useEffect(() => {
    async function fetchResearch() {
      setLoading(true);
      try {
        // Get token from localStorage
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Fetch people
        const peopleRes = await fetch(`/api/research/people/?search=${encodeURIComponent(query)}`, {
          credentials: 'include',
          headers,
        });
        const peopleData = await peopleRes.json();
        const peopleArray = Array.isArray(peopleData) ? peopleData : [];
        
        // Transform people data to include connection status
        const transformedPeople = peopleArray.map((person: any) => ({
          id: person.id,
          username: person.username,
          name: person.name,
          avatarUrl: getAvatarUrl(person.avatarUrl),
          role: person.role,
          personality_tags: person.personality_tags || [],
          connection_status: person.connection_status || 'connect',
          connection_request_id: person.connection_request_id
        }));
        
        setPeople(transformedPeople);
        
        // Initialize person status from API data
        const initialStatus: { [id: number]: 'connect' | 'pending' | 'connected' | 'received' } = {};
        transformedPeople.forEach(person => {
          if (person.connection_status) {
            initialStatus[person.id] = person.connection_status;
          }
        });
        setPersonStatus(initialStatus);
        
        // Fetch communities
        const commRes = await fetch(`/api/communities/?search=${encodeURIComponent(query)}`, {
          credentials: 'include',
          headers,
        });
        const commData = await commRes.json();
        const communitiesData = Array.isArray(commData.results) ? commData.results : Array.isArray(commData) ? commData : [];
        
        // Transform communities data to match Community interface
        const transformedCommunities = communitiesData.map((community: any) => ({
          id: community.id,
          name: community.name,
          description: community.description,
          slug: community.slug,
          bannerUrl: community.banner || null,
          icon: community.icon || null,
          topics: community.topics || [],
          total_members: community.total_members || community.members_count || 0,
        }));
        
        setCommunities(transformedCommunities);
        
        // Fetch posts
        const postsRes = await fetch(`/api/posts/?search=${encodeURIComponent(query)}`, {
          credentials: 'include',
          headers,
        });
        const postsData = await postsRes.json();
        const postsArr = Array.isArray(postsData.results) ? postsData.results : Array.isArray(postsData) ? postsData : [];
        // Transform posts to match Post interface
        setPosts(postsArr.map((post: any) => {
          console.log('Processing post:', {
            id: post.id,
            title: post.title,
            hasCommunity: !!post.community,
            community: post.community,
            isPersonal: !post.community || post.is_personal
          });
          
          // Determine if this is a personal post
          const isPersonal = !post.community || post.is_personal;
          
          return {
            id: isPersonal ? `personal_${post.id}` : post.id,
            title: post.title,
            snippet: post.snippet || post.content || '',
            media: Array.isArray(post.media)
              ? post.media
                  .filter((m: any) => m.type === 'image' || m.type === 'video')
                  .map((m: any) => ({
                    type: m.type as 'image' | 'video',
                    url: m.url || m.file || '',
                    alt: m.alt || '',
                  } as MediaItem))
              : [],
            author: post.author,
            rating: post.rating,
            totalRatings: post.totalRatings,
            commentCount: post.commentCount,
            created_at: post.created_at,
            // Only set community if it actually exists and the post is not personal
            community: (post.community && !post.is_personal) ? {
              id: post.community.id,
              name: post.community.name,
              slug: post.community.slug,
              is_private: post.community.is_private,
              isPrivate: post.community.isPrivate,
            } : undefined,
          };
        }));
      } catch (e) {
        setPeople([]);
        setCommunities([]);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchResearch();
  }, [query]);

  let filteredPeople = people;
  let filteredCommunities = communities;
  let filteredPosts = posts;

  if (tab === 'all') {
    if (query) {
      filteredPeople = people.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.role && p.role.toLowerCase().includes(query.toLowerCase()))
      );
      filteredCommunities = communities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(query.toLowerCase()))
      );
      filteredPosts = posts.filter(p => {
        // Allow personal posts (no community field)
        if (!p.community) return (
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          (p.snippet && p.snippet.toLowerCase().includes(query.toLowerCase()))
        );
        // Only show posts from public communities
        if (p.community.is_private === false || p.community.isPrivate === false) {
          return (
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            (p.snippet && p.snippet.toLowerCase().includes(query.toLowerCase()))
          );
        }
        return false;
      });
    } else {
      // When query is empty, show all items but still filter private posts
      filteredPeople = people;
      filteredCommunities = communities;
      filteredPosts = posts.filter(p => {
        // Allow personal posts (no community field)
        if (!p.community) return true;
        // Only show posts from public communities
        return p.community.is_private === false || p.community.isPrivate === false;
      });
    }
  }

  let tabResults: Person[] | Community[] | Post[] = [];
  if (tab === 'people') {
    if (query) {
      tabResults = people.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.role && p.role.toLowerCase().includes(query.toLowerCase()))
      );
    } else {
      tabResults = people;
    }
  }
  else if (tab === 'communities') {
    if (query) {
      tabResults = communities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(query.toLowerCase()))
      );
    } else {
      tabResults = communities;
    }
  }
  else if (tab === 'posts') {
    if (query) {
      tabResults = posts.filter(p => {
        // Allow personal posts (no community field)
        if (!p.community) return (
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          (p.snippet && p.snippet.toLowerCase().includes(query.toLowerCase()))
        );
        // Only show posts from public communities
        if (p.community.is_private === false || p.community.isPrivate === false) {
          return (
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            (p.snippet && p.snippet.toLowerCase().includes(query.toLowerCase()))
          );
        }
        return false;
      });
    } else {
      // When query is empty, show all posts but still filter private posts
      tabResults = posts.filter(p => {
        // Allow personal posts (no community field)
        if (!p.community) return true;
        // Only show posts from public communities
        return p.community.is_private === false || p.community.isPrivate === false;
      });
    }
  }

  // Helper to generate a unique key for posts
  const getPostKey = (item: Post) => item.community ? `community-${item.id}` : `personal-${item.id}`;

  // Sort and filter people
  const getSortedAndFilteredPeople = (peopleList: Person[]) => {
    let filtered = peopleList;
    
    // Apply text filter
    if (peopleFilter) {
      filtered = filtered.filter(person =>
        person.name.toLowerCase().includes(peopleFilter.toLowerCase()) ||
        person.role.toLowerCase().includes(peopleFilter.toLowerCase()) ||
        person.personality_tags.some(tag => tag.name.toLowerCase().includes(peopleFilter.toLowerCase()))
      );
    }
    
    // Apply sorting
    switch (peopleSortBy) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'role':
        return filtered.sort((a, b) => a.role.localeCompare(b.role));
      case 'relevance':
      default:
        // Keep original order (relevance from API)
        return filtered;
    }
  };

  // Handle community navigation
  const handleCommunityView = (community: Community) => {
    if (community.slug) {
      navigate(`/communities/${community.slug}`);
    }
  };

  // Handle connection request
  const handleConnect = async (person: Person) => {
    if (connecting[person.id]) return;
    
    try {
      setConnecting(prev => ({ ...prev, [person.id]: true }));
      
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/connections/requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          receiver_id: person.id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersonStatus(prev => ({ ...prev, [person.id]: 'pending' }));
        
        // Update the person's connection_request_id
        setPeople(prev => prev.map(p => 
          p.id === person.id 
            ? { ...p, connection_status: 'pending', connection_request_id: data.id }
            : p
        ));
      } else {
        console.error('Failed to send connection request');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setConnecting(prev => ({ ...prev, [person.id]: false }));
    }
  };

  // Handle cancel connection request
  const handleCancelRequest = async (person: Person) => {
    if (!person.connection_request_id || connecting[person.id]) return;
    
    try {
      setConnecting(prev => ({ ...prev, [person.id]: true }));
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/connections/requests/${person.connection_request_id}/cancel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        setPersonStatus(prev => ({ ...prev, [person.id]: 'connect' }));
        
        // Update the person's connection status
        setPeople(prev => prev.map(p => 
          p.id === person.id 
            ? { ...p, connection_status: 'connect', connection_request_id: undefined }
            : p
        ));
      } else {
        console.error('Failed to cancel connection request');
      }
    } catch (error) {
      console.error('Error canceling connection request:', error);
    } finally {
      setConnecting(prev => ({ ...prev, [person.id]: false }));
    }
  };

  return (
    <div className="flex-1 bg-gray-100 dark:bg-dark-bg transition-colors duration-200 min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-gray-800 p-4">
                <Navigation />
              </div>
            </div>
          </div>

          {/* Main Content - Research UI */}
          <div className="lg:col-span-6 order-2 lg:order-2">
            <div className="space-y-4">
              {/* Search Header */}
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-gray-800 p-4">
                <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Research</h1>
                <input
                  type="text"
                  placeholder="Search for people, communities, or posts..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded mb-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="relative mb-6">
                  {/* Creative Tab Container */}
                  <div className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl p-1.5 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="flex space-x-1">
                      {(['all', 'people', 'communities', 'posts'] as Tab[]).map((t, index) => (
                        <button
                          key={t}
                          className={`relative flex-1 px-3 sm:px-4 lg:px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                            tab === t 
                              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white shadow-lg shadow-purple-500/25 dark:shadow-purple-500/40' 
                              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                          }`}
                          onClick={() => setTab(t)}
                        >
                          {/* Active tab indicator */}
                          {tab === t && (
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-xl animate-pulse"></div>
                          )}
                          
                          {/* Tab content with icon */}
                          <div className="relative z-10 flex items-center justify-center space-x-1 sm:space-x-2">
                            {/* Tab icons */}
                            {t === 'all' && (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                              </svg>
                            )}
                            {t === 'people' && (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                              </svg>
                            )}
                            {t === 'communities' && (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                              </svg>
                            )}
                            {t === 'posts' && (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="hidden sm:inline text-sm lg:text-base">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                          </div>
                          
                          {/* Hover effect */}
                          <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                            tab === t 
                              ? 'opacity-0' 
                              : 'opacity-0 hover:opacity-100 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10'
                          }`}></div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60 animate-pulse"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                </div>
              </div>

              {tab === 'all' && (
                <div className="space-y-4">
                  {/* People Section */}
                  <CardContainer>
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">People</h2>
                    
                    {/* People Filter and Sort Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        type="text"
                        placeholder="Filter people by name, role, or tags..."
                        value={peopleFilter}
                        onChange={e => setPeopleFilter(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <select
                        value={peopleSortBy}
                        onChange={e => setPeopleSortBy(e.target.value as 'name' | 'role' | 'relevance')}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="relevance">Sort by Relevance</option>
                        <option value="name">Sort by Name</option>
                        <option value="role">Sort by Role</option>
                      </select>
                    </div>
                    
                    <div className="space-y-4">
                      {getSortedAndFilteredPeople(filteredPeople).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-6">
                          <div className="relative mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                              <svg className="w-10 h-10 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 animate-pulse"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {peopleFilter ? 'No matches found' : 'No people discovered yet'}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                            {peopleFilter 
                              ? 'Try adjusting your search terms or filters to find more people.'
                              : 'Be the first to discover amazing people in your network!'
                            }
                          </p>
                        </div>
                      )}
                      {getSortedAndFilteredPeople(filteredPeople).slice(0, showAllPeople ? undefined : 10).map(item => (
                        <div key={item.id}>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-colors duration-200">
                            <div className="flex items-center">
                              <img 
                                src={item.avatarUrl} 
                                alt={item.name} 
                                className="w-12 h-12 rounded-full mr-4"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/default.png'; }}
                              />
                              <div className="flex-1">
                                <div 
                                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors duration-200"
                                  onClick={() => navigate(`/profile/${item.username}`)}
                                >
                                  {item.name}
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {item.personality_tags.map(tag => (
                                    <span key={tag.name} className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="ml-4">
                                {item.connection_status === 'connected' ? (
                                  <button className="p-2 bg-white/80 dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl relative z-10 shadow-sm backdrop-blur-sm" disabled>
                                    <CheckIcon className="w-5 h-5" />
                                  </button>
                                ) : item.connection_status === 'pending' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl flex items-center gap-2">
                                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                      <span>Pending</span>
                                    </span>
                                    <button
                                      className="p-2 bg-white/80 dark:bg-dark-card border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:scale-105 relative z-10 shadow-sm backdrop-blur-sm"
                                      onClick={() => handleCancelRequest(item)}
                                      disabled={!!connecting[item.id]}
                                    >
                                      <XMarkIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105 font-medium"
                                    onClick={() => handleConnect(item)}
                                    disabled={!!connecting[item.id]}
                                  >
                                    {connecting[item.id] ? (
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
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {getSortedAndFilteredPeople(filteredPeople).length > 10 && (
                        <div className="text-center pt-4">
                          <button
                            onClick={() => setShowAllPeople(!showAllPeople)}
                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            {showAllPeople ? `Show Less (${getSortedAndFilteredPeople(filteredPeople).length})` : `Show More (${getSortedAndFilteredPeople(filteredPeople).length - 10} more)`}
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContainer>

                  {/* Communities Section */}
                  <CardContainer>
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Communities</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {filteredCommunities.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 px-6">
                          <div className="relative mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                              <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-60 animate-pulse"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {query ? 'No communities match your search' : 'No communities found'}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                            {query 
                              ? 'Try different keywords or browse all communities to discover new ones.'
                              : 'Start exploring to find amazing communities that match your interests!'
                            }
                          </p>
                        </div>
                      )}
                      {filteredCommunities.map(item => (
                        <div key={item.id}>
                          <div 
                            onClick={() => handleCommunityView(item)}
                            className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 cursor-pointer"
                          >
                            <div className="h-32 relative">
                              <img 
                                src={getCommunityBannerUrl(item.bannerUrl)} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/default_community_banner.png';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={getCommunityIconUrl(item.icon)} 
                                    alt={item.name} 
                                    className="w-10 h-10 rounded-full border-2 border-white shadow"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = '/default_community_icon.png';
                                    }}
                                  />
                                  <h3 className="text-lg font-medium text-white">{item.name}</h3>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{item.description}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {item.topics?.map(topic => (
                                  <span key={topic} className="text-xs px-3 py-1.5 rounded-full font-medium bg-gradient-to-r from-purple-50 via-pink-50 to-white text-purple-600 border border-purple-200 dark:bg-gradient-to-r dark:from-purple-900 dark:via-purple-700 dark:to-pink-900 dark:text-white dark:border-purple-700/40">{topic}</span>
                                ))}
                              </div>
                              <div className="mt-4 flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">{item.total_members?.toLocaleString()} members</span>
                                <button 
                                  onClick={() => handleCommunityView(item)}
                                  className="px-4 py-1.5 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg font-medium transition-colors"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContainer>

                  {/* Posts Section */}
                  <CardContainer>
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Posts</h2>
                    <div className="space-y-4">
                      {filteredPosts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-6">
                          <div className="relative mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                              <svg className="w-10 h-10 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full opacity-60 animate-pulse"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-blue-400 to-green-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {query ? 'No posts match your search' : 'No posts discovered yet'}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                            {query 
                              ? 'Try different search terms or browse all posts to find interesting content.'
                              : 'Be the first to discover amazing posts and stories from the community!'
                            }
                          </p>
                        </div>
                      )}
                      {filteredPosts.map(item => (
                        <div key={getPostKey(item)}>
                          <PostCard
                            id={item.id}
                            title={item.title}
                            content={item.snippet}
                            author={{
                              name: item.author?.name || "",
                              avatarUrl: getAvatarUrl(item.author?.avatarUrl || ""),
                              personalityTags: item.author?.personality_tags || [],
                              role: item.author?.role || "",
                              username: item.author?.username || ""
                            }}
                            author_role={item.author?.role || ""}
                            timestamp={item.created_at || new Date().toISOString()}
                            rating={item.rating ?? 0}
                            totalRatings={item.totalRatings ?? 0}
                            commentCount={item.commentCount ?? 0}
                            isPersonal={!item.community}
                            media={item.media as MediaItem[]}
                            community={item.community?.slug}
                            communityName={item.community?.name}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContainer>
                </div>
              )}
              {tab === 'people' && (
                <>
                  {/* People Filter and Sort Controls */}
                  <CardContainer>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        type="text"
                        placeholder="Filter people by name, role, or tags..."
                        value={peopleFilter}
                        onChange={e => setPeopleFilter(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <select
                        value={peopleSortBy}
                        onChange={e => setPeopleSortBy(e.target.value as 'name' | 'role' | 'relevance')}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="relevance">Sort by Relevance</option>
                        <option value="name">Sort by Name</option>
                        <option value="role">Sort by Role</option>
                      </select>
                    </div>
                    
                    <div className="space-y-4">
                      {getSortedAndFilteredPeople(tabResults as Person[]).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-6">
                          <div className="relative mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                              <svg className="w-10 h-10 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 animate-pulse"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {peopleFilter ? 'No matches found' : 'No people discovered yet'}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                            {peopleFilter 
                              ? 'Try adjusting your search terms or filters to find more people.'
                              : 'Be the first to discover amazing people in your network!'
                            }
                          </p>
                        </div>
                      )}
                      {getSortedAndFilteredPeople(tabResults as Person[]).slice(0, showAllPeople ? undefined : 10).map((item) => (
                        <div key={item.id}>
                          <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm transition-colors duration-200">
                            <div className="flex items-center">
                              <img 
                                src={item.avatarUrl} 
                                alt={item.name} 
                                className="w-12 h-12 rounded-full mr-4"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/default.png'; }}
                              />
                              <div className="flex-1">
                                <div 
                                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors duration-200"
                                  onClick={() => navigate(`/profile/${item.username}`)}
                                >
                                  {item.name}
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {item.personality_tags.map(tag => (
                                    <span key={tag.name} className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="ml-4">
                                {item.connection_status === 'connected' ? (
                                  <button className="p-2 bg-white/80 dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl relative z-10 shadow-sm backdrop-blur-sm" disabled>
                                    <CheckIcon className="w-5 h-5" />
                                  </button>
                                ) : item.connection_status === 'pending' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl flex items-center gap-2">
                                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                      <span>Pending</span>
                                    </span>
                                    <button
                                      className="p-2 bg-white/80 dark:bg-dark-card border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:scale-105 relative z-10 shadow-sm backdrop-blur-sm"
                                      onClick={() => handleCancelRequest(item)}
                                      disabled={!!connecting[item.id]}
                                    >
                                      <XMarkIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105 font-medium"
                                    onClick={() => handleConnect(item)}
                                    disabled={!!connecting[item.id]}
                                  >
                                    {connecting[item.id] ? (
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
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {getSortedAndFilteredPeople(tabResults as Person[]).length > 10 && (
                        <div className="text-center pt-4">
                          <button
                            onClick={() => setShowAllPeople(!showAllPeople)}
                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            {showAllPeople ? `Show Less (${getSortedAndFilteredPeople(tabResults as Person[]).length})` : `Show More (${getSortedAndFilteredPeople(tabResults as Person[]).length - 10} more)`}
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContainer>
                </>
              )}
              {tab === 'communities' && (
                <CardContainer>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {(tabResults as Community[]).length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 px-6">
                        <div className="relative mb-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-60 animate-pulse"></div>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {query ? 'No communities match your search' : 'No communities found'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                          {query 
                            ? 'Try different keywords or browse all communities to discover new ones.'
                            : 'Start exploring to find amazing communities that match your interests!'
                          }
                        </p>
                      </div>
                    )}
                    {(tabResults as Community[]).map((item) => (
                      <div key={item.id}>
                        <div 
                          onClick={() => handleCommunityView(item)}
                          className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 cursor-pointer"
                        >
                          <div className="h-32 relative">
                            <img 
                              src={getCommunityBannerUrl(item.bannerUrl)} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/default_community_banner.png';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={getCommunityIconUrl(item.icon)} 
                                  alt={item.name} 
                                  className="w-10 h-10 rounded-full border-2 border-white shadow"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/default_community_icon.png';
                                  }}
                                />
                                <h3 className="text-lg font-medium text-white">{item.name}</h3>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{item.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.topics?.map(topic => (
                                <span key={topic} className="text-xs px-3 py-1.5 rounded-full font-medium bg-gradient-to-r from-purple-50 via-pink-50 to-white text-purple-600 border border-purple-200 dark:bg-gradient-to-r dark:from-purple-900 dark:via-purple-700 dark:to-pink-900 dark:text-white dark:border-purple-700/40">{topic}</span>
                              ))}
                            </div>
                            <div className="mt-4 flex items-center justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">{item.total_members?.toLocaleString()} members</span>
                              <button 
                                onClick={() => handleCommunityView(item)}
                                className="px-4 py-1.5 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg font-medium transition-colors"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContainer>
              )}
              {tab === 'posts' && (
                <CardContainer>
                  <div className="space-y-4">
                    {(tabResults as Post[]).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 px-6">
                        <div className="relative mb-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full opacity-60 animate-pulse"></div>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-blue-400 to-green-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {query ? 'No posts match your search' : 'No posts discovered yet'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                          {query 
                            ? 'Try different search terms or browse all posts to find interesting content.'
                            : 'Be the first to discover amazing posts and stories from the community!'
                          }
                        </p>
                      </div>
                    )}
                    {(tabResults as Post[]).map((item) => (
                      <div key={getPostKey(item)}>
                        <PostCard
                          id={item.id}
                          title={item.title}
                          content={item.snippet}
                          author={{
                            name: item.author?.name || "",
                            avatarUrl: getAvatarUrl(item.author?.avatarUrl || ""),
                            personalityTags: item.author?.personality_tags || [],
                            role: item.author?.role || "",
                            username: item.author?.username || ""
                          }}
                          author_role={item.author?.role || ""}
                          timestamp={item.created_at || new Date().toISOString()}
                          rating={item.rating ?? 0}
                          totalRatings={item.totalRatings ?? 0}
                          commentCount={item.commentCount ?? 0}
                          isPersonal={!item.community}
                          media={item.media as MediaItem[]}
                          community={item.community?.slug}
                          communityName={item.community?.name}
                        />
                      </div>
                    ))}
                  </div>
                </CardContainer>
              )}
            </div>
          </div>

          {/* Right Sidebar - Suggested Communities - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3 order-3 lg:order-3">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-gray-800 p-4">
                <SuggestedCommunities />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Research; 