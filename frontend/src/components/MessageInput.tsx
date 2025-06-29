import { FC, useRef, useState, useEffect } from 'react';
import { 
  PlusCircleIcon, 
  PhotoIcon, 
  FaceSmileIcon,
  ArrowUturnLeftIcon,
  XMarkIcon,
  PlayCircleIcon as GifIcon,
  DocumentIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { Message, FileUpload, RealTimeSuggestion } from '../types/messenger';
import EmojiPicker from './EmojiPicker';
import MessageSuggestions from './MessageSuggestions';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (content: string, files?: FileUpload[]) => void;
  handleFileSelect: (files: FileList) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  isDarkMode: boolean;
  replyingTo: Message | null;
  handleCancelReply: () => void;
  ALLOWED_FILE_TYPES: string[];
  handleSendReply?: () => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  conversationId?: string;
}

interface FilePreview {
  id: string;
  file: File;
  preview?: string;
}

const MessageInput: FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleFileSelect,
  showEmojiPicker,
  setShowEmojiPicker,
  isDarkMode,
  replyingTo,
  handleCancelReply,
  ALLOWED_FILE_TYPES,
  handleSendReply,
  replyContent,
  setReplyContent,
  conversationId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);

  // Add click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowEmojiPicker]);

  // Generate previews for selected files
  useEffect(() => {
    const newPreviews: FilePreview[] = [];
    selectedFiles.forEach(file => {
      if (file.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({
            id: file.id,
            file: file.file,
            preview: reader.result as string
          });
          setSelectedFiles(prev => 
            prev.map(f => f.id === file.id ? { ...f, preview: reader.result as string } : f)
          );
        };
        reader.readAsDataURL(file.file);
      }
    });
  }, [selectedFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles: FilePreview[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
      handleFileSelect(files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="w-4 h-4 text-blue-500" />;
    }
    if (file.type.includes('pdf')) {
      return <DocumentIcon className="w-4 h-4 text-red-500" />;
    }
    if (file.type.includes('word') || file.type.includes('document')) {
      return <DocumentIcon className="w-4 h-4 text-blue-600" />;
    }
    if (file.type.includes('text')) {
      return <DocumentIcon className="w-4 h-4 text-green-500" />;
    }
    return <DocumentIcon className="w-4 h-4 text-purple-500" />;
  };

  return (
    <div className={`sticky bottom-0 px-6 py-4 border-t ${isDarkMode ? 'border-dark-border bg-dark-card' : 'border-gray-200 bg-white'} z-10`}>  
      {/* Reply Preview Container */}
      {replyingTo && (
        <div className={`mb-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowUturnLeftIcon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Replying to {replyingTo.sender.name}
              </span>
            </div>
            <button
              onClick={handleCancelReply}
              className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            >
              <XMarkIcon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
          <p className={`mt-1.5 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
            {replyingTo.content}
          </p>
        </div>
      )}

      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="mb-2">
          {selectedFiles.filter(f => f.file.type.startsWith('image/')).length > 0 && (
            <div className="grid grid-cols-6 gap-0.5 mb-1">
              {selectedFiles
                .filter(file => file.file.type.startsWith('image/'))
                .map((file) => (
                  <div
                    key={file.id}
                    className="relative aspect-square rounded-md overflow-hidden group shadow-sm"
                  >
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    >
                      <XMarkIcon className="w-2 h-2" />
                    </button>
                  </div>
                ))}
            </div>
          )}

          {selectedFiles.filter(f => !f.file.type.startsWith('image/')).length > 0 && (
            <div className="space-y-0.5">
              {selectedFiles
                .filter(file => !file.file.type.startsWith('image/'))
                .map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-1.5 p-1 rounded-md ${
                      isDarkMode ? 'bg-dark-card-hover' : 'bg-gray-100/80'
                    } group shadow-sm transition-all duration-200 hover:shadow-md`}
                  >
                    <div className={`p-0.5 rounded ${
                      isDarkMode ? 'bg-dark-card' : 'bg-white/80'
                    }`}>
                      {getFileIcon(file.file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[9px] font-medium truncate ${
                        isDarkMode ? 'text-dark-text' : 'text-gray-900'
                      }`}>
                        {file.file.name}
                      </p>
                      <p className={`text-[8px] ${
                        isDarkMode ? 'text-dark-text-secondary' : 'text-gray-600'
                      }`}>
                        {formatFileSize(file.file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className={`p-0.5 ${
                        isDarkMode ? 'hover:bg-dark-card-hover' : 'hover:bg-gray-200'
                      } rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110`}
                    >
                      <XMarkIcon className="w-2 h-2" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Left: Attach buttons */}
        <div className="flex items-center gap-2 self-end pb-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 ${isDarkMode ? 'bg-dark-card-hover hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} rounded-full transition-colors`}
          >
            <PlusCircleIcon className="w-4 h-4 text-purple-600" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleFileChange}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 ${isDarkMode ? 'bg-dark-card-hover hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} rounded-full transition-colors`}
          >
            <PhotoIcon className="w-4 h-4 text-blue-600" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 ${isDarkMode ? 'bg-dark-card-hover hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} rounded-full transition-colors`}
          >
            <GifIcon className="w-4 h-4 text-green-600" />
          </button>
        </div>

        {/* Center: Input area */}
        <div className="flex-1">
          <div className={`relative ${replyingTo ? 'ring-2 ring-purple-500 rounded-full' : ''}`}>
            <div className={`flex items-center gap-2 ${replyingTo ? 'bg-purple-50 dark:bg-purple-900/10' : ''}`}>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={replyingTo ? "Write a reply..." : "Type a message..."}
                  value={replyingTo ? replyContent : newMessage}
                  onChange={(e) => replyingTo ? setReplyContent(e.target.value) : setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (replyingTo && handleSendReply) {
                        handleSendReply();
                      } else {
                        handleSendMessage(newMessage);
                      }
                    }
                  }}
                  className={`w-full ${isDarkMode 
                    ? 'bg-gray-800 text-dark-text placeholder-gray-400 border border-gray-700 shadow-sm' 
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500 border border-gray-200 shadow-sm'} px-4 pr-10 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors`}
                />
                
                {/* AI Assistant Icon inside input */}
                {conversationId && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <MessageSuggestions
                      conversationId={conversationId}
                      isDarkMode={isDarkMode}
                      onSuggestionSelect={(suggestion: RealTimeSuggestion) => {
                        if (replyingTo) {
                          setReplyContent(suggestion.content);
                        } else {
                          setNewMessage(suggestion.content);
                        }
                      }}
                      onSuggestionAccept={(suggestion: RealTimeSuggestion) => {
                        console.log('Suggestion accepted:', suggestion);
                      }}
                      onSuggestionReject={(suggestion: RealTimeSuggestion) => {
                        console.log('Suggestion rejected:', suggestion);
                      }}
                      variant="input-icon"
                      className=""
                    />
                  </div>
                )}
              </div>
              
              <div className="relative" ref={emojiPickerRef}>
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2.5 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition-colors`}
                >
                  <FaceSmileIcon className="w-4 h-4 text-yellow-400" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <EmojiPicker
                      onEmojiSelect={(emoji: string) => {
                        if (replyingTo) {
                          setReplyContent(replyContent + emoji);
                        } else {
                          setNewMessage(newMessage + emoji);
                        }
                        setShowEmojiPicker(false);
                      }}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  if (replyingTo && handleSendReply) {
                    handleSendReply();
                  } else {
                    // Convert selectedFiles to FileUpload format
                    const fileUploads = selectedFiles.map(file => ({
                      id: file.id,
                      file: file.file,
                      progress: 0,
                      status: 'pending' as const,
                      fileName: file.file.name,
                      fileSize: formatFileSize(file.file.size),
                      fileType: file.file.type,
                      preview: file.preview
                    }));
                    handleSendMessage(newMessage, fileUploads);
                  }
                  setSelectedFiles([]);
                }}
                disabled={!newMessage.trim() && !replyingTo}
                className={`p-2.5 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <PaperAirplaneIcon className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput; 