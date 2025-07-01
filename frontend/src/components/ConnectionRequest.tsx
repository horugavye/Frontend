import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  HeartIcon,
  TrophyIcon,
  FireIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  HashtagIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Navigation from './Navigation';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import CardContainer from './CardContainer';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is important for CSRF
});

// Add request interceptor for authentication and CSRF
api.interceptors.request.use((config) => {
  // Get the latest token (in case it was updated)
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add CSRF token if present
  const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken.split('=')[1];
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried refreshing the token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            api.defaults.headers['Authorization'] = `Bearer ${response.data.access}`;
            originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

interface Friend {
  id: string;
  userId?: string;
  user: {
    name: string;
    username: string;
    avatarUrl: string;
    personalityTags: {
      name: string;
      color: string;
    }[];
    badges: {
      name: string;
      icon: string;
      color: string;
    }[];
    lastActive: string;
    matchScore: number;
    connectionStrength: number;
  };
  message: string;
  timestamp: string;
  mutualConnections: number;
  status: 'pending' | 'accepted' | 'rejected' | 'suggested' | 'discover';
  commonInterests?: string[];
  interests?: {
    name: string;
    category?: string;
  }[];
  lastInteraction?: string;
  location?: string;
  mutualFriends?: string[];
  connectionStatus?: 'connect' | 'pending' | 'connected';
  icebreakers?: string[];
  connectionRequestId?: number;
  is_alchy?: boolean;
}

interface FilterOptions {
  location: string[];
  interests: string[];
  connectionStrength: number;
  matchScore: number;
}

// Add this constant at the top of the file, after the imports
// const TAG_COLORS: { [key: string]: string } = { ... };

// Add this constant at the top with other constants
const BACKEND_URL = API_URL;

// Add this helper function at the top with other constants
const getAvatarUrl = (avatarPath: string) => {
  const MEDIA_URL = `${import.meta.env.VITE_API_URL}/media`;
  if (!avatarPath) return undefined;
  
  // If it's already a full URL, return it as is
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }

  // For backend media paths
  if (avatarPath.includes('media/')) {
    // Remove any duplicate media/ prefixes and clean the path
    const cleanPath = avatarPath.replace(/^.*?media\//, '');
    return `${MEDIA_URL}/${cleanPath}`;
  }

  // For avatar paths that start with avatars/
  if (avatarPath.startsWith('avatars/')) {
    return `${MEDIA_URL}/avatars/${avatarPath.replace('avatars/', '')}`;
  }

  // For other API endpoints, use the full API URL
  const path = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
  return `${BACKEND_URL}/${path}`;
};

const ConnectionRequest: FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'discover' | 'requests' | 'friends' | 'suggested'>('discover');
  const [sortBy, setSortBy] = useState<'recent' | 'mutual' | 'name' | 'match' | 'strength'>('match');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    location: [],
    interests: [],
    connectionStrength: 0,
    matchScore: 0,
  });
  const [suggestedFriends, setSuggestedFriends] = useState<Friend[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [currentFriends, setCurrentFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [discoverFriends, setDiscoverFriends] = useState<Friend[]>([]);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [isLoadingSentRequests, setIsLoadingSentRequests] = useState(false);
  const [sentRequestsError, setSentRequestsError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [infoPopoverId, setInfoPopoverId] = useState<string | null>(null);

  const fetchSuggestedFriends = async (page = 1) => {
    setIsLoadingSuggestions(true);
    setSuggestionsError(null);
    try {
      console.log('\n=== FETCHING SUGGESTED FRIENDS ===');
      const response = await api.get('/connections/suggestions/', {
        params: {
          page,
          page_size: pagination.pageSize
        }
      });
      
      // Add detailed logging for connection strength
      console.log('\n=== CONNECTION STRENGTH DEBUG ===');
      response.data.results.forEach((suggestion: any, index: number) => {
        console.log(`\nSuggestion ${index + 1}:`);
        console.log('User:', suggestion.suggested_user.username);
        console.log('Raw connection_strength:', suggestion.connection_strength);
        console.log('connection_strength type:', typeof suggestion.connection_strength);
        console.log('connection_strength validation:', {
          isNull: suggestion.connection_strength === null,
          isUndefined: suggestion.connection_strength === undefined,
          isNaN: isNaN(suggestion.connection_strength),
          value: suggestion.connection_strength
        });
      });
      
      console.log('\n=== RAW API RESPONSE ===');
      console.log(JSON.stringify(response.data, null, 2));
      
      if (!response.data.results || response.data.results.length === 0) {
        console.log('No suggestions found, refreshing...');
        await handleRefreshSuggestions();
        return;
      }
      
      // Transform the API response to match our Friend interface
      const transformedData = response.data.results.map((suggestion: any) => {
        console.log('\n=== PROCESSING SUGGESTION ===');
        console.log('Suggestion ID:', suggestion.id);
        const suggestedUser = suggestion.suggested_user;
        console.log('Suggested User:', suggestedUser.username);

        // Add connection strength validation and processing
        let connectionStrength = 0;
        if (typeof suggestion.connection_strength === 'number' && !isNaN(suggestion.connection_strength)) {
          connectionStrength = Math.min(Math.max(Math.round(suggestion.connection_strength), 0), 100);
          console.log('Valid connection strength:', connectionStrength);
        } else {
          console.warn('Invalid connection strength, defaulting to 0:', suggestion.connection_strength);
        }

        // Process interests with detailed logging
        console.log('\n--- Interests Processing ---');
        console.log('Raw interests:', suggestedUser.interests);
        const interests = Array.isArray(suggestedUser.interests) 
          ? suggestedUser.interests.map((interest: any) => ({
              name: interest.name || interest,
              category: interest.category
            }))
          : [];
        console.log('Processed interests:', interests);

        // Process common interests with detailed logging
        console.log('\n--- Common Interests Processing ---');
        console.log('Raw common_interests:', suggestion.common_interests);
        const commonInterests = Array.isArray(suggestion.common_interests) 
          ? suggestion.common_interests 
          : [];
        console.log('Processed common_interests:', commonInterests);
        console.log('Number of common interests:', commonInterests.length);
        console.log('Common interests details:', commonInterests);

        const icebreakers = (suggestion.match_highlights && suggestion.match_highlights.length > 0)
          ? suggestion.match_highlights
          : (suggestion.icebreakers || []);

        const transformedFriend = {
          id: suggestedUser.id.toString(),
          user: {
            name: `${suggestedUser.first_name || ''} ${suggestedUser.last_name || ''}`.trim() || suggestedUser.username,
            username: suggestedUser.username || suggestedUser.id.toString(),
            avatarUrl: getAvatarUrl(suggestedUser.avatar),
            personalityTags: suggestedUser.personality_tags?.map((tag: any) => {
              if (typeof tag === 'object' && tag.name) {
                return {
                  name: tag.name,
                  color: tag.color
                };
              }
              return null;
            }).filter(Boolean) || [],
            badges: suggestedUser.badges || [],
            matchScore: Math.round(suggestion.score), // Use sc
            connectionStrength: connectionStrength, // Use processed connection strengt
            lastActive: suggestedUser.last_active || 'Online'
          },
          message: `${suggestion.mutual_connections || 0} mutual connections`,
          timestamp: suggestion.created_at,
          mutualConnections: suggestion.mutual_connections || 0,
          status: 'suggested',
          interests: interests,
          commonInterests: commonInterests,
          location: suggestedUser.location || 'Unknown Location',
          mutualFriends: suggestion.mutual_friends || [],
          connectionStatus: suggestion.connection_status || 'connect',
          icebreakers: icebreakers,
          connectionRequestId: suggestion.connection_request_id || undefined
        };

        console.log('\n=== FINAL TRANSFORMED FRIEND ===');
        console.log('Name:', transformedFriend.user.name);
        console.log('Connection Strength:', transformedFriend.user.connectionStrength);
        console.log('Connection Strength Validation:', {
          isNumber: typeof transformedFriend.user.connectionStrength === 'number',
          isInRange: transformedFriend.user.connectionStrength >= 0 && transformedFriend.user.connectionStrength <= 100,
          value: transformedFriend.user.connectionStrength
        });

        return transformedFriend;
      });
      
      // Filter out users who are already friends
      const filteredData = transformedData.filter((suggestion: Friend) => {
        return !currentFriends.some(friend => friend.id === suggestion.id);
      });
      
      console.log('\n=== FINAL FILTERED DATA ===');
      filteredData.forEach((friend: Friend) => {
        console.log(`\nFriend: ${friend.user.name}`);
        console.log('Common Interests:', friend.commonInterests || []);
        console.log('Number of Common Interests:', (friend.commonInterests || []).length);
      });

      setSuggestedFriends(filteredData);
      setPagination({
        page: response.data.page,
        pageSize: response.data.page_size,
        total: response.data.total,
        totalPages: response.data.total_pages
      });
    } catch (error) {
      console.error('Error fetching suggested friends:', error);
      setSuggestionsError('Failed to load suggested connections. Please try again later.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'suggested') {
      console.log('Suggested tab activated, fetching friends...');
      fetchSuggestedFriends();
    }
  }, [activeTab]);

  const handleConnect = async (friendId: string) => {
    if (connectingIds.has(friendId)) return;
    
    try {
        setConnectingIds(prev => new Set([...prev, friendId]));
        
        // Update UI optimistically
        setSuggestedFriends(prevFriends => 
            prevFriends.map(friend => 
                friend.id === friendId 
                    ? { 
                        ...friend, 
                        connectionStatus: 'pending',
                        status: 'pending'
                    }
                    : friend
            )
        );

        // Let the backend handle validation and ensure proper sender/receiver roles
        const response = await api.post('/connections/requests/', {
            receiver_id: friendId,
            validate_only: false,
            ensure_roles: true
        });

        // Update UI with the connection request ID from the response
        setSuggestedFriends(prevFriends => 
            prevFriends.map(friend => 
                friend.id === friendId 
                    ? { 
                        ...friend, 
                        connectionStatus: 'pending',
                        status: 'pending',
                        connectionRequestId: response.data.id
                    }
                    : friend
            )
        );

        // Refresh sent requests after sending a new request
        await fetchSentRequests();
        setSuggestionsError(null);
    } catch (error: any) {
        console.error('Error sending connection request:', error);
        
        // Check if the error is due to an existing request
        if (error.response?.status === 400 && error.response?.data?.detail?.includes('already exists')) {
            // If a request already exists, fetch the existing request
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
                    (req: any) => req.receiver.id.toString() === friendId
                );
                
                if (existingRequest) {
                    // Update UI with the existing request ID
                    setSuggestedFriends(prevFriends => 
                        prevFriends.map(friend => 
                            friend.id === friendId 
                                ? { 
                                    ...friend, 
                                    connectionStatus: 'pending',
                                    status: 'pending',
                                    connectionRequestId: existingRequest.id
                                }
                                : friend
                        )
                    );
                    return;
                }
            } catch (fetchError) {
                console.error('Error fetching existing requests:', fetchError);
            }
        }
        
        // Revert UI state on error
        setSuggestedFriends(prevFriends => 
            prevFriends.map(friend => 
                friend.id === friendId 
                    ? { ...friend, connectionStatus: 'connect', status: 'suggested' }
                    : friend
            )
        );

        // Use backend error message
        const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to send connection request. Please try again.';
        setSuggestionsError(errorMessage);
    } finally {
        setConnectingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(friendId);
            return newSet;
        });
    }
};

  // Add WebSocket connection setup
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const WS_BASE_URL = import.meta.env.VITE_API_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${WS_BASE_URL}/ws/socket.io/?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        switch (data.type) {
          case 'suggested_friends':
          case 'suggested_friends_updated':
            // Transform the suggestions data to match our Friend interface
            const transformedSuggestions = data.suggestions.map((suggestion: any) => ({
              id: suggestion.suggested_user.id.toString(),
              user: {
                name: `${suggestion.suggested_user.first_name || ''} ${suggestion.suggested_user.last_name || ''}`.trim() || suggestion.suggested_user.username,
                username: suggestion.suggested_user.username,
                avatarUrl: getAvatarUrl(suggestion.suggested_user.avatar),
                personalityTags: suggestion.suggested_user.personality_tags || [],
                badges: suggestion.suggested_user.badges || [],
                matchScore: Math.round(suggestion.score), // Remove multiplication by 100
                connectionStrength: suggestion.connection_strength || 0,
                lastActive: suggestion.suggested_user.last_active || 'Online'
              },
              message: `${suggestion.mutual_connections || 0} mutual connections`,
              timestamp: suggestion.created_at,
              mutualConnections: suggestion.mutual_connections || 0,
              status: 'suggested' as const,
              interests: suggestion.suggested_user.interests || [],
              commonInterests: suggestion.common_interests || [],
              location: suggestion.suggested_user.location || 'Unknown Location',
              mutualFriends: suggestion.mutual_friends || [],
              connectionStatus: suggestion.connection_status || 'connect',
              connectionRequestId: suggestion.connection_request_id
            }));
            setSuggestedFriends(transformedSuggestions);
            break;

          case 'friends_list':
          case 'friends_updated':
            // Transform the friends data to match our Friend interface
            const transformedFriends = data.friends.map((friend: any) => ({
              id: friend.id,
              user: {
                name: `${friend.first_name || ''} ${friend.last_name || ''}`.trim() || friend.username,
                username: friend.username,
                avatarUrl: getAvatarUrl(friend.avatar),
                personalityTags: friend.personality_tags || [],
                badges: friend.badges || [],
                matchScore: 100, // Friends have 100% match score
                connectionStrength: friend.connection_strength || 0,
                lastActive: friend.last_active || 'Online'
              },
              message: `Connected ${new Date(friend.connected_since).toLocaleDateString()}`,
              timestamp: friend.connected_at,
              mutualConnections: friend.mutual_connections || 0,
              status: 'accepted' as const,
              interests: friend.interests || [],
              commonInterests: friend.common_interests || [],
              location: friend.location || 'Unknown Location',
              mutualFriends: [],
              connectionStatus: 'connected' as const,
              lastInteraction: friend.last_interaction
            }));
            setCurrentFriends(transformedFriends);
            break;

          case 'received_requests':
          case 'received_requests_updated':
            // Transform received requests
            const transformedReceivedRequests = data.requests.map((request: any) => ({
              id: `received-${request.id}-${request.sender.id}`,
              userId: request.sender.id.toString(),
              user: {
                name: `${request.sender.first_name || ''} ${request.sender.last_name || ''}`.trim() || request.sender.username,
                username: request.sender.username,
                avatarUrl: getAvatarUrl(request.sender.avatar),
                personalityTags: request.sender.personality_tags || [],
                badges: request.sender.badges || [],
                matchScore: request.match_score ? Math.round(request.match_score) : 0, // Remove multiplication by 100
                connectionStrength: request.connection_strength || 0,
                lastActive: request.sender.last_active || 'Online'
              },
              message: request.message || 'Would love to connect!',
              timestamp: request.created_at,
              mutualConnections: request.mutual_connections || 0,
              status: 'pending' as const,
              commonInterests: request.common_interests || [],
              location: request.sender.location || 'Unknown Location',
              connectionRequestId: request.id
            }));
            setFriendRequests(transformedReceivedRequests);
            break;

          case 'sent_requests':
          case 'sent_requests_updated':
            // Transform sent requests
            const transformedSentRequests = data.requests.map((request: any) => ({
              id: `sent-${request.id}-${request.receiver.id}`,
              userId: request.receiver.id.toString(),
              user: {
                name: `${request.receiver.first_name || ''} ${request.receiver.last_name || ''}`.trim() || request.receiver.username,
                username: request.receiver.username,
                avatarUrl: getAvatarUrl(request.receiver.avatar),
                personalityTags: request.receiver.personality_tags || [],
                badges: request.receiver.badges || [],
                matchScore: request.match_score ? Math.round(request.match_score) : 0, // Remove multiplication by 100
                connectionStrength: request.connection_strength || 0,
                lastActive: request.receiver.last_active || 'Online'
              },
              message: request.message || 'Connection request sent',
              timestamp: request.created_at,
              mutualConnections: request.mutual_connections || 0,
              status: 'pending' as const,
              commonInterests: request.common_interests || [],
              location: request.receiver.location || 'Unknown Location',
              connectionRequestId: request.id
            }));
            setSentRequests(transformedSentRequests);
            break;

          case 'error':
            console.error('WebSocket error:', data.message);
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Modify handleRefreshSuggestions to use WebSocket
  const handleRefreshSuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Request refresh through WebSocket
        socket.send(JSON.stringify({
          type: 'refresh_suggestions'
        }));
      } else {
        // Fallback to HTTP if WebSocket is not available
        await api.get('/connections/suggestions/refresh/');
        await fetchSuggestedFriends(1);
      }
    } catch (error) {
      console.error('Error refreshing suggestions:', error);
      setSuggestionsError('Failed to refresh suggestions. Please try again.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Modify fetchFriends to use WebSocket when available
  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    setFriendsError(null);
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Request friends refresh through WebSocket
        socket.send(JSON.stringify({
          type: 'refresh_friends'
        }));
      } else {
        // Fallback to HTTP if WebSocket is not available
        console.log('Fetching friends from database...');
        const response = await api.get('/connections/connections/friends/');
        const transformedFriends = response.data.map((friend: any) => ({
          id: friend.id,
          user: {
            name: `${friend.first_name || ''} ${friend.last_name || ''}`.trim() || friend.username,
            username: friend.username,
            avatarUrl: getAvatarUrl(friend.avatar),
            personalityTags: friend.personality_tags || [],
            badges: friend.badges || [],
            matchScore: 100, // Friends have 100% match score
            connectionStrength: friend.connection_strength || 0,
            lastActive: friend.last_active || 'Online'
          },
          message: `Connected ${new Date(friend.connected_since).toLocaleDateString()}`,
          timestamp: friend.connected_at,
          mutualConnections: friend.mutual_connections || 0,
          status: 'accepted' as const,
          interests: friend.interests || [],
          commonInterests: friend.common_interests || [],
          location: friend.location || 'Unknown Location',
          mutualFriends: [],
          connectionStatus: 'connected' as const,
          lastInteraction: friend.last_interaction
        }));
        setCurrentFriends(transformedFriends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Details:', error.response?.data);
        setFriendsError(error.response?.data?.detail || 'Failed to load friends. Please try again later.');
      } else {
        setFriendsError('Failed to load friends. Please try again later.');
      }
    } finally {
      setIsLoadingFriends(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [activeTab]);

  const stats = {
    pendingRequests: friendRequests.length,
    totalFriends: currentFriends.length,
    mutualConnections: 15
  };

  // Update locations and roles to use database data
  const MAX_FILTER_OPTIONS = 10;
  const locations = Array.from(
    new Set(
      [...suggestedFriends, ...friendRequests, ...currentFriends, ...discoverFriends]
        .map(friend => friend.location)
        .filter(Boolean)
    )
  ).slice(0, MAX_FILTER_OPTIONS);

  const allInterests = Array.from(
    new Set(
      [...suggestedFriends, ...friendRequests, ...currentFriends, ...discoverFriends]
        .flatMap(friend => friend.commonInterests || [])
    )
  ).slice(0, MAX_FILTER_OPTIONS);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const filterFriends = (friends: Friend[]) => {
    return friends.filter(friend => {
      const matchesSearch = !searchQuery || 
        friend.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.commonInterests?.some(interest => 
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesLocation = !filters.location.length || 
        (friend.location && filters.location.includes(friend.location));

      const matchesInterests = !filters.interests.length || 
        friend.commonInterests?.some(interest => 
          filters.interests.includes(interest)
        );

      return matchesSearch && matchesLocation && matchesInterests;
    });
  };

  const sortFriends = (friends: Friend[]) => {
    return [...friends].sort((a, b) => {
      switch (sortBy) {
        case 'mutual':
          return b.mutualConnections - a.mutualConnections;
        case 'name':
          return a.user.name.localeCompare(b.user.name);
        case 'match':
          return b.user.matchScore - a.user.matchScore;
        case 'strength':
          return b.user.connectionStrength - a.user.connectionStrength;
        case 'recent':
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });
  };

  const renderMatchScore = (score: number) => {
    const roundedScore = Math.round(score);
    const width = `${roundedScore}%`;
    return (
      <>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-purple-600">Match Score</span>
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {roundedScore}%
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width }}
          />
        </div>
      </>
    );
  };

  const renderBadge = (badge: { name: string; icon: string; color: string }) => {
    return (
      <span
        key={badge.name}
        className={`${badge.color} inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium`}
      >
        {badge.icon === 'trophy' && <TrophyIcon className="w-3 h-3" />}
        {badge.icon === 'fire' && <FireIcon className="w-3 h-3" />}
        {badge.icon === 'bolt' && <BoltIcon className="w-3 h-3" />}
        {badge.icon === 'heart' && <HeartIcon className="w-3 h-3" />}
        {badge.name}
      </span>
    );
  };

  const renderConnectionStrength = (strength: number) => {
    const bars = [20, 40, 60, 80, 100];
    return (
      <div className="flex gap-0.5 items-end h-4">
        {bars.map((threshold, index) => (
          <div
            key={threshold}
            className={`w-1 rounded-sm transition-all duration-300 ${
              strength >= threshold
                ? 'bg-gradient-to-t from-purple-500 to-pink-500'
                : 'bg-gray-200'
            }`}
            style={{ height: `${(index + 1) * 20}%` }}
          />
        ))}
      </div>
    );
  };

  const fetchSentRequests = async () => {
    setIsLoadingSentRequests(true);
    setSentRequestsError(null);
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Request refresh through WebSocket
        socket.send(JSON.stringify({
          type: 'refresh_requests'
        }));
      } else {
        // Fallback to HTTP if WebSocket is not available
        const response = await api.get('/connections/requests/', {
          params: {
            sender: true,
            receiver: false,
            status: 'pending',
            exclude_self: true,
            current_user: 'sender'
          }
        });
        
        const transformedRequests = response.data.map((request: any) => ({
          id: `sent-${request.id}-${request.receiver.id}`,
          userId: request.receiver.id.toString(),
          user: {
            name: `${request.receiver.first_name || ''} ${request.receiver.last_name || ''}`.trim() || request.receiver.username,
            username: request.receiver.username,
            avatarUrl: getAvatarUrl(request.receiver.avatar),
            personalityTags: request.receiver.personality_tags || [],
            badges: request.receiver.badges || [],
            matchScore: request.match_score ? Math.round(request.match_score) : 0, // Remove multiplication by 100
            connectionStrength: request.connection_strength || 0,
            lastActive: request.receiver.last_active || 'Online'
          },
          message: request.message || 'Connection request sent',
          timestamp: request.created_at,
          mutualConnections: request.mutual_connections || 0,
          status: 'pending' as const,
          commonInterests: request.common_interests || [],
          location: request.receiver.location || 'Unknown Location',
          connectionRequestId: request.id
        }));
        setSentRequests(transformedRequests);
      }
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      setSentRequestsError('Failed to load sent requests. Please try again later.');
    } finally {
      setIsLoadingSentRequests(false);
    }
  };

  const fetchFriendRequests = async () => {
    setIsLoadingRequests(true);
    setRequestsError(null);
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Request refresh through WebSocket
        socket.send(JSON.stringify({
          type: 'refresh_requests'
        }));
      } else {
        // Fallback to HTTP if WebSocket is not available
        const response = await api.get('/connections/requests/', {
          params: {
            sender: false,
            receiver: true,
            status: 'pending',
            exclude_self: true,
            current_user: 'receiver'
          }
        });
        
        const transformedRequests = response.data.map((request: any) => ({
          id: `received-${request.id}-${request.sender.id}`,
          userId: request.sender.id.toString(),
          user: {
            name: `${request.sender.first_name || ''} ${request.sender.last_name || ''}`.trim() || request.sender.username,
            username: request.sender.username,
            avatarUrl: getAvatarUrl(request.sender.avatar),
            personalityTags: request.sender.personality_tags || [],
            badges: request.sender.badges || [],
            matchScore: request.match_score ? Math.round(request.match_score) : 0, // Remove multiplication by 100
            connectionStrength: request.connection_strength || 0,
            lastActive: request.sender.last_active || 'Online'
          },
          message: request.message || 'Would love to connect!',
          timestamp: request.created_at,
          mutualConnections: request.mutual_connections || 0,
          status: 'pending' as const,
          commonInterests: request.common_interests || [],
          location: request.sender.location || 'Unknown Location',
          connectionRequestId: request.id
        }));
        setFriendRequests(transformedRequests);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      setRequestsError('Failed to load connection requests. Please try again later.');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Update useEffect to fetch both received and sent requests
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchFriendRequests();
      fetchSentRequests();
    }
  }, [activeTab]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setConnectingIds(prev => new Set([...prev, requestId]));
      setError(null);

      // Get the accepted friend's data before removing from requests
      const acceptedRequest = friendRequests.find(request => request.id === requestId);
      if (!acceptedRequest || !acceptedRequest.userId) {
        throw new Error('Request not found or invalid user ID');
      }

      // Call API to accept the request using the connectionRequestId
      const response = await api.post(`/connections/requests/${acceptedRequest.connectionRequestId}/accept/`);

      // Remove from friend requests using the unique ID
      setFriendRequests(prev => prev.filter(request => request.id !== requestId));

      // Remove from suggested friends if present (using the userId)
      setSuggestedFriends(prev => prev.filter(friend => 
        friend.id !== acceptedRequest.userId && 
        friend.connectionRequestId?.toString() !== acceptedRequest.connectionRequestId?.toString()
      ));

      // Add to current friends immediately for better UX
      const newFriend: Friend = {
        id: acceptedRequest.userId, // userId is guaranteed to be a string due to the check above
        user: acceptedRequest.user,
        message: `Connected ${new Date().toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
        mutualConnections: acceptedRequest.mutualConnections,
        status: 'accepted' as const,
        commonInterests: acceptedRequest.commonInterests,
        location: acceptedRequest.location,
        connectionStatus: 'connected' as const
      };
      setCurrentFriends(prev => [newFriend, ...prev]);

      // Refresh all lists to ensure consistency with backend
      await Promise.all([
        fetchFriends(),
        fetchSuggestedFriends(),
        fetchFriendRequests()
      ]);

    } catch (error) {
      console.error('Error accepting connection request:', error);
      let errorMessage = 'Failed to accept connection request';
      
      if (axios.isAxiosError(error) && error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
        errorMessage = error.response.data.detail || error.response.data.error || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setConnectingIds(prev => new Set([...prev, requestId]));
      setError(null);

      // Get the rejected friend's data before removing from requests
      const rejectedRequest = friendRequests.find(request => request.id === requestId);
      if (!rejectedRequest) {
        throw new Error('Request not found');
      }

      // Call API to reject the request using the connectionRequestId
      await api.post(`/connections/requests/${rejectedRequest.connectionRequestId}/reject/`);

      // Remove from friend requests using the unique ID
      setFriendRequests(prev => prev.filter(request => request.id !== requestId));

      // Remove from suggested friends if present (using the userId)
      setSuggestedFriends(prev => prev.filter(friend => 
        friend.id !== rejectedRequest.userId && 
        friend.connectionRequestId?.toString() !== rejectedRequest.connectionRequestId?.toString()
      ));

      // Refresh requests list to ensure consistency with backend
      await fetchFriendRequests();

    } catch (error) {
      console.error('Error rejecting connection request:', error);
      let errorMessage = 'Failed to reject connection request';
      
      if (axios.isAxiosError(error) && error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
        errorMessage = error.response.data.detail || error.response.data.error || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Modify handleCancelRequest to handle cancellation properly
  const handleCancelRequest = async (requestId: number) => {
    if (!requestId || connectingIds.has(requestId.toString())) return;
    
    try {
      setConnectingIds(prev => new Set([...prev, requestId.toString()]));
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Cancel request through WebSocket
        socket.send(JSON.stringify({
          type: 'cancel_request',
          request_id: requestId
        }));
      } else {
        // Fallback to HTTP if WebSocket is not available
        await api.post(`/connections/requests/${requestId}/cancel/`);
        
        // Update UI to show connect button again
        setSuggestedFriends(prevFriends => 
          prevFriends.map(friend => 
            friend.connectionRequestId === requestId
              ? { 
                  ...friend, 
                  connectionStatus: 'connect',
                  status: 'suggested',
                  connectionRequestId: undefined
                }
              : friend
          )
        );

        // Also remove from sent requests
        setSentRequests(prev => prev.filter(request => request.connectionRequestId !== requestId));
      }

      setSuggestionsError(null);
    } catch (error: any) {
      console.error('Error canceling connection request:', error);
      const errorMessage = error.response?.data?.detail || 
                       error.response?.data?.message || 
                       'Failed to cancel connection request. Please try again.';
      setSuggestionsError(errorMessage);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId.toString());
        return newSet;
      });
    }
  };

  const handleViewProfile = (username: string) => {
    // Use encodeURIComponent to properly encode the username
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  const renderRequestsContent = () => {
    if (isLoadingRequests) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-dark-text-secondary">Loading requests...</p>
        </div>
      );
    }

    if (requestsError) {
      return (
        <div className="text-center py-12 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4 max-w-md mx-auto">
            <p className="font-medium">Error Loading Requests</p>
            <p className="text-sm mt-1">{requestsError}</p>
          </div>
          <button
            onClick={() => fetchFriendRequests()}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5" />
              <span>Try Again</span>
            </div>
          </button>
        </div>
      );
    }

    if (friendRequests.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="bg-white/90 dark:bg-dark-card rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-dark-border max-w-md mx-auto backdrop-blur-sm">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">No Pending Requests</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
              You don't have any pending connection requests at the moment.
            </p>
            <button
              onClick={() => setActiveTab('discover')}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
            >
              Discover New Connections
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Received Requests Only */}
        {friendRequests.length > 0 && (
          <div className="bg-white/90 dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Received Requests</h2>
            <div className="space-y-4">
              {sortFriends(filterFriends(friendRequests)).map(renderFriendCard)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFriendsContent = () => {
    if (isLoadingFriends) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-dark-text-secondary">Loading friends...</p>
        </div>
      );
    }

    if (friendsError) {
      return (
        <div className="text-center py-12">
          <div className="bg-white/90 dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4 max-w-md mx-auto">
              <p className="font-medium">Error Loading Friends</p>
              <p className="text-sm mt-1">{friendsError}</p>
            </div>
            <button
              onClick={fetchFriends}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="w-5 h-5" />
                <span>Try Again</span>
              </div>
            </button>
          </div>
        </div>
      );
    }

    if (currentFriends.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="bg-white/90 dark:bg-dark-card rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-dark-border max-w-md mx-auto backdrop-blur-sm">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">No Friends Yet</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
              Start connecting with other professionals to build your network!
            </p>
            <button
              onClick={() => setActiveTab('discover')}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
            >
              Discover New Connections
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sortFriends(filterFriends(currentFriends)).map(renderFriendCard)}
      </div>
    );
  };

  const renderFriendCard = (friend: Friend) => (
    <div
      key={friend.id}
      className={`bg-white/90 dark:bg-dark-card rounded-2xl p-6 hover:bg-white dark:hover:bg-dark-card-hover transition-all duration-300 shadow-sm border border-gray-200 dark:border-dark-border hover:shadow-lg group relative overflow-hidden backdrop-blur-sm ${friend.is_alchy ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''}`}
    >
      {/* Alchy badge */}
      {friend.is_alchy && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/80 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-bold shadow-md animate-pulse">
          <SparklesIcon className="w-4 h-4 mr-1 text-yellow-500" />
          Alchy Friend
        </div>
      )}
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[size:24px_24px]"></div>
      </div>

      <div className="flex items-start gap-4 relative">
        {/* Enhanced Avatar Section */}
        <div className="relative cursor-pointer group/avatar" onClick={() => handleViewProfile(friend.user.username)}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full blur-md opacity-50 group-hover/avatar:opacity-75 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full animate-pulse opacity-20"></div>
            {friend.user.avatarUrl ? (
              <img
                src={friend.user.avatarUrl}
                alt={friend.user.name}
                className="w-16 h-16 rounded-full border-2 border-white dark:border-dark-border shadow-lg transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:shadow-xl relative z-10"
                onError={e => { (e.target as HTMLImageElement).src = '/default.jpg'; }}
              />
            ) : (
              <img
                src="/default.jpg"
                alt="Default profile"
                className="w-16 h-16 rounded-full border-2 border-white dark:border-dark-border shadow-lg transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:shadow-xl relative z-10 bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
              />
            )}
            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-border z-20 transition-all duration-300 ${
              friend.user.lastActive === 'Online' ? 'bg-green-500 ring-2 ring-green-200 dark:ring-green-900' : 'bg-gray-400'
            }`} />
          </div>
        </div>

        {/* Enhanced Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 
                className="text-lg font-semibold text-gray-900 dark:text-dark-text cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300"
                onClick={() => handleViewProfile(friend.user.username)}
              >
                {friend.user.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {friend.user.personalityTags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 text-xs font-medium rounded-full text-white shadow-sm transition-transform duration-300 hover:scale-105"
                  style={{ 
                    backgroundColor: tag.color,
                    boxShadow: `0 2px 4px ${tag.color}40`
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {/* Info icon for suggested friends */}
              {friend.status === 'suggested' && (
                <div className="relative">
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    onClick={() => setInfoPopoverId(infoPopoverId === friend.id ? null : friend.id)}
                    aria-label="Why suggested?"
                  >
                    <InformationCircleIcon className="w-5 h-5 text-purple-500" />
                  </button>
                  {infoPopoverId === friend.id && (
                    <div className="absolute right-0 mt-2 w-72 z-50 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg p-4 text-sm text-gray-700 dark:text-dark-text animate-fadeIn">
                      <div className="font-semibold text-purple-600 mb-2 flex items-center gap-1">
                        <InformationCircleIcon className="w-4 h-4" /> Why this suggestion?
                      </div>
                      {friend.icebreakers && friend.icebreakers.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {friend.icebreakers.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      ) : (
                        null
                      )}
                      <button
                        className="mt-3 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
                        onClick={() => setInfoPopoverId(null)}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}
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

          {/* Enhanced Interests Section */}
          {friend.commonInterests && friend.commonInterests.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-dark-text">Common Interests</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {friend.commonInterests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800/30 dark:to-pink-800/30 text-purple-800 dark:text-purple-200 rounded-full border border-purple-200 dark:border-purple-700/30 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 transition-all duration-300 cursor-pointer group/interest hover:shadow-md hover:scale-105"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Match Score and Connection Strength */}
          {friend.status !== 'accepted' && (
            <div className="mt-6 space-y-4">
              {/* Match Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Match Score</span>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {friend.user.matchScore}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${friend.user.matchScore}%` }}
                  />
                </div>
              </div>
              
              {/* Connection Strength */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Connection Strength</span>
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {friend.user.connectionStrength}%
                  </div>
                </div>
                <div className="flex items-end h-4 gap-0.5">
                  {[20, 40, 60, 80, 100].map((threshold, idx) => (
                    <div
                      key={threshold}
                      className={`w-1.5 rounded-sm transition-all duration-500 ${
                        friend.user.connectionStrength >= threshold
                          ? 'bg-gradient-to-t from-purple-500 to-pink-500 shadow-sm'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                      style={{ 
                        height: `${(idx + 1) * 4 + 8}px`,
                        boxShadow: friend.user.connectionStrength >= threshold 
                          ? '0 2px 4px rgba(168, 85, 247, 0.2)' 
                          : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeTab === 'suggested' && (
                <>
                  {friend.connectionStatus === 'connect' && (
                    <button
                      onClick={() => handleConnect(friend.id)}
                      disabled={connectingIds.has(friend.id)}
                      className={`px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105 font-medium ${
                        connectingIds.has(friend.id) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {connectingIds.has(friend.id) ? (
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
                  {friend.connectionStatus === 'pending' && (
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 bg-gray-100 dark:bg-dark-card-hover text-gray-600 dark:text-dark-text rounded-xl flex items-center gap-2 shadow-sm">
                        <ClockIcon className="w-5 h-5" />
                        <span>Pending</span>
                      </span>
                      <button
                        onClick={() => friend.connectionRequestId && handleCancelRequest(friend.connectionRequestId)}
                        disabled={connectingIds.has(friend.id)}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105 font-medium"
                      >
                        {connectingIds.has(friend.id) ? (
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
                </>
              )}

              {/* Enhanced Accept/Reject buttons for requests tab */}
              {activeTab === 'requests' && friend.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptRequest(friend.id)}
                    disabled={connectingIds.has(friend.id)}
                    className={`px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105 font-medium ${
                      connectingIds.has(friend.id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {connectingIds.has(friend.id) ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-5 h-5" />
                        <span>Accept</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRejectRequest(friend.id)}
                    disabled={connectingIds.has(friend.id)}
                    className={`px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105 font-medium ${
                      connectingIds.has(friend.id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {connectingIds.has(friend.id) ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        <span>Rejecting...</span>
                      </>
                    ) : (
                      <>
                        <XMarkIcon className="w-5 h-5" />
                        <span>Reject</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <button className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-all duration-300 hover:scale-105 hover:shadow-md font-medium">
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span>Message</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const fetchDiscoverFriends = async () => {
    setIsLoadingDiscover(true);
    setDiscoverError(null);
    try {
      console.log('Fetching discover friends from database...');
      const response = await api.get('/connections/connections/discover/');
      
      // Add detailed logging of the raw response
      console.log('\n=== Raw Discover Response ===');
      response.data.forEach((friend: any) => {
        console.log(`\nFriend: ${friend.first_name} ${friend.last_name} (ID: ${friend.id})`);
        console.log('Raw connection_strength:', friend.connection_strength);
        console.log('Raw match_score:', friend.match_score);
        console.log('Raw interests:', JSON.stringify(friend.interests, null, 2));
        console.log('Raw common_interests:', JSON.stringify(friend.common_interests, null, 2));
      });

      const transformedFriends = response.data.map((friend: any) => {
        console.log(`\n=== Processing Discover Friend: ${friend.first_name} ${friend.last_name} ===`);
        console.log('Raw match_score:', friend.match_score);
        console.log('Raw connection_strength:', friend.connection_strength);
        
        // Process interests with detailed logging
        const interests = Array.isArray(friend.interests) 
          ? friend.interests.map((interest: any) => ({
              name: interest.name || interest,
              category: interest.category
            }))
          : [];

        console.log('Processed interests:', interests);

        // Validate and process match score
        let matchScore = 0;
        if (typeof friend.match_score === 'number' && !isNaN(friend.match_score)) {
          matchScore = Math.min(Math.max(Math.round(friend.match_score), 0), 100);
        } else {
          console.warn('Invalid match score in discover, defaulting to 0:', friend.match_score);
        }

        // Validate and process connection strength
        let connectionStrength = 0;
        if (typeof friend.connection_strength === 'number' && !isNaN(friend.connection_strength)) {
          connectionStrength = Math.min(Math.max(Math.round(friend.connection_strength), 0), 100);
        }

        const transformedFriend = {
          id: friend.id?.toString() || 'unknown',
          user: {
            name: `${friend.first_name || ''} ${friend.last_name || ''}`.trim() || friend.username || 'Anonymous User',
            username: friend.username || friend.id?.toString() || 'unknown', // Add username with fallback
            avatarUrl: getAvatarUrl(friend.avatar),
            personalityTags: friend.personality_tags || [],
            badges: Array.isArray(friend.badges) 
              ? friend.badges.map((badge: any) => ({
                  name: badge?.name || 'Unknown Badge',
                  icon: badge?.icon || 'trophy',
                  color: badge?.color || 'text-purple-500'
                }))
              : [],
            matchScore: matchScore, // Use validated match score
            connectionStrength: connectionStrength, // Use validated connection strength
            lastActive: friend.last_active || friend.last_login || 'Recently'
          },
          message: `${friend.mutual_connections || 0} mutual connections`,
          timestamp: friend.created_at || new Date().toISOString(),
          mutualConnections: friend.mutual_connections || 0,
          status: 'discover' as const,
          interests: interests,
          commonInterests: Array.isArray(friend.common_interests) ? friend.common_interests : [],
          location: friend.location || friend.city || 'Location not specified',
          mutualFriends: Array.isArray(friend.mutual_friends) ? friend.mutual_friends : [],
          connectionStatus: 'connect' as const
        };

        console.log('\n=== Final Transformed Discover Friend ===');
        console.log('Name:', transformedFriend.user.name);
        console.log('Match Score:', transformedFriend.user.matchScore);
        console.log('Connection Strength:', transformedFriend.user.connectionStrength);
        console.log('Common Interests:', transformedFriend.commonInterests);

        return transformedFriend;
      });

      setDiscoverFriends(transformedFriends);
    } catch (error) {
      console.error('Error fetching discover friends:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Details:', error.response?.data);
        setDiscoverError(error.response?.data?.detail || 'Failed to load discover friends. Please try again later.');
      } else {
        setDiscoverError('Failed to load discover friends. Please try again later.');
      }
    } finally {
      setIsLoadingDiscover(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscoverFriends();
    }
  }, [activeTab]);

  const renderDiscoverContent = () => {
    if (isLoadingDiscover) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-dark-text-secondary">Loading discover friends...</p>
        </div>
      );
    }

    if (discoverError) {
      return (
        <div className="text-center py-12 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4 max-w-md mx-auto">
            <p className="font-medium">Error Loading Discover Friends</p>
            <p className="text-sm mt-1">{discoverError}</p>
          </div>
          <button
            onClick={fetchDiscoverFriends}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5" />
              <span>Try Again</span>
            </div>
          </button>
        </div>
      );
    }

    if (discoverFriends.length === 0) {
      return (
        <div className="text-center py-12 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">No Discover Friends Found</h3>
          <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
            We couldn't find any new connections to discover at the moment. Try adjusting your filters or check back later!
          </p>
          <button
            onClick={fetchDiscoverFriends}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5" />
              <span>Refresh</span>
            </div>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sortFriends(filterFriends(discoverFriends)).map(renderFriendCard)}
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
            {/* Enhanced Header Section */}
              <CardContainer>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 dark:bg-dark-card-hover p-2 sm:p-3 rounded-xl shadow-sm">
                    <UserPlusIcon className="w-5 h-5 sm:w-7 sm:h-7 text-gray-500 dark:text-gray-300" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-dark-text">Find Friends</h1>
                    <p className="text-gray-600 dark:text-dark-text-secondary mt-1 text-sm sm:text-base">
                      Connect with like-minded professionals
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="bg-gray-100 dark:bg-dark-card-hover px-3 sm:px-4 py-2 rounded-xl shadow-sm w-full sm:w-auto text-center sm:text-left">
                    <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{stats.pendingRequests} pending requests</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-dark-card-hover px-3 sm:px-4 py-2 rounded-xl shadow-sm w-full sm:w-auto text-center sm:text-left">
                    <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{stats.totalFriends} total friends</span>
                  </div>
                </div>
              </div>
              </CardContainer>

              {/* Enhanced Search and Filter */}
              <CardContainer>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by name, role, or interests..."
                        className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-3 bg-white/80 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-sm sm:text-base text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 backdrop-blur-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-2 sm:p-3 rounded-xl transition-all duration-300 backdrop-blur-sm w-full sm:w-auto ${
                        showFilters 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                          : 'bg-white/80 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text hover:bg-white dark:hover:bg-dark-card-hover shadow-sm hover:shadow-md'
                      }`}
                    >
                      <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  {/* Enhanced Advanced Filters */}
                  {showFilters && (
                    <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border space-y-4 shadow-sm animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Location Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <GlobeAltIcon className="w-4 h-4 text-purple-500" />
                              Location
                            </div>
                          </label>
                          <select
                            multiple
                            className="w-full rounded-lg border-gray-200 dark:border-dark-border text-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text shadow-sm"
                            value={filters.location}
                            onChange={(e) => handleFilterChange('location', 
                              Array.from(e.target.selectedOptions, option => option.value)
                            )}
                            size={4}
                          >
                            {locations.map(location => (
                              <option 
                                key={location} 
                                value={location}
                                className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer text-gray-900 dark:text-dark-text"
                              >
                                {location}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Interests Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                            <div className="flex items-center gap-2">
                              <HashtagIcon className="w-4 h-4 text-purple-500" />
                              Interests
                            </div>
                          </label>
                          <select
                            multiple
                            className="w-full rounded-lg border-gray-200 dark:border-dark-border text-sm focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text shadow-sm"
                            value={filters.interests}
                            onChange={(e) => handleFilterChange('interests', 
                              Array.from(e.target.selectedOptions, option => option.value)
                            )}
                            size={4}
                          >
                            {allInterests.map(interest => (
                              <option 
                                key={interest} 
                                value={interest}
                                className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer text-gray-900 dark:text-dark-text"
                              >
                                {interest}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Connection Strength Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                            <div className="flex items-center gap-2">
                              <BoltIcon className="w-4 h-4 text-purple-500" />
                              Minimum Connection Strength
                            </div>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.connectionStrength}
                            onChange={(e) => handleFilterChange('connectionStrength', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                          />
                          <div className="text-sm text-gray-600 dark:text-dark-text-secondary mt-2 flex justify-between">
                            <span>0%</span>
                            <span className="text-purple-600 dark:text-purple-400 font-medium">{filters.connectionStrength}%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Match Score Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                            <div className="flex items-center gap-2">
                              <SparklesIcon className="w-4 h-4 text-purple-500" />
                              Minimum Match Score
                            </div>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.matchScore}
                            onChange={(e) => handleFilterChange('matchScore', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                          />
                          <div className="text-sm text-gray-600 dark:text-dark-text-secondary mt-2 flex justify-between">
                            <span>0%</span>
                            <span className="text-purple-600 dark:text-purple-400 font-medium">{filters.matchScore}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContainer>

              {/* Tabs */}
              <CardContainer>
                <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-dark-border pb-4">
                  {[
                    { id: 'discover', icon: SparklesIcon, label: 'Discover' },
                    { id: 'suggested', icon: StarIcon, label: 'Suggested', count: suggestedFriends.length },
                    { id: 'requests', icon: UserPlusIcon, label: 'Requests', count: stats.pendingRequests },
                    { id: 'friends', icon: UserIcon, label: 'Friends', count: stats.totalFriends }
                  ].map(({ id, icon: Icon, label, count }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`pb-3 px-3 border-b-2 transition-all duration-300 text-sm whitespace-nowrap ${
                        activeTab === id
                          ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-dark-card'
                          : 'border-transparent text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text bg-white dark:bg-dark-card'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                        {count !== undefined && count > 0 && (
                          <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs px-1.5 py-0.5 rounded-full">
                            {count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Enhanced Sort Options */}
                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <span className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Sort by:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'recent', label: 'Most Recent' },
                      { id: 'match', label: 'Match Score' },
                      { id: 'mutual', label: 'Mutual Friends' }
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setSortBy(id as any)}
                        className={`px-3 py-1 rounded-lg transition-all duration-300 text-sm ${
                          sortBy === id
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add pagination controls */}
                {activeTab === 'suggested' && suggestedFriends.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
                    <button
                      onClick={() => fetchSuggestedFriends(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 w-full sm:w-auto ${
                        pagination.page === 1
                          ? 'bg-gray-100 dark:bg-dark-card-hover text-gray-400 cursor-not-allowed'
                          : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchSuggestedFriends(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 w-full sm:w-auto ${
                        pagination.page === pagination.totalPages
                          ? 'bg-gray-100 dark:bg-dark-card-hover text-gray-400 cursor-not-allowed'
                          : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </CardContainer>

              {/* Content based on active tab */}
              <div className="space-y-4">
                {activeTab === 'discover' && renderDiscoverContent()}
                {activeTab === 'suggested' && (
                  <>
                    {isLoadingSuggestions ? (
                      <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-4 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-purple-500 border-t-transparent"></div>
                        <p className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Loading suggestions...</p>
                      </div>
                    ) : suggestionsError ? (
                      <div className="text-center py-8 sm:py-12 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4 max-w-md mx-auto">
                          <p className="font-medium text-sm sm:text-base">Error Loading Suggestions</p>
                          <p className="text-sm mt-1">{suggestionsError}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSuggestionsError(null);
                            setActiveTab('suggested');
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Try Again</span>
                          </div>
                        </button>
                      </div>
                    ) : suggestedFriends.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 bg-white/90 dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border backdrop-blur-sm">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UserGroupIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">No Suggested Friends Yet</h3>
                        <p className="text-gray-600 dark:text-dark-text-secondary mb-6 text-sm sm:text-base">
                          We're working on finding the perfect connections for you. Check back later for personalized suggestions!
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                          <button
                            onClick={() => setActiveTab('discover')}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
                          >
                            Explore Discover
                          </button>
                          <button
                            onClick={handleRefreshSuggestions}
                            className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>Refresh</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortFriends(filterFriends(suggestedFriends)).map(renderFriendCard)}
                      </div>
                    )}
                  </>
                )}
                {activeTab === 'requests' && renderRequestsContent()}
                {activeTab === 'friends' && renderFriendsContent()}
            </div>
          </div>
        </div>

          {/* Right Sidebar - Stats and Suggested Friends */}
          <div className="hidden lg:block lg:col-span-3 order-3 lg:order-3">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
            <div className="space-y-6">
              {/* Stats Card */}
                <CardContainer>
                  <div className="relative overflow-hidden backdrop-blur-sm">
                {/* Modern Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[size:24px_24px]"></div>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text mb-6">Friends Stats</h2>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-1">
                      {stats.totalFriends}
                    </div>
                    <p className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Total Friends</p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <span className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Pending Requests</span>
                      <span className="text-gray-900 dark:text-dark-text font-medium text-sm sm:text-base">{stats.pendingRequests}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <span className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Mutual Friends</span>
                      <span className="text-gray-900 dark:text-dark-text font-medium text-sm sm:text-base">{stats.mutualConnections}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card-hover rounded-lg">
                      <span className="text-gray-600 dark:text-dark-text-secondary text-sm sm:text-base">Suggested Friends</span>
                      <span className="text-gray-900 dark:text-dark-text font-medium text-sm sm:text-base">{suggestedFriends.length}</span>
                    </div>
                  </div>
                </div>
              </div>
                </CardContainer>

              {/* Suggested Friends Card */}
                <CardContainer>
                  <div className="relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-text">Suggested Friends</h2>
                  <button 
                    onClick={handleRefreshSuggestions}
                    className="p-2 bg-white/80 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm backdrop-blur-sm"
                  >
                    <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {suggestedFriends.slice(0, 3).map(friend => (
                    <div 
                      key={friend.id} 
                      className="flex items-center gap-3 group p-3 hover:bg-white dark:hover:bg-dark-card-hover rounded-xl transition-all duration-300 relative overflow-hidden border border-gray-100 dark:border-dark-border"
                    >
                      <div className="relative cursor-pointer group/avatar" onClick={() => handleViewProfile(friend.user.username)}>
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full blur-md opacity-50 group-hover/avatar:opacity-75 transition-all duration-500"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full animate-pulse opacity-20"></div>
                          {friend.user.avatarUrl ? (
                            <img
                              src={friend.user.avatarUrl}
                              alt={friend.user.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-dark-border transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:shadow-xl relative z-10"
                              onError={e => { (e.target as HTMLImageElement).src = '/default.jpg'; }}
                            />
                          ) : (
                            <img
                              src="/default.jpg"
                              alt="Default profile"
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-dark-border transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:shadow-xl relative z-10 bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                            />
                          )}
                          <span className={`absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 border-white dark:border-dark-border z-20 transition-all duration-300 ${
                            friend.user.lastActive === 'Online' ? 'bg-green-500 ring-2 ring-green-200 dark:ring-green-900' : 'bg-gray-400'
                          }`} />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-gray-900 dark:text-dark-text font-bold truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 cursor-pointer text-sm sm:text-base"
                          onClick={() => handleViewProfile(friend.user.username)}
                        >
                          {friend.user.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <UserGroupIcon className="w-3 h-3 text-purple-500" />
                          <span className="text-gray-500 dark:text-dark-text-secondary font-medium">{friend.mutualConnections} mutual friends</span>
                        </div>
                      </div>

                      {friend.connectionStatus === 'connect' && (
                        <button 
                          className="p-2 bg-white/80 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-300 hover:scale-105 relative z-10 shadow-sm backdrop-blur-sm"
                          onClick={() => handleConnect(friend.id)}
                          disabled={connectingIds.has(friend.id)}
                        >
                          {connectingIds.has(friend.id) ? (
                            <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          ) : (
                            <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      )}
                      {friend.connectionStatus === 'pending' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-dark-text-secondary font-medium">Pending</span>
                          <button 
                            className="p-2 bg-white/80 dark:bg-dark-card border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:scale-105 relative z-10 shadow-sm backdrop-blur-sm"
                            onClick={() => friend.connectionRequestId && handleCancelRequest(friend.connectionRequestId)}
                            disabled={connectingIds.has(friend.id)}
                          >
                            {connectingIds.has(friend.id) ? (
                              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            ) : (
                              <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                        </div>
                      )}
                      {friend.connectionStatus === 'connected' && (
                        <button 
                          className="p-2 bg-white/80 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary rounded-xl relative z-10 shadow-sm backdrop-blur-sm"
                          disabled
                        >
                          <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {suggestedFriends.length > 3 && (
                    <button 
                      onClick={() => setActiveTab('suggested')}
                      className="w-full py-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold transition-colors duration-300 bg-white/80 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 backdrop-blur-sm"
                    >
                      View All Suggestions
                    </button>
                  )}
                </div>
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

export default ConnectionRequest;