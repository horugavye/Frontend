import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_URL_WITH_SLASH = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Helper function to construct API URLs
const constructApiUrl = (endpoint: string) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // Ensure endpoint ends with a trailing slash
  const endpointWithSlash = cleanEndpoint.endsWith('/') ? cleanEndpoint : `${cleanEndpoint}/`;
  return `${API_URL_WITH_SLASH}/${endpointWithSlash}`;
};

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  rating: number;
  reputation_points: number;
  connection_strength: number;
  is_verified: boolean;
  is_mentor: boolean;
  account_type: 'personal' | 'professional' | 'business';
  profile_visibility: 'public' | 'private' | 'connections';
  two_factor_enabled: boolean;
  email_verified: boolean;
  last_active: string;
  online_status: 'online' | 'away' | 'offline' | 'busy';
  language_preference: string;
  theme_preference: 'light' | 'dark' | 'system';
  timezone: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  contribution_points: number;
  profile_completion: number;
  endorsement_count: number;
}

type RegisterResult = { userId: string };

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  interests: string[];
  personality_tags: { name: string; color: string }[];
  bio: string;
  location: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const formatUserData = (userData: any): User => {
  console.log('Raw user data received:', {
    ...userData,
    hasAvatar: !!userData.avatar,
    avatarPath: userData.avatar,
  });

  // Format the avatar URL properly
  let avatarUrl = userData.avatar;
  
  // Only process avatar if it exists
  if (avatarUrl) {
    if (avatarUrl.startsWith('http')) {
      // Keep the URL as is if it's already a full URL
      console.log('Using existing full URL avatar:', avatarUrl);
    } else if (avatarUrl.startsWith('/media')) {
      // Add base URL if it starts with /media
      avatarUrl = `${API_BASE_URL}${avatarUrl}`;
      console.log('Constructed media URL:', avatarUrl);
    } else {
      // Add full path for other cases
      avatarUrl = `${API_BASE_URL}/media/${avatarUrl}`;
      console.log('Constructed full path URL:', avatarUrl);
    }
  }

  const formattedUser = {
    ...userData,
    avatar: avatarUrl,
    // Ensure all required fields have default values
    rating: userData.rating || 0,
    reputation_points: userData.reputation_points || 0,
    connection_strength: userData.connection_strength || 0,
    is_verified: userData.is_verified || false,
    is_mentor: userData.is_mentor || false,
    account_type: userData.account_type || 'personal',
    profile_visibility: userData.profile_visibility || 'public',
    two_factor_enabled: userData.two_factor_enabled || false,
    email_verified: userData.email_verified || false,
    last_active: userData.last_active || new Date().toISOString(),
    online_status: userData.online_status || 'online',
    language_preference: userData.language_preference || 'en',
    theme_preference: userData.theme_preference || 'light',
    timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    post_count: userData.post_count || 0,
    follower_count: userData.follower_count || 0,
    following_count: userData.following_count || 0,
    contribution_points: userData.contribution_points || 0,
    profile_completion: userData.profile_completion || 0,
    endorsement_count: userData.endorsement_count || 0
  };

  console.log('Formatted user data:', {
    ...formattedUser,
    hasAvatar: !!formattedUser.avatar,
    avatarUrl: formattedUser.avatar,
  });
  
  return formattedUser;
};

// Add at the top of the file
let refreshPromise: Promise<string | null> | null = null;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const onRefreshSuccess = (token: string | null) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const subscribeTokenRefresh = (callback: (token: string | null) => void) => {
    refreshSubscribers.push(callback);
  };

  // Function to get user data
  const fetchUserData = async (accessToken: string) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      const response = await axios.get(constructApiUrl('auth/user'));
      console.log('Raw API response:', {
        data: response.data,
        hasAvatar: !!response.data.avatar,
        avatarPath: response.data.avatar
      });
      const formattedUser = formatUserData(response.data);
      setUser(formattedUser);
      return formattedUser;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  // Update the refreshToken function
  const refreshToken = async () => {
    // If a refresh is already in progress, subscribe to its result
    if (refreshPromise) {
      return new Promise<string | null>((resolve) => {
        subscribeTokenRefresh(token => resolve(token));
      });
    }

    setIsRefreshing(true);
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      console.error('No refresh token available');
      setIsRefreshing(false);
      onRefreshSuccess(null);
      return null;
    }

    try {
      // Clear any existing Authorization header to avoid conflicts
      delete axios.defaults.headers.common['Authorization'];
      
      console.log('Attempting to refresh token...');
      const response = await axios.post(constructApiUrl('auth/token/refresh'), {
        refresh: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Token refresh response:', response.data);

      if (!response.data.access) {
        console.error('No access token in refresh response');
        setIsRefreshing(false);
        onRefreshSuccess(null);
        return null;
      }

      const newAccessToken = response.data.access;
      if (typeof newAccessToken !== 'string') {
        console.error('Invalid access token format');
        setIsRefreshing(false);
        onRefreshSuccess(null);
        return null;
      }

      localStorage.setItem('access_token', newAccessToken);
      setToken(newAccessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      console.log('Token refreshed successfully');
      
      // Dispatch token-expired event to trigger WebSocket reconnection
      window.dispatchEvent(new Event('token-expired'));
      
      setIsRefreshing(false);
      onRefreshSuccess(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setIsRefreshing(false);
      onRefreshSuccess(null);
      
      // Only redirect if the component is still mounted
      if (mountedRef.current) {
        window.location.href = '/login';
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  };

  // Add token expiration check
  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // If token expires in less than 5 minutes, schedule a refresh
      if (timeUntilExpiration < 300000) { // 5 minutes in milliseconds
        console.log('Token expiring soon, scheduling refresh');
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        // Schedule refresh 1 minute before expiration
        refreshTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            console.log('Refreshing token');
            refreshToken();
          }
        }, Math.max(0, timeUntilExpiration - 60000)); // 1 minute before expiration
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [token]);

  const initializeAuth = async () => {
    setLoading(true);
    try {
      let currentToken = localStorage.getItem('access_token');
      const refreshTokenValue = localStorage.getItem('refresh_token');

      if (!currentToken) {
        if (!refreshTokenValue) {
          // No tokens available - user is not logged in
          setUser(null);
          setToken(null);
          setLoading(false);
          return;
        }
        
        // Try to refresh the token if we have a refresh token
        console.log('No access token, attempting to refresh...');
        const newToken = await refreshToken();
        if (newToken) {
          currentToken = newToken;
        } else {
          // Clear everything if refresh fails
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setToken(null);
          setLoading(false);
          return;
        }
      }

      try {
        // Try to get user data with current token
        await fetchUserData(currentToken);
      } catch (error) {
        if (!refreshPromise) {
          // If current token fails and we haven't tried refreshing yet, try to refresh
          console.log('Access token invalid, attempting to refresh...');
          const newToken = await refreshToken();
          if (newToken) {
            await fetchUserData(newToken);
          } else {
            // Clear auth state if refresh fails
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setToken(null);
          }
        } else {
          // Clear auth state if both token and refresh fail
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      // Clear everything if authentication fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  // Update the login function to ensure proper initialization
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login with:', { email });
      
      const response = await axios.post(constructApiUrl('auth/login'), {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });

      console.log('Login response:', response.data);
      
      const { user: userData, access, refresh } = response.data;
      
      if (!access || !refresh) {
        throw new Error('Invalid response from server: missing tokens');
      }
      
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      setToken(access);
      
      // Get full user data
      try {
        const userResponse = await axios.get(constructApiUrl('auth/user'), {
          headers: {
            'Authorization': `Bearer ${access}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        });
        
        console.log('Full user data response:', userResponse.data);
        
        // Format and set user data
        const formattedUser = formatUserData(userResponse.data);
        console.log('Setting formatted user:', formattedUser);
        setUser(formattedUser);

        // Preload the avatar
        if (formattedUser.avatar) {
          console.log('Preloading avatar:', formattedUser.avatar);
          const img = new Image();
          img.src = formattedUser.avatar;
        }
      } catch (error: any) {
        console.error('Error fetching full user data:', error);
        // Fall back to login response data if user fetch fails
        const formattedUser = formatUserData(userData);
        setUser(formattedUser);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          throw new Error('Invalid email or password');
        } else if (status === 400) {
          throw new Error(data.error || 'Please check your input');
        } else if (status === 500) {
          throw new Error('Server error. Please try again later');
        } else {
          throw new Error(data.error || 'Login failed');
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection');
      } else {
        // Something happened in setting up the request
        throw new Error('Error setting up request');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      console.log('[Register] Starting registration', data);
      const response = await axios.post(constructApiUrl('auth/register'), {
        username: data.username,
        email: data.email,
        password: data.password,
        password2: data.confirmPassword,
        first_name: data.first_name,
        last_name: data.last_name,
        interests: data.interests,
        personality_tags: data.personality_tags,
        bio: data.bio,
        location: data.location
      });
      console.log('[Register] Registration response', response.data);

      const { access, refresh } = response.data;
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      console.log('[Register] Tokens set in localStorage', { access, refresh });
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      setToken(access);
      console.log('[Register] Authorization header set');
      // Fetch and set the full user data (same as login)
      console.log('[Register] Fetching user data from /auth/user');
      const userResponse = await axios.get(constructApiUrl('auth/user'), {
        headers: {
          'Authorization': `Bearer ${access}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      console.log('[Register] User data fetched', userResponse.data);
      const formattedUser = formatUserData(userResponse.data);
      setUser(formattedUser);
      console.log('[Register] User set in context', formattedUser);
      // Return userId for redirect
      return { userId: formattedUser.id };
    } catch (error: any) {
      console.error('[Register] Registration error:', error);
      throw new Error(error.response?.data?.error || 'Registration failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const response = await axios.post(constructApiUrl('auth/google'), {
        credential
      });

      const { user, access, refresh } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      setToken(access);
      
      setUser(user);
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.response?.data?.error || 'Google login failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
    token,
    setToken,
    refreshToken
  };

  // Add logs to track user and token changes
  useEffect(() => {
    console.log('[AuthProvider] user changed:', user);
  }, [user]);
  useEffect(() => {
    console.log('[AuthProvider] token changed:', token);
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 