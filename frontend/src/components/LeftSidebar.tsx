import { FC, useState } from 'react';
import { 
  PlusCircleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import NewConversationModal from './modals/NewConversationModal';
import { API_BASE_URL } from '../config/api';

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  lastMessage: {
    content: string;
    timestamp: string;
    sender: {
      id: string;
      name: string;
    };
  } | null;
  unreadCount: number;
  user: {
    id: string;
    name: string;
    avatarUrl: string;
    isOnline: boolean;
    status: 'online' | 'offline' | 'away' | 'busy';
    bio?: string;
    personality_tags?: Array<{
      name: string;
      color: string;
    }>;
  } | null;
  group: {
    id: string;
    name: string;
    acronym: string;
    color: string;
    members: number;
    isActive: boolean;
    description?: string;
    avatarUrl: string;
  } | null;
  group_id?: string;
}

interface LeftSidebarProps {
  conversations: Conversation[];
  activeConversation: string | null;
  isLoadingConversations: boolean;
  conversationsError: string | null;
  isDarkMode: boolean;
  onConversationSelect: (conversation: Conversation) => void;
  onNewConversation: (user: { id: string; name: string; avatarUrl: string }) => void;
  onNewGroup: () => void;
}

const DEFAULT_AVATAR = 'https://via.placeholder.com/150';
const DEFAULT_GROUP_AVATAR = `${API_BASE_URL}/media/avatars/group.png`;

const LeftSidebar: FC<LeftSidebarProps> = ({
  conversations,
  activeConversation,
  isLoadingConversations,
  conversationsError,
  isDarkMode,
  onConversationSelect,
  onNewConversation,
  onNewGroup,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // Within a week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conversation => 
    conversation.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    (conversation.lastMessage?.content && conversation.lastMessage.content.toLowerCase().includes(searchInput.toLowerCase()))
  );

  const handleNewConversation = (user: { id: string; name: string; avatarUrl: string }) => {
    onNewConversation(user);
    setShowNewConversationModal(false);
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} border rounded-2xl overflow-hidden`}>
      {/* Header */}
      <div className={`sticky top-0 p-8 border-b ${isDarkMode ? 'border-dark-border' : 'border-gray-200'} bg-inherit z-10`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'} tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent`}>Messages</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowNewConversationModal(true)}
              className={`p-3.5 ${isDarkMode ? 'bg-dark-card-hover hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md`}
            >
              <PlusCircleIcon className="w-6 h-6 text-purple-600" />
            </button>
            <button 
              onClick={onNewGroup}
              className={`p-3.5 ${isDarkMode ? 'bg-dark-card-hover hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md`}
            >
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-8 relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`w-full pl-14 pr-6 py-3.5 rounded-full ${
              isDarkMode 
                ? 'bg-dark-card-hover text-dark-text placeholder-gray-500' 
                : 'bg-gray-50 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-sm`}
          />
          <MagnifyingGlassIcon className={`absolute left-5 top-4 w-5 h-5 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Direct Messages Section */}
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase`}>
              Direct Messages
            </h3>
            <span className={`text-xs px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-dark-card-hover text-gray-400' : 'bg-gray-100 text-gray-600'} font-medium`}>
              {conversations.filter(c => c.type === 'direct').length}
            </span>
          </div>
          
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : conversationsError ? (
            <div className="text-center py-8 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">{conversationsError}</div>
          ) : filteredConversations.filter(conversation => conversation.type === 'direct').length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-gray-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No direct messages yet
              </p>
              <button 
                onClick={() => setShowNewConversationModal(true)}
                className="mt-4 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors duration-200"
              >
                Start a new conversation
              </button>
            </div>
          ) : (
            filteredConversations
              .filter(conversation => conversation.type === 'direct')
              .map((conversation) => (
                <div
                  key={`direct-${conversation.id}`}
                  className={`p-4 cursor-pointer transition-all duration-200 rounded-xl ${
                    activeConversation === conversation.id 
                      ? isDarkMode 
                        ? 'bg-dark-card-hover shadow-lg shadow-purple-500/10' 
                        : 'bg-gray-50 shadow-lg shadow-purple-500/5'
                      : isDarkMode 
                        ? 'hover:bg-dark-card-hover/50' 
                        : 'hover:bg-gray-50/50'
                  }`}
                  onClick={() => onConversationSelect(conversation)}
                >
                  <div className="flex items-center space-x-5">
                    <div className="relative">
                      {conversation.user && (
                        <img
                          src={conversation.user.avatarUrl || DEFAULT_AVATAR}
                          alt={conversation.user.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-500/20"
                        />
                      )}
                      {conversation.user?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-sm font-semibold truncate ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                            {conversation.user?.name || 'Unknown'}
                          </h3>
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatTimestamp(conversation.lastMessage?.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className={`text-xs truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-full font-medium shadow-sm">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Group Chats Section */}
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase`}>
              Group Chats
            </h3>
            <span className={`text-xs px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-dark-card-hover text-gray-400' : 'bg-gray-100 text-gray-600'} font-medium`}>
              {conversations.filter(c => c.type === 'group').length}
            </span>
          </div>
          
          {filteredConversations.filter(c => c.type === 'group').length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-gray-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No group chats yet
              </p>
              <button 
                onClick={onNewGroup}
                className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
              >
                Create a new group
              </button>
            </div>
          ) : (
            filteredConversations
              .filter(conversation => conversation.type === 'group')
              .map((conversation) => (
                <div
                  key={`group-${conversation.id}`}
                  className={`p-4 cursor-pointer transition-all duration-200 rounded-xl ${
                    activeConversation === conversation.id 
                      ? isDarkMode 
                        ? 'bg-dark-card-hover shadow-lg shadow-blue-500/10' 
                        : 'bg-gray-50 shadow-lg shadow-blue-500/5'
                      : isDarkMode 
                        ? 'hover:bg-dark-card-hover/50' 
                        : 'hover:bg-gray-50/50'
                  }`}
                  onClick={() => onConversationSelect(conversation)}
                >
                  <div className="flex items-center space-x-5">
                    <div className="relative">
                      {conversation.group && (
                        <img
                          src={conversation.group.avatarUrl || DEFAULT_GROUP_AVATAR}
                          alt={conversation.group.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/20"
                        />
                      )}
                      {conversation.group?.isActive && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-semibold truncate ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                          {conversation.group?.name || 'Unknown Group'}
                        </h3>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatTimestamp(conversation.lastMessage?.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className={`text-xs truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-full font-medium shadow-sm">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onNewConversation={handleNewConversation}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default LeftSidebar; 