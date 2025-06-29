import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Connection API endpoints
export const connectionApi = {
  getConnections: () => api.get('/connections/'),
  getConnectionRequests: () => api.get('/connections/requests/'),
  sendConnectionRequest: (receiverId: number, message?: string) => 
    api.post('/connections/requests/', { receiver_id: receiverId, message }),
  acceptConnectionRequest: (requestId: number) => 
    api.post(`/connections/requests/${requestId}/accept/`),
  rejectConnectionRequest: (requestId: number) => 
    api.post(`/connections/requests/${requestId}/reject/`),
  cancelConnectionRequest: (requestId: number) => 
    api.post(`/connections/requests/${requestId}/cancel/`),
  getSuggestions: () => api.get('/connections/suggestions/'),
  getAllSuggestions: () => api.get('/connections/suggestions/'),
  getAISuggestedFriends: () => api.get('/connections/alchemy-suggestions/'),
  refreshSuggestions: () => api.get('/connections/suggestions/refresh/'),
  getDiscoverSuggestions: () => api.get('/connections/discover/'),
};

// Real-time Message Suggestion API endpoints
export const realTimeSuggestionApi = {
  generateSuggestions: (conversationId: string, suggestionTypes?: string[], maxSuggestions?: number, customPrompt?: string) => 
    api.post('/chat/real-time-suggestions/generate/', {
      conversation_id: conversationId,
      suggestion_types: suggestionTypes,
      max_suggestions: maxSuggestions,
      custom_prompt: customPrompt
    }),
  analyzeConversation: (conversationId: string) => 
    api.get(`/chat/real-time-suggestions/analyze_conversation/?conversation_id=${conversationId}`),
}; 