import { FC } from 'react';
import { XMarkIcon, ClockIcon, CheckCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Message } from '../types/messenger';

interface MessageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
  isDarkMode: boolean;
}

const MessageInfoModal: FC<MessageInfoModalProps> = ({ isOpen, onClose, message, isDarkMode }) => {
  if (!isOpen) return null;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

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
            Message Info
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

        {/* Content */}
        <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {/* Message Content */}
          <div className="p-4 rounded-lg bg-opacity-50 backdrop-blur-sm border border-opacity-50"
               style={{
                 backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                 borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
               }}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* Message Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm">Sent: {formatTimestamp(message.timestamp)}</span>
            </div>
            
            {message.status && (
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                <span className="text-sm">
                  Status: {message.status.read ? 'Read' : message.status.delivered ? 'Delivered' : 'Sent'}
                </span>
              </div>
            )}

            {message.forwarded_from && (
              <div className="flex items-center gap-2">
                <PaperAirplaneIcon className="w-4 h-4" />
                <span className="text-sm">Forwarded message</span>
              </div>
            )}
          </div>

          {/* Sender Info */}
          <div className="pt-4 border-t border-opacity-20"
               style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sender
            </h4>
            <div className="flex items-center gap-3">
              <img
                src={message.sender?.avatarUrl || '/default.jpg'}
                alt={message.sender?.name || 'Unknown'}
                className="w-10 h-10 rounded-full border-2 border-purple-400"
              />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {message.sender?.name || 'Unknown'}
                </p>
                {message.sender?.email && (
                  <p className="text-sm text-gray-500">{message.sender.email}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageInfoModal; 