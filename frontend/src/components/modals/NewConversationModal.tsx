import { FC, useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewConversation: (user: { id: string; name: string; avatarUrl: string }) => void;
  isDarkMode: boolean;
}

const NewConversationModal: FC<NewConversationModalProps> = ({ 
  isOpen, 
  onClose, 
  onNewConversation,
  isDarkMode 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/connections/connections/friends/`);
      const usersData = Array.isArray(response.data) ? response.data : [];
      
      if (usersData.length === 0) {
        setUsers([]);
        return;
      }
      
      const transformedUsers = usersData.map((user: any) => {
        let avatar_url = user.avatar;
        
        // Handle avatar URL
        if (!avatar_url || typeof avatar_url !== 'string' || avatar_url.trim() === '') {
          avatar_url = '/default.jpg';
        } else if (avatar_url.startsWith('http')) {
          // Keep full URLs as is
          avatar_url = avatar_url;
        } else if (avatar_url.startsWith('/media')) {
          // Handle paths starting with /media
          avatar_url = `${import.meta.env.VITE_API_URL}${avatar_url}`;
        } else {
          // Handle other paths
          avatar_url = `${import.meta.env.VITE_API_URL}/media/${avatar_url}`;
        }
        
        return {
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          username: user.username || '',
          avatar: avatar_url
        };
      });
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const username = user.username.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || username.includes(query);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-[500px] max-h-[90vh] ${isDarkMode ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
              New Conversation
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Start a conversation with your friends
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card-hover transition-colors ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className={`p-3 ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} rounded-lg`}>
              <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            </div>
          )}

          {/* Search */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
              Search Users
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-dark-card-hover border-gray-700 text-dark-text placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <MagnifyingGlassIcon className={`absolute left-3 top-3 w-5 h-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
          </div>

          {/* Users List */}
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">{error}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4">
                <p className={`text-gray-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {searchQuery ? 'No users found' : 'No users available'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onNewConversation({
                        id: user.id,
                        name: `${user.first_name} ${user.last_name}`.trim() || user.username,
                        avatarUrl: user.avatar
                      });
                      onClose();
                    }}
                    className={`w-full p-4 flex items-center gap-3 ${
                      isDarkMode 
                        ? 'bg-[#292b2f] text-[#e5e7eb]' 
                        : 'bg-white hover:bg-gray-50'
                    } transition-colors rounded-lg`}
                  >
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-10 h-10 rounded-full border-2 border-purple-400"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                        {`${user.first_name} ${user.last_name}`.trim() || user.username}
                      </p>
                      {user.username && (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal; 