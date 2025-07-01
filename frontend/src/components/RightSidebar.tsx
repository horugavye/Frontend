import { FC, useState, useRef, useEffect } from 'react';
import { 
  PhoneIcon,
  VideoCameraIcon,
  UserIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
  LinkIcon,
  EllipsisHorizontalIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';
import { Message, GroupMemberData } from '../types/messenger';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import DeleteGroupModal from './modals/DeleteGroupModal';
import UpdateGroupModal from './modals/UpdateGroupModal';
import AddMembersModal from './AddMembersModal';
import { useNavigate } from 'react-router-dom';

interface RightSidebarProps {
  selectedConversation: any;
  isDarkMode: boolean;
  currentMessages: Message[];
  groupMembers: { [key: string]: GroupMemberData[] };
  user: any;
  onImageClick: (attachment: any, index: number) => void;
  onDeleteConversation: () => void;
  setSelectedConversation: React.Dispatch<React.SetStateAction<any>>;
  onDeleteGroup: (groupId: string) => void;
  setGroupMembers?: any;
  fetchGroupMembers?: (groupId: string) => Promise<void>;
  setConversations: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveConversation: React.Dispatch<React.SetStateAction<any>>;
}

const RightSidebar: FC<RightSidebarProps> = ({
  selectedConversation,
  isDarkMode,
  currentMessages,
  groupMembers,
  user,
  onImageClick,
  onDeleteConversation,
  setSelectedConversation,
  onDeleteGroup,
  setGroupMembers,
  fetchGroupMembers,
  setConversations,
  setActiveConversation,
}) => {
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-4 text-gray-500">Loading user...</span>
      </div>
    );
  }

  const { isDarkMode: themeIsDark } = useTheme();
  const [selectedMemberMenu, setSelectedMemberMenu] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showUpdateGroupModal, setShowUpdateGroupModal] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedMemberMenu) return;
    function handleClickOutside(event: MouseEvent) {
      // If menu is open and click is outside the menu and not on the ... button, close it
      const target = event.target as HTMLElement;
      // Check if click is inside the menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        // Check if click is on any of the ... buttons
        if (!target.closest('.member-menu-trigger')) {
          setSelectedMemberMenu(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedMemberMenu]);

  const getMediaAttachments = () => {
    const getFullUrl = (path: string | null | undefined): string => {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      if (path.startsWith('data:')) return path;
      let cleanPath = path;
      cleanPath = cleanPath.replace(/^\/media\/media\//, '/media/');
      cleanPath = cleanPath.replace(/^\/+/, '');
      cleanPath = cleanPath.replace(/\/media\/media\//, '/media/');
      return `${import.meta.env.VITE_API_URL}/media/${cleanPath}`;
    };

    // Type guard for file object
    type FileType = {
      id: string;
      file?: string;
      file_name?: string;
      file_type?: string;
      file_size?: number;
      category?: string;
      thumbnail?: string;
      created_at?: string;
      uploaded_by?: string;
      url?: string;
      type?: string;
      fileName?: string;
      fileSize?: number;
      duration?: number;
      thumbnail_url?: string;
    };

    const isImageFile = (file: FileType) => {
      const fileType = file.file_type || file.type || '';
      const fileName = file.file_name || file.fileName || '';
      const category = file.category;
      if (category === 'image') return true;
      if (fileType.startsWith('image/')) return true;
      if (fileType === 'image') return true;
      const extension = fileName.split('.').pop()?.toLowerCase();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif'];
      if (extension && imageExtensions.includes(extension)) return true;
      return false;
    };
    const isVideoFile = (file: FileType) => {
      const fileType = file.file_type || file.type || '';
      const fileName = file.file_name || file.fileName || '';
      const category = file.category;
      if (category === 'video') return true;
      if (fileType.startsWith('video/')) return true;
      if (fileType === 'video') return true;
      const extension = fileName.split('.').pop()?.toLowerCase();
      const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'm4v'];
      if (extension && videoExtensions.includes(extension)) return true;
      return false;
    };
    const isDocumentFile = (file: FileType) => {
      const fileType = file.file_type || file.type || '';
      const fileName = file.file_name || file.fileName || '';
      const category = file.category;
      if (category === 'document') return true;
      if (fileType.startsWith('application/pdf')) return true;
      if (fileType.startsWith('application/msword')) return true;
      if (fileType.startsWith('application/vnd.openxmlformats-officedocument')) return true;
      if (fileType.startsWith('text/')) return true;
      const extension = fileName.split('.').pop()?.toLowerCase();
      const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'];
      if (extension && documentExtensions.includes(extension)) return true;
      return false;
    };

    const mediaFiles = currentMessages
      .filter(message => {
        const hasFiles = Array.isArray(message.files) && message.files.length > 0;
        const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0;
        return hasFiles || hasAttachments;
      })
      .flatMap(message => {
        const files = Array.isArray(message.files) ? message.files : [];
        const attachments = Array.isArray(message.attachments) ? message.attachments : [];
        return [...files, ...attachments];
      })
      .filter((file: FileType) => {
        const isImage = isImageFile(file);
        const isVideo = isVideoFile(file);
        const isDocument = isDocumentFile(file);
        return isImage || isVideo || isDocument;
      })
      .map((file: FileType) => {
        const isImage = isImageFile(file);
        const isVideo = isVideoFile(file);
        const isDocument = isDocumentFile(file);
        let url = file.url || (file.file ? getFullUrl(file.file) : '');
        if (url && !url.startsWith('http') && !url.startsWith('data:')) {
          url = getFullUrl(url);
        }
        let thumbnail: string | undefined = undefined;
        if (isImage || isVideo) {
          thumbnail = file.thumbnail_url || (file.thumbnail ? getFullUrl(file.thumbnail) : undefined) || (isImage ? url : undefined);
          if (thumbnail && !thumbnail.startsWith('http') && !thumbnail.startsWith('data:')) {
            thumbnail = getFullUrl(thumbnail);
          }
        }
        let type = file.file_type || file.type || '';
        if (isImage) type = 'image';
        else if (isVideo) type = 'video';
        else if (isDocument) type = 'document';
        return {
          id: file.id,
          type,
          url,
          thumbnail,
          fileName: file.file_name || file.fileName || 'Media',
          fileSize: file.file_size || file.fileSize,
          duration: file.duration,
          category: file.category || (isImage ? 'image' : isVideo ? 'video' : isDocument ? 'document' : 'other')
        };
      });
    return mediaFiles;
  };

  const mediaAttachments = getMediaAttachments();

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'moderator' | 'member') => {
    // Optimistically update the UI
    let previousState: typeof selectedConversation | null = null;
    setSelectedConversation((prev: typeof selectedConversation) => {
      previousState = prev;
      if (!prev || !prev.group) return prev;
      // Update group.members
      const updatedGroupMembers = Array.isArray(prev.group.members)
        ? prev.group.members.map((member: any) =>
            member.id === memberId ? { ...member, role: newRole } : member
          )
        : [];
      // Update selectedConversation.members
      const updatedMembers = Array.isArray(prev.members)
        ? prev.members.map((member: any) =>
            member.id === memberId ? { ...member, role: newRole } : member
          )
        : [];
      return {
        ...prev,
        group: {
          ...prev.group,
          members: updatedGroupMembers,
        },
        members: updatedMembers,
      };
    });
    setIsUpdating(true);
    try {
      if (!selectedConversation?.id) {
        throw new Error('Conversation ID not found');
      }
      // Only allow admins to change roles
      const groupMemberList = selectedConversation?.members || [];
      const currentUserMember = groupMemberList.find((m: any) => m.id === user?.id || m.user?.id === user?.id);
      if (!currentUserMember || currentUserMember.role !== 'admin') {
        toast.error('Only admins can change roles');
        // Revert optimistic update
        if (previousState) setSelectedConversation(previousState);
        return;
      }
      if (memberId === user?.id) {
        toast.error('You cannot change your own role');
        if (previousState) setSelectedConversation(previousState);
        return;
      }
      // Call backend API to change role
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations/${selectedConversation.id}/change_member_role/`,
        {
          member_id: memberId,
          role: newRole
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      if (response.status === 200) {
        toast.success(`Successfully updated role to ${newRole}`);
        // Fetch updated conversation details
        try {
          const token = localStorage.getItem('access_token');
          const convResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/chat/conversations/${selectedConversation.id}/`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (convResponse.status === 200 && convResponse.data) {
            setSelectedConversation((prev: typeof selectedConversation) => ({
              ...prev,
              ...convResponse.data,
              // Optionally, you may want to transform convResponse.data to match your UI shape
            }));
          }
        } catch (fetchError) {
          console.error('Failed to fetch updated conversation:', fetchError);
        }
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.detail ||
        'Failed to update role. Please try again.';
      toast.error(errorMessage);
      // Revert optimistic update
      if (previousState) setSelectedConversation(previousState);
    } finally {
      setIsUpdating(false);
      setSelectedMemberMenu(null);
    }
  };

  const handleRemoveMember = async (memberUserId: string | undefined) => {
    console.log('handleRemoveMember called with:', memberUserId);
    if (!memberUserId) {
      console.log('Early return: Invalid member');
      toast.error('Invalid member');
      return;
    }
    let previousState: typeof selectedConversation | null = null;
    try {
      setIsUpdating(true);
      if (!selectedConversation?.id) {
        console.log('Early return: Conversation ID not found');
        throw new Error('Conversation ID not found');
      }
      const conversationId = selectedConversation.id;
      const currentUserMember = selectedConversation?.members?.find(
        (m: any) => m.id === user?.id || m.user?.id === user?.id
      );
      if (!currentUserMember || currentUserMember.role !== 'admin') {
        console.log('Early return: Not admin or no currentUserMember', currentUserMember);
        toast.error('Only admins can remove members');
        return;
      }
      if (memberUserId === user?.id) {
        console.log('Early return: Tried to remove self');
        toast.error('You cannot remove yourself from the group');
        return;
      }
      const targetMember = conversationId ? groupMembers[conversationId]?.find((member) => (member.user?.id || member.id) === memberUserId) : undefined;
      if (targetMember?.role === 'admin') {
        console.log('Early return: Tried to remove another admin', targetMember);
        toast.error('Admins cannot remove other admins');
        return;
      }
      if (conversationId) {
        // Save previous state for rollback
        previousState = selectedConversation;
        setSelectedConversation((prev: typeof selectedConversation) => {
          if (!prev || !prev.group) return prev;
          const currentGroupMembers = Array.isArray(prev.group.members) ? prev.group.members : [];
          const currentMembers = Array.isArray(prev.members) ? prev.members : [];
          return {
            ...prev,
            group: {
              ...prev.group,
              members: currentGroupMembers.filter(
                (member: any) => (member.user?.id !== memberUserId && member.id !== memberUserId)
              )
            },
            members: currentMembers.filter(
              (member: any) => (member.user?.id !== memberUserId && member.id !== memberUserId)
            )
          };
        });
        setSelectedMemberMenu(null);
      }
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations/${selectedConversation.id}/remove_member/`,
        { user_id: memberUserId },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.status === 200) {
        toast.success('Member removed successfully');
        // Fetch updated conversation details
        try {
          const token = localStorage.getItem('access_token');
          const convResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/chat/conversations/${selectedConversation.id}/`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (convResponse.status === 200 && convResponse.data) {
            // Use the latest groupMembers[conversationId] if available for members
            setSelectedConversation((prev: typeof selectedConversation) => {
              const conversationId = prev?.id;
              let newMembers = prev?.members;
              let newGroupMembers = prev?.group?.members;
              if (conversationId && groupMembers && groupMembers[conversationId]) {
                newMembers = groupMembers[conversationId];
                newGroupMembers = groupMembers[conversationId];
              }
              return {
                ...prev,
                ...convResponse.data,
                members: newMembers,
                group: {
                  ...prev?.group,
                  ...convResponse.data.group,
                  members: newGroupMembers,
                },
              };
            });
          }
        } catch (fetchError) {
          console.error('Failed to fetch updated conversation:', fetchError);
        }
        // Refresh group members list from backend for consistency
        if (fetchGroupMembers && conversationId) {
          await fetchGroupMembers(conversationId);
        }
      } else {
        // Revert optimistic update if not 200
        if (previousState) setSelectedConversation(previousState);
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Failed to remove member. Please try again.';
      toast.error(errorMessage);
      // Revert optimistic update on error
      if (previousState) setSelectedConversation(previousState);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setIsUpdating(true);
      if (!selectedConversation?.id || !selectedConversation?.group?.id) {
        console.error('Group ID not found', { selectedConversation });
        throw new Error('Group ID not found');
      }
      // Use the group ID for the delete URL
      const groupId = selectedConversation.group.id;
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/chat/groups/${groupId}/`;
      const conversationId = selectedConversation.id;
      console.log('groupMembers[conversationId]:', groupMembers[conversationId]);
      console.log('user:', user);
      if (!user) {
        console.error('User is not defined!');
        toast.error('User is not defined!');
        setIsUpdating(false);
        setShowDeleteGroupModal(false);
        return;
      }
      if (!groupMembers[conversationId] || groupMembers[conversationId].length === 0) {
        console.error('No group members found for this group!');
        toast.error('No group members found for this group!');
        setIsUpdating(false);
        setShowDeleteGroupModal(false);
        return;
      }
      // Log all member ids for comparison
      if (Array.isArray(groupMembers[conversationId])) {
        groupMembers[conversationId].forEach((member, idx) => {
          console.log(`Member[${idx}]:`, member, 'member.id:', member.id, 'role:', member.role);
        });
      }
      // Use member.id instead of member.user?.id for admin check
      const currentUserMember = groupMembers[conversationId]?.find((member) => member.id === user?.id);
      console.log('Result of .find() for currentUserMember:', currentUserMember);
      const adminIdToSend = currentUserMember?.id || user.id;
      console.log('Attempting to delete group:', groupId);
      console.log('API URL:', apiUrl);
      console.log('Current user:', user);
      console.log('Current user member:', currentUserMember);
      if (!currentUserMember || currentUserMember.role !== 'admin') {
        console.error('Only admins can delete the group', { currentUserMember });
        toast.error('Only admins can delete the group');
        return;
      }
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };
      console.log('Request headers:', headers);
      const response = await axios.delete(apiUrl, { headers });
      console.log('Delete group response:', response);
      if (response.status === 200 || response.status === 204) {
        toast.success('Group deleted successfully');
        // Instantly remove the group conversation from the UI
        setConversations(prev => prev.filter(conv => conv.group?.id !== groupId));
        setSelectedConversation(null);
        setActiveConversation(null);
        navigate('/messages');
        setShowDeleteGroupModal(false);
      } else {
        const errorMsg = `Unexpected response status: ${response.status} ${response.statusText || ''}`;
        toast.error(errorMsg);
        console.error(errorMsg, response);
      }
    } catch (error) {
      let errorMessage = 'Failed to delete group. Please try again.';
      if (error.response) {
        errorMessage =
          error.response.data?.detail ||
          error.response.data?.error ||
          error.response.data?.message ||
          JSON.stringify(error.response.data) ||
          errorMessage;
        errorMessage = `Error ${error.response.status}: ${errorMessage}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
    
      console.error('Error deleting group:', error);
    } finally {
      setIsUpdating(false);
      setShowDeleteGroupModal(false);
    }
  };

  // Add this function to ensure group members are loaded before showing the delete modal
  const handleConfirmDeleteGroup = async () => {
    const conversationId = selectedConversation?.id;
    if (conversationId && (!groupMembers[conversationId] || groupMembers[conversationId].length === 0)) {
      if (fetchGroupMembers) {
        await fetchGroupMembers(conversationId);
      }
    }
    setShowDeleteGroupModal(true);
  };

  const handleAddMembers = () => {
    setShowAddMembersModal(true);
  };

  const handleGroupUpdate = (updatedGroup: any) => {
    console.log('Group updated:', updatedGroup);
    if (selectedConversation) {
      setSelectedConversation({
        ...selectedConversation,
        name: updatedGroup.name,
        group: {
          ...selectedConversation.group,
          id: updatedGroup.id,
          name: updatedGroup.name,
          avatarUrl: updatedGroup.avatar
        }
      });
    }
    setShowUpdateGroupModal(false);
  };

  // Debug logs to help diagnose admin detection
  console.log('groupMemberList:', selectedConversation?.members);
  console.log('user:', user);
  console.log('currentUserMember:', selectedConversation?.members?.find((m: any) => m.id === user?.id || m.user?.id === user?.id));
  console.log('currentUserIsAdmin:', selectedConversation?.members?.find((m: any) => m.id === user?.id || m.user?.id === user?.id)?.role === 'admin');

  // Add this variable for clarity
  const currentUserIsAdmin = selectedConversation?.members?.find(
    (m: any) => m.id === user?.id || m.user?.id === user?.id
  )?.role === 'admin';

  if (selectedConversation?.type === 'group') {
    console.log('user.id:', user?.id);
    console.log('groupId:', selectedConversation.group?.id);
    console.log('groupMemberList:', selectedConversation?.members);
    console.log('currentUserMember:', selectedConversation?.members?.find((m: any) => m.id === user?.id || m.user?.id === user?.id));
    console.log('currentUserIsAdmin:', currentUserIsAdmin);
  }

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-dark-card' : 'bg-white'} shadow-lg rounded-2xl overflow-hidden`}>
      <div className={`sticky top-0 p-8 border-b ${isDarkMode ? 'border-dark-border' : 'border-gray-200'} bg-inherit z-10`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'} tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent`}>
            {selectedConversation?.type === 'direct' ? 'Contact Info' : 'Group Info'}
          </h2>
          <div className="flex items-center space-x-4">
            <button className={`p-3.5 ${isDarkMode ? 'bg-dark-card-hover hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md`}>
              <PhoneIcon className="w-6 h-6 text-purple-600" />
            </button>
            <button className={`p-3.5 ${isDarkMode ? 'bg-dark-card-hover hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md`}>
              <VideoCameraIcon className="w-6 h-6 text-blue-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={selectedConversation?.type === 'direct' 
                  ? selectedConversation?.user?.avatarUrl 
                  : selectedConversation?.group?.avatarUrl || '/group.png'}
                alt={selectedConversation?.type === 'direct' 
                  ? selectedConversation?.user?.name 
                  : selectedConversation?.group?.name}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-500/20"
              />
              {selectedConversation?.type === 'direct' && selectedConversation?.user?.isOnline && (
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-dark-card" />
              )}
            </div>
            <h3 className={`mt-4 text-lg font-semibold ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
              {selectedConversation?.type === 'direct' 
                ? selectedConversation?.user?.name 
                : selectedConversation?.group?.name}
            </h3>
            {selectedConversation?.type === 'direct' ? (
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedConversation?.user?.isOnline ? 'Online' : 'Offline'}
              </p>
            ) : (
              <div className="flex items-center gap-1 mt-1">
                <UserGroupIcon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{
                  groupMembers[selectedConversation?.group?.id]?.length ?? selectedConversation?.members?.length ?? 0
                } members</p>
              </div>
            )}
          </div>
        </div>

        {selectedConversation?.type === 'direct' && (
          <div className="px-8 py-6 space-y-6">
            <div>
              <h3 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase mb-3`}>
                Bio
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                {selectedConversation?.user?.bio || 'No bio available'}
              </p>
            </div>

            {selectedConversation?.user?.personality_tags && selectedConversation.user.personality_tags.length > 0 && (
              <div>
                <h3 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase mb-3`}>
                  Personality
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedConversation.user.personality_tags.map((tag: any, index: number) => (
                    <span
                      key={index}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/40' 
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                      style={{ 
                        backgroundColor: tag.color 
                          ? isDarkMode 
                            ? `${tag.color}30` 
                            : `${tag.color}15`
                          : undefined 
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase`}>
              Shared Media
            </h3>
            <span className={`text-xs px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-dark-card-hover text-gray-400' : 'bg-gray-100 text-gray-600'} font-medium`}>
              {mediaAttachments.length}
            </span>
          </div>
          {mediaAttachments.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {mediaAttachments.slice(0, 6).map((attachment, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => onImageClick(attachment, index)}
                >
                  <img
                    src={attachment.thumbnail || attachment.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  {attachment.type?.startsWith('video/') && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {mediaAttachments.length > 6 && (
                <button
                  onClick={() => onImageClick(mediaAttachments[6], 6)}
                  className="aspect-square rounded-xl overflow-hidden relative group"
                >
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-dark-card-hover' : 'bg-gray-50'} group-hover:opacity-90 transition-opacity`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      +{mediaAttachments.length - 6}
                    </span>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className={`text-center py-8 rounded-xl ${isDarkMode ? 'bg-dark-card-hover' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No media shared yet
              </p>
            </div>
          )}
          {mediaAttachments.length > 0 && (
            <button 
              className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/20' 
                  : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
              }`}
              onClick={() => onImageClick(mediaAttachments[0], 0)}
            >
              View All Media
            </button>
          )}
        </div>

        {selectedConversation?.type === 'group' && (
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase`}>
                Members
              </h3>
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-dark-card-hover text-gray-400' : 'bg-gray-100 text-gray-600'} font-medium`}>
                {(groupMembers && selectedConversation?.group?.id && groupMembers[selectedConversation.group.id]?.length) || selectedConversation?.members?.length || 0}
              </span>
            </div>
            <div className="space-y-4">
              {(selectedConversation?.type === 'group' && groupMembers && selectedConversation?.group?.id && groupMembers[selectedConversation.group.id]
                ? groupMembers[selectedConversation.group.id]
                : selectedConversation?.members || []
              ).map((member: any) => {
                console.log('Rendering member:', member);
                if (!member.user || !member.user.id) {
                  console.log('Skipping member without user or user.id:', member);
                  return null;
                }
                const displayName = member.name
                  || (member.user && (member.user.first_name || member.user.last_name) ? `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim() : '')
                  || member.username
                  || member.email
                  || 'Unknown User';
                return (
                  <div key={member.id} className="group flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors duration-200">
                    <div className="relative">
                      <img
                        src={member.avatarUrl || member.user?.avatar || '/default.jpg'}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/20"
                      />
                      {(member.isOnline || member.user?.is_online) && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-base font-semibold truncate ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>{displayName}</h3>
                          {(member.isOnline || member.user?.is_online) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                              Online
                            </span>
                          )}
                        </div>
                        <div className="relative transition-opacity">
                          <button
                            onClick={() => setSelectedMemberMenu(selectedMemberMenu === member.id ? null : member.id)}
                            className={`p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} member-menu-trigger`}
                            tabIndex={0}
                          >
                            <EllipsisHorizontalIcon className="w-5 h-5" />
                          </button>
                          {selectedMemberMenu === member.id && (
                            <div
                              ref={menuRef}
                              className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg backdrop-blur-sm ${
                                isDarkMode 
                                  ? 'bg-dark-card/95 border border-gray-700/50 shadow-gray-900/20' 
                                  : 'bg-white/95 border border-gray-200/50 shadow-gray-200/50'
                              } z-10 overflow-hidden`}
                            >
                              <div className="py-1.5">
                                {/* Show menu actions for everyone, but only allow admins (not self) to use them */}
                                <div>
                                  <button
                                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 ${
                                      isDarkMode 
                                        ? 'text-gray-300 hover:text-purple-400' 
                                        : 'text-gray-700 hover:text-purple-600'
                                    } transition-all duration-200 ${(!currentUserIsAdmin || (member.user?.id) === user?.id || isUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onMouseDown={() => {
                                      console.log('Role change button clicked for', member.user?.id, 'to admin');
                                      handleRoleChange(member.user?.id, 'admin');
                                    }}
                                    disabled={!currentUserIsAdmin || (member.user?.id) === user?.id || isUpdating}
                                  >
                                    <ShieldCheckIcon className="w-4 h-4" />
                                    <span>Make Admin</span>
                                  </button>
                                  <button
                                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 ${
                                      isDarkMode 
                                        ? 'text-gray-300 hover:text-blue-400' 
                                        : 'text-gray-700 hover:text-blue-600'
                                    } transition-all duration-200 ${(!currentUserIsAdmin || (member.user?.id) === user?.id || isUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onMouseDown={() => {
                                      console.log('Role change button clicked for', member.user?.id, 'to moderator');
                                      handleRoleChange(member.user?.id, 'moderator');
                                    }}
                                    disabled={!currentUserIsAdmin || (member.user?.id) === user?.id || isUpdating}
                                  >
                                    <ShieldExclamationIcon className="w-4 h-4" />
                                    <span>Make Moderator</span>
                                  </button>
                                  <button
                                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 ${
                                      isDarkMode 
                                        ? 'text-gray-300 hover:text-green-400' 
                                        : 'text-gray-700 hover:text-green-600'
                                    } transition-all duration-200 ${(!currentUserIsAdmin || (member.user?.id) === user?.id || isUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onMouseDown={() => {
                                      console.log('Role change button clicked for', member.user?.id, 'to member');
                                      handleRoleChange(member.user?.id, 'member');
                                    }}
                                    disabled={!currentUserIsAdmin || (member.user?.id) === user?.id || isUpdating}
                                  >
                                    <UserIcon className="w-4 h-4" />
                                    <span>Make Member</span>
                                  </button>
                                  <div className={`h-px my-1 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}`} />
                                  <button
                                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 ${
                                      isDarkMode 
                                        ? 'text-red-400 hover:text-red-300' 
                                        : 'text-red-600 hover:text-red-700'
                                    } transition-all duration-200 ${(!currentUserIsAdmin || (member.user?.id) === user?.id || isUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onMouseDown={() => {
                                      console.log('Remove member clicked', member.user.id, user?.id, currentUserIsAdmin, isUpdating);
                                      handleRemoveMember(member.user.id);
                                    }}
                                    disabled={!currentUserIsAdmin || (member.user?.id) === user?.id || isUpdating}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                    <span>Remove Member</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'admin' 
                            ? isDarkMode 
                              ? 'bg-purple-900/30 text-purple-300' 
                              : 'bg-purple-100 text-purple-700'
                            : member.role === 'moderator'
                              ? isDarkMode
                                ? 'bg-blue-900/30 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDarkMode
                                ? 'bg-gray-700/50 text-gray-300'
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.role === 'admin' ? 'Administrator' : member.role === 'moderator' ? 'Moderator' : 'Member'}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Actions
          </h3>
          <div className="space-y-2">
            {selectedConversation?.type === 'group' && (
              <>
                <button
                  onClick={handleAddMembers}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 active:bg-purple-600/40' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200 active:bg-purple-300'
                  } shadow-sm hover:shadow-md`}
                >
                  <UserPlusIcon className="w-5 h-5" />
                  Add Members
                </button>
                <button
                  onClick={() => setShowUpdateGroupModal(true)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 active:bg-blue-600/40' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300'
                  } shadow-sm hover:shadow-md`}
                >
                  <PencilIcon className="w-5 h-5" />
                  Update Group
                </button>
                {/* Only show Delete Group button if current user is admin */}
                {currentUserIsAdmin && (
                  <button
                    onClick={handleConfirmDeleteGroup}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 active:bg-red-600/40' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300'
                    } shadow-sm hover:shadow-md`}
                  >
                    <TrashIcon className="w-5 h-5" />
                    Delete Group
                  </button>
                )}
              </>
            )}
            {selectedConversation?.type === 'direct' && (
              <button
                onClick={onDeleteConversation}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
                  isDarkMode 
                    ? 'text-red-400 hover:bg-gray-800' 
                    : 'text-red-600 hover:bg-gray-100'
                }`}
              >
                <TrashIcon className="w-5 h-5" />
                Delete Conversation
              </button>
            )}
          </div>
        </div>
      </div>

      {showDeleteGroupModal && selectedConversation?.group && (
        <DeleteGroupModal
          isOpen={showDeleteGroupModal}
          onClose={() => setShowDeleteGroupModal(false)}
          onConfirm={() => handleDeleteGroup()}
          groupName={selectedConversation.group.name}
          isDarkMode={isDarkMode}
          isDeleting={isUpdating}
        />
      )}

      {showUpdateGroupModal && selectedConversation?.group && (
        <UpdateGroupModal
          isOpen={showUpdateGroupModal}
          onClose={() => setShowUpdateGroupModal(false)}
          onUpdate={handleGroupUpdate}
          groupName={selectedConversation.group.name}
          groupAvatar={selectedConversation.group.avatarUrl}
          selectedConversation={selectedConversation}
        />
      )}

      {selectedConversation?.type === 'group' && (
        <AddMembersModal
          isOpen={showAddMembersModal}
          onClose={() => setShowAddMembersModal(false)}
          groupId={selectedConversation.group.id}
          conversationId={selectedConversation.id}
        />
      )}
    </div>
  );
};

export default RightSidebar; 