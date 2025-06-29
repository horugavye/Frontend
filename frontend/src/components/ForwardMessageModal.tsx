import React, { FC, useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Conversation } from '../types/messenger';
import api from '../utils/api';

// Update API_BASE_URL to use local development URL
const API_BASE_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = '/default-avatar.png';

interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  status: 'online' | 'offline' | 'away' | 'busy';
  type: 'user';
}

interface Group {
  id: string;
  name: string;
  avatarUrl: string;
  memberCount: number;
  type: 'group';
}

type ForwardableItem = User | Group;

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForward: (conversationIds: string[]) => Promise<void>;
  isDarkMode: boolean;
}

const ForwardMessageModal: FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  onForward,
  isDarkMode
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/chat/conversations/');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.name.toLowerCase().includes(searchLower) ||
      conv.user?.name.toLowerCase().includes(searchLower) ||
      conv.group?.name.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (conversationId: string) => {
    setSelectedConversations(prev =>
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleForward = async () => {
    if (selectedConversations.length === 0) return;
    try {
      await onForward(selectedConversations);
      onClose();
    } catch (error) {
      console.error('Error forwarding message:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
      
      {/* Modal */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl shadow-2xl z-50 ${
          isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Forward Message
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-opacity-10 ${
              isDarkMode ? 'hover:bg-white text-white' : 'hover:bg-gray-900 text-gray-900'
            }`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
          <MagnifyingGlassIcon
            className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
        </div>

        {/* Conversations List */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No conversations found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    isDarkMode
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.user?.avatarUrl || conv.group?.avatarUrl || 'https://ui-avatars.com/api/?background=random'}
                      alt={conv.name}
                      className="w-10 h-10 rounded-full border-2 border-purple-400"
                    />
                    {selectedConversations.includes(conv.id) && (
                      <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
                        <CheckIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {conv.name}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {conv.type === 'direct' ? 'Direct Message' : `${conv.group?.members || 0} members`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleForward}
            disabled={selectedConversations.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedConversations.length > 0
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : isDarkMode
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Forward ({selectedConversations.length})
          </button>
        </div>
      </div>
    </>
  );
};

export default ForwardMessageModal; 