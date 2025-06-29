// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL;

// API Endpoints
export const API_ENDPOINTS = {
    COMMUNITIES: 'communities',
    USER_COMMUNITIES: 'communities/user',
    DISCOVER_COMMUNITIES: 'communities/discover',
    TRENDING_TOPICS: 'communities/trending-topics',
    AUTH: 'auth',
    USERS: 'users',
    SEARCH_PROFILES: 'auth/profiles/search',
    POSTS: 'communities/posts/',
    COMMUNITY_POSTS: 'communities',
    SAVED_POSTS: 'saved-posts'
};

// Axios instance configuration
export const API_CONFIG = {
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
}; 