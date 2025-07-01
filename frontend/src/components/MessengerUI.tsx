import { FC, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  PhotoIcon,
  FaceSmileIcon,
  GifIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
  VideoCameraIcon,
  PhoneIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  ArrowDownTrayIcon as DownloadIcon,
  Bars3Icon,
  BellIcon,
  UserGroupIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  UserIcon,
  ArchiveBoxIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ArrowUturnLeftIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  ArrowPathIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useChatWebSocket } from '../context/ChatWebSocketContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { MessageFormat } from '../types/messenger';
import ForwardMessageModal from './ForwardMessageModal';
import ThreadView from './ThreadView';
import { Message, MessageThread, Conversation, MessageReaction, FileUpload, User } from '../types/messenger';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import DeleteGroupModal from './modals/DeleteGroupModal';
import MessageInput from './MessageInput';
import MessageSuggestions from './MessageSuggestions';
import { formatFileSize, getFileCategory } from '../utils/fileUtils';
import { QUICK_REACTIONS } from '../constants/reactions';
import { MessageGroup, ConversationMessages } from '../types/messenger';

// Add API base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Add API base URL configuration
const DEFAULT_AVATAR = '/default.jpg';
const DEFAULT_GROUP_AVATAR = '/group.png';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      console.error('Authentication error:', error);
      // You might want to redirect to login page or show an error message
    }
    return Promise.reject(error);
  }
);

const API_ENDPOINTS = {
  conversations: '/api/chat/conversations/',
  createGroup: '/api/chat/groups/',
  getConnections: '/api/connections/connections/',
  getMyConnections: '/api/connections/connections/',
  getUsers: '/api/connections/connections/friends/',
  messages: (conversationId: string) => `/api/chat/conversations/${conversationId}/messages/`,
  sendMessage: (conversationId: string) => `/api/chat/conversations/${conversationId}/messages/`,
  deleteConversation: (conversationId: string) => `/api/chat/conversations/${conversationId}/`,
  deleteMessage: (conversationId: string, messageId: string) => `/api/chat/conversations/${conversationId}/messages/${messageId}/`,
  createThread: (conversationId: string, messageId: string) => `/api/chat/conversations/${conversationId}/messages/${messageId}/threads/`,
  getThread: (conversationId: string, messageId: string) => `/api/chat/conversations/${conversationId}/messages/${messageId}/threads/`,
};

// Add message status icons
const MessageStatusIcon = ({ status, isDarkMode }: { status: string; isDarkMode: boolean }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return isDarkMode ? 'text-gray-400' : 'text-gray-500';
      case 'delivered':
        return isDarkMode ? 'text-gray-400' : 'text-gray-500';
      case 'read':
        return 'text-blue-500'; // Keep blue for read status in both themes
      case 'failed':
        return 'text-red-500'; // Keep red for failed status in both themes
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-500';
    }
  };

  const statusColor = getStatusColor(status);

  switch (status) {
    case 'sent':
      return <CheckCircleIcon className={`h-3 w-3 ${statusColor}`} />;
    case 'delivered':
      return <div className="flex space-x-0.5">
        <CheckCircleIcon className={`h-3 w-3 ${statusColor}`} />
        <CheckCircleIcon className={`h-3 w-3 ${statusColor}`} />
      </div>;
    case 'read':
      return <div className="flex space-x-0.5">
        <CheckCircleIcon className={`h-3 w-3 ${statusColor}`} />
        <CheckCircleIcon className={`h-3 w-3 ${statusColor}`} />
      </div>;
    case 'failed':
      return <XCircleIcon className={`h-3 w-3 ${statusColor}`} />;
    default:
      return <ClockIcon className={`h-3 w-3 ${statusColor} animate-spin`} />;
  }
};

const MessageTimeDivider: FC<{ date: string; isDarkMode: boolean }> = ({ date, isDarkMode }) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateStr);
        return 'Invalid Date';
      }
      
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if the date is today
      if (date.toDateString() === now.toDateString()) {
        return 'Today';
      }
      
      // Check if the date is yesterday
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // For other dates, format as "Month Day, Year"
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
  <div className="flex items-center justify-center my-4">
    <div className={`rounded-full px-3 py-1 ${
      isDarkMode 
        ? 'bg-gray-700/50' 
        : 'bg-gray-200/80'
    }`}>
        <span className={`text-xs ${
          isDarkMode 
            ? 'text-gray-400' 
            : 'text-gray-600'
        }`}>{formatDate(date)}</span>
    </div>
  </div>
);
};

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (group: {
    name: string;
    members: Array<{ id: string; name: string; avatarUrl: string }>;
  }) => void;
}

// Add CreateGroupModal component
const CreateGroupModal: FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Array<{ id: string; name: string; avatarUrl: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { isDarkMode } = useTheme();

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(API_ENDPOINTS.getUsers);
      const usersData = Array.isArray(response.data) ? response.data : [];
      
      if (usersData.length === 0) {
        setUsers([]);
        return;
      }
      
      const transformedUsers = usersData.map((user: any) => {
        let avatar_url = user.avatar;
        
        // Handle avatar URL
        if (avatar_url && typeof avatar_url === 'string' && avatar_url.trim() !== '') {
          if (avatar_url.startsWith('http')) {
            // Keep full URLs as is
            avatar_url = avatar_url;
          } else if (avatar_url.startsWith('/media')) {
            // Handle paths starting with /media
            avatar_url = `${API_BASE_URL}${avatar_url}`;
          } else {
            // Handle other paths
            avatar_url = `${API_BASE_URL}/media/${avatar_url}`;
          }
        } else {
          avatar_url = null;
        }
        
        return {
          id: user.id,
          username: user.username || user.email?.split('@')[0] || `user_${user.id}`,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          avatar_url,
          is_online: user.is_online || false,
          last_seen: user.last_active,
          role: user.role || 'Member',
          mutual_connections: user.mutual_connections || 0,
          personality_tags: Array.isArray(user.personality_tags) ? user.personality_tags : [],
          bio: user.bio || '',
          location: user.location || '',
          interests: Array.isArray(user.interests) ? user.interests : []
        };
      });
      
      setUsers(transformedUsers);
    } catch (error) {
      setError('Failed to load users. Please try again later.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const username = user.username?.toLowerCase() || '';
    const firstName = user.first_name?.toLowerCase() || '';
    const lastName = user.last_name?.toLowerCase() || '';
    const bio = user.bio?.toLowerCase() || '';
    const location = user.location?.toLowerCase() || '';
    const interests = user.interests?.join(' ').toLowerCase() || '';
    
    return username.includes(searchLower) ||
           firstName.includes(searchLower) ||
           lastName.includes(searchLower) ||
           bio.includes(searchLower) ||
           location.includes(searchLower) ||
           interests.includes(searchLower);
  });

  const handleMemberSelect = (user: User) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(member => member.id === user.id);
      if (isSelected) {
        return prev.filter(member => member.id !== user.id);
      } else {
        return [...prev, {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          avatarUrl: user.avatar_url
        }];
      }
    });
  };

  const handleMemberRemove = (userId: string) => {
    setSelectedMembers(prev => prev.filter(member => member.id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (groupName.trim().length < 3) {
      setError('Group name must be at least 3 characters long');
      return;
    }

    if (groupName.trim().length > 50) {
      setError('Group name must be less than 50 characters');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      await onCreate({
        name: groupName.trim(),
        members: selectedMembers,
      });
      setGroupName('');
      setSelectedMembers([]);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create group. Please try again.';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-[500px] max-h-[90vh] ${isDarkMode ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
              Create New Group
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Create a group chat with your friends
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

          {/* Group Name Input */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className={`w-full ${isDarkMode ? 'bg-dark-card-hover text-dark-text' : 'bg-gray-50 text-gray-900'} px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
              disabled={isCreating}
            />
          </div>

          {/* Member Search */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
              Add Members
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
                disabled={isCreating}
              />
              <MagnifyingGlassIcon className={`absolute left-3 top-3 w-5 h-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>

            {/* Search Results */}
            <div className="mt-4 max-h-[300px] overflow-y-auto custom-scrollbar">
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
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors`}
                    onClick={() => !isCreating && handleMemberSelect(user)}
                  >
                    <div className="relative flex-shrink-0 mr-3">
                      <img
                        src={user.avatar_url}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="w-10 h-10 rounded-full"
                      />
                      {user.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                          isDarkMode ? 'text-dark-text' : 'text-gray-900'
                        }`}>
                          {user.first_name} {user.last_name}
                        </p>
                        <p className={`text-xs truncate ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {user.username}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedMembers.some(member => member.id === user.id)
                            ? 'border-purple-500 bg-purple-500'
                            : isDarkMode
                              ? 'border-gray-600'
                              : 'border-gray-300'
                        }`}>
                          {selectedMembers.some(member => member.id === user.id) && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 dark:border-dark-border flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedMembers.length > 0 ? `${selectedMembers.length} members selected` : 'No members selected'}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode
                  ? 'bg-dark-card-hover text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } transition-colors`}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
              className={`px-4 py-2 rounded-lg ${
                isCreating
                  ? 'bg-purple-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-purple-600 hover:bg-purple-700'
              } text-white transition-colors flex items-center space-x-2`}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Group</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add new component for empty state
const EmptyState: FC<{
  onNewConversation: (user: { id: string; name: string; avatarUrl: string }) => void;
  onCreateGroup: (group: { name: string; members: Array<{ id: string; name: string; avatarUrl: string }> }) => void;
}> = ({ onNewConversation, onCreateGroup }) => {
  const { isDarkMode } = useTheme();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className={`w-24 h-24 ${isDarkMode ? 'bg-dark-card-hover' : 'bg-gray-50'} rounded-full flex items-center justify-center mb-6`}>
        <ChatBubbleLeftRightIcon className={`w-12 h-12 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
      </div>
      
      <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'} mb-2`}>
        Welcome to Messenger
      </h2>
      
      <p className={`text-lg text-center max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
        Start a new conversation or join a group chat to begin messaging with your team.
      </p>
      
      <div className="flex space-x-4">
        <button
          onClick={() => setShowCreateGroupModal(true)}
          className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
            isDarkMode
              ? 'bg-dark-card-hover text-purple-400 hover:bg-dark-card-hover/80'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          } transition-colors`}
        >
          <UserGroupIcon className="w-5 h-5" />
          <span>Create Group</span>
        </button>
        
        <button
          onClick={() => onNewConversation({ id: '', name: '', avatarUrl: '' })}
          className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
            isDarkMode
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          } transition-colors`}
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {showCreateGroupModal && (
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onCreate={onCreateGroup}
        />
      )}
    </div>
  );
};

interface MessageActionsProps {
  message: Message;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onMenu: () => void;
  isDarkMode: boolean;
  onShowEmojiPicker: () => void;
  onDelete: () => void;
  onInfo: () => void;
}

const MessageActions: FC<MessageActionsProps> = ({ 
  message, 
  onReply, 
  onReact, 
  onMenu, 
  isDarkMode, 
  onShowEmojiPicker, 
  onDelete, 
  onInfo 
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Reply button - always visible */}
      <button
        onClick={onReply}
        className={`p-1 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors duration-200 shadow-sm hover:scale-110 transform`}
        title="Reply"
      >
        <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
      </button>

      {/* React button - always visible */}
      <div className="relative">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className={`p-1 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors duration-200 shadow-sm hover:scale-110 transform`}
          title="React"
        >
          <FaceSmileIcon className="w-3.5 h-3.5" />
        </button>
        {showReactionPicker && (
          <ReactionPicker
            onSelect={(emoji: string) => {
              onReact(emoji);
              setShowReactionPicker(false);
            }}
            onClose={() => setShowReactionPicker(false)}
            isDarkMode={isDarkMode}
            onShowEmojiPicker={onShowEmojiPicker}
          />
        )}
      </div>

      {/* Menu button with dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`p-1 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors duration-200 shadow-sm hover:scale-110 transform`}
          title="More actions"
          type="button"
        >
          <EllipsisHorizontalIcon className="w-3.5 h-3.5" />
        </button>
        {showMenu && (
          <div className={`absolute ${message.isOwn ? 'right-0' : 'left-0'} mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 z-50 transition-all duration-200 ease-out transform origin-top-right scale-100 opacity-100 backdrop-blur-md animate-fade-in`}>
            {message.isOwn && (
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 rounded-lg"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              onClick={() => {
                onInfo();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2 rounded-lg"
            >
              <InformationCircleIcon className="w-4 h-4" />
              Info
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Add ReactionDisplay component definition
const ReactionDisplay: FC<{
  reactions: MessageReaction[];
  onReactionClick: (emoji: string) => void;
  isDarkMode: boolean;
}> = ({ reactions, onReactionClick, isDarkMode }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {reactions.map((reaction) => (
        <div key={reaction.emoji} className="relative group">
          <button
            onClick={() => onReactionClick(reaction.emoji)}
            className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all duration-200 ease-in-out ${
              reaction.isSelected
                ? 'bg-purple-100/80 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800'
                : 'bg-gray-50/80 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            } hover:scale-105 active:scale-95`}
          >
            <span className="text-base leading-none">{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </button>
          
          <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-xl shadow-xl text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out z-50 backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-gray-800/95 text-gray-200 ring-1 ring-gray-700' 
              : 'bg-white/95 text-gray-900 ring-1 ring-gray-200'
          }`}>
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <div className="flex items-center gap-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
                <span className="text-lg">{reaction.emoji}</span>
                <span className="font-medium">Reactions</span>
              </div>
              
              {reaction.users && reaction.users.length > 0 ? (
                <div className="flex flex-col gap-1.5 pt-1">
                  {reaction.users.map((username, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isDarkMode ? 'bg-purple-400' : 'bg-purple-500'
                      }`} />
                      <span className="text-xs font-medium">{username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                  No reactions yet
                </span>
              )}
            </div>
            
            <div className={`absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 ${
              isDarkMode 
                ? 'bg-gray-800/95 ring-1 ring-gray-700' 
                : 'bg-white/95 ring-1 ring-gray-200'
            }`} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Add ReactionPicker component definition
const ReactionPicker: FC<{
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
  onShowEmojiPicker: () => void;  // Add this prop
}> = ({ onSelect, onClose, isDarkMode, onShowEmojiPicker }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className={`absolute bottom-full right-0 mb-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 animate-fade-in`}
    >
      <div className="flex gap-1">
        {QUICK_REACTIONS.map(({ emoji, label }) => (
          <button
            key={`${emoji}-${label}`}
            onClick={() => onSelect(emoji)}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            title={label}
          >
            <span className="text-xl">{emoji}</span>
          </button>
        ))}
        <button
          onClick={() => {
            onShowEmojiPicker();
            onClose();
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="More emojis"
        >
          <FaceSmileIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// Add MessageInfoModal component before MessengerUI
interface MessageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
  isDarkMode: boolean;
}

const MessageInfoModal: FC<MessageInfoModalProps> = ({ isOpen, onClose, message, isDarkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div className={`relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl transform transition-all ${
        isDarkMode 
          ? 'bg-gray-800 text-white border border-gray-700' 
          : 'bg-white text-gray-900 border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        } flex items-center justify-between`}>
          <h2 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Message Details
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Message Content */}
          <div className={`p-4 rounded-xl ${
            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <p className={`text-base whitespace-pre-wrap ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              {message.content}
            </p>
          </div>

          {/* Sender Info */}
          <div className={`p-4 rounded-xl ${
            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-sm font-medium mb-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              From
            </h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={message.sender.avatarUrl}
                  alt={message.sender.name}
                  className="w-12 h-12 rounded-full ring-2 ring-offset-2 ring-purple-500"
                />
                {message.sender.role && (
                  <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 text-xs rounded-full ${
                    isDarkMode 
                      ? 'bg-purple-900/80 text-purple-200' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {message.sender.role}
                  </span>
                )}
              </div>
              <div>
                <p className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {message.sender.name}
                </p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Message Status - Only show for own messages */}
          {message.isOwn && (
            <div className={`p-4 rounded-xl ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <h3 className={`text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MessageStatusIcon status={message.status} isDarkMode={isDarkMode} />
                  <span className={`text-sm font-medium capitalize ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {message.status}
                  </span>
                </div>
                
                {message.deliveryStatus && (
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`flex flex-col items-center p-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-600/50' : 'bg-gray-100'
                      }`}>
                        <CheckCircleIcon className={`w-5 h-5 ${
                          message.deliveryStatus.sent 
                            ? 'text-green-500' 
                            : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <span className="text-xs mt-1">Sent</span>
                      </div>
                      <div className={`flex flex-col items-center p-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-600/50' : 'bg-gray-100'
                      }`}>
                        <CheckCircleIcon className={`w-5 h-5 ${
                          message.deliveryStatus.delivered 
                            ? 'text-green-500' 
                            : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <span className="text-xs mt-1">Delivered</span>
                      </div>
                      <div className={`flex flex-col items-center p-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-600/50' : 'bg-gray-100'
                      }`}>
                        <CheckCircleIcon className={`w-5 h-5 ${
                          message.deliveryStatus.read 
                            ? 'text-green-500' 
                            : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <span className="text-xs mt-1">Read</span>
                      </div>
                    </div>

                    {message.deliveryStatus.readBy && message.deliveryStatus.readBy.length > 0 && (
                      <div className="mt-4">
                        <p className={`text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Read by
                        </p>
                        <div className="space-y-2">
                          {message.deliveryStatus.readBy.map((reader, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <img
                                src={DEFAULT_AVATAR}
                                alt={reader.name}
                                className="w-6 h-6 rounded-full"
                              />
                              <span className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>{reader.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`p-4 rounded-xl ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <h3 className={`text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Reactions
              </h3>
              <div className="flex flex-wrap gap-2">
                {message.reactions.map((reaction) => (
                  <div
                    key={`${message.id}-${reaction.emoji}`}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      reaction.isSelected
                        ? isDarkMode
                          ? 'bg-purple-900/50 text-purple-200'
                          : 'bg-purple-100 text-purple-700'
                        : isDarkMode
                          ? 'bg-gray-600/50 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-lg">{reaction.emoji}</span>
                    <span className="text-sm font-medium">{reaction.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`p-4 rounded-xl ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <h3 className={`text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Attachments
              </h3>
              <div className="space-y-3">
                {message.attachments.map((attachment, idx) => (
                  <div
                    key={`${attachment.id}-${idx}`}
                    className="mt-2"
                  >
                    {/* Attachment content */}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit History */}
          {message.edited && message.editHistory && message.editHistory.length > 0 && (
            <div className={`p-4 rounded-xl ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <h3 className={`text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Edit History
              </h3>
              <div className="space-y-3">
                {message.editHistory.map((edit, index) => (
                  <div
                    key={`${edit.timestamp}-${index}`}
                    className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <span>Edited {new Date(edit.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forwarded Message Info */}
          {message.isForwarded && message.originalMessage && (
            <div className={`p-4 rounded-xl ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <h3 className={`text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Forwarded Message
              </h3>
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-600/50' : 'bg-gray-100'
              }`}>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  From {message.originalMessage.sender} in {message.originalMessage.chat}
                </p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {new Date(message.originalMessage.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add these before the MessengerUI component definition
interface LeaveGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupName: string;
}

const LeaveGroupModal = ({ isOpen, onClose, onConfirm, groupName }: LeaveGroupModalProps) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative w-[400px] ${isDarkMode ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
        <div className="flex items-center justify-center mb-4">
          <div className={`p-3 rounded-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
            <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-500" />
          </div>
        </div>
        
        <h2 className={`text-xl font-semibold mb-2 text-center ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
          Warning: Leave Group
        </h2>
        
        <div className={`mb-6 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <p className="text-center">
            You are about to leave the group <span className="font-medium">{groupName}</span>
          </p>
          
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} border ${isDarkMode ? 'border-red-800' : 'border-red-200'}`}>
            <h3 className="font-medium text-red-500 mb-2">This action will:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Remove you from the group</li>
              <li>Remove your access to group messages</li>
              <li>Remove your access to shared media and files</li>
              <li>Clear your group chat history</li>
              <li>You will need to be re-invited to rejoin</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Leave Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const MessengerUI = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { isDarkMode } = useTheme();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isConnected, sendMessage, lastMessage, connect, disconnect } = useChatWebSocket();
  
  // Add pendingFiles state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Add handleFileSelect function
  const handleFileSelect = (files: FileList) => {
    const newUploads = Array.from(files).map(file => {
      const upload: FileUpload = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        status: 'pending',
        progress: 0,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type
      };
      return upload;
    });
    setFileUploads(prev => [...prev, ...newUploads]);
  };

  // Helper functions for consistent user data handling
  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    
    // Handle message sender/receiver structure
    if (user.name && typeof user.name === 'string') {
      // If name is already a full name, return it
      if (user.name.trim() && user.name !== 'undefined undefined') {
        return user.name;
      }
    }
    
    // First try to get the name directly if it exists
    if (user.name && typeof user.name === 'string' && user.name.trim()) {
      return user.name;
    }
    
    // Then try first_name and last_name combination
    if (user.first_name || user.last_name) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      if (fullName) return fullName;
    }
    
    // Then try username
    if (user.username && typeof user.username === 'string') {
      return user.username;
    }
    
    // If user has a user object with name properties
    if (user.user) {
      if (user.user.name && typeof user.user.name === 'string' && user.user.name.trim()) {
        return user.user.name;
      }
      if (user.user.first_name || user.user.last_name) {
        const fullName = `${user.user.first_name || ''} ${user.user.last_name || ''}`.trim();
        if (fullName) return fullName;
      }
      if (user.user.username && typeof user.user.username === 'string') {
        return user.user.username;
      }
    }
    
    return 'Unknown User';
  };

  const getAvatarUrl = (user: any) => {
    // If it's a group object, use DEFAULT_GROUP_AVATAR as fallback
    const isGroup = user && (
      (user.members !== undefined) || // has members property
      (user.name && !user.first_name && !user.last_name) // has name but not first/last name
    );
    let avatarUrl = user?.avatarUrl || user?.avatar || user?.avatar_url || user?.user?.avatarUrl || user?.user?.avatar || user?.user?.avatar_url;
    if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim() === '') {
      return isGroup ? DEFAULT_GROUP_AVATAR : DEFAULT_AVATAR;
    }
    // If avatarUrl is a static asset in public (e.g. /group.png or /default.jpg), return as-is
    if (avatarUrl === '/group.png' || avatarUrl === '/default.jpg') {
      return avatarUrl;
    }
    // Check for backend default avatar paths
    const backendDefaults = [
      '/media/avatars/default.jpeg',
      '/media/avatars/default.jpg',
      '/media/avatars/default.png',
      'profile-default-icon-2048x2045-u3j7s5nj.png'
    ];
    for (const def of backendDefaults) {
      if (avatarUrl.includes(def)) {
        return isGroup ? DEFAULT_GROUP_AVATAR : DEFAULT_AVATAR;
      }
    }
    if (avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith('/media')) {
      return `${API_BASE_URL}${avatarUrl}`;
    }
    return `${API_BASE_URL}/media/${avatarUrl}`;
  };

  const getUserId = (user: any) => {
    if (!user) return 'unknown';
    
    // Try different possible id properties
    if (user.id) return user.id;
    if (user.user?.id) return user.user.id;
    
    return 'unknown';
  };

  // Add message info modal state here, with other state declarations
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [selectedMessageInfo, setSelectedMessageInfo] = useState<Message | null>(null);
  
  // Add forward message state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showGroupActions, setShowGroupActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showQuickReactions, setShowQuickReactions] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState(''); // Add missing state variable
  const [isForwarding, setIsForwarding] = useState(false);
  const [selectedForwardMessages, setSelectedForwardMessages] = useState<string[]>([]);
  const [showEffectPicker, setShowEffectPicker] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [showThreadView, setShowThreadView] = useState(false);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessages>({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Add responsive state
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Add new state
  const [voiceRecording, setVoiceRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [showFormatting, setShowFormatting] = useState(false);
  const [messageFormat, setMessageFormat] = useState<MessageFormat>({});
  const [typingUsers, setTypingUsers] = useState<Array<{ name: string; avatarUrl: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add new state for right sidebar menu
  const [showRightSidebarMenu, setShowRightSidebarMenu] = useState(false);

  // Add new state for new conversation modal
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Add new state for group creation modal
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);

  // Add state declarations at the top with other state
  const [groupMembers, setGroupMembers] = useState<{ [key: string]: GroupMemberData[] }>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Add new state for file uploads
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);

  // Add file size constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  // Add utility functions for file handling
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const generateVideoThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        video.currentTime = 1; // Seek to 1 second
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      video.onerror = () => reject(new Error('Error loading video'));
      video.src = URL.createObjectURL(file);
    });
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setActiveConversation(conversation.id);
    setShowRightPanel(false); // Hide right sidebar when selecting a conversation
    if (isMobileView) {
      setShowSidebar(false);
    }
    navigate(`/messages/${conversation.id}`);
    
    // Mark messages as read when selecting a conversation
    if (document.hasFocus() && !document.hidden) {
      markMessagesAsRead();
    }
  };

  // Add effect to update selected conversation details when conversations change
  useEffect(() => {
    if (activeConversation) {
      const conversation = conversations.find(c => c.id === activeConversation);
      if (conversation && (!selectedConversation || selectedConversation.id !== conversation.id)) {
        setSelectedConversation(conversation);
      }
    }
  }, [activeConversation, conversations, selectedConversation]);

  // Handle back navigation
  const handleBack = () => {
    navigate('/messages');
    setActiveConversation(null);
    setSelectedConversation(null);
  };

  // Update the fetchConversations function
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoadingConversations(true);
        setConversationsError(null);
        
        const response = await api.get(API_ENDPOINTS.conversations);
        if (Array.isArray(response.data)) {
          response.data.forEach((conv, index) => {
            console.log(`Raw conversation ${index + 1}:`, {
              id: conv.id,
              name: conv.name,
              type: conv.type,
              raw_unread_count: conv.unread_count,
              raw_unread: conv.unread,
              raw_unread_messages: conv.unread_messages,
              raw_last_message: conv.last_message,
              raw_members: conv.members?.map(m => ({
                id: m.id,
                user: m.user?.username,
                raw_unread: m.unread,
                raw_unread_count: m.unread_count
              }))
            });
          });
        }
        
        const allConversations = Array.isArray(response.data) ? response.data : [];
        
        // Add detailed unread message logging
        console.log('=== Unread Messages Summary ===');
        allConversations.forEach(conv => {
          if (conv.unread_count > 0) {
            console.log(`Conversation: ${conv.name || 'Direct Message'}`, {
              id: conv.id,
              unreadCount: conv.unread_count,
              lastMessage: conv.last_message ? {
                content: conv.last_message.content,
                timestamp: conv.last_message.timestamp,
                sender: conv.last_message.sender
              } : null,
              type: conv.type,
              members: conv.members?.map(m => ({
                user: m.user?.username,
                unread_count: m.unread_count
              }))
            });
          }
        });
        console.log('=== End Unread Messages Summary ===');
        
        // Helper function to get participant name
        const getParticipantName = (participant: any) => {
          if (!participant) return 'Unknown User';
          
          // Try to get full name first
          const fullName = `${participant.first_name || ''} ${participant.last_name || ''}`.trim();
          if (fullName) return fullName;
          
          // Then try username
          if (participant.username) return participant.username;
          
          // Then try email
          if (participant.email) return participant.email.split('@')[0];
          
          return 'Unknown User';
        };

        const transformedConversations = allConversations.map(conv => {
          // Calculate total unread count from members
          const totalUnreadCount = conv.members?.reduce((total, member) => {
            // Only count unread messages for the current user
            if (member.user?.id === user?.id) {
              const memberUnreadCount = member.unread_count || 0;
              console.log(`[MessengerUI] Member unread count for ${member.user.username}:`, {
                userId: member.user.id,
                unreadCount: memberUnreadCount,
                conversationId: conv.id
              });
              return total + memberUnreadCount;
            }
            return total;
          }, 0) || 0;

          // Get the current user's member data for this conversation
          const currentUserMember = conv.members?.find(m => m.user?.id === user?.id);
          const currentUserUnreadCount = currentUserMember?.unread_count || 0;

          // Debug online status for direct conversations
          if (conv.type === 'direct') {
            const otherParticipant = conv.participant1?.id === user?.id ? conv.participant2 : conv.participant1;
            console.log('[MessengerUI] Online status debug for direct conversation:', {
              conversationId: conv.id,
              participantName: otherParticipant?.first_name + ' ' + otherParticipant?.last_name,
              participantId: otherParticipant?.id,
              is_online: otherParticipant?.is_online,
              online_status: otherParticipant?.online_status,
              last_active: otherParticipant?.last_active
            });
          }

          console.log('[MessengerUI] Conversation unread details:', {
            id: conv.id,
            name: conv.type === 'direct' ? 
              getParticipantName(conv.participant1?.id === user?.id ? conv.participant2 : conv.participant1) :
              (conv.name || 'Unknown Group'),
            type: conv.type,
            totalUnreadCount,
            currentUserUnreadCount,
            memberUnreadCounts: conv.members?.map(m => ({
              userId: m.user?.id,
              username: m.user?.username,
              unreadCount: m.unread_count,
              isCurrentUser: m.user?.id === user?.id
            }))
          });

          const transformed = {
            id: conv.id,
            type: conv.type,
            name: conv.type === 'direct' ? 
              getParticipantName(conv.participant1?.id === user?.id ? conv.participant2 : conv.participant1) :
              (conv.name || 'Unknown Group'),
            lastMessage: conv.last_message ? {
              content: conv.last_message.content,
              timestamp: conv.last_message.timestamp,
              sender: conv.last_message.sender
            } : null,
            unreadCount: currentUserUnreadCount, // Use the current user's unread count
            user: conv.type === 'direct' ? {
              id: conv.participant1?.id === user?.id ? conv.participant2?.id : conv.participant1?.id,
              name: getParticipantName(conv.participant1?.id === user?.id ? conv.participant2 : conv.participant1),
              avatarUrl: getAvatarUrl(conv.participant1?.id === user?.id ? conv.participant2 : conv.participant1),
              isOnline: (conv.participant1?.id === user?.id ? conv.participant2?.is_online : conv.participant1?.is_online) || false,
              status: (conv.participant1?.id === user?.id ? conv.participant2?.online_status : conv.participant1?.online_status) || 'offline',
              bio: conv.participant1?.id === user?.id ? conv.participant2?.bio : conv.participant1?.bio || '',
              personality_tags: conv.participant1?.id === user?.id ? conv.participant2?.personality_tags : conv.participant1?.personality_tags || []
            } : null,
            group: conv.type === 'group' ? {
              id: conv.group?.id || null,
              name: conv.name || 'Unknown Group',
              acronym: conv.acronym || '',
              color: conv.color || '#6366f1',
              members: conv.members?.length || 0,
              isActive: true,
              description: conv.description || '',
              avatarUrl: getAvatarUrl(conv.group)
            } : null,
            group_id: conv.group?.id || null,
            members: conv.members || []
          };

          console.log('[MessengerUI] Transformed conversation:', {
            id: transformed.id,
            name: transformed.name,
            unreadCount: transformed.unreadCount,
            currentUserUnreadCount,
            totalUnreadCount
          });

          if (conv.type === 'group' && !conv.group_id) {
            console.warn('[MessengerUI] Warning: group_id missing for group conversation', conv);
          }

          return transformed;
        });

        console.log('Final transformed conversations:', transformedConversations);
        setConversations(transformedConversations);
        setConversationsError(null);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversationsError('Failed to load conversations');
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, []);

  const messages: ConversationMessages = {};

  // Update the currentMessages declaration
  const currentMessages = activeConversation 
    ? conversationMessages[activeConversation] || []
    : [];

  // Update the currentGroup declaration
  const isGroupChat = activeConversation && typeof activeConversation === 'string' && activeConversation.startsWith('g');
  const currentGroup = isGroupChat ? selectedConversation?.group : null;

  // Add message search functionality
  const filteredMessages = currentMessages?.filter(message => 
    message.content.toLowerCase().includes(searchInput.toLowerCase())
  );

  // Memoize message groups calculation
  const messageGroups = useMemo(() => {
    if (!currentMessages?.length) {
      return [];
    }

    return currentMessages.reduce<MessageGroup[]>((acc, message) => {
      // Skip null or invalid messages
      if (!message) {
        return acc;
      }

      // Handle messages without timestamps
      if (!message.timestamp) {
        // If no timestamp, add to the last group or create a new one with current date
        const lastGroup = acc[acc.length - 1];
        if (lastGroup) {
          lastGroup.messages.push(message);
        } else {
          acc.push({
            date: new Date().toLocaleDateString(),
            messages: [message]
          });
        }
        return acc;
      }

      try {
        const messageDate = new Date(message.timestamp);
        if (isNaN(messageDate.getTime())) {
          // If timestamp is invalid, add to the last group or create a new one with current date
          const lastGroup = acc[acc.length - 1];
          if (lastGroup) {
            lastGroup.messages.push(message);
          } else {
            acc.push({
              date: new Date().toLocaleDateString(),
              messages: [message]
            });
          }
          return acc;
        }

        const dateKey = messageDate.toLocaleDateString();
        const lastGroup = acc[acc.length - 1];

        if (lastGroup && lastGroup.date === dateKey) {
          lastGroup.messages.push(message);
        } else {
          acc.push({
            date: dateKey,
            messages: [message]
          });
        }
      } catch (error) {
        console.error('Error processing message timestamp:', error);
        // Add message to the last group or create a new one with current date
        const lastGroup = acc[acc.length - 1];
        if (lastGroup) {
          lastGroup.messages.push(message);
        } else {
          acc.push({
            date: new Date().toLocaleDateString(),
            messages: [message]
          });
        }
      }

      return acc;
    }, []);
  }, [currentMessages]);

  // Split scroll handling into two separate effects
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const bottomThreshold = 100;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < bottomThreshold;
    
    setShowScrollButton(!isNearBottom);
  }, []);

  const handleScrollToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const bottomThreshold = 100;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < bottomThreshold;
    
    if (isNearBottom) {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      container.addEventListener('scroll', handleScrollToBottom);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('scroll', handleScrollToBottom);
      };
    }
  }, [handleScroll, handleScrollToBottom]);

  // Update resize handling effect with better breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // More comprehensive breakpoints
      const isMobile = width < 768; // md breakpoint
      const isTablet = width >= 768 && width < 1024; // lg breakpoint
      const isDesktop = width >= 1024;
      
      setIsMobileView(isMobile);
      
      // Auto-hide sidebar on mobile, show on larger screens
      if (isMobile) {
        setShowSidebar(false);
        setShowRightPanel(false);
      } else if (isTablet) {
        setShowSidebar(true);
        setShowRightPanel(false);
      } else {
        setShowSidebar(true);
        // Keep right panel state as is on desktop
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update voice recording effect
  useEffect(() => {
    let interval: number | undefined;
    if (voiceRecording) {
      interval = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [voiceRecording]);

  // Update mobile padding effect
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.style.paddingBottom = isMobileView ? '64px' : '0';
    }
  }, [isMobileView]);

  // Update conversation ID effect
  useEffect(() => {
    // Only set active conversation if it's explicitly selected by the user
    if (conversationId && conversationId !== activeConversation && selectedConversation?.id === conversationId) {
      setActiveConversation(conversationId);
      setShowRightPanel(false); // Hide right sidebar when conversation changes
    }
  }, [conversationId, activeConversation, selectedConversation]);

  // Add effect to handle authentication
  useEffect(() => {
    
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/messages' } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Add effect to set selected conversation on mount
  useEffect(() => {
    console.log('Mount effect - conversationId:', conversationId);
    console.log('Mount effect - selectedConversation:', selectedConversation);
    console.log('Mount effect - conversations:', conversations);
    
    if (conversationId && !selectedConversation) {
      const conversation = conversations.find(c => c.id === conversationId);
      console.log('Mount effect - found conversation:', conversation);
      
      if (conversation) {
        console.log('Mount effect - setting conversation type:', conversation.type);
        setSelectedConversation(conversation);
        setActiveConversation(conversationId);
      }
    }
  }, [conversationId, conversations, selectedConversation]);

  // Add WebSocket connection effect
  useEffect(() => {
    if (selectedConversation?.id) {
      connect(selectedConversation.id);
    }
    return () => {
      disconnect();
    };
  }, [selectedConversation?.id, connect, disconnect]);

  // Add a ref to store the current conversation messages
  const conversationMessagesRef = useRef<ConversationMessages>({});
  
  // Update the ref whenever conversationMessages changes
  useEffect(() => {
    conversationMessagesRef.current = conversationMessages;
  }, [conversationMessages]);

  // Update the WebSocket message handling effect
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('[MessengerUI] Received WebSocket message:', {
      type: lastMessage.type,
      message: lastMessage.message,
      timestamp: new Date().toISOString(),
      rawMessage: lastMessage, // Log the entire message object
      conversationId: activeConversation,
      selectedConversationId: selectedConversation?.id
    });
    
    switch (lastMessage.type) {
      case 'chat_message':
        if (lastMessage.message) {
          const message = lastMessage.message;
          const conversationId = message.conversation_id || message.conversation;
          // Determine if this is a story message
          const isStory = Boolean(message.story && message.story.id);
          // Process message immediately
          const processedMessage: Message = {
            id: message.id,
            content: message.content,
            sender: {
              id: typeof message.sender === 'object' ? message.sender.id : message.sender,
              name: typeof message.sender === 'object' ? 
                (message.sender.name || message.sender.username || '') : '',
              avatarUrl: typeof message.sender === 'object' ? 
                (message.sender.avatarUrl || DEFAULT_AVATAR) : DEFAULT_AVATAR,
              role: typeof message.sender === 'object' ? message.sender.role : undefined
            },
            timestamp: message.created_at || new Date().toISOString(),
            status: message.status || 'sent',
            isOwn: message.isOwn || false,
            attachments: (message.files || []).map((file: any) => ({
              id: file.id,
              type: file.file_type || file.type,
              url: file.url || file.file,
              thumbnail: file.thumbnail_url || file.thumbnail,
              fileName: file.file_name || file.fileName,
              fileSize: file.file_size || file.fileSize,
              duration: file.duration
            })),
            reactions: message.reactions || [],
            message_type: message.message_type || 'text',
            files: message.files || [],
            created_at: message.created_at || new Date().toISOString(),
            updated_at: message.updated_at || new Date().toISOString(),
            ...(isStory ? { isStory: true, storyId: message.story.id } : {})
          };

          // Update conversation messages using the ref
          setConversationMessages(prev => {
            const currentMessages = prev[conversationId] || [];
            const messageExists = currentMessages.some(m => m.id === processedMessage.id);
            
            if (messageExists) {
              return {
                ...prev,
                [conversationId]: currentMessages.map(m => 
                  m.id === processedMessage.id ? { ...m, ...processedMessage } : m
                )
              };
            } else {
              const updatedMessages = [...currentMessages, processedMessage].sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              return {
                ...prev,
                [conversationId]: updatedMessages
              };
            }
          });

          // Update conversations state with improved unread count handling
          setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
              const isActiveAndFocused = conv.id === activeConversation && document.hasFocus();
              const isWindowVisible = !document.hidden;
              const shouldIncrementUnread = !processedMessage.isOwn && (!isActiveAndFocused || !isWindowVisible);
              
              // Calculate new unread count
              const newUnreadCount = shouldIncrementUnread ? 
                (conv.unreadCount || 0) + 1 : 
                (isActiveAndFocused && isWindowVisible ? 0 : conv.unreadCount || 0);

              console.log('[MessengerUI] Updating unread count:', {
                conversationId,
                isActiveAndFocused,
                isWindowVisible,
                shouldIncrementUnread,
                oldCount: conv.unreadCount,
                newCount: newUnreadCount
              });
              
              return {
                ...conv,
                lastMessage: {
                  content: processedMessage.content,
                  timestamp: processedMessage.timestamp,
                  sender: {
                    id: processedMessage.sender.id,
                    name: processedMessage.sender.name
                  }
                },
                unreadCount: newUnreadCount
              };
            }
            return conv;
          }));

          // If active conversation and focused, mark as read
          if (conversationId === activeConversation && document.hasFocus() && !document.hidden) {
            markMessagesAsRead();
          }
        }
        break;

      case 'message_status':
        if (lastMessage.message_id && lastMessage.status) {
          setConversationMessages(prev => {
            const updatedMessages = { ...prev };
            Object.keys(updatedMessages).forEach(convId => {
              updatedMessages[convId] = updatedMessages[convId].map(msg => 
                msg.id === lastMessage.message_id
                  ? { ...msg, status: lastMessage.status }
                  : msg
              );
            });
            return updatedMessages;
          });
        }
        break;

      case 'read_status':
        if (lastMessage.message_ids && lastMessage.user_id && lastMessage.user_id !== user?.id) {
          // Update unread counts when messages are read by others
          setConversations(prev => prev.map(conv => {
            const hasUnreadMessages = Object.values(conversationMessagesRef.current).some(
              messages => messages.some(m => 
                lastMessage.message_ids.includes(m.id) && 
                !m.isOwn && 
                m.status !== 'read'
              )
            );
            
            if (hasUnreadMessages && conv.id !== activeConversation) {
              const newUnreadCount = Math.max(0, (conv.unreadCount || 0) - 1);
              console.log('[MessengerUI] Updating unread count from read status:', {
                conversationId: conv.id,
                oldCount: conv.unreadCount,
                newCount: newUnreadCount
              });
              return {
                ...conv,
                unreadCount: newUnreadCount
              };
            }
            return conv;
          }));
        }
        break;

      case 'initial_messages':
        if (lastMessage.messages && activeConversation) {
          setConversationMessages(prev => ({
            ...prev,
            [activeConversation]: lastMessage.messages
          }));
        }
        break;

      case 'unread_count_update':
        if (lastMessage.conversation_id && lastMessage.unread_count !== undefined) {
          setConversations(prev => prev.map(conv => {
            if (conv.id === lastMessage.conversation_id) {
              console.log('[MessengerUI] Updating unread count from WebSocket:', {
                conversationId: conv.id,
                oldCount: conv.unreadCount,
                newCount: lastMessage.unread_count
              });
              return {
                ...conv,
                unreadCount: lastMessage.unread_count
              };
            }
            return conv;
          }));
        }
        break;
    }
  }, [lastMessage, activeConversation, user?.id]);

  // Update markMessagesAsRead to be more robust
  const markMessagesAsRead = async () => {
    if (!activeConversation || !user?.id) return;

    try {
      // Call API to mark messages as read
      await api.post(`/api/chat/conversations/${activeConversation}/mark_read/`);
      
      // Update local state to reset unread count
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversation) {
          console.log('[MessengerUI] Marking messages as read:', {
            conversationId: conv.id,
            oldCount: conv.unreadCount,
            newCount: 0
          });
          return {
            ...conv,
            unreadCount: 0
          };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Add visibility and focus change handlers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeConversation) {
        // Add a small delay to ensure the window is fully visible and focused
        setTimeout(() => {
          if (document.hasFocus()) {
            markMessagesAsRead();
          }
        }, 100);
      }
    };

    // Also handle focus/blur events
    const handleFocus = () => {
      if (activeConversation && !document.hidden) {
        markMessagesAsRead();
      }
    };

    // Handle window focus/blur
    const handleWindowFocus = () => {
      if (activeConversation && !document.hidden) {
        markMessagesAsRead();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('focus', handleFocus);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('focus', handleFocus);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [activeConversation]);

  // Add effect to handle initial messages
  useEffect(() => {
    if (lastMessage?.type === 'initial_messages' && lastMessage.messages) {
      const conversationId = activeConversation;
      if (conversationId) {
        setConversationMessages(prev => ({
          ...prev,
          [conversationId]: lastMessage.messages
        }));
      }
    }
  }, [lastMessage, activeConversation]);

  // Update handleSendMessage to use pendingFiles
  const handleSendMessage = async (content: string | undefined | null, files: FileUpload[] = []) => {
    if (!activeConversation) {
      console.error('No active conversation');
      return;
    }

    console.log('handleSendMessage called with:', { content, files });
    const contentStr = content?.trim() || '';
    console.log('Trimmed content:', contentStr);
    
    if (!contentStr && files.length === 0) {
      console.error('Message must have content or files');
      return;
    }

    try {
      // Clear message input and file uploads immediately
      setNewMessage('');
      setFileUploads([]);
      
      // Clear any selected files in the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Process files if any are provided
      let processedFiles = [];
      if (files.length > 0) {
        processedFiles = await Promise.all(files.map(async (file) => {
          const base64Data = await convertFileToBase64(file.file);
          let thumbnail = '';
          
          if (file.file.type.startsWith('image/')) {
            thumbnail = base64Data;
          } else if (file.file.type.startsWith('video/')) {
            thumbnail = await generateVideoThumbnail(file.file);
          }

          return {
            id: file.id || Math.random().toString(36).substr(2, 9),
            file: base64Data,
            file_name: file.fileName || file.file.name,
            file_type: file.fileType || file.file.type,
            file_size: file.file.size,
            category: file.file.type.startsWith('image/') ? 'image' as const : 
                     file.file.type.startsWith('video/') ? 'video' as const : 
                     file.file.type.startsWith('audio/') ? 'audio' as const : 'document' as const,
            thumbnail: thumbnail,
            created_at: new Date().toISOString(),
            uploaded_by: user?.id || '',
            url: base64Data
          };
        }));
      }

      // Determine message type based on content and files
      let messageType = 'text';
      if (files.length > 0) {
        messageType = contentStr ? 'mixed' : 'file';
      }

      const messageData = {
        type: 'chat_message' as const,
        conversation: activeConversation,
        message: {
          content: contentStr,
          message_type: messageType,
          files: processedFiles,
          conversation: activeConversation
        }
      };

      console.log('Sending message:', messageData);
      sendMessage(messageData);
      
      // Clean up file resources
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  // Fix type errors in handleReaction
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!activeConversation) {
      console.error('Missing activeConversation ID:', { messageId, emoji });
      toast.error('No active conversation selected');
      return;
    }

    // Log conversation and user details
    console.log('%c=== REACTION DEBUG ===', 'background: #FF9800; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
    console.log('Conversation ID:', activeConversation);
    console.log('Message ID:', messageId);
    console.log('Emoji:', emoji);
    console.log('Current User:', user ? {
      id: user.id,
      username: user.username,
      email: user.email
    } : 'Not logged in');
    
    // Add more detailed token debugging
    console.log('%c=== TOKEN DEBUG ===', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
    console.log('LocalStorage token:', localStorage.getItem('access_token')?.substring(0, 20) + '...');
    console.log('Axios defaults headers:', api.defaults.headers);
    console.log('Axios instance config:', {
      baseURL: api.defaults.baseURL,
      withCredentials: api.defaults.withCredentials,
      headers: api.defaults.headers
    });

    try {
      // First try to add/remove the reaction
      console.log('Sending reaction request to:', `/api/chat/conversations/${activeConversation}/messages/${messageId}/react/`);
      console.log('Request payload:', { emoji });
      const response = await api.post(
        `/api/chat/conversations/${activeConversation}/messages/${messageId}/react/`,
        { emoji }
      );
      console.log('Response:', response.data);

      // If we get here, the reaction was successful
      const isRemoved = response.data.removed;

      if (isRemoved) {
        // For removed reactions, update the UI optimistically
        setConversationMessages(prev => {
          const conversationId = activeConversation;
          if (!conversationId) return prev;

          return {
            ...prev,
            [conversationId]: prev[conversationId].map(msg => {
              if (msg.id === messageId) {
                // Remove the reaction from the message
                const updatedReactions = msg.reactions?.filter(r => r.emoji !== emoji) || [];
                return {
                  ...msg,
                  reactions: updatedReactions
                };
              }
              return msg;
            })
          };
        });

        toast.success('Reaction removed', {
          icon: '🗑️',
          duration: 2000
        });
      } else {
        // For added reactions, fetch the updated message
        try {
          const messageResponse = await api.get<Message>(
            `/api/chat/conversations/${activeConversation}/messages/${messageId}/`
          );
          
          // Update the message reactions in the UI
          setConversationMessages(prev => {
            const conversationId = activeConversation;
            if (!conversationId) return prev;

            return {
              ...prev,
              [conversationId]: prev[conversationId].map(msg => {
                if (msg.id === messageId) {
                  return {
                    ...msg,
                    reactions: messageResponse.data.reactions
                  };
                }
                return msg;
              })
            };
          });

          // Show success toast
          toast.success('Reaction added!', {
            icon: '👍',
            duration: 2000
          });
        } catch (error: any) {
          // If fetching the updated message fails, try to refresh the token
          if (error.response?.status === 401) {
            try {
              const { refreshToken } = useAuth();
              const newToken = await refreshToken();
              if (newToken) {
                // Retry the message fetch with the new token
                const messageResponse = await api.get<Message>(
                  `/api/chat/conversations/${activeConversation}/messages/${messageId}/`
                );
                
                // Update the message reactions in the UI
                setConversationMessages(prev => {
                  const conversationId = activeConversation;
                  if (!conversationId) return prev;

                  return {
                    ...prev,
                    [conversationId]: prev[conversationId].map(msg => {
                      if (msg.id === messageId) {
                        return {
                          ...msg,
                          reactions: messageResponse.data.reactions
                        };
                      }
                      return msg;
                    })
                  };
                });

                toast.success('Reaction added!', {
                  icon: '👍',
                  duration: 2000
                });
                return;
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              toast.error('Session expired. Please log in again.');
              window.location.href = '/login';
              return;
            }
          }
          throw error; // Re-throw if it's not a 401 error
        }
      }
    } catch (error: any) {
      console.error('Error handling reaction:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        try {
          const { refreshToken } = useAuth();
          const newToken = await refreshToken();
          if (newToken) {
            // Retry the reaction with the new token
            const response = await api.post(
              `/api/chat/conversations/${activeConversation}/messages/${messageId}/react/`,
              { emoji }
            );
            
            // Update UI based on response
            if (response.data.removed) {
              setConversationMessages(prev => {
                const conversationId = activeConversation;
                if (!conversationId) return prev;

                return {
                  ...prev,
                  [conversationId]: prev[conversationId].map(msg => {
                    if (msg.id === messageId) {
                      const updatedReactions = msg.reactions?.filter(r => r.emoji !== emoji) || [];
                      return { ...msg, reactions: updatedReactions };
                    }
                    return msg;
                  })
                };
              });

              toast.success('Reaction removed', {
                icon: '🗑️',
                duration: 2000
              });
            } else {
              const messageResponse = await api.get<Message>(
                `/api/chat/conversations/${activeConversation}/messages/${messageId}/`
              );
              
              setConversationMessages(prev => {
                const conversationId = activeConversation;
                if (!conversationId) return prev;

                return {
                  ...prev,
                  [conversationId]: prev[conversationId].map(msg => {
                    if (msg.id === messageId) {
                      return {
                        ...msg,
                        reactions: messageResponse.data.reactions
                      };
                    }
                    return msg;
                  })
                };
              });

              toast.success('Reaction added!', {
                icon: '👍',
                duration: 2000
              });
            }
            return;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
          return;
        }
      }
      
      toast.error('Failed to update reaction. Please try again.');
    }
  };

  const handleReply = (messageId: string) => {
    console.log('%c=== REPLY FLOW START ===', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
    console.log('%cReply initiated for message ID:', 'color: #4CAF50; font-weight: bold;', messageId);
    
    const messageToReply = conversationMessages[activeConversation || '']?.find(
      msg => msg.id === messageId
    );
    
    if (messageToReply) {
      console.log('%cFound message to reply to:', 'color: #2196F3; font-weight: bold;', {
        id: messageToReply.id,
        content: messageToReply.content,
        sender: {
          id: messageToReply.sender.id,
          name: messageToReply.sender.name,
          role: messageToReply.sender.role
        },
        timestamp: messageToReply.timestamp,
        conversation: activeConversation
      });
      
      setReplyingTo(messageToReply);
      setReplyContent('');
      setShowMessageActions(null);
      
      console.log('%cReply state updated:', 'color: #9C27B0; font-weight: bold;', {
        replyingTo: {
          id: messageToReply.id,
          content: messageToReply.content,
          sender: messageToReply.sender.name
        },
        replyContent: '',
        activeConversation
      });
    } else {
      console.warn('%cCould not find message to reply to:', 'color: #FF5722; font-weight: bold;', {
        messageId,
        activeConversation,
        availableMessages: conversationMessages[activeConversation || '']?.length || 0
      });
    }
  };

  const handleCancelReply = () => {
    console.log('Cancelling reply, current state:', {
      replyingTo,
      replyContent,
      activeConversation
    });
    setReplyingTo(null);
    setReplyContent('');
    console.log('Reply state cleared');
  };

  const handleReplyInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    console.log('=== REPLY INPUT CHANGE ===');
    console.log('Reply input state:', {
      currentContent: replyContent,
      newContent,
      replyingToId: replyingTo?.id,
      replyingToContent: replyingTo?.content,
      activeConversation
    });
    setReplyContent(newContent);
  };

  const handleSendReply = async () => {
    console.log('=== REPLY FLOW START ===');
    console.log('Pre-send state check:', {
      hasReplyingTo: !!replyingTo,
      replyingToId: replyingTo?.id,
      replyingToContent: replyingTo?.content,
      replyContent,
      activeConversation,
      user: user ? {
        id: user.id,
        username: user.username
      } : null
    });

    if (!replyingTo || !replyContent.trim()) {
      console.warn('Cannot send reply - validation failed:', {
        hasReplyingTo: !!replyingTo,
        hasContent: !!replyContent.trim(),
        contentLength: replyContent.length,
        activeConversation
      });
      return;
    }

    try {
      const messageToSend = {
        content: replyContent,
        reply_to_id: replyingTo.id,
        conversation: activeConversation,
        message_type: 'text'
      };
      console.log('Sending reply to API:', {
        endpoint: API_ENDPOINTS.sendMessage(activeConversation || ''),
        payload: messageToSend,
        headers: api.defaults.headers
      });
      
      const response = await api.post(API_ENDPOINTS.sendMessage(activeConversation || ''), messageToSend);
      console.log('Reply API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        replyTo: response.data.reply_to,
        parentMessage: response.data.parent_message,
        rawResponse: response
      });

      // Add message to UI with proper typing
      const newMessage: Message = {
        id: response.data.id,
        content: replyContent,
        sender: {
          id: user?.id || '',
          name: user?.username || '',
          avatarUrl: user?.avatar || DEFAULT_AVATAR,
          role: 'Member' as const
        },
        receiver: {
          id: selectedConversation?.id || '',
          name: selectedConversation?.name || '',
          avatarUrl: selectedConversation?.user?.avatarUrl || DEFAULT_AVATAR,
          role: 'Member' as const
        },
        timestamp: new Date().toISOString(),
        status: 'sent',
        isOwn: true,
        replyTo: response.data.reply_to ? {
          id: response.data.reply_to.id,
          content: response.data.reply_to.content,
          sender: {
            id: response.data.reply_to.sender.id,
            name: response.data.reply_to.sender.username || response.data.reply_to.sender.name || '',
            avatarUrl: response.data.reply_to.sender.avatar_url || DEFAULT_AVATAR,
            role: response.data.reply_to.sender.role || 'Member'
          }
        } : undefined
      };
      console.log('Constructed new message for UI:', {
        id: newMessage.id,
        content: newMessage.content,
        replyTo: newMessage.replyTo ? {
          id: newMessage.replyTo.id,
          content: newMessage.replyTo.content,
          sender: newMessage.replyTo.sender
        } : null,
        timestamp: newMessage.timestamp,
        isOwn: newMessage.isOwn
      });

      setConversationMessages(prev => {
        const currentMessages = prev[activeConversation || ''] || [];
        const updatedMessages = {
          ...prev,
          [activeConversation || '']: [...currentMessages, newMessage]
        };
        console.log('Updated conversation messages:', {
          conversationId: activeConversation,
          previousMessageCount: currentMessages.length,
          newMessageCount: updatedMessages[activeConversation || '']?.length,
          lastMessage: updatedMessages[activeConversation || '']?.slice(-1)[0]
        });
        return updatedMessages;
      });

      // Clear reply state
      setReplyingTo(null);
      setReplyContent('');
      console.log('Reply state cleared after successful send');

    } catch (error: any) {
      console.error('Error sending reply:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        replyingToId: replyingTo?.id,
        content: replyContent
      });
      toast.error('Failed to send reply. Please try again.');
    }
    console.log('=== REPLY FLOW END ===');
  };

  const handleForward = (messageId: string) => {
    const message = conversationMessages[activeConversation || '']?.find(m => m.id === messageId);
    if (message) {
      setMessageToForward(message);
      setShowForwardModal(true);
    }
  };

  const handleForwardToFriends = async (conversationIds: string[]) => {
    if (!messageToForward || !activeConversation) return;

    // Define friends and groups as empty arrays to satisfy linter
    const friends: any[] = [];
    const groups: any[] = [];

    try {
      for (const conversationId of conversationIds) {
        // First ensure the target conversation exists
        let targetConversationId = conversationId;
        try {
          // Try to get the conversation
          await api.get(`${API_BASE_URL}/api/chat/conversations/${conversationId}/`);
        } catch (error: any) {
          if (error.response?.status === 404) {
            // Conversation doesn't exist, create it
            const item = [...friends, ...groups].find(i => i.id === conversationId);
            if (!item) continue;

            if (item.type === 'user') {
              // Create direct conversation
              const response = await api.post(`${API_BASE_URL}/api/chat/conversations/`, {
                type: 'direct',
                other_user: item.id
              });
              targetConversationId = response.data.id;
            } else {
              // For groups, we should already have a conversation
              console.error('Group conversation not found');
              continue;
            }
          } else {
            // Other error, skip this conversation
            console.error('Error checking conversation:', error);
            continue;
          }
        }

        // Now forward the message - use the source conversation ID in the URL
        await api.post(
          `${API_BASE_URL}/api/chat/conversations/${activeConversation}/messages/${messageToForward.id}/forward/`,
          { conversation_id: targetConversationId }  // Pass the target conversation ID in the body
        );
      }
      toast.success('Message forwarded successfully');
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!activeConversation) {
      console.error('No active conversation selected');
      toast.error('No active conversation selected');
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Deleting message...');

      // Call the API to delete the message
      await api.delete(API_ENDPOINTS.deleteMessage(activeConversation, messageId));

      // Update the UI by removing the deleted message
      setConversationMessages(prev => {
        const conversationId = activeConversation;
        if (!conversationId) return prev;

        return {
          ...prev,
          [conversationId]: prev[conversationId].filter(msg => msg.id !== messageId)
        };
      });

      // Update toast to success
      toast.success('Message deleted successfully', {
        id: loadingToast,
        duration: 2000
      });

      // If the message was pinned, remove it from pinned messages
      setPinnedMessages(prev => prev.filter(id => id !== messageId));

    } catch (error: any) {
      console.error('Error deleting message:', error);
      
      // Show error toast with specific message if available
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          'Failed to delete message. Please try again.';
      toast.error(errorMessage);

      // If the error is due to unauthorized access
      if (error.response?.status === 403) {
        toast.error('You do not have permission to delete this message');
      }
      // If the error is due to message not found
      else if (error.response?.status === 404) {
        toast.error('Message not found');
      }
    }
  };

  const handleEdit = (messageId: string) => {
    // Handle edit logic
    setShowMessageActions(null);
  };

  const handlePinMessage = (messageId: string) => {
    setPinnedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleMessageEffect = (messageId: string, effect: string) => {
    // Add effect animation logic
  };

  const handleThreadView = async (messageId: string) => {
    try {
      if (!activeConversation) {
        toast.error('No active conversation');
        return;
      }

      // First, get the parent message
      const parentMessageResponse = await api.get(`/api/chat/conversations/${activeConversation}/messages/${messageId}/`);
      const parentMessage = parentMessageResponse.data;

      // Then, create or get the thread data
      const threadResponse = await api.post(`/api/chat/conversations/${activeConversation}/messages/${messageId}/threads/`);
      
      // Transform the thread data to match our expected format
      const threadData: MessageThread = {
        id: threadResponse.data.id,
        parentMessage: {
          id: parentMessage.id,
          content: parentMessage.content,
          sender: {
            id: parentMessage.sender.id,
            name: parentMessage.sender.username || parentMessage.sender.name || '',
            avatarUrl: parentMessage.sender.avatar_url || DEFAULT_AVATAR,
            role: parentMessage.sender.role || 'Member'
          },
          timestamp: parentMessage.created_at,
          status: parentMessage.status || 'sent',
          isOwn: String(parentMessage.sender.id) === String(user?.id),
          conversation: activeConversation,
          conversation_id: activeConversation,
          message_type: parentMessage.message_type || 'text',
          files: parentMessage.files || [],
          isThreadReply: false,
          attachments: parentMessage.files?.map((file: any) => ({
            id: file.id,
            type: file.file_type || 'file',
            url: file.url || file.file,
            thumbnail: file.thumbnail_url || file.thumbnail,
            fileName: file.file_name,
            fileSize: file.file_size,
            duration: file.duration
          })) || []
        },
        replies: (threadResponse.data.messages || []).map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: {
            id: msg.sender.id,
            name: msg.sender.username || msg.sender.name || '',
            avatarUrl: msg.sender.avatar_url || DEFAULT_AVATAR,
            role: msg.sender.role || 'Member'
          },
          timestamp: msg.created_at,
          status: msg.status || 'sent',
          isOwn: String(msg.sender.id) === String(user?.id),
          conversation: activeConversation,
          conversation_id: activeConversation,
          message_type: msg.message_type || 'text',
          files: msg.files || [],
          isThreadReply: true,
          attachments: msg.files?.map((file: any) => ({
            id: file.id,
            type: file.file_type || 'file',
            url: file.url || file.file,
            thumbnail: file.thumbnail_url || '',
            fileName: file.file_name,
            fileSize: file.file_size,
            duration: file.duration
          })) || []
        })),
        participantsCount: threadResponse.data.participants?.length || 0,
        lastReplyAt: threadResponse.data.last_reply_at || threadResponse.data.created_at,
        repliesCount: threadResponse.data.messages?.length || 0
      };

      // Set the active thread and show the thread view modal
      setActiveThread(threadData);
      setShowThreadView(true);

    } catch (error) {
      console.error('Error handling thread:', error);
      toast.error('Failed to open thread');
    }
  };

  const handleSendThreadReply = async (content: string, parentMessageId: string, attachments?: File[]) => {
    if (!activeConversation || !activeThread) return;

    try {
      // Validate content
      if (!content || content.trim() === '') {
        throw new Error('Message content cannot be empty');
      }

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('conversation', activeConversation);
      formData.append('parent_message_id', parentMessageId);
      formData.append('thread_id', activeThread.id);
      formData.append('message_type', 'text');
      formData.append('is_thread_reply', 'true');

      // Append files if they exist
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await api.post(
        API_ENDPOINTS.sendMessage(activeConversation),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Transform the response data to match our Message type
      const newReply: Message = {
        id: response.data.id,
        content: response.data.content,
        sender: {
          id: response.data.sender.id,
          name: response.data.sender.username || response.data.sender.name || '',
          avatarUrl: response.data.sender.avatar_url || DEFAULT_AVATAR,
          role: response.data.sender.role || 'Member',
        },
        receiver: undefined,
        timestamp: response.data.created_at || '',
        status: response.data.status || 'sent',
        isOwn: String(response.data.sender.id) === String(user?.id),
        attachments: Array.isArray(response.data.files)
          ? response.data.files.map((file: any) => ({
              id: file.id,
              type: file.file_type || 'file',
              url: file.url || file.file || '',
              thumbnail: file.thumbnail_url || '',
              fileName: file.file_name || '',
              fileSize: file.file_size || 0,
              duration: file.duration,
            }))
          : [],
        thread: response.data.thread,
        hasThread: !!response.data.thread,
        isThreadReply: true,
        parent_message_id: parentMessageId,
        thread_id: activeThread.id,
        replyTo: {
          id: parentMessageId,
          content: response.data.parent_message?.content || '',
          sender: {
            id: response.data.parent_message?.sender?.id || '',
            name: response.data.parent_message?.sender?.username || response.data.parent_message?.sender?.name || '',
            avatarUrl: response.data.parent_message?.sender?.avatar_url || DEFAULT_AVATAR,
            role: response.data.parent_message?.sender?.role || 'Member'
          }
        },
        conversation: activeConversation,
        conversation_id: activeConversation,
        message_type: 'text'
      };

      // Update the active thread with the new reply
      setActiveThread(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          replies: [...(prev.replies || []), newReply],
          repliesCount: (prev.repliesCount || 0) + 1,
          lastReplyAt: newReply.timestamp
        };
      });

      // Update the parent message's thread count in the conversation messages
      setConversationMessages(prev => {
        const currentMessages = prev[activeConversation] || [];
        return {
          ...prev,
          [activeConversation]: currentMessages.map(msg => {
            if (msg.id === parentMessageId && msg.thread) {
              return {
                ...msg,
                thread: {
                  ...msg.thread,
                  repliesCount: (msg.thread.repliesCount || 0) + 1,
                  lastReplyAt: newReply.timestamp
                }
              };
            }
            return msg;
          })
        };
      });

    } catch (error) {
      console.error('Error sending thread reply:', error);
      throw error;
    }
  };

  // Add theme colors as constants
  const themeColors = {
    primary: '#8957e5',
    secondary: '#161b22',
    textPrimary: '#c9d1d9',
    textSecondary: '#8b949e',
    border: '#21262d',
    background: '#0d1117',
    success: '#238636',
    danger: '#f85149',
  };

  // Add CSS classes for fun animations
  const bounceClass = 'hover:animate-bounce transition-transform';
  const wiggleClass = 'hover:animate-wiggle transition-transform';
  const spinClass = 'hover:animate-spin-slow transition-transform';

  // Update styles with new animations
  useEffect(() => {
    const styles = `
      @keyframes wiggle {
        0%, 100% { transform: rotate(-3deg); }
        50% { transform: rotate(3deg); }
      }
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-wiggle {
        animation: wiggle 0.3s ease-in-out infinite;
      }
      .animate-spin-slow {
        animation: spin 3s linear infinite;
      }

      /* Custom Scrollbar Styles */
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.5);
        border-radius: 3px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(139, 92, 246, 0.5);
        border-radius: 3px;
        transition: background 0.2s ease;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(139, 92, 246, 0.8);
      }

      /* Firefox Scrollbar */
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(139, 92, 246, 0.5) rgba(31, 41, 55, 0.5);
      }

      /* Message Status Animation */
      @keyframes statusPop {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      .status-pop {
        animation: statusPop 0.2s ease-out forwards;
      }

      /* Typing Indicator Animation */
      @keyframes typingBounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-5px); }
      }

      .typing-dot {
        animation: typingBounce 1s infinite ease-in-out;
      }

      /* Reaction Hover Animation */
      @keyframes reactionPop {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }

      .reaction-hover:hover {
        animation: reactionPop 0.3s ease-in-out;
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Handle voice recording
  const handleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingDuration(0);
    } else {
      setIsRecording(false);
      // TODO: Handle voice message sending
    }
  };

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    // Handle file upload
  }, []);

  // Handle message formatting
  const handleFormat = (format: keyof MessageFormat) => {
    setMessageFormat(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  // Format message text
  const formatText = (text: string, format: MessageFormat) => {
    let formatted = text;
    if (format.bold) formatted = `**${formatted}**`;
    if (format.italic) formatted = `_${formatted}_`;
    if (format.code) formatted = `\`${formatted}\``;
    if (format.link) formatted = `[${formatted}](${format.link})`;
    return formatted;
  };

  // Add handler for new conversation
  const handleNewConversation = async (user: { id: string; name: string; avatarUrl: string }) => {
    try {
      console.log('Creating new conversation with user:', user);
      
      // First check if a conversation with this user already exists
      const existingConversation = conversations.find(conv => 
        conv.type === 'direct' && 
        conv.user?.id === user.id
      );

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation);
        // If conversation exists, just select it
        handleConversationSelect(existingConversation);
        setShowNewConversationModal(false);
        return;
      }
      
      const response = await api.post(API_ENDPOINTS.conversations, {
        type: 'direct',
        other_user: user.id,
        members: [user.id] // Add the other user as a member
      });
      
      console.log('Conversation creation response:', response.data);
      
      const newConversation: Conversation = {
        id: String(response.data.id),
        type: 'direct',
        name: user.name,
        lastMessage: null,
        unreadCount: 0,
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          isOnline: false,
          status: 'offline',
          bio: '',
          personality_tags: []
        },
        group: null
      };
      
      setConversations(prev => {
        // Only add if not already present
        if (prev.some(conv => conv.id === newConversation.id)) {
          return prev;
        }
        return [newConversation, ...prev];
      });
      
      setActiveConversation(newConversation.id);
      setSelectedConversation(newConversation); // Ensure details are set
      setShowNewConversationModal(false); // Close the modal after successful creation
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  // Add handler for group creation
  const handleCreateGroup = async (groupData: { 
    name: string; 
    members: Array<{ id: string; name: string; avatarUrl: string }> 
  }) => {
    try {
      console.log('\n=== Starting Group Creation ===');
      console.log('Group data:', groupData);
      
      // Extract member IDs from the members array
      const memberIds = groupData.members.map(member => member.id);
      console.log('Extracted member IDs:', memberIds);
      
      const response = await api.post('/api/chat/groups/', {
        name: groupData.name,
        memberIds: memberIds
      });
      
      console.log('Group creation response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      
      // Extract IDs from response
      const { group_id, conversation_id } = response.data;
      console.log('Extracted IDs:', { group_id, conversation_id, rawResponse: response.data });
      
      // Fetch the actual group members from the backend
      const membersResponse = await api.get(`${API_BASE_URL}/api/chat/conversations/${conversation_id}/members/`);
      const members = membersResponse.data.map((member: any) => ({
        id: member.user.id,
        name: `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim() || member.user.username,
        avatarUrl: member.user.avatar || DEFAULT_GROUP_AVATAR,
        role: member.role || 'member',
        isOnline: member.user.is_online || false,
      }));

      // Create new conversation object with real members count
      const newConversation = {
        id: conversation_id,
        type: 'group' as const,
        name: groupData.name,
        lastMessage: null,
        unreadCount: 0,
        user: null,
        group: {
          id: group_id,
          name: groupData.name,
          acronym: groupData.name.substring(0, 2).toUpperCase(),
          members: members.length,
          isActive: true,
          avatarUrl: DEFAULT_GROUP_AVATAR
        },
        members: members
      };
      
      // Update conversations state
      setConversations(prev => [newConversation, ...prev]);
      setGroupMembers(prev => ({ ...prev, [group_id]: members }));
      
      // Select the new conversation
      handleConversationSelect(newConversation);
      
      console.log('=== Group Creation Completed Successfully ===\n');
      
      // Close the modal
      setShowCreateGroupModal(false);
      
      // Show success message
      toast.success('Group created successfully!');
      
    } catch (error: any) {
      console.error('=== Error in Group Creation ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      // Show error message
      const errorMessage = error.response?.data?.detail || 'Failed to create group';
      toast.error(errorMessage);
    }
  };

  // Add loading states
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add effect to fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return;
      
      // Check if user is available
      if (!user || !user.id) {
        console.error('User not available');
        setMessagesError('User session expired. Please log in again.');
        return;
      }

      try {
        setIsLoadingMessages(true);
        setMessagesError(null);

        console.log('Fetching messages for conversation:', activeConversation);
        console.log('Current user:', user);

        const response = await api.get(API_ENDPOINTS.messages(activeConversation));
        
        console.log('Raw API response:', response.data);
        
        // Transform the messages to match our Message interface with safe fallbacks
        let transformedMessages = response.data
          .filter((msg: any) => {
            // Exclude messages that are thread replies
            if (msg.is_thread_reply || msg.parent_message_id) {
              console.log('Filtering out thread reply:', {
                messageId: msg.id,
                content: msg.content,
                isThreadReply: msg.is_thread_reply,
                parentMessageId: msg.parent_message_id
              });
              return false;
            }
            return true;
          })
          .map((msg: any) => {
            // Helper functions for consistent user data handling
            const getDisplayName = (user: any) => {
              return user ? `${user.first_name} ${user.last_name}`.trim() : 'Unknown User';
            };
            const getAvatarUrl = (user: any) => {
              return user?.avatar || DEFAULT_AVATAR;
            };
            const getUserId = (user: any) => {
              return user?.id || 'unknown';
            };

            // Log the raw message data for debugging
            console.log('Processing message:', {
              messageId: msg.id,
              content: msg.content,
              replyToId: msg.reply_to_id || msg.reply_to?.id,
              parentMessageId: msg.parent_message_id
            });

            // Get thread info if it exists
            let thread: MessageThread | undefined = undefined;
            if (msg.thread_id || msg.thread) {
              thread = {
                id: msg.thread_id || msg.thread?.id,
                parentMessage: msg,
                replies: msg.thread_replies || msg.thread?.replies || [],
                participantsCount: msg.thread_participants_count || msg.thread?.participantsCount || 0,
                lastReplyAt: msg.thread_last_reply_at || msg.thread?.lastReplyAt || msg.created_at,
                repliesCount: msg.thread_replies_count || (msg.thread_replies ? msg.thread_replies.length : 0) || msg.thread?.repliesCount || 0
              };
            }

            // Store the reply reference ID for later reconstruction
            const replyToId = msg.reply_to_id || msg.reply_to?.id || msg.parent_message_id;

            const transformedMessage: Message = {
              id: msg.id,
              content: msg.content,
              sender: {
                id: getUserId(msg.sender),
                name: getDisplayName(msg.sender),
                avatarUrl: getAvatarUrl(msg.sender),
                role: (msg.sender?.role === 'Admin' || msg.sender?.role === 'Member') ? msg.sender.role : undefined
              },
              receiver: {
                id: getUserId(msg.receiver),
                name: getDisplayName(msg.receiver),
                avatarUrl: getAvatarUrl(msg.receiver),
                role: (msg.receiver?.role === 'Admin' || msg.receiver?.role === 'Member') ? msg.receiver.role : undefined
              },
              timestamp: msg.created_at,
              status: msg.status || 'sent',
              isOwn: String(getUserId(msg.sender)) === String(user?.id),
              attachments: (msg.files || msg.attachments || []).map((file: any) => ({
                id: file.id,
                type: file.file_type || file.type,
                url: file.url || file.file,
                thumbnail: file.thumbnail_url || file.thumbnail,
                fileName: file.file_name || file.fileName,
                fileSize: file.file_size || file.fileSize,
                duration: file.duration
              })),
              thread: thread,
              hasThread: Boolean(thread),
              isThreadReply: Boolean(msg.is_thread_reply || msg.parent_message_id),
              reactions: msg.reactions ? msg.reactions.map((reaction: any) => ({
                emoji: reaction.emoji,
                count: reaction.count,
                users: reaction.users || [],
                isSelected: reaction.isSelected || false
              })) : [],
              // Store the reply reference ID in a way that won't conflict with the Message type
              _replyToId: replyToId
            };

            // Log the transformed message for debugging
            console.log('Transformed message:', {
              id: transformedMessage.id,
              content: transformedMessage.content,
              replyToId: transformedMessage._replyToId,
              isThreadReply: transformedMessage.isThreadReply,
              hasThread: transformedMessage.hasThread,
              threadId: transformedMessage.thread?.id
            });

            return transformedMessage;
          });

        // --- RECONSTRUCT replyTo property for replies ---
        // Build a dictionary of messages by ID
        const messageDict: { [id: string]: Message } = {};
        transformedMessages.forEach((msg: Message) => {
          messageDict[msg.id] = msg;
        });

        // For each message, if it has a reply reference, set replyTo
        transformedMessages = transformedMessages.map((msg: Message) => {
          const replyToId = (msg as any)._replyToId;
          if (replyToId && messageDict[replyToId]) {
            const originalMessage = messageDict[replyToId];
            msg.replyTo = {
              id: originalMessage.id,
              content: originalMessage.content,
              sender: originalMessage.sender
            };
          }
          // Remove the temporary _replyToId property
          delete (msg as any)._replyToId;
          return msg;
        });

        // Log the final messages with replyTo reconstruction
        console.log('Messages after replyTo reconstruction:', transformedMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          replyTo: msg.replyTo ? {
            id: msg.replyTo.id,
            content: msg.replyTo.content,
            sender: msg.replyTo.sender.name
          } : null
        })));

        // Fetch full thread data for messages with threads
        const threadFetches = transformedMessages.map(async (msg: Message) => {
          if (msg.thread?.id) {
            try {
              console.log('Fetching thread data for message:', msg.id);
              const threadResponse = await api.get(`/api/chat/conversations/${activeConversation}/messages/${msg.id}/threads/`);
              console.log('Thread response:', threadResponse.data);
              
              // Preserve the existing thread data and merge with new data
              msg.thread = {
                ...msg.thread,
                id: threadResponse.data.id,
                parentMessage: msg, // Keep the parent message reference
                replies: threadResponse.data.replies || msg.thread.replies || [],
                participantsCount: threadResponse.data.participantsCount || msg.thread.participantsCount || 0,
                lastReplyAt: threadResponse.data.lastReplyAt || msg.thread.lastReplyAt || msg.timestamp,
                repliesCount: threadResponse.data.repliesCount || (threadResponse.data.replies && Array.isArray(threadResponse.data.replies)) 
                  ? threadResponse.data.replies.length 
                  : (msg.thread.repliesCount || 0)
              };
              msg.hasThread = true; // Ensure hasThread is set
              console.log('Updated thread data for message:', {
                messageId: msg.id,
                threadId: msg.thread.id,
                repliesCount: msg.thread.repliesCount,
                replies: msg.thread.replies?.length
              });
            } catch (err) {
              console.error('Failed to fetch thread details for message', msg.id, err);
              // Keep existing thread data if fetch fails
              if (msg.thread) {
                msg.thread = {
                  ...msg.thread,
                  replies: msg.thread.replies || [],
                  participantsCount: msg.thread.participantsCount || 0,
                  lastReplyAt: msg.thread.lastReplyAt || msg.timestamp,
                  repliesCount: msg.thread.repliesCount || 0
                };
                msg.hasThread = true; // Ensure hasThread is set
              }
            }
          }
          return msg;
        });

        // Wait for all thread fetches to complete
        transformedMessages = await Promise.all(threadFetches);

        // Log summary of messages with threads AFTER fetching thread data
        const messagesWithThreads = transformedMessages.filter((msg: Message) => msg.hasThread && msg.thread?.id);
        console.log('Messages with threads summary:', {
          totalMessages: transformedMessages.length,
          messagesWithThreads: messagesWithThreads.length,
          messagesWithThreadsDetails: messagesWithThreads.map((msg: Message) => ({
            id: msg.id,
            content: msg.content,
            threadId: msg.thread?.id,
            repliesCount: msg.thread?.repliesCount || 0
          }))
        });

        // Update the messages state with proper typing
        setConversationMessages(prev => ({
          ...prev,
          [activeConversation || '']: transformedMessages as Message[]
        }));

      } catch (error: any) {
        console.error('Error fetching messages:', error);
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        setMessagesError(
          error.response?.data?.message || 
          error.message || 
          'Failed to load messages. Please try again later.'
        );
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversation, user]);

  // Add loading state for authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Add unauthenticated state
  if (!isAuthenticated) {
    return null; // Will be redirected by the useEffect
  }

  // Add upload progress UI component
  const UploadProgress: FC<{ uploads: FileUpload[] }> = ({ uploads }) => {
    if (uploads.length === 0) return null;

    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-96 z-50">
        <div className="space-y-3">
          {uploads.map(upload => (
            <div key={upload.id} className="flex items-center space-x-3">
              {upload.preview && upload.file.type.startsWith('image/') ? (
                <img
                  src={upload.preview}
                  alt={upload.file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                  <svg className={`w-6 h-6 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(upload.file.size)}
                </p>
                {upload.status === 'uploading' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                )}
                {upload.status === 'success' && (
                  <p className="text-xs text-green-500 mt-1">Upload complete</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const UploadPreview: FC<{ uploads: FileUpload[]; onRemove: (id: string) => void }> = ({ uploads, onRemove }) => {
    if (uploads.length === 0) return null;

    const getFileIcon = (fileType: string) => {
      if (fileType.startsWith('image/')) return null;
      if (fileType.includes('pdf')) return '📄';
      if (fileType.includes('word')) return '📝';
      if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
      if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
      if (fileType.includes('zip') || fileType.includes('archive')) return '🗜️';
      return '📎';
    };

    const renderPreview = (upload: FileUpload) => {
      if (upload.file.type.startsWith('image/')) {
        return (
          <div className="relative group">
            <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src={upload.preview}
                alt={upload.file.name}
                className="w-full h-32 object-cover"
              />
              <button
                onClick={() => onRemove(upload.id)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
              {upload.file.name}
            </div>
          </div>
        );
      }

      return (
        <div className="relative group">
          <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-xl">{getFileIcon(upload.file.type)}</span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {upload.file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(upload.file.size)}
              </p>
            </div>
            <button
              onClick={() => onRemove(upload.id)}
              className="ml-2 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />              </svg>
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-2 p-2">
        {uploads.map(upload => (
          <div key={upload.id} className="relative">
            {renderPreview(upload)}
            {upload.status === 'pending' && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    fileName: string;
    index: number;
  } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Add DocumentPreviewModal component
  const DocumentPreviewModal = () => {
    if (!selectedDocument) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
        onClick={() => setSelectedDocument(null)}
      >
        <div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold dark:text-white">
              {selectedDocument.fileName}
            </h3>
            <button
              onClick={() => setSelectedDocument(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card-hover rounded-full"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="relative aspect-[4/3] bg-gray-100 dark:bg-dark-card-hover rounded-lg overflow-hidden">
            {selectedDocument.fileType.startsWith('image/') ? (
              <img
                src={selectedDocument.url}
                alt={selectedDocument.fileName}
                className="w-full h-full object-contain"
              />
            ) : selectedDocument.fileType.includes('pdf') ? (
              <object
                data={selectedDocument.url}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="text-6xl mb-4">
                    {getFileIcon(selectedDocument.fileType)}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Unable to display PDF directly. Please download to view.
                  </p>
                  <a
                    href={selectedDocument.url}
                    download
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Download PDF
                  </a>
                </div>
              </object>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-6xl mb-4">
                  {getFileIcon(selectedDocument.fileType)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Preview not available for this file type
                </p>
                <a
                  href={selectedDocument.url}
                  download
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Update the image click handler in the grid
  const handleImageClick = (attachment: any, index: number) => {
    setSelectedImage({
      url: attachment.url,
      fileName: attachment.file_name,
      index
    });
    setIsZoomed(false);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; fileName: string; fileType: string } | null>(null);
  
  // Add message info modal state here, with other state declarations

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    
    try {
      await api.delete(API_ENDPOINTS.deleteConversation(activeConversation));
      
      // Remove conversation from state
      setConversations(prev => prev.filter(c => c.id !== activeConversation));
      
      // Clear active conversation
      setActiveConversation(null);
      setSelectedConversation(null);
      
      // Close modals
      setShowDeleteModal(false);
      setShowRightPanel(false);
      
      // Navigate back to messages list
      navigate('/messages');
      
      toast.success('Conversation deleted successfully');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  interface DeleteConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    conversationName: string;
    conversationType: 'direct' | 'group';
  }

  const DeleteConversationModal: FC<DeleteConversationModalProps> = ({ isOpen, onClose, onConfirm, conversationName, conversationType }) => {
    const { isDarkMode } = useTheme();

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className={`relative w-[400px] ${isDarkMode ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            </div>
          </div>
          
          <h2 className={`text-xl font-semibold mb-2 text-center ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
            Warning: Delete {conversationType === 'direct' ? 'Conversation' : 'Group'}
          </h2>
          
          <div className={`mb-6 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p className="text-center">
              You are about to delete this {conversationType === 'direct' ? 'conversation' : 'group'} with <span className="font-medium">{conversationName}</span>
            </p>
            
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} border ${isDarkMode ? 'border-red-800' : 'border-red-200'}`}>
              <h3 className="font-medium text-red-500 mb-2">This action cannot be undone and will:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Permanently delete all messages</li>
                <li>Remove all shared media and files</li>
                {conversationType === 'group' && (
                  <>
                    <li>Remove all group members</li>
                    <li>Delete group settings and permissions</li>
                  </>
                )}
                <li>Clear conversation history</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add role colors constant near the top with other constants
  const ROLE_COLORS = {
    admin: 'bg-gray-700',
    moderator: 'bg-gray-600',
    member: 'bg-gray-500',
    owner: 'bg-gray-800'
  };

  const [selectedMemberMenu, setSelectedMemberMenu] = useState<string | null>(null);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      if (!selectedConversation?.group?.id) {
        console.error('No group selected');
        return;
      }

      const response = await api.put(`/api/chat/conversations/${selectedConversation.id}/change_member_role/`, {
        member_id: memberId,
        role: newRole
      });

      if (response.status === 200) {
        // Refresh the members list
        await fetchGroupMembers(selectedConversation.group.id);
        setSelectedMemberMenu(null);
      }
    } catch (error: any) {
      console.error('Error changing role:', error);
      // You might want to show an error message to the user here
      const errorMessage = error.response?.data?.error || 'Failed to change role';
      // You can use your preferred notification system here
      alert(errorMessage);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      // Add your API call here to delete the member
      console.log(`Deleting member ${memberId}`);
      setSelectedMemberMenu(null);
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const handleLeaveGroup = async (conversationId: string) => {
    try {
      if (!selectedConversation?.group?.id) {
        console.error('No group selected');
        return;
      }

      const response = await api.post(`/api/chat/conversations/${conversationId}/remove_member/`, {
        user_id: user?.id
      });
      
      if (response.status === 200) {
        // Remove the conversation from the list
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        // Clear the selected conversation
        setSelectedConversation(null);
        // Close the modal
        setShowGroupInfo(false);
      }
    } catch (error: any) {
      console.error('Error leaving group:', error);
      const errorMessage = error.response?.data?.error || 'Failed to leave group';
      alert(errorMessage);
    }
  };

  const handleDeleteGroup = async (conversationId: string) => {
    try {
      if (!selectedConversation?.group?.id) {
        console.error('No group selected');
        return;
      }

      const response = await api.delete(`/api/chat/groups/${selectedConversation.group.id}/`);
      
      if (response.status === 200) {
        // Remove the conversation from the list
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        // Clear the selected conversation
        setSelectedConversation(null);
        // Close the modal
        setShowDeleteGroupModal(false);
        toast.success('Group deleted successfully');
      }
    } catch (error: any) {
      console.error('Error deleting group:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete group';
      toast.error(errorMessage);
    }
  };

  // Add new interface for AddMembersModal props
  interface AddMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    conversationId: string;
    onMembersAdded: () => void;
  }

  // Add new component for adding members
  const AddMembersModal: FC<AddMembersModalProps> = ({ isOpen, onClose, groupId, conversationId, onMembersAdded }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);  // Changed from Set to single string
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationType, setConversationType] = useState<'direct' | 'group' | null>(null);
    const [existingMembers, setExistingMembers] = useState<Set<string>>(new Set());
    const [isCreating, setIsCreating] = useState(false);
    const { isDarkMode } = useTheme();

    // Add filtered users computation
    const filteredUsers = useMemo(() => {
      if (!searchQuery.trim()) return users;
      const query = searchQuery.toLowerCase();
      return users.filter(user => 
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      );
    }, [users, searchQuery]);

    useEffect(() => {
      if (isOpen) {
        const initializeModal = async () => {
          try {
            console.log('=== Initializing Modal ===');
            // First fetch conversation details
            await fetchConversationDetails();
            
            // Then fetch existing members and wait for them to be set
            const existingMemberIds = await fetchExistingMembers();
            console.log('=== Existing Members Fetched ===');
            console.log('Existing member IDs:', Array.from(existingMemberIds));
            
            // Now fetch and filter users with the existing members
            await fetchUsers(existingMemberIds);
          } catch (error) {
            console.error('Error initializing modal:', error);
            setError(error instanceof Error ? error.message : 'Failed to initialize modal');
          }
        };

        initializeModal();
      }
    }, [isOpen]);

    const fetchExistingMembers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No access token found');
        }

        console.log('=== Fetching Existing Members ===');
        console.log('Group ID:', groupId);

        const response = await fetch(`${API_BASE_URL}/api/chat/groups/${groupId}/members/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch existing members');
        }

        const data = await response.json();
        console.log('Existing members data:', data);
        
        const memberIds = new Set(data.map((member: any) => String(member.user.id)));
        console.log('Existing member IDs:', Array.from(memberIds));
        
        setExistingMembers(memberIds);
        return memberIds;
      } catch (err) {
        console.error('Error fetching existing members:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch existing members');
        return new Set<string>(); // Return empty set on error
      }
    };

    const fetchConversationDetails = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No access token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch conversation details');
        }

        const data = await response.json();
        console.log('Conversation details:', data);
        setConversationType(data.type);

        if (data.type !== 'group') {
          setError('Can only add members to group chats');
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (err) {
        console.error('Error fetching conversation details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch conversation details');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    };

    const fetchUsers = async (existingMemberIds: Set<string>) => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('=== Fetching Friends ===');
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No access token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/connections/connections/friends/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Error response:', errorData);
          throw new Error(errorData?.detail || `Failed to fetch friends: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw friends data:', data);

        if (!Array.isArray(data)) {
          console.error('Invalid data format:', data);
          throw new Error('Invalid response format');
        }

        console.log('Current existing members:', Array.from(existingMemberIds));

        const formattedUsers = data
          .filter((user: any) => {
            const isValid = user?.id;
            if (!isValid) {
              console.warn('Invalid user:', user);
            }
            return isValid;
          })
          .filter((user: any) => {
            const isExistingMember = existingMemberIds.has(String(user.id));
            console.log(`Checking user ${user.id}:`, {
              username: user.username,
              isExistingMember,
              existingMembers: Array.from(existingMemberIds)
            });
            return !isExistingMember;
          })
          .map((user: any) => {
            // Handle avatar URL
            let avatar_url = user.avatar_url || user.avatar || '';
            if (!avatar_url || typeof avatar_url !== 'string' || avatar_url.trim() === '') {
              avatar_url = DEFAULT_AVATAR;
            } else if (avatar_url.startsWith('http')) {
              // Keep full URLs as is
              avatar_url = avatar_url;
            } else if (avatar_url.startsWith('/media')) {
              // Handle paths starting with /media
              avatar_url = `${API_BASE_URL}${avatar_url}`;
            } else {
              // Handle other paths
              avatar_url = `${API_BASE_URL}/media/${avatar_url}`;
            }

            // Ensure we're not using the default avatar path in the URL
            if (avatar_url.includes('profile-default-icon-2048x2045-u3j7s5nj.png')) {
              avatar_url = DEFAULT_AVATAR;
            }

            return {
              id: user.id,
              username: user.username || '',
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              avatar_url,
              is_online: user.is_online || false,
              last_seen: user.last_seen,
              role: user.role,
              mutual_connections: user.mutual_connections,
              personality_tags: user.personality_tags || [],
              bio: user.bio,
              location: user.location,
              interests: user.interests || []
            };
          });

        console.log('Final formatted users:', formattedUsers);
        setUsers(formattedUsers);
      } catch (err) {
        console.error('Error in fetchUsers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch friends');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const handleAddMember = async (userId: string) => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No access token found');
        }

        // Get conversation details first
        console.log('Fetching conversation details for ID:', conversationId);
        const conversationResponse = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!conversationResponse.ok) {
          const errorData = await conversationResponse.json().catch(() => null);
          console.error('Failed to fetch conversation details:', {
            status: conversationResponse.status,
            statusText: conversationResponse.statusText,
            errorData
          });
          throw new Error('Failed to fetch conversation details');
        }

        const conversationData = await conversationResponse.json();
        console.log('Conversation details:', {
          id: conversationData.id,
          type: conversationData.type,
          name: conversationData.name,
          members_count: conversationData.members_count,
          group_id: conversationData.group_id
        });

        if (conversationData.type !== 'group') {
          console.error('Invalid conversation type:', conversationData.type);
          throw new Error('Can only add members to group chats');
        }

        if (!conversationData.group_id) {
          console.error('Missing group_id for group conversation');
          throw new Error('Invalid group conversation');
        }

        console.log('Attempting to add member:', {
          userId,
          conversationId,
          groupId: conversationData.group_id
        });

        const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/add_member/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            group_id: conversationData.group_id
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Add member response error:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          throw new Error(errorData?.detail || `Failed to add member: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Successfully added member:', responseData);

        // Update the groupMembers state with the new member
        if (selectedConversation?.group?.id) {
          const groupId = selectedConversation.group.id;
          const newMember = {
            id: userId,
            name: responseData.user.first_name + ' ' + responseData.user.last_name,
            avatarUrl: responseData.user.avatar || DEFAULT_AVATAR,
            role: responseData.role || 'member',
            isOnline: responseData.user.is_online || false
          };

          setGroupMembers(prev => {
            const currentMembers = prev[groupId] || [];
            return {
              ...prev,
              [groupId]: [...currentMembers, newMember]
            };
          });

          // Update the selectedConversation state to reflect the new member count
          setSelectedConversation(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              group: {
                ...prev.group,
                members: (prev.group?.members || 0) + 1
              }
            };
          });
        }

        onMembersAdded();
        onClose();
      } catch (err) {
        console.error('Error adding member:', err);
        setError(err instanceof Error ? err.message : 'Failed to add member');
      }
    };

    const handleUserSelect = (user: User) => {
      setSelectedUser(prev => prev === user.id ? null : user.id);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className={`relative w-[500px] max-h-[80vh] ${isDarkMode ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-xl`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
              Add Members
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card-hover transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-border">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-dark-card-hover border-gray-700 text-dark-text placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                disabled={isCreating}
              />
              <MagnifyingGlassIcon className={`absolute left-3 top-2.5 w-5 h-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
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
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors ${
                    selectedUser === user.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                  onClick={() => !isCreating && handleUserSelect(user)}
                >
                  <div className="relative mr-3">
                    <img
                      src={user.avatar_url || DEFAULT_AVATAR}
                      alt={
                        (user.first_name && user.last_name)
                          ? `${user.first_name} ${user.last_name}`
                          : user.username || 'User'
                      }
                      className="w-12 h-12 rounded-full"
                      onError={e => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    />
                    {user.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-200">
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : user.username || 'User'}
                    </div>
                    {user.bio && (
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {user.bio}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <input
                      type="radio"
                      checked={selectedUser === user.id}
                      onChange={() => !isCreating && handleUserSelect(user)}
                      className={`w-5 h-5 border-2 ${
                        isDarkMode
                          ? 'border-gray-600 bg-dark-card-hover checked:bg-purple-600 checked:border-purple-600'
                          : 'border-gray-300 bg-white checked:bg-purple-600 checked:border-purple-600'
                      } focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-card transition-colors`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedUser ? '1 member selected' : 'No member selected'}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-dark-card-hover text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedUser) {
                      handleAddMember(selectedUser);
                    }
                  }}
                  disabled={!selectedUser || isCreating}
                  className={`px-4 py-2 rounded-lg ${
                    !selectedUser || isCreating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } transition-colors`}
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add state for AddMembersModal
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);

  // ... existing code ...
  interface DeleteGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    groupName: string;
  }

  const DeleteGroupModal: FC<DeleteGroupModalProps> = ({ isOpen, onClose, onConfirm, groupName }) => {
    const { isDarkMode } = useTheme();

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className={`relative w-[400px] ${isDarkMode ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <TrashIcon className="w-6 h-6 text-red-500" />
            </div>
          </div>
          
          <h2 className={`text-xl font-semibold mb-2 text-center ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
            Warning: Delete Group
          </h2>
          
          <div className={`mb-6 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p className="text-center">
              You are about to delete the group <span className="font-medium">{groupName}</span>
            </p>
            
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} border ${isDarkMode ? 'border-red-800' : 'border-red-200'}`}>
              <h3 className="font-medium text-red-500 mb-2">This action cannot be undone and will:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Permanently delete all group messages</li>
                <li>Remove all shared media and files</li>
                <li>Remove all group members</li>
                <li>Delete group settings and permissions</li>
                <li>Clear all group chat history</li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ... existing code ...

  // Update the delete group button click handler
  <button 
    onClick={() => setShowDeleteGroupModal(true)}
    className={`w-full py-3 ${isDarkMode ? 'bg-red-900/50 hover:bg-red-900/70 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'} rounded-lg transition-colors flex items-center justify-center gap-2`}
  >
    <TrashIcon className="w-5 h-5" />
    Delete Group
  </button>

  // ... existing code ...

  // Add the DeleteGroupModal to the render section
  {showDeleteGroupModal && selectedConversation?.group && (
    <DeleteGroupModal
      isOpen={showDeleteGroupModal}
      onClose={() => setShowDeleteGroupModal(false)}
      onConfirm={() => {
        handleDeleteGroup(selectedConversation.group.id);
        setShowDeleteGroupModal(false);
      }}
      groupName={selectedConversation.group.name}
    />
  )}
  // ... existing code ...

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return null;
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
    if (fileType.includes('zip') || fileType.includes('archive')) return '🗜️';
    return '📎';
  };

  // Add ImageLightbox component
  const ImageLightbox = () => {
    if (!selectedImage) return null;

    const mediaAttachments = currentMessages
      .filter(message => message.attachments && message.attachments.length > 0)
      .flatMap(message => message.attachments || [])
      .filter((attachment): attachment is NonNullable<typeof attachment> => 
        attachment !== undefined && 
        (attachment.type === 'image' || attachment.type?.startsWith('image/'))
      );

    const handlePrevious = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedImage.index > 0) {
        const prevAttachment = mediaAttachments[selectedImage.index - 1];
        setSelectedImage({
          url: prevAttachment.url,
          fileName: prevAttachment.fileName || 'Image',
          index: selectedImage.index - 1
        });
        setIsZoomed(false);
      }
    };

    const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedImage.index < mediaAttachments.length - 1) {
        const nextAttachment = mediaAttachments[selectedImage.index + 1];
        setSelectedImage({
          url: nextAttachment.url,
          fileName: nextAttachment.fileName || 'Image',
          index: selectedImage.index + 1
        });
        setIsZoomed(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
        setIsZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrevious(e as any);
      } else if (e.key === 'ArrowRight') {
        handleNext(e as any);
      }
    };

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage]);

    return (
      <div 
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
        onClick={() => {
          setSelectedImage(null);
          setIsZoomed(false);
        }}
      >
        {/* Navigation Arrows */}
        {selectedImage.index > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            onClick={handlePrevious}
          >
            <ChevronLeftIcon className="w-8 h-8" />
          </button>
        )}
        {selectedImage.index < mediaAttachments.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            onClick={handleNext}
          >
            <ChevronRightIcon className="w-8 h-8" />
          </button>
        )}

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white/80 text-sm">
            {selectedImage.fileName}
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-white/80 hover:text-white bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-white/80 hover:text-white bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                window.open(selectedImage.url, '_blank');
              }}
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-white/80 hover:text-white bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
                setIsZoomed(false);
              }}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Image */}
        <div className="relative max-w-[90vw] max-h-[90vh]">
          <img
            src={selectedImage.url}
            alt={selectedImage.fileName}
            className={`max-w-full max-h-[90vh] object-contain transition-transform duration-200 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
          />
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent">
          <div className="text-white/80 text-sm">
            {selectedImage.index + 1} / {mediaAttachments.length}
          </div>
        </div>
      </div>
    );
  };

  // Add these utility functions at the top level
  const formatTimestamp = (timestamp: string | number | undefined) => {
    if (!timestamp) return 'Invalid date';
    
    try {
      // Convert to milliseconds if it's in seconds
      const timestampMs = typeof timestamp === 'number' && timestamp < 10000000000 
        ? timestamp * 1000 
        : timestamp;
      
      const date = new Date(timestampMs);
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return 'Invalid date';
      }
      
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  };

  const getFullUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:')) return path;
    
    // Clean the path
    let cleanPath = path;
    // Remove any duplicate media/ prefixes
    cleanPath = cleanPath.replace(/^\/media\/media\//, '/media/');
    // Remove any leading slashes
    cleanPath = cleanPath.replace(/^\/+/, '');
    // Remove any duplicate media/ in the middle of the path
    cleanPath = cleanPath.replace(/\/media\/media\//, '/media/');
    
    // Construct the full URL
    const fullUrl = `${API_BASE_URL}/media/${cleanPath}`;
    console.log('[MessengerUI] Path processing:', {
      originalPath: path,
      cleanedPath: cleanPath,
      fullUrl: fullUrl
    });
    return fullUrl;
  };

  // Add function to fetch a specific message
  const fetchSpecificMessage = async (conversationId: string, messageId: string): Promise<Message | null> => {
    try {
      // First check if we already have the message in our state
      const existingMessages = conversationMessages[conversationId] || [];
      const existingMessage = existingMessages.find(msg => msg.id === messageId);
      if (existingMessage) {
        return existingMessage;
      }

      // If not in state, fetch all messages for the conversation
      const response = await api.get(API_ENDPOINTS.messages(conversationId));
      const messages = response.data;
      
      // Find the specific message
      const message = messages.find((msg: any) => msg.id === messageId);
      if (!message) {
        console.error('Message not found in conversation');
        return null;
      }

      // Transform the message to match our Message interface
      const transformedMessage = {
        ...message,
        sender: {
          id: message.sender.id,
          name: `${message.sender.first_name} ${message.sender.last_name}`.trim() || message.sender.username,
          avatarUrl: message.sender.avatar || DEFAULT_AVATAR,
          role: message.sender.role
        },
        timestamp: message.created_at,
        status: message.status || 'sent',
        isOwn: message.sender.id === user?.id
      };

      // Update the conversation messages state
      setConversationMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), transformedMessage]
      }));

      return transformedMessage;
    } catch (error) {
      console.error('Error fetching specific message:', error);
      return null;
    }
  };

  const ReplyPreview: FC<{
    message: Message;
    onCancel: () => void;
    isDarkMode: boolean;
  }> = ({ message, onCancel, isDarkMode }) => {
    return (
      <div className={`flex items-start space-x-2 p-2 rounded-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Replying to {message.sender.name}
            </span>
            <button
              onClick={onCancel}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className={`text-sm truncate ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {message.content}
          </p>
        </div>
      </div>
    );
  };

  // Add online status change listener
  useEffect(() => {
    const handleOnlineStatusChange = (event: CustomEvent) => {
      const { user_id, username, online_status, is_online, last_active } = event.detail;
      
      console.log('[MessengerUI] Online status change received:', {
        user_id,
        username,
        online_status,
        is_online,
        last_active
      });

      // Update conversations list with new online status
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.type === 'direct' && conv.user?.id === user_id) {
            return {
              ...conv,
              user: {
                ...conv.user,
                isOnline: is_online,
                status: online_status
              }
            };
          }
          return conv;
        })
      );

      // Update selected conversation if it's the same user
      if (selectedConversation?.type === 'direct' && selectedConversation?.user?.id === user_id) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          user: {
            ...prev.user!,
            isOnline: is_online,
            status: online_status
          }
        } : prev);
      }

      // Update group members if the user is in the current group
      if (selectedConversation?.type === 'group' && groupMembers[selectedConversation.group.id]) {
        setGroupMembers(prev => ({
          ...prev,
          [selectedConversation.group.id]: prev[selectedConversation.group.id].map(member => 
            member.id === user_id 
              ? { ...member, isOnline: is_online }
              : member
          )
        }));
      }
    };

    window.addEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);
    
    return () => {
      window.removeEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);
    };
  }, [selectedConversation, groupMembers]);

  // Add periodic online status refresh
  useEffect(() => {
    const refreshOnlineStatus = async () => {
      if (!activeConversation || !selectedConversation) return;
      
      try {
        // Refresh conversations to get updated online status
        const response = await api.get(API_ENDPOINTS.conversations);
        const allConversations = response.data;
        
        // Update conversations with fresh data
        const transformedConversations = allConversations.map(conv => {
          // ... existing transformation logic
          const currentUserUnreadCount = conv.members?.find(m => m.user?.id === user?.id)?.unread_count || 0;
          
          return {
            id: conv.id,
            type: conv.type,
            name: conv.type === 'direct' ? 
              getDisplayName(conv.participant1?.id === user?.id ? conv.participant2 : conv.participant1) :
              (conv.name || 'Unknown Group'),
            lastMessage: conv.last_message ? {
              content: conv.last_message.content,
              timestamp: conv.last_message.timestamp,
              sender: conv.last_message.sender
            } : null,
            unreadCount: currentUserUnreadCount,
            user: conv.type === 'direct' ? {
              id: conv.participant1?.id === user?.id ? conv.participant2?.id : conv.participant1?.id,
              name: getDisplayName(conv.participant1?.id === user?.id ? conv.participant2 : conv.participant1),
              avatarUrl: getAvatarUrl(conv.participant1?.id === user?.id ? conv.participant2 : conv.participant1),
              isOnline: (conv.participant1?.id === user?.id ? conv.participant2?.is_online : conv.participant1?.is_online) || false,
              status: (conv.participant1?.id === user?.id ? conv.participant2?.online_status : conv.participant1?.online_status) || 'offline',
              bio: conv.participant1?.id === user?.id ? conv.participant2?.bio : conv.participant1?.bio || '',
              personality_tags: conv.participant1?.id === user?.id ? conv.participant2?.personality_tags : conv.participant1?.personality_tags || []
            } : null,
            group: conv.type === 'group' ? {
              id: conv.group?.id || null,
              name: conv.name || 'Unknown Group',
              acronym: conv.acronym || '',
              color: conv.color || '#6366f1',
              members: conv.members?.length || 0,
              isActive: true,
              description: conv.description || '',
              avatarUrl: getAvatarUrl(conv.group)
            } : null,
            group_id: conv.group?.id || null,
            members: conv.members || []
          };
        });
        
        setConversations(transformedConversations);
      } catch (error) {
        console.error('[MessengerUI] Error refreshing online status:', error);
      }
    };

    // Refresh every 30 seconds
    const interval = setInterval(refreshOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, [activeConversation, selectedConversation, user]);

  // Add fetchGroupMembers function
  const fetchGroupMembers = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/members/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch group members');
      }
      const data = await response.json();
      // Map to GroupMemberData format
      const members = data.map((member: any) => ({
        id: member.user.id,
        name: `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim() || member.user.username,
        avatarUrl: member.user.avatar || DEFAULT_AVATAR,
        role: member.role || 'member',
        isOnline: member.user.is_online || false,
      }));
      setGroupMembers(prev => ({ ...prev, [conversationId]: members }));
    } catch (error) {
      console.error('Error fetching group members:', error);
      setGroupMembers(prev => ({ ...prev, [conversationId]: [] }));
    }
  };

  return (
    <div className="w-full h-[calc(100vh-8rem)] max-w-[1600px] mx-auto mt-16 sticky top-16">
      {/* Mobile Header - Only visible on mobile */}
      {isMobileView && activeConversation && (
        <div className={`sticky top-0 z-50 h-16 px-4 border-b ${isDarkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} flex items-center justify-between`}>
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            {selectedConversation && (
              <>
                {selectedConversation.user ? (
                  <>
                    <img
                      src={selectedConversation.user.avatarUrl || DEFAULT_AVATAR}
                      alt={selectedConversation.user.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-500"
                    />
                    <div>
                      <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                        {selectedConversation.user.name || 'Unknown User'}
                      </h2>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedConversation.user.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={selectedConversation.group.avatarUrl || DEFAULT_GROUP_AVATAR}
                      alt={selectedConversation.group.name || 'Group'}
                      className="w-8 h-8 rounded-lg object-cover border-2 border-purple-500"
                    />
                    <div>
                      <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>{selectedConversation.group.name}</h2>
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{groupMembers[selectedConversation.group.id]?.length ?? selectedConversation?.members?.length ?? 0} members</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <button 
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <InformationCircleIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>
      )}

      <div className={`flex h-full ${isDarkMode ? 'bg-dark-bg text-dark-text' : 'bg-gray-100 text-gray-900'} relative`}>
        {/* Mobile Menu Button - Only visible on mobile when no conversation is active */}
        {isMobileView && !activeConversation && (
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="fixed top-4 left-4 z-50 p-2.5 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        )}

        {/* Left Sidebar - Responsive */}
        {showSidebar && (
          <div className={`${
            isMobileView 
              ? 'fixed inset-y-0 left-0 z-40 w-full sm:w-96 transform transition-transform duration-300 ease-in-out shadow-xl' 
              : 'relative w-80 lg:w-96'
          } ${isMobileView ? 'h-full' : 'h-[calc(100vh-8rem)]'}`}>
            <LeftSidebar
              conversations={conversations}
              activeConversation={activeConversation}
              isLoadingConversations={isLoadingConversations}
              conversationsError={conversationsError}
              isDarkMode={isDarkMode}
              onConversationSelect={handleConversationSelect}
              onNewConversation={handleNewConversation}
              onNewGroup={() => setShowCreateGroupModal(true)}
            />
          </div>
        )}

        {/* Main Chat Area - Responsive */}
        <div className={`flex-1 flex flex-col ${
          isMobileView 
            ? 'w-full min-h-0' 
            : 'min-w-0 lg:min-w-[600px] xl:min-w-[800px] max-w-[1200px]'
        }`}>
          {activeConversation ? (
            <div className={`h-full flex flex-col ${isDarkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} border rounded-2xl overflow-hidden shadow-sm`}>
              {/* Chat Header - Desktop only (mobile has its own header) */}
              {!isMobileView && (
                <div className={`sticky top-0 h-16 px-4 lg:px-6 border-b ${isDarkMode ? 'border-dark-border bg-dark-card' : 'border-gray-200 bg-white'} flex items-center justify-between z-10`}>
                <div className="flex items-center space-x-4">
                  {selectedConversation && (
                    <>
                      {selectedConversation.user ? (
                        <>
                          <img
                            src={selectedConversation.user.avatarUrl || DEFAULT_AVATAR}
                            alt={selectedConversation.user.name || 'User'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                                {selectedConversation.user.name || 'Unknown User'}
                              </h2>
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {selectedConversation.user.isOnline ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <img
                            src={selectedConversation.group.avatarUrl || DEFAULT_GROUP_AVATAR}
                            alt={selectedConversation.group.name || 'Group'}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-purple-500"
                          />
                          <div>
                            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>{selectedConversation.group.name}</h2>
                            <div className="flex items-center gap-1 mt-1">
                              <UserGroupIcon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{groupMembers[selectedConversation.group.id]?.length ?? selectedConversation?.members?.length ?? 0} members</p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button className={`p-2.5 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-full transition-colors`}>
                    <PhoneIcon className={`w-5 h-5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                  </button>
                  <button className={`p-2.5 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-full transition-colors`}>
                    <VideoCameraIcon className={`w-5 h-5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                  </button>
                  <button 
                    onClick={() => setShowRightPanel(!showRightPanel)}
                    className={`p-2.5 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-full transition-colors`}
                  >
                    <InformationCircleIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                </div>
              </div>
              )}

              {/* Messages Container - Responsive */}
              <div className={`flex-1 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-dark-card' : 'bg-white'} px-3 sm:px-4 lg:px-6 py-4`}>
                {isLoadingMessages ? (
                  // Loading state
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : messagesError ? (
                  // Error state
                  <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8">
                    <div className={`w-16 h-16 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'} rounded-full flex items-center justify-center mb-4`}>
                      <XCircleIcon className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'} mb-2 text-center`}>
                      Error Loading Messages
                    </h2>
                    <p className={`text-base text-center max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {messagesError}
                    </p>
                    <button
                      onClick={() => {
                        setMessagesError(null);
                        fetchMessages();
                      }}
                      className={`mt-4 px-4 py-2 rounded-lg ${
                        isDarkMode 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      } transition-colors`}
                    >
                      Try Again
                    </button>
                  </div>
                ) : !currentMessages || currentMessages.length === 0 ? (
                  // Empty state when no messages
                  <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8">
                    <div className={`w-24 h-24 ${isDarkMode ? 'bg-dark-card-hover' : 'bg-gray-50'} rounded-full flex items-center justify-center mb-6`}>
                      <ChatBubbleLeftRightIcon className={`w-12 h-12 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    
                    <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'} mb-2 text-center`}>
                      No Messages Yet
                    </h2>
                    
                    <p className={`text-lg text-center max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
                      Start the conversation by sending your first message!
                    </p>
                  </div>
                ) : (
                  // Messages list when there are messages - Responsive
                  <div className="space-y-4">
                    {messageGroups.map((group: MessageGroup, groupIndex: number) => (
                      <div key={`group-${group.date}-${groupIndex}`} className="mb-6">
                        <MessageTimeDivider date={group.date} isDarkMode={isDarkMode} />
                        {group.messages.map((message: Message, messageIndex: number) => (
                          <div
                            key={`msg-${message.id}-${messageIndex}`}
                            className={`group relative flex items-start mb-4 ${
                              message.isOwn ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {/* Message content - Responsive */}
                            <div className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] relative ${
                              message.isOwn ? 'flex-row-reverse space-x-reverse' : ''
                            }`}>
                              {/* Message Actions - Responsive */}
                              <div className={`absolute top-1/2 -translate-y-1/2 ${
                                message.isOwn ? '-left-2' : '-right-2'
                              } flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}>
                                <MessageActions
                                  message={message}
                                  onReply={() => handleReply(message.id)}
                                  onReact={(emoji) => handleReaction(message.id, emoji)}
                                  onMenu={() => setShowMessageActions(message.id)}
                                  isDarkMode={isDarkMode}
                                  onShowEmojiPicker={() => setShowEmojiPicker(true)}
                                  onDelete={() => handleDelete(message.id)}
                                  onInfo={() => {
                                    setSelectedMessageInfo(message);
                                    setShowMessageInfo(true);
                                  }}
                                />
                              </div>
                              {/* Avatar - Responsive */}
                              <img
                                src={message.sender.avatarUrl || DEFAULT_AVATAR}
                                alt={message.sender.name}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                              />
                              {/* Message content and actions - Responsive */}
                              <div className={`flex flex-col space-y-1 relative ${
                                message.isOwn ? 'items-end' : 'items-start'
                              }`}>
                                {/* Reply preview if this is a reply */}
                                {message.replyTo && (
                                  <div className={`flex items-start space-x-2 mb-1.5 ${
                                    message.isOwn ? 'flex-row-reverse space-x-reverse' : ''
                                  }`}>
                                    {/* Vertical line connector */}
                                    <div className={`w-0.5 h-8 rounded-full ${
                                      message.isOwn 
                                        ? 'bg-purple-400 dark:bg-purple-500' 
                                        : 'bg-gray-300 dark:bg-gray-600'
                                    }`} />
                                    {/* Reply content */}
                                    <div className={`flex flex-col space-y-0.5 ${
                                      message.isOwn ? 'items-end' : 'items-start'
                                    }`}>
                                      <span className={`text-xs font-medium ${
                                        message.isOwn 
                                          ? 'text-purple-600 dark:text-purple-400' 
                                          : 'text-gray-600 dark:text-gray-400'
                                      }`}>
                                        {message.replyTo.sender.name}
                                      </span>
                                      <div className={`px-3 py-1.5 rounded-lg text-sm ${
                                        message.isOwn
                                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100'
                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                      }`}>
                                        {message.replyTo.content}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Message content - Responsive */}
                                <div className={`px-3 sm:px-4 py-2 rounded-2xl text-sm sm:text-base ${
                                  message.isOwn
                                    ? isDarkMode
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-purple-600 text-white'
                                    : isDarkMode
                                      ? 'bg-gray-700 text-gray-100'
                                      : 'bg-gray-100 text-gray-900'
                                }`}>
                                  {message.isStory && (
                                    <span className="inline-block mr-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold align-middle">Story</span>
                                  )}
                                  {message.content}
                                </div>
                                
                                {/* Reactions */}
                                {message.reactions && message.reactions.length > 0 && (
                                  <ReactionDisplay
                                    reactions={message.reactions}
                                    onReactionClick={(emoji) => handleReaction(message.id, emoji)}
                                    isDarkMode={isDarkMode}
                                  />
                                )}
                                
                                {/* Thread replies count indicator */}
                                {message.hasThread && message.thread && (
                                  <div className="flex items-center space-x-1 mt-1 cursor-pointer hover:opacity-80 transition-opacity"
                                       onClick={() => handleThreadView(message.id)}>
                                    <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 text-purple-500" />
                                    <span className="text-xs text-purple-500 font-medium">
                                      {message.thread.repliesCount} {message.thread.repliesCount === 1 ? 'reply' : 'replies'}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Attachments - Responsive */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2">
                                    <div className={`grid gap-1 max-w-[280px] sm:max-w-[320px] lg:max-w-[400px] ${
                                      message.attachments.length === 1 ? 'grid-cols-1' :
                                      message.attachments.length === 2 ? 'grid-cols-2' :
                                      message.attachments.length === 3 ? 'grid-cols-2' :
                                      'grid-cols-2'
                                    }`}>
                                      {message.attachments.map((attachment, idx) => (
                                        <div 
                                          key={`att-${message.id}-${attachment.id || idx}-${Date.now()}`}
                                          className={`relative ${
                                            message.attachments?.length === 3 && idx === 0 ? 'row-span-2' : ''
                                          }`}
                                        >
                                          {attachment.type === 'image' || 
                                           attachment.type.startsWith('image/') || 
                                           attachment.type === 'jpeg' || 
                                           attachment.type === 'jpg' || 
                                           attachment.type === 'png' || 
                                           attachment.type === 'gif' ? (
                                            <div className="relative rounded-lg overflow-hidden aspect-square group">
                                              <img
                                                src={attachment.thumbnail || attachment.url}
                                                alt={attachment.fileName || 'Image attachment'}
                                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => handleImageClick(attachment, idx)}
                                                onError={(e) => {
                                                  const img = e.target as HTMLImageElement;
                                                  if (img.src === attachment.thumbnail) {
                                                    img.src = attachment.url;
                                                  } else {
                                                    img.src = DEFAULT_AVATAR;
                                                  }
                                                }}
                                              />
                                              <a
                                                href={attachment.url}
                                                download
                                                className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                              </a>
                                              {message.attachments.length > 4 && idx === 3 && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                  <span className="text-white text-lg font-bold">
                                                    +{message.attachments.length - 4}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ) : attachment.type === 'video' ? (
                                            <div className="relative rounded-lg overflow-hidden aspect-square group">
                                              <video
                                                src={attachment.url}
                                                controls
                                                className="w-full h-full object-cover"
                                                poster={attachment.thumbnail}
                                              />
                                              <a
                                                href={attachment.url}
                                                download
                                                className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                              </a>
                                            </div>
                                          ) : (
                                            <div 
                                              className="relative rounded-lg overflow-hidden bg-gray-50 dark:bg-dark-card-hover p-3 sm:p-4 group cursor-pointer"
                                              onClick={() => setSelectedDocument({
                                                url: attachment.url,
                                                fileName: attachment.fileName || 'Document',
                                                fileType: attachment.type
                                              })}
                                            >
                                              <div className="flex items-center space-x-3">
                                                <div className="text-2xl sm:text-3xl">
                                                  {getFileIcon(attachment.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {attachment.fileName || 'Document'}
                                                  </p>
                                                  {attachment.fileSize && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                      {attachment.fileSize}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Message status and timestamp - Responsive */}
                                <div className="flex items-center space-x-1">
                                  {message.isOwn && <MessageStatusIcon status={message.status} isDarkMode={isDarkMode} />}
                                  <span className={`text-xs ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {formatTimestamp(message.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

             
              {/* Message Input - Responsive */}
              <MessageInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                handleFileSelect={handleFileSelect}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                isDarkMode={isDarkMode}
                replyingTo={replyingTo}
                handleCancelReply={handleCancelReply}
                ALLOWED_FILE_TYPES={ALLOWED_FILE_TYPES}
                handleSendReply={handleSendReply}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                conversationId={activeConversation}
              />
            </div>
          ) : (
            // Show conversations list in responsive mode when there are conversations, otherwise show empty state
            <div className={`h-full ${isDarkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} border rounded-2xl overflow-hidden`}>
              {isMobileView && conversations && conversations.length > 0 ? (
                // Show conversations list in mobile when there are conversations
                <div className="h-full flex flex-col">
                  <div className={`sticky top-0 h-16 px-4 border-b ${isDarkMode ? 'border-dark-border bg-dark-card' : 'border-gray-200 bg-white'} flex items-center justify-between z-10`}>
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                      Conversations
                    </h2>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <LeftSidebar
                      conversations={conversations}
                      activeConversation={activeConversation}
                      isLoadingConversations={isLoadingConversations}
                      conversationsError={conversationsError}
                      isDarkMode={isDarkMode}
                      onConversationSelect={handleConversationSelect}
                      onNewConversation={handleNewConversation}
                      onNewGroup={() => setShowCreateGroupModal(true)}
                    />
                  </div>
                </div>
              ) : (
                // Show empty state when no conversations or not mobile
                <EmptyState onNewConversation={handleNewConversation} onCreateGroup={handleCreateGroup} />
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Responsive */}
        {activeConversation && showRightPanel && (
          <div className={`${
            isMobileView 
              ? 'fixed inset-y-0 right-0 z-40 w-full sm:w-[400px] transform transition-transform duration-300 ease-in-out shadow-xl' 
              : 'relative w-[350px] lg:w-[400px]'
          } ${isMobileView ? 'h-full' : 'h-[calc(100vh-8rem)]'}`}>
            <RightSidebar
              selectedConversation={selectedConversation}
              isDarkMode={isDarkMode}
              currentMessages={currentMessages}
              groupMembers={groupMembers}
              user={user}
              onImageClick={handleImageClick}
              onDeleteConversation={handleDeleteConversation}
              setSelectedConversation={setSelectedConversation}
              onDeleteGroup={handleDeleteGroup}
              setGroupMembers={setGroupMembers}
              fetchGroupMembers={fetchGroupMembers}
              setConversations={setConversations}
              setActiveConversation={setActiveConversation}
            />
          </div>
        )}

        {/* Mobile Overlay */}
        {isMobileView && (showSidebar || showRightPanel) && (
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => {
              setShowSidebar(false);
              setShowRightPanel(false);
            }}
          />
        )}

        {/* Add the lightbox component */}
        <ImageLightbox />

        <DeleteConversationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConversation}
          conversationName={selectedConversation?.type === 'direct' ? selectedConversation?.user?.name || 'Unknown User' : selectedConversation?.group?.name || 'Unknown Group'}
          conversationType={selectedConversation?.type || 'direct'}
        />

        {selectedMessageInfo && (
          <MessageInfoModal
            isOpen={showMessageInfo}
            onClose={() => {
              setShowMessageInfo(false);
              setSelectedMessageInfo(null);
            }}
            message={selectedMessageInfo}
            isDarkMode={isDarkMode}
          />
        )}
        
        <ForwardMessageModal
          isOpen={showForwardModal}
          onClose={() => setShowForwardModal(false)}
          onForward={handleForwardToFriends}
          isDarkMode={isDarkMode}
        />
        
        {/* Thread View */}
        {showThreadView && activeThread && (
          <ThreadView
            thread={activeThread}
            onClose={() => {
              setActiveThread(null);
              setShowThreadView(false);
            }}
            onSendReply={handleSendThreadReply}
            onReaction={handleReaction}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Add Members Modal */}
        {showAddMembersModal && selectedConversation && (
          <AddMembersModal
            isOpen={showAddMembersModal}
            onClose={() => setShowAddMembersModal(false)}
            groupId={selectedConversation.group?.id || ''}
            conversationId={selectedConversation.id}
            onMembersAdded={() => {
              if (selectedConversation.group?.id) {
                fetchGroupMembers(selectedConversation.group.id);
              }
            }}
          />
        )}

        {showLeaveGroupModal && selectedConversation?.group && (
          <LeaveGroupModal
            isOpen={showLeaveGroupModal}
            onClose={() => setShowLeaveGroupModal(false)}
            onConfirm={() => {
              handleLeaveGroup(selectedConversation.id);
              setShowLeaveGroupModal(false);
            }}
            groupName={selectedConversation.group.name}
          />
        )}
        {showDeleteGroupModal && selectedConversation?.group && (
          <DeleteGroupModal
            isOpen={showDeleteGroupModal}
            onClose={() => setShowDeleteGroupModal(false)}
            onConfirm={() => {
              handleDeleteGroup(selectedConversation.group.id);
              setShowDeleteGroupModal(false);
            }}
            groupName={selectedConversation.group.name}
          />
        )}

        {showCreateGroupModal && (
          <CreateGroupModal
            isOpen={showCreateGroupModal}
            onClose={() => setShowCreateGroupModal(false)}
            onCreate={handleCreateGroup}
          />
        )}
      </div>
      <DocumentPreviewModal />
    </div>
  );
};

export default MessengerUI; 
