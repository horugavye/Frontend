import axios from 'axios';
import type { AxiosError as AxiosErrorType } from 'axios';
import { API_CONFIG } from '../config/api';

// Create axios instance with default config
const api = axios.create({
  ...API_CONFIG,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle URL formatting
        if (config.url) {
            // Remove any duplicate /api/ in the URL
            if (config.url.includes('/api/api/')) {
                config.url = config.url.replace('/api/api/', '/api/');
            }

            // Ensure URL starts with /api/ if it doesn't already
            if (!config.url.startsWith('/api/') && !config.url.startsWith('http')) {
                config.url = `/api/${config.url}`;
            }

            // Remove any double slashes except for http(s)://
            config.url = config.url.replace(/([^:]\/)\/+/g, '$1');

            // Ensure trailing slash for Django endpoints
            if (!config.url.endsWith('/')) {
                config.url += '/';
            }
        }

        // Don't set Content-Type for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Response error:', error);
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error data:', error.response.data);
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
            
            if (error.response.status === 401) {
                // Handle unauthorized access
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        
        return Promise.reject(error);
    }
);

// Export the axios instance and type
export { api as default, type AxiosErrorType as AxiosError }; 