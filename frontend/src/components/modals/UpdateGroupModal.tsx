import { FC, useState, useRef } from 'react';
import { XMarkIcon, PencilIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Group {
  id: number;
  name: string;
  avatar?: string;
  avatarUrl?: string;
}

interface SelectedConversation {
  id: number;
  type: 'direct' | 'group';
  name: string;
  group: Group;
}

interface UpdateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: Group) => void;
  groupName: string;
  groupAvatar: string;
  selectedConversation: SelectedConversation;
}

const UpdateGroupModal: FC<UpdateGroupModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  groupName,
  groupAvatar,
  selectedConversation
}) => {
  const navigate = useNavigate();
  const { token, refreshToken } = useAuth();
  const [newName, setNewName] = useState(groupName);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(groupAvatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useTheme();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Image selected:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Image preview generated');
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    if (!newName.trim()) {
      setError('Group name cannot be empty');
      return;
    }

    if (newName.trim() === groupName && !selectedImage) {
      toast.error('No changes made');
      return;
    }

    // Add debug logging
    console.log('Debug - selectedConversation:', {
      conversationId: selectedConversation?.id,
      group: selectedConversation?.group,
      fullObject: selectedConversation
    });

    if (!selectedConversation?.id) {
      setError('Invalid conversation data');
      return;
    }

    if (!token) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('name', newName.trim());
    
    if (selectedImage) {
      console.log('Selected image:', selectedImage);
      formData.append('avatar', selectedImage);
    }

    try {
      setIsUpdating(true);

      const conversationId = selectedConversation.id;
      console.log('Debug - Using conversation ID:', conversationId);

      console.log('Sending update request:', {
        conversationId,
        newName: newName.trim(),
        hasImage: !!selectedImage,
        imageName: selectedImage?.name
      });

      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations/${conversationId}/update_group/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Update response:', response.data);
      onUpdate(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error updating group:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        conversationId: selectedConversation?.id,
        selectedConversation: selectedConversation
      });

      if (error.response?.status === 401) {
        try {
          // Try to refresh the token
          const newToken = await refreshToken();
          if (newToken) {
            // Retry the update with the new token
            const retryResponse = await axios.patch(
              `${import.meta.env.VITE_API_URL}/api/chat/conversations/${selectedConversation.id}/update_group/`,
              formData,
              {
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
            console.log('Retry update response:', retryResponse.data);
            onUpdate(retryResponse.data);
            onClose();
            return;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          toast.error('Your session has expired. Please login again.');
          navigate('/login');
          return;
        }
      }

      const errorMessage = error.response?.data?.detail || 'Failed to update group. Please try again.';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        
        <div className={`relative w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${
          isDarkMode ? 'bg-dark-card border border-gray-700' : 'bg-white'
        }`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute right-4 top-4 p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            disabled={isUpdating}
          >
            <XMarkIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>

          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className={`w-24 h-24 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Group avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default.jpg';
                    }}
                  />
                ) : groupAvatar ? (
                  <img
                    src={groupAvatar}
                    alt="Group avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  isUpdating ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                disabled={isUpdating}
              >
                <PencilIcon className="w-6 h-6 text-white" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
                disabled={isUpdating}
              />
            </div>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Click to change group picture
            </p>
          </div>

          {/* Title */}
          <h3 className={`text-lg font-semibold leading-6 ${
            isDarkMode ? 'text-dark-text' : 'text-gray-900'
          }`}>
            Update Group
          </h3>

          {/* Description */}
          <div className="mt-2">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Update the group name and profile picture
            </p>
          </div>

          {/* Form */}
          <div className="mt-4">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
              Group Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                isDarkMode 
                  ? 'bg-dark-card-hover border-gray-700 text-dark-text placeholder-gray-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200`}
              placeholder="Enter new group name"
              disabled={isUpdating}
            />
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600/50 active:bg-gray-500/50' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400'
              } shadow-sm hover:shadow-md`}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={isUpdating || (!newName.trim() && !selectedImage) || (newName.trim() === groupName && !selectedImage)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isUpdating || (!newName.trim() && !selectedImage) || (newName.trim() === groupName && !selectedImage)
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                    : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
              } text-white shadow-sm hover:shadow-md flex items-center space-x-2`}
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <PencilIcon className="w-4 h-4" />
                  <span>Update Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateGroupModal; 