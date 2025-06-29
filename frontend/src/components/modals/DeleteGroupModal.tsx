import { FC } from 'react';
import { ExclamationTriangleIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupName: string;
  isDarkMode: boolean;
  isDeleting?: boolean;
}

const DeleteGroupModal: FC<DeleteGroupModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  groupName, 
  isDarkMode,
  isDeleting = false 
}) => {
  if (!isOpen) return null;

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
            disabled={isDeleting}
          >
            <XMarkIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>

          {/* Warning icon */}
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
          }`}>
            <ExclamationTriangleIcon className={`h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
          </div>

          {/* Title */}
          <h3 className={`mt-4 text-lg font-semibold leading-6 ${
            isDarkMode ? 'text-dark-text' : 'text-gray-900'
          }`}>
            Delete Group
          </h3>

          {/* Warning message */}
          <div className="mt-2">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Are you sure you want to delete the group "{groupName}"? This action cannot be undone. All messages, media, and group data will be permanently deleted.
            </p>
          </div>

          {/* Additional warning */}
          <div className={`mt-4 rounded-lg p-4 ${
            isDarkMode ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-100'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
              <strong>Warning:</strong> This will remove the group for all members and delete all group content permanently.
            </p>
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
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDeleting 
                  ? 'opacity-50 cursor-not-allowed' 
                  : isDarkMode
                    ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                    : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
              } text-white shadow-sm hover:shadow-md flex items-center space-x-2`}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4" />
                  <span>Delete Permanently</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteGroupModal; 