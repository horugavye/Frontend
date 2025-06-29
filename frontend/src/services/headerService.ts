import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface Notification {
  id: string;
  type: 'connection' | 'message' | 'rating' | 'community' | 'achievement' | 'event';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  user?: {
    name: string;
    avatar: string;
  };
  community?: {
    name: string;
    icon: string;
  };
}

const headerService = {
  // Get user profile data
  getUserProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  // Get notifications
  getNotifications: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string) => {
    const response = await api.post(`/notifications/${notificationId}/read/`);
    return response.data;
  },

  // Update theme preference
  updateThemePreference: async (theme: 'light' | 'dark' | 'system') => {
    const response = await api.put('/auth/profile/update/', {
      theme_preference: theme,
    });
    return response.data;
  },

  // Update online status
  updateOnlineStatus: async (status: 'online' | 'away' | 'offline' | 'busy') => {
    const response = await api.put('/auth/profile/update/', {
      online_status: status,
    });
    return response.data;
  },
};

export default headerService; 