import * as React from 'react';
import { 
  MagnifyingGlassIcon, 
  EnvelopeIcon, 
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import Notifications from './Notifications';
import MobileMenu from './MobileMenu';
import api from '../utils/axios';
import { useWebSocket } from '../context/WebSocketContext';
import { useGlobalChatWebSocket } from '../context/GlobalChatWebSocketContext';
import { Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';
import { API_URL } from '../config';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');
const FALLBACK_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236B7280"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"%3E%3C/path%3E%3C/svg%3E';

const Header = () => {
  // All hooks must be at the top level
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState(false);
  const [avatarLoaded, setAvatarLoaded] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showMessageToast, setShowMessageToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<{sender: string; content: string} | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isConnected: isNotificationsConnected, lastMessage: notificationsMessage } = useWebSocket();
  const { isConnected: isGlobalChatConnected, lastMessage: globalChatMessage, unreadCount } = useGlobalChatWebSocket();
  const hasFetchedUnreadCount = useRef(false);
  const [searchValue, setSearchValue] = useState('');

  const isMessengerPage = location.pathname === '/messenger';

  // Debug user data
  React.useEffect(() => {
    if (user) {
      console.log('Current user data:', user);
      console.log('Avatar URL:', user.avatar);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && !user) {
      console.error('User is authenticated but user data is missing');
    }
  }, [isAuthenticated, user]);

  // Update theme preference
  React.useEffect(() => {
    if (user?.theme_preference === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, [user?.theme_preference]);

  // Close profile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset avatar states and URL when user changes
  useEffect(() => {
    if (user) {
      console.log('User data in avatar effect:', user);
      setAvatarLoaded(false);
      setAvatarError(false);
      
      // Get the avatar URL
      const url = getAvatarUrl(user.avatar);
      console.log('Setting avatar URL to:', url);
      setAvatarUrl(url);
      
      // Preload the image
      const img = new Image();
      img.src = url;
      img.onload = () => {
        console.log('Avatar image loaded successfully:', url);
        setAvatarLoaded(true);
        setAvatarError(false);
      };
      img.onerror = () => {
        console.error('Failed to load avatar:', url);
        setAvatarError(true);
        setAvatarLoaded(true);
        // Only fall back to default if the current URL isn't already the default
        if (url !== FALLBACK_AVATAR) {
          console.log('Falling back to default avatar');
          setAvatarUrl(FALLBACK_AVATAR);
        }
      };
    } else {
      console.log('No user data, clearing avatar');
      setAvatarUrl(null);
      setAvatarLoaded(true);
      setAvatarError(false);
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (
      !loading &&
      !isAuthenticated &&
      !(
        location.pathname.includes('/login') ||
        location.pathname.includes('/register')
      )
    ) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, location.pathname, loading]);

  // Handle notification messages for toast notifications
  useEffect(() => {
    if (!notificationsMessage) return;

    console.log('[Header] Processing notification message:', notificationsMessage);

    if (notificationsMessage.type === 'notification' && 
        notificationsMessage.notification_type === 'new_message' && 
        !location.pathname.includes('/messenger')) {
      const message = notificationsMessage.message;
      const sender = notificationsMessage.sender_name;
      toast(
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <div>
            <p className="font-medium">{sender}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        </div>,
        {
          duration: 5000,
          position: 'top-right',
          style: {
            background: isDarkMode ? '#1a1a1a' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            border: `1px solid ${isDarkMode ? '#333333' : '#e5e7eb'}`,
          },
        }
      );
    }
  }, [notificationsMessage, location.pathname, isDarkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getAvatarUrl = (avatarPath: string | undefined | null) => {
    console.log('Getting avatar URL for:', avatarPath);
    
    // If no avatar path, return null
    if (!avatarPath) {
      console.log('No avatar path provided');
      return null;
    }
    
    try {
      // If it's already a full URL, return it
      if (avatarPath.startsWith('http')) {
        console.log('Using full URL avatar:', avatarPath);
        return avatarPath;
      }
      
      // Construct the full URL
      const fullUrl = avatarPath.startsWith('/media') 
        ? `${API_BASE_URL}${avatarPath}`
        : `${API_BASE_URL}/media/${avatarPath}`;
      
      console.log('Constructed full URL:', fullUrl);
      return fullUrl;
    } catch (e) {
      console.error('Error constructing avatar URL:', e);
      return null;
    }
  };

  // Add proper type checking for user object
  const username = user?.username || '';
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';
  const displayName = fullName || username;

  // If not authenticated or still loading, don't render the header
  if (!isAuthenticated || loading) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={showMobileMenu} 
        onClose={() => setShowMobileMenu(false)} 
      />

      {/* Toast Notification */}
      <Transition
        show={showMessageToast}
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="fixed top-4 right-4 z-50 w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-dark-card shadow-lg ring-1 ring-black ring-opacity-5"
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                New message from {toastMessage?.sender}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {toastMessage?.content}
              </p>
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                onClick={() => {
                  setShowMessageToast(false);
                  setToastMessage(null);
                }}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border h-16 shadow-sm dark:shadow-gray-800 mb-4">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-3 sm:px-4 lg:px-6 bg-white dark:bg-dark-card py-2">
          {/* Logo and Search Section */}
          <div className="flex items-center flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-3 bg-white dark:bg-dark-card rounded-full hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
              onClick={() => setShowMobileMenu(true)}
            >
              <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" />
            </button>

            {/* Logo - Hidden when search is expanded on mobile */}
            <div className={`flex items-center space-x-2 mr-4 sm:mr-8 ${isSearchExpanded ? 'hidden sm:flex' : ''}`}>
              <div 
                onClick={() => navigate('/dashboard')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate('/dashboard');
                  }
                }}
              >
                <Logo />
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 relative max-w-3xl">
              {/* Mobile Search Toggle */}
              <button 
                style={{ backgroundColor: 'transparent', background: 'transparent', boxShadow: 'none', WebkitBoxShadow: 'none', MozBoxShadow: 'none', border: 'none', outline: 'none', zIndex: 1, pointerEvents: 'auto', position: 'relative' }}
                className="p-3 rounded-full transition-colors sm:hidden bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
                onClick={() => navigate('/research')}
                aria-label="Toggle search"
              >
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Search Input */}
              <div 
                className={`${
                  isSearchExpanded 
                    ? 'fixed inset-x-0 top-0 z-50 p-2 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border' 
                    : 'hidden sm:block'
                } sm:relative sm:p-0 sm:bg-transparent sm:border-0`}
              >
                <div className="flex items-center max-w-3xl mx-auto">
                  <div className={`flex-1 relative search-container ${isSearchExpanded ? 'expanded' : ''}`}>
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <button style={{ backgroundColor: 'transparent', background: 'transparent', boxShadow: 'none', WebkitBoxShadow: 'none', MozBoxShadow: 'none', border: 'none', outline: 'none', zIndex: 1, pointerEvents: 'auto', position: 'relative' }} className="p-3 rounded-full transition-colors bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent" onClick={() => navigate('/research')}>
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search Superlink"
                        className="block w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-full py-2 pl-14 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            navigate(`/research?query=${encodeURIComponent(searchValue)}`);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions - Hidden when search is expanded on mobile */}
          <div className={`flex items-center space-x-1 sm:space-x-2 ${isSearchExpanded ? 'hidden sm:flex' : ''}`}>
            <button 
              className={`relative p-3 bg-white dark:bg-dark-card rounded-full hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors ${
                isMessengerPage ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-300'
              }`}
              onClick={() => navigate('/messenger')}
            >
              <EnvelopeIcon className="w-6 h-6" />
              {!isMessengerPage && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications */}
            <Notifications variant="minimal" />
            
            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              {user ? (
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
                >
                  <div className="relative">
                    {!avatarLoaded && !avatarError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
                      </div>
                    )}
                    <img
                      src={avatarUrl || FALLBACK_AVATAR}
                      alt={`${user?.username || 'User'}'s profile`}
                      className={`w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-dark-border transition-all duration-300 ${
                        avatarLoaded && !avatarError ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log('Avatar loaded successfully:', {
                          src: target.src,
                          originalAvatar: user?.avatar,
                          isFallback: target.src === FALLBACK_AVATAR
                        });
                        setAvatarLoaded(true);
                        setAvatarError(false);
                      }}
                      onError={(e) => {
                        console.error('Avatar load error:', {
                          originalSrc: (e.target as HTMLImageElement).src,
                          avatar: user?.avatar,
                          error: e
                        });
                        setAvatarError(true);
                        setAvatarLoaded(true);
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        
                        // Use SVG fallback
                        console.log('Using SVG fallback avatar');
                        setAvatarUrl(FALLBACK_AVATAR);
                      }}
                    />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  <UserCircleIcon className="w-6 h-6" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute -right-4 top-full mt-1 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg py-1 z-50 border border-gray-100 dark:border-dark-border">
                  <button
                    onClick={async () => {
                      setIsNavigating(true);
                      try {
                        await navigate(`/profile/${user?.username}`);
                      } finally {
                        setIsNavigating(false);
                        setShowProfileMenu(false);
                      }
                    }}
                    disabled={isNavigating}
                    className={`flex items-center w-full px-6 py-3 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors ${
                      isNavigating ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    <UserCircleIcon className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" />
                    {isNavigating ? 'Loading...' : 'View Profile'}
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center w-full px-6 py-3 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
                  >
                    <Cog6ToothIcon className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      toggleDarkMode();
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center w-full px-6 py-3 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
                  >
                    {isDarkMode ? (
                      <SunIcon className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <MoonIcon className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" />
                    )}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  {user && (
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-6 py-3 text-sm bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" />
                      <span className="text-red-500 dark:text-red-400">Logout</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header; 