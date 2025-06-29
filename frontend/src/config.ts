// API URL configuration with fallback
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    // If VITE_API_URL is set, use it
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  
  // Fallback for production - replace with your actual Render backend URL
  if (import.meta.env.PROD) {
    return 'https://superlink-h7if.onrender.com/api';
  }
  
  // Fallback for development
  return 'http://localhost:8000/api';
};

export const API_URL = getApiUrl(); 