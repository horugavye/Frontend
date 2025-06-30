import { FC, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  SparklesIcon,
  UserGroupIcon,
  BookmarkIcon,
  StarIcon,
  PlusIcon,
  UserPlusIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';

interface CommunityNav {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

const Navigation: FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const pendingConnectionsCount = 5;
  const [userCommunities, setUserCommunities] = useState<CommunityNav[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [showAllCommunities, setShowAllCommunities] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const fetchUserCommunities = async () => {
      setLoadingCommunities(true);
      setCommunitiesError(null);
      try {
        const response = await api.get(API_ENDPOINTS.USER_COMMUNITIES);
        const communities = response.data.map((community: any) => ({
          id: community.id,
          slug: community.slug,
          name: community.name,
          icon: community.icon || '🌟',
        }));
        setUserCommunities(communities);
      } catch (err) {
        setCommunitiesError('Failed to load your communities.');
      } finally {
        setLoadingCommunities(false);
      }
    };
    fetchUserCommunities();
  }, []);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block space-y-6 bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm dark:shadow-gray-800">
        <div className="space-y-1">
          <h2 className="px-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>
          <div className="space-y-1">
            <Link
              to="/"
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isActive('/') 
                  ? 'text-white bg-purple-600 shadow-md' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <HomeIcon className="w-5 h-5 mr-3" />
              Home Feed
            </Link>
            <Link
              to="/discover"
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isActive('/discover') 
                  ? 'text-white bg-purple-600 shadow-md' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <SparklesIcon className="w-5 h-5 mr-3" />
              Discover
            </Link>
            <Link
              to="/stories"
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isActive('/stories') 
                  ? 'text-white bg-purple-600 shadow-md' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <CameraIcon className="w-5 h-5 mr-3" />
              Stories
            </Link>
            <Link
              to={`/connections/${user?.id}`}
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isActive(`/connections/${user?.id}`) 
                  ? 'text-white bg-purple-600 shadow-md' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <UserPlusIcon className="w-5 h-5 mr-3" />
              Connection Requests
            </Link>
            <Link
              to="/communities"
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isActive('/communities') 
                  ? 'text-white bg-purple-600 shadow-md' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <UserGroupIcon className="w-5 h-5 mr-3" />
              Communities
            </Link>
            <Link
              to="/saved"
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isActive('/saved') 
                  ? 'text-white bg-purple-600 shadow-md' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <BookmarkIcon className="w-5 h-5 mr-3" />
              Saved Posts
            </Link>
          </div>
        </div>
        {/* User Communities List */}
        <div className="mt-8">
          <h3 className="px-4 text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">Your Communities</h3>
          {loadingCommunities ? (
            <div className="px-4 py-2 text-gray-500 text-sm">Loading...</div>
          ) : communitiesError ? (
            <div className="px-4 py-2 text-red-500 text-sm">{communitiesError}</div>
          ) : userCommunities.length === 0 ? (
            <div className="px-4 py-2 text-gray-400 text-sm">You haven't joined any communities yet.</div>
          ) : (
            <>
              <ul className="space-y-1">
                {(showAllCommunities ? userCommunities : userCommunities.slice(0, 5)).map((community) => (
                  <li key={community.id}>
                    <Link
                      to={`/communities/${community.slug}`}
                      className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-200 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-gray-100 dark:hover:bg-gray-800`}
                    >
                      <span className="w-6 h-6 mr-3 flex items-center justify-center text-lg">
                        {community.icon.startsWith('http') ? (
                          <img 
                            src={community.icon} 
                            alt={community.name} 
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Prevent infinite loop
                              target.src = '/default_community_icon.png';
                            }}
                          />
                        ) : (
                          community.icon
                        )}
                      </span>
                      <span className="truncate">{community.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {userCommunities.length > 5 && (
                <button
                  className="ml-4 mt-2 text-sm text-purple-600 hover:underline focus:outline-none"
                  onClick={() => setShowAllCommunities((prev) => !prev)}
                >
                  {showAllCommunities ? 'View Less' : 'View More'}
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden bg-white dark:bg-dark-card shadow-lg rounded-t-xl">
        <div className="flex items-center justify-around px-2 py-2">
          <Link
            to="/"
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
              isActive('/') ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link
            to="/discover"
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
              isActive('/discover') ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <SparklesIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Discover</span>
          </Link>
          <Link
            to="/stories"
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
              isActive('/stories') ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <CameraIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Stories</span>
          </Link>
          <Link
            to={`/connections/${user?.id}`}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 relative ${
              isActive(`/connections/${user?.id}`) ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <UserPlusIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Connections</span>
          </Link>
          <Link
            to="/saved"
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
              isActive('/saved') ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BookmarkIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Saved</span>
          </Link>
          <Link
            to="/communities"
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
              isActive('/communities') ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <UserGroupIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Communities</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navigation; 