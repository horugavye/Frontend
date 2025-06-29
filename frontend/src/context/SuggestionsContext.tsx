import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/api';

export interface Suggestion {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
    role: string;
    personalityTags: {
      name: string;
      color: string;
    }[];
    badges: {
      name: string;
      icon: string;
      color: string;
    }[];
    matchScore: number;
    connectionStrength: number;
    lastActive: string;
  };
  message: string;
  timestamp: string;
  mutualConnections: number;
  status: 'pending' | 'accepted' | 'rejected' | 'suggested';
  commonInterests?: string[];
  lastInteraction?: string;
  location?: string;
  mutualFriends?: string[];
  connectionStatus?: 'connect' | 'pending' | 'connected';
  icebreakers?: string[];
}

interface SuggestionsContextType {
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  fetchSuggestions: (page?: number) => Promise<void>;
  refreshSuggestions: () => Promise<void>;
}

const SuggestionsContext = createContext<SuggestionsContextType | undefined>(undefined);

export const SuggestionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });

  const { isAuthenticated } = useAuth();

  const fetchSuggestions = async (page = 1) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      console.log('\n=== FETCHING SUGGESTIONS ===');
      const response = await axios.get(`${API_URL}/connections/suggestions/`, {
        params: {
          page,
          page_size: pagination.pageSize
        }
      });

      // Add detailed logging of raw response
      console.log('\n=== RAW SUGGESTIONS RESPONSE ===');
      response.data.results.forEach((suggestion: any, index: number) => {
        console.log(`\nSuggestion ${index + 1}:`);
        console.log('User:', suggestion.suggested_user.username);
        console.log('Raw connection_strength:', suggestion.connection_strength);
        console.log('connection_strength type:', typeof suggestion.connection_strength);
        console.log('connection_strength validation:', {
          isNull: suggestion.connection_strength === null,
          isUndefined: suggestion.connection_strength === undefined,
          isNaN: isNaN(suggestion.connection_strength),
          value: suggestion.connection_strength,
          isFalsy: !suggestion.connection_strength
        });
      });

      if (!response.data.results || response.data.results.length === 0) {
        await refreshSuggestions();
        return;
      }

      const transformedData = response.data.results.map((suggestion: any) => {
        const suggestedUser = suggestion.suggested_user;
        
        // Add validation and processing for connection strength
        let connectionStrength = 0;
        if (typeof suggestion.connection_strength === 'number' && !isNaN(suggestion.connection_strength)) {
          connectionStrength = Math.min(Math.max(Math.round(suggestion.connection_strength), 0), 100);
          console.log(`\nProcessing connection strength for ${suggestedUser.username}:`);
          console.log('Original value:', suggestion.connection_strength);
          console.log('Processed value:', connectionStrength);
        } else {
          console.warn(`Invalid connection strength for ${suggestedUser.username}:`, suggestion.connection_strength);
        }

        const transformed = {
          id: suggestedUser.id.toString(),
          user: {
            name: `${suggestedUser.first_name || ''} ${suggestedUser.last_name || ''}`.trim() || suggestedUser.username,
            avatarUrl: suggestedUser.avatar || 'https://i.pravatar.cc/150?img=5',
            role: suggestedUser.role || 'AI Professional',
            personalityTags: suggestedUser.personality_tags || [],
            badges: suggestedUser.badges || [],
            matchScore: Math.round(suggestion.score * 100),
            connectionStrength: connectionStrength, // Use processed value
            lastActive: suggestedUser.last_active || 'Online'
          },
          message: `${suggestion.mutual_connections || 0} mutual connections`,
          timestamp: suggestion.created_at,
          mutualConnections: suggestion.mutual_connections || 0,
          status: 'suggested',
          commonInterests: suggestion.common_interests || [],
          location: suggestedUser.location || 'Unknown Location',
          mutualFriends: suggestion.mutual_friends || [],
          connectionStatus: 'connect',
          icebreakers: suggestion.match_highlights || []
        };

        // Log final transformed data
        console.log(`\nFinal transformed data for ${suggestedUser.username}:`);
        console.log('Connection Strength:', transformed.user.connectionStrength);
        console.log('Connection Strength Validation:', {
          isNumber: typeof transformed.user.connectionStrength === 'number',
          isInRange: transformed.user.connectionStrength >= 0 && transformed.user.connectionStrength <= 100,
          value: transformed.user.connectionStrength
        });

        return transformed;
      });

      setSuggestions(transformedData);
      setPagination({
        page: response.data.page,
        pageSize: response.data.page_size,
        total: response.data.total,
        totalPages: response.data.total_pages
      });
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      setError('Failed to load suggestions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSuggestions = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await axios.get(`${API_URL}/connections/suggestions/refresh/`);
      await fetchSuggestions(1);
    } catch (error: any) {
      console.error('Error refreshing suggestions:', error);
      setError('Failed to refresh suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load suggestions when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
      setError(null);
    }
  }, [isAuthenticated]);

  const value = {
    suggestions,
    isLoading,
    error,
    pagination,
    fetchSuggestions,
    refreshSuggestions
  };

  return (
    <SuggestionsContext.Provider value={value}>
      {children}
    </SuggestionsContext.Provider>
  );
};

export const useSuggestions = () => {
  const context = useContext(SuggestionsContext);
  if (context === undefined) {
    throw new Error('useSuggestions must be used within a SuggestionsProvider');
  }
  return context;
}; 