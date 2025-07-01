import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { User } from '../types/messenger';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  conversationId: string;
  onMembersAdded?: () => void;
}

interface FriendUser extends User {
  avatar: string;
  is_online: boolean;
}

const AddMembersModal: React.FC<AddMembersModalProps> = ({
  isOpen,
  onClose,
  groupId,
  conversationId,
  onMembersAdded
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<FriendUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<FriendUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [groupMembers, setGroupMembers] = useState<FriendUser[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (isOpen) {
      fetchGroupMembers();
      fetchUsers();
    }
  }, [isOpen]);

  const fetchGroupMembers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/conversations/${conversationId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.data && Array.isArray(response.data.members)) {
        const members = response.data.members.map((member: any) => ({
          ...member.user,
          id: String(member.user.id)
        }));
        console.log('Current group members:', members.map((member: FriendUser) => ({ 
          id: member.id, 
          name: `${member.first_name} ${member.last_name}` 
        })));
        setGroupMembers(members);
      } else {
        console.log('No members found in response:', response.data);
        setGroupMembers([]);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      setGroupMembers([]);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/connections/connections/friends/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      // Ensure all friend IDs are strings
      const friends = response.data.map((friend: FriendUser) => ({
        ...friend,
        id: String(friend.id)
      }));
      
      console.log('All friends:', friends.map((friend: FriendUser) => ({ 
        id: friend.id, 
        name: `${friend.first_name} ${friend.last_name}` 
      })));
      
      // Filter out users who are already group members
      const filteredUsers = friends.filter((friend: FriendUser) => {
        const isAlreadyMember = groupMembers.some(member => member.id === friend.id);
        console.log(`Checking friend ${friend.first_name} ${friend.last_name} (ID: ${friend.id}):`, 
          isAlreadyMember ? 'Already in group' : 'Can be added');
        return !isAlreadyMember;
      });
      
      console.log('Filtered friends (available to add):', 
        filteredUsers.map((friend: FriendUser) => ({ id: friend.id, name: `${friend.first_name} ${friend.last_name}` })));
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to fetch friends. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user: FriendUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one member to add');
      return;
    }

    try {
      setIsCreating(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations/${conversationId}/add_members/`,
        {
          member_ids: selectedUsers.map(user => user.id)
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        toast.success('Members added successfully');
        // Refresh both group members and friends list
        await fetchGroupMembers();
        await fetchUsers();
        // Clear selected users
        setSelectedUsers([]);
        onMembersAdded && onMembersAdded();
        onClose();
      }
    } catch (error: any) {
      console.error('Error adding members:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to add members. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div 
        ref={modalRef}
        className={`relative w-[500px] max-h-[90vh] ${isDarkMode ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
              Add Members
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Add new members to the group
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

          {/* Member Search */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
              Search Members
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
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors`}
                      onClick={() => !isCreating && handleUserSelect(user)}
                    >
                      <div className="relative flex-shrink-0 mr-3">
                        <img
                          src={user.avatar || user.avatar_url || '/default.jpg'}
                          alt={
                            (user.first_name && user.last_name)
                              ? `${user.first_name} ${user.last_name}`
                              : user.username || 'User'
                          }
                          className="w-10 h-10 rounded-full"
                          onError={e => { (e.target as HTMLImageElement).src = '/default.jpg'; }}
                        />
                        {user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isDarkMode ? 'text-dark-text' : 'text-gray-900'
                        }`}>
                          {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : user.username || 'User'}
                        </p>
                        <p className={`text-xs truncate ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {user.username}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedUsers.some(member => member.id === user.id)
                            ? 'border-purple-500 bg-purple-500'
                            : isDarkMode
                              ? 'border-gray-600'
                              : 'border-gray-300'
                        }`}>
                          {selectedUsers.some(member => member.id === user.id) && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 dark:border-dark-border flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedUsers.length > 0 ? `${selectedUsers.length} members selected` : 'No members selected'}
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
              onClick={handleAddMembers}
              disabled={isCreating || selectedUsers.length === 0}
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
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Members</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMembersModal; 