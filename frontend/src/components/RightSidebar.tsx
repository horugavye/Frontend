import { FC, useState } from 'react';
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

interface RightSidebarProps {
  selectedConversation: any;
  isDarkMode: boolean;
  currentMessages: Message[];
  groupMembers: { [key: string]: GroupMemberData[] };
  user: any;
  onImageClick: (attachment: any, index: number) => void;
  onDeleteConversation: () => void;
  setGroupMembers: React.Dispatch<React.SetStateAction<{ [key: string]: GroupMemberData[] }>>;
  setSelectedConversation: React.Dispatch<React.SetStateAction<any>>;
  onDeleteGroup: (groupId: string) => void;
  fetchGroupMembers: (groupId: string) => Promise<void>;
}

const RightSidebar: FC<RightSidebarProps> = ({
  selectedConversation,
  isDarkMode,
  currentMessages,
  groupMembers,
  user,
  onImageClick,
  onDeleteConversation,
  setGroupMembers,
  setSelectedConversation,
  onDeleteGroup,
  fetchGroupMembers,
}) => {
  const { isDarkMode: themeIsDark } = useTheme();
  const [selectedMemberMenu, setSelectedMemberMenu] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showUpdateGroupModal, setShowUpdateGroupModal] = useState(false);

  const getMediaAttachments = () => {
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
      return `${import.meta.env.VITE_API_URL}/media/${cleanPath}`;
    };

    const isImageFile = (file: any) => {
      const fileType = file.file_type || file.type || '';
      const fileName = file.file_name || file.fileName || '';
      const category = file.category;
      
      // Log file details for debugging
      console.log('[RightSidebar] Checking image file:', {
        fileName,
        fileType,
        category,
        file
      });
      
      // Check category first
      if (category === 'image') {
        console.log('[RightSidebar] Detected image by category');
        return true;
      }
      
      // Check MIME types
      if (fileType.startsWith('image/')) {
        console.log('[RightSidebar] Detected image by MIME type:', fileType);
        return true;
      }
      if (fileType === 'image') {
        console.log('[RightSidebar] Detected image by type');
        return true;
      }
      
      // Check file extensions
      const extension = fileName.split('.').pop()?.toLowerCase();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif'];
      if (extension && imageExtensions.includes(extension)) {
        console.log('[RightSidebar] Detected image by extension:', extension);
        return true;
      }
      
      return false;
    };

    const isVideoFile = (file: any) => {
      const fileType = file.file_type || file.type || '';
      const fileName = file.file_name || file.fileName || '';
      const category = file.category;
      
      // Log file details for debugging
      console.log('[RightSidebar] Checking video file:', {
        fileName,
        fileType,
        category,
        file
      });
      
      // Check category first
      if (category === 'video') {
        console.log('[RightSidebar] Detected video by category');
        return true;
      }
      
      // Check MIME types
      if (fileType.startsWith('video/')) {
        console.log('[RightSidebar] Detected video by MIME type:', fileType);
        return true;
      }
      if (fileType === 'video') {
        console.log('[RightSidebar] Detected video by type');
        return true;
      }
      
      // Check file extensions
      const extension = fileName.split('.').pop()?.toLowerCase();
      const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'm4v'];
      if (extension && videoExtensions.includes(extension)) {
        console.log('[RightSidebar] Detected video by extension:', extension);
        return true;
      }
      
      return false;
    };

    const isDocumentFile = (file: any) => {
      const fileType = file.file_type || file.type || '';
      const fileName = file.file_name || file.fileName || '';
      const category = file.category;
      
      // Log file details for debugging
      console.log('[RightSidebar] Checking document file:', {
        fileName,
        fileType,
        category,
        file
      });
      
      // Check category first
      if (category === 'document') {
        console.log('[RightSidebar] Detected document by category');
        return true;
      }
      
      // Check MIME types
      if (fileType.startsWith('application/pdf')) {
        console.log('[RightSidebar] Detected PDF by MIME type');
        return true;
      }
      if (fileType.startsWith('application/msword')) {
        console.log('[RightSidebar] Detected Word by MIME type');
        return true;
      }
      if (fileType.startsWith('application/vnd.openxmlformats-officedocument')) {
        console.log('[RightSidebar] Detected Office document by MIME type');
        return true;
      }
      if (fileType.startsWith('text/')) {
        console.log('[RightSidebar] Detected text file by MIME type');
        return true;
      }
      
      // Check file extensions
      const extension = fileName.split('.').pop()?.toLowerCase();
      const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'];
      if (extension && documentExtensions.includes(extension)) {
        console.log('[RightSidebar] Detected document by extension:', extension);
        return true;
      }
      
      return false;
    };

    // Log all messages for debugging
    console.log('[RightSidebar] All messages:', currentMessages);

    const mediaFiles = currentMessages
      .filter(message => {
        // Check for both files and attachments
        const hasFiles = message.files && message.files.length > 0;
        const hasAttachments = message.attachments && message.attachments.length > 0;
        
        // Log message details
        console.log('[RightSidebar] Checking message:', {
          messageId: message.id,
          hasFiles,
          hasAttachments,
          files: message.files,
          attachments: message.attachments
        });
        
        return hasFiles || hasAttachments;
      })
      .flatMap(message => {
        // Combine both files and attachments
        const files = message.files || [];
        const attachments = message.attachments || [];
        const allFiles = [...files, ...attachments];
        
        // Log combined files
        console.log('[RightSidebar] Combined files for message:', {
          messageId: message.id,
          totalFiles: allFiles.length,
          files: allFiles
        });
        
        return allFiles;
      })
      .filter(file => {
        // Check if it's a media file (image, video, or document)
        const isImage = isImageFile(file);
        const isVideo = isVideoFile(file);
        const isDocument = isDocumentFile(file);
        
        // Log detection results
        console.log('[RightSidebar] File detection results:', {
          fileName: file.file_name || file.fileName,
          isImage,
          isVideo,
          isDocument,
          file
        });
        
        return isImage || isVideo || isDocument;
      })
      .map(file => {
        const isImage = isImageFile(file);
        const isVideo = isVideoFile(file);
        const isDocument = isDocumentFile(file);

        // Handle URLs with consistent priority
        let url = file.url;
        if (!url && file.file) {
          url = getFullUrl(file.file);
        } else if (url && !url.startsWith('http') && !url.startsWith('data:')) {
          url = getFullUrl(url);
        }

        // Handle thumbnail URLs with consistent priority
        let thumbnail = null;
        if (isImage || isVideo) {
          thumbnail = file.thumbnail_url || 
                     (file.thumbnail ? getFullUrl(file.thumbnail) : null) || 
                     (isImage ? url : null);
          
          if (thumbnail && !thumbnail.startsWith('http') && !thumbnail.startsWith('data:')) {
            thumbnail = getFullUrl(thumbnail);
          }
        }

        // Determine the type based on file characteristics
        let type = file.file_type || file.type;
        if (isImage) type = 'image';
        else if (isVideo) type = 'video';
        else if (isDocument) type = 'document';

        const result = {
          id: file.id,
          type,
          url,
          thumbnail,
          fileName: file.file_name || file.fileName || 'Media',
          fileSize: file.file_size || file.fileSize,
          duration: file.duration,
          category: file.category || (isImage ? 'image' : isVideo ? 'video' : isDocument ? 'document' : 'other')
        };

        // Log final processed file
        console.log('[RightSidebar] Processed file:', result);

        return result;
      });

    // Log final results
    console.log('[RightSidebar] Final media files:', mediaFiles);
    
    return mediaFiles;
  };

  const mediaAttachments = getMediaAttachments();

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'moderator' | 'member') => {
    try {
      setIsUpdating(true);
      if (!selectedConversation?.id) {
        throw new Error('Conversation ID not found');
      }

      // Check if the current user is an admin
      const currentUserMember = groupMembers[selectedConversation.group?.id]?.find(
        member => member.id === user?.id
      );
      
      if (!currentUserMember || currentUserMember.role !== 'admin') {
        toast.error('Only admins can change roles');
        return;
      }

      // Prevent changing own role
      if (memberId === user?.id) {
        toast.error('You cannot change your own role');
        return;
      }

      // Check if this is the last admin trying to change their role
      const adminCount = groupMembers[selectedConversation.group?.id]?.filter(
        member => member.role === 'admin'
      ).length || 0;
      
      const targetMember = groupMembers[selectedConversation.group?.id]?.find(
        member => member.id === memberId
      );
      
      if (targetMember?.role === 'admin' && adminCount <= 1) {
        toast.error('Cannot remove the last admin. Please promote another member to admin first.');
        return;
      }

      // Use the correct API endpoint for changing member role
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/chat/conversations/${selectedConversation.id}/change_member_role/`, {
        member_id: memberId,
        role: newRole
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.status === 200) {
        toast.success(`Successfully updated role to ${newRole}`);
        
        // Update the local state immediately
        if (selectedConversation?.group?.id) {
          const groupId = selectedConversation.group.id;
          
          // Update groupMembers state
          setGroupMembers(prev => {
            const updatedMembers = prev[groupId]?.map(member => 
              member.id === memberId 
                ? { ...member, role: newRole }
                : member
            ) || [];
            
            return {
              ...prev,
              [groupId]: updatedMembers
            };
          });

          // Update selectedConversation state
          setSelectedConversation(prev => {
            if (!prev || !prev.group) return prev;
            
            // Ensure members is an array
            const currentMembers = Array.isArray(prev.group.members) ? prev.group.members : [];
            
            return {
              ...prev,
              group: {
                ...prev.group,
                members: currentMembers.map(member => 
                  member.id === memberId 
                    ? { ...member, role: newRole }
                    : member
                )
              }
            };
          });
        }
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Failed to update role. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
      setSelectedMemberMenu(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setIsUpdating(true);
      if (!selectedConversation?.id) {
        throw new Error('Conversation ID not found');
      }

      // Check if the current user is an admin
      const currentUserMember = groupMembers[selectedConversation.group?.id]?.find(
        member => member.id === user?.id
      );
      
      if (!currentUserMember || currentUserMember.role !== 'admin') {
        toast.error('Only admins can remove members');
        return;
      }

      // Prevent removing yourself
      if (memberId === user?.id) {
        toast.error('You cannot remove yourself from the group');
        return;
      }

      // Prevent removing other admins
      const targetMember = groupMembers[selectedConversation.group?.id]?.find(
        member => member.id === memberId
      );
      
      if (targetMember?.role === 'admin') {
        toast.error('Admins cannot remove other admins');
        return;
      }

      // Optimistically update the UI
      if (selectedConversation?.group?.id) {
        const groupId = selectedConversation.group.id;
        
        // Update groupMembers state immediately
        setGroupMembers(prev => {
          const currentGroupMembers = prev[groupId] || [];
          const updatedMembers = currentGroupMembers.filter(member => member.id !== memberId);
          return {
            ...prev,
            [groupId]: updatedMembers
          };
        });

        // Update selectedConversation state immediately
        setSelectedConversation(prev => {
          if (!prev || !prev.group) return prev;
          const currentMembers = prev.group.members || 0;
          return {
            ...prev,
            group: {
              ...prev.group,
              members: currentMembers - 1
            }
          };
        });

        // Close the member menu immediately
        setSelectedMemberMenu(null);
      }

      // Make the API call
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations/${selectedConversation.id}/remove_member/`,
        { user_id: memberId },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        toast.success('Member removed successfully');
        // Refresh the group members to ensure sync with backend
        if (selectedConversation?.group?.id) {
          await fetchGroupMembers(selectedConversation.group.id);
        }
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Failed to remove member. Please try again.';
      toast.error(errorMessage);

      // Revert the optimistic update on error
      if (selectedConversation?.group?.id) {
        const groupId = selectedConversation.group.id;
        // Refresh the group members to get the correct state
        await fetchGroupMembers(groupId);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setIsUpdating(true);
      if (!selectedConversation?.id || !selectedConversation?.group?.id) {
        throw new Error('Group ID not found');
      }

      // Check if the current user is an admin
      const currentUserMember = groupMembers[selectedConversation.group.id]?.find(
        member => member.id === user?.id
      );
      
      if (!currentUserMember || currentUserMember.role !== 'admin') {
        toast.error('Only admins can delete the group');
        return;
      }

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations/${selectedConversation.id}/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        toast.success('Group deleted successfully');
        onDeleteGroup(selectedConversation.id);
        setShowDeleteGroupModal(false);
      }
    } catch (error: any) {
      console.error('Error deleting group:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Failed to delete group. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
      setShowDeleteGroupModal(false);
    }
  };

  const handleConfirmDeleteGroup = () => {
    setShowDeleteGroupModal(true);
  };

  const handleAddMembers = () => {
    setShowAddMembersModal(true);
  };

  const handleMembersAdded = () => {
    // Refresh the group members list
    if (selectedConversation?.group?.id) {
      fetchGroupMembers(selectedConversation.group.id);
    }
  };

  const handleGroupUpdate = (updatedGroup: any) => {
    console.log('Group updated:', updatedGroup);
    // Update the conversation data with the new group info
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

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-dark-card' : 'bg-white'} shadow-lg rounded-2xl overflow-hidden`}>
      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile/Group Info */}
        <div className="p-8">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={selectedConversation?.type === 'direct' 
                  ? selectedConversation?.user?.avatarUrl 
                  : selectedConversation?.group?.avatarUrl}
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
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {groupMembers[selectedConversation?.group?.id]?.length || 0} members
              </p>
            )}
          </div>
        </div>

        {/* Bio and Personality Tags for Direct Messages */}
        {selectedConversation?.type === 'direct' && (
          <div className="px-8 py-6 space-y-6">
            {/* Bio Section */}
            <div>
              <h3 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase mb-3`}>
                Bio
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                {selectedConversation?.user?.bio || 'No bio available'}
              </p>
            </div>

            {/* Personality Tags */}
            {selectedConversation?.user?.personality_tags && selectedConversation.user.personality_tags.length > 0 && (
              <div>
                <h3 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase mb-3`}>
                  Personality
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedConversation.user.personality_tags.map((tag, index) => (
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

        {/* Media Section */}
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
                  {(attachment.type?.startsWith('video/') || attachment.file_type?.startsWith('video/')) && (
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

        {/* Group Members Section */}
        {selectedConversation?.type === 'group' && (
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} uppercase`}>
                Members
              </h3>
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-dark-card-hover text-gray-400' : 'bg-gray-100 text-gray-600'} font-medium`}>
                {groupMembers[selectedConversation?.group?.id]?.length || 0}
              </span>
            </div>
            <div className="space-y-4">
              {groupMembers[selectedConversation?.group?.id]?.map((member) => (
                <div key={member.id} className="group flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors duration-200">
                  <div className="relative">
                    <img
                      src={member.avatarUrl || '/default.jpg'}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/20"
                    />
                    {member.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-dark-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-base font-semibold truncate ${isDarkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                          {member.name}
                        </h3>
                        {member.isOnline && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                            Online
                          </span>
                        )}
                      </div>
                      {member.id !== user?.id && (
                        <div className="relative">
                          <button
                            onClick={() => setSelectedMemberMenu(selectedMemberMenu === member.id ? null : member.id)}
                            className={`p-2 rounded-full transition-all duration-200 ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-gray-300' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <EllipsisHorizontalIcon className="w-5 h-5" />
                          </button>
                          {selectedMemberMenu === member.id && (
                            <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg backdrop-blur-sm ${
                              isDarkMode 
                                ? 'bg-dark-card/95 border border-gray-700/50 shadow-gray-900/20' 
                                : 'bg-white/95 border border-gray-200/50 shadow-gray-200/50'
                            } z-10 overflow-hidden`}>
                              <div className="py-1.5">
                                {member.id !== user?.id && (
                                  <>
                                    <button
                                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 ${
                                        isDarkMode 
                                          ? 'text-gray-300 hover:text-purple-400' 
                                          : 'text-gray-700 hover:text-purple-600'
                                      } transition-all duration-200 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => handleRoleChange(member.id, 'admin')}
                                      disabled={isUpdating}
                                    >
                                      <ShieldCheckIcon className="w-4 h-4" />
                                      <span>Make Admin</span>
                                    </button>
                                    <button
                                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 ${
                                        isDarkMode 
                                          ? 'text-gray-300 hover:text-blue-400' 
                                          : 'text-gray-700 hover:text-blue-600'
                                      } transition-all duration-200 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => handleRoleChange(member.id, 'moderator')}
                                      disabled={isUpdating}
                                    >
                                      <ShieldExclamationIcon className="w-4 h-4" />
                                      <span>Make Moderator</span>
                                    </button>
                                    <button
                                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 ${
                                        isDarkMode 
                                          ? 'text-gray-300 hover:text-green-400' 
                                          : 'text-gray-700 hover:text-green-600'
                                      } transition-all duration-200 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => handleRoleChange(member.id, 'member')}
                                      disabled={isUpdating}
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
                                      } transition-all duration-200 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => handleRemoveMember(member.id)}
                                      disabled={isUpdating}
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                      <span>Remove Member</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
              ))}
            </div>
          </div>
        )}

        {/* Actions Section */}
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
                <button
                  onClick={() => setShowDeleteGroupModal(true)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 active:bg-red-600/40' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300'
                  } shadow-sm hover:shadow-md`}
                >
                  <TrashIcon className="w-5 h-5" />
                  Delete Group
                </button>
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

      {/* Delete Group Modal */}
      {showDeleteGroupModal && selectedConversation?.group && (
        <DeleteGroupModal
          isOpen={showDeleteGroupModal}
          onClose={() => setShowDeleteGroupModal(false)}
          onConfirm={handleDeleteGroup}
          groupName={selectedConversation.group.name}
          isDarkMode={isDarkMode}
          isDeleting={isUpdating}
        />
      )}

      {/* Update Group Modal */}
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

      {/* Add Members Modal */}
      {selectedConversation?.type === 'group' && (
        <AddMembersModal
          isOpen={showAddMembersModal}
          onClose={() => setShowAddMembersModal(false)}
          groupId={selectedConversation.group.id}
          conversationId={selectedConversation.id}
          onMembersAdded={() => {
            if (selectedConversation.group?.id) {
              fetchGroupMembers(selectedConversation.group.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default RightSidebar; 