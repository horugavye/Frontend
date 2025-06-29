import { FC, useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, FaceSmileIcon, EllipsisHorizontalIcon, PhotoIcon, DocumentIcon, CheckCircleIcon, ClockIcon, XCircleIcon, VideoCameraIcon, MusicalNoteIcon, PlusCircleIcon, GifIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';
import { Message, MessageThread } from '../types/messenger';
import EmojiPicker from './EmojiPicker';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import MessageInfoModal from './MessageInfoModal';
import ForwardMessageModal from './ForwardMessageModal';
import api from '../utils/api';

const DEFAULT_AVATAR = '/default-avatar.png';

interface ThreadViewProps {
  thread: MessageThread;
  onClose: () => void;
  onSendReply: (content: string, parentMessageId: string, attachments?: File[]) => Promise<void>;
  onReaction: (messageId: string, emoji: string) => Promise<void>;
  isDarkMode: boolean;
}

const MessageStatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'sent':
      return <CheckCircleIcon className="w-4 h-4 text-gray-400" />;
    case 'delivered':
      return <CheckCircleIcon className="w-4 h-4 text-blue-400" />;
    case 'read':
      return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
    case 'sending':
      return <ClockIcon className="w-4 h-4 text-gray-400" />;
    case 'error':
      return <XCircleIcon className="w-4 h-4 text-red-400" />;
    default:
      return <CheckCircleIcon className="w-4 h-4 text-gray-400" />;
  }
};

const ThreadView: FC<ThreadViewProps> = ({
  thread,
  onClose,
  onSendReply,
  onReaction,
  isDarkMode
}) => {
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showReactionPickerId, setShowReactionPickerId] = useState<string | null>(null);
  const [localThread, setLocalThread] = useState<MessageThread>(thread);
  const [selectedMessageInfo, setSelectedMessageInfo] = useState<Message | null>(null);
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [selectedMessageToForward, setSelectedMessageToForward] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string }>({});
  const threadRef = useRef<MessageThread>(thread);
  const isInitialMount = useRef(true);

  // Initialize thread data
  useEffect(() => {
    if (thread) {
      console.log('Initializing thread data:', thread);
      const initialThread = {
        ...thread,
        replies: thread.replies || [],
        repliesCount: thread.repliesCount || 0,
        participantsCount: thread.participantsCount || 0,
        lastReplyAt: thread.lastReplyAt || thread.parentMessage.timestamp
      };
      threadRef.current = initialThread;
      setLocalThread(initialThread);
    }
  }, [thread]);

  // Fetch thread replies when component mounts
  useEffect(() => {
    let isMounted = true;

    const fetchThreadReplies = async () => {
      try {
        if (!threadRef.current?.parentMessage?.conversation || !threadRef.current?.parentMessage?.id) {
          console.error('Missing conversation or message ID');
          return;
        }

        console.log('Fetching thread replies for:', {
          conversationId: threadRef.current.parentMessage.conversation,
          messageId: threadRef.current.parentMessage.id
        });

        const response = await api.get(
          `/api/chat/conversations/${threadRef.current.parentMessage.conversation}/messages/${threadRef.current.parentMessage.id}/threads/`
        );

        if (response.data && isMounted) {
          console.log('Received thread replies:', response.data);
          
          // Preserve existing replies if they exist
          const existingReplies = threadRef.current.replies || [];
          const newReplies = (response.data.messages || []).map((msg: any) => ({
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
            conversation: threadRef.current.parentMessage.conversation,
            conversation_id: threadRef.current.parentMessage.conversation,
            message_type: msg.message_type || 'text',
            files: msg.files || [],
            isThreadReply: true,
            parent_message_id: threadRef.current.parentMessage.id,
            thread_id: threadRef.current.id,
            attachments: msg.files?.map((file: any) => ({
              id: file.id,
              type: file.file_type || 'file',
              url: file.url || file.file,
              thumbnail: file.thumbnail_url || '',
              fileName: file.file_name,
              fileSize: file.file_size,
              duration: file.duration
            })) || []
          }));

          // Merge existing and new replies, avoiding duplicates
          const mergedReplies = [...existingReplies];
          newReplies.forEach(newReply => {
            const existingIndex = mergedReplies.findIndex(r => r.id === newReply.id);
            if (existingIndex >= 0) {
              mergedReplies[existingIndex] = newReply;
            } else {
              mergedReplies.push(newReply);
            }
          });

          const updatedThread: MessageThread = {
            ...threadRef.current,
            replies: mergedReplies,
            participantsCount: response.data.participants?.length || threadRef.current.participantsCount || 0,
            lastReplyAt: response.data.last_reply_at || response.data.created_at || threadRef.current.lastReplyAt,
            repliesCount: mergedReplies.length
          };

          console.log('Setting updated thread:', updatedThread);
          threadRef.current = updatedThread;
          setLocalThread(updatedThread);
        }
      } catch (error) {
        console.error('Error fetching thread replies:', error);
        if (isMounted) {
          toast.error('Failed to load thread replies');
        }
      }
    };

    fetchThreadReplies();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Update local thread when prop changes
  useEffect(() => {
    if (thread && !isInitialMount.current) {
      console.log('Thread prop changed:', thread);
      // Only update if the thread ID matches
      if (thread.id === threadRef.current?.id) {
        const updatedThread = {
          ...thread,
          replies: thread.replies || threadRef.current.replies || [],
          repliesCount: thread.repliesCount || threadRef.current.repliesCount || 0,
          participantsCount: thread.participantsCount || threadRef.current.participantsCount || 0,
          lastReplyAt: thread.lastReplyAt || threadRef.current.lastReplyAt || thread.parentMessage.timestamp
        };
        console.log('Setting updated thread from prop:', updatedThread);
        threadRef.current = updatedThread;
        setLocalThread(updatedThread);
      }
    }
    isInitialMount.current = false;
  }, [thread]);

  // Handle WebSocket updates
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        // Ignore heartbeat messages
        if (data.type === 'heartbeat' || data.type === 'ping' || data.type === 'pong') return;
        
        if (data.type === 'chat_message' && data.message) {
          const message = data.message;
          console.log('Received WebSocket message:', message);
          
          // Check if this message belongs to our thread
          if (message.thread_id === threadRef.current?.id || 
              (message.parent_message_id === threadRef.current?.parentMessage?.id)) {
            console.log('Message belongs to current thread, updating...');
            
            // Ensure we have the latest thread state
            const currentThread = threadRef.current;
            if (!currentThread) return;

            setLocalThread(prev => {
              if (!prev) return prev;
              
              // Create a new array of replies
              const updatedReplies = [...(prev.replies || [])];
              const existingIndex = updatedReplies.findIndex(r => r.id === message.id);
              
              const newMessage = {
                id: message.id,
                content: message.content,
                sender: {
                  id: message.sender.id,
                  name: message.sender.username || message.sender.name || '',
                  avatarUrl: message.sender.avatar_url || DEFAULT_AVATAR,
                  role: message.sender.role || 'Member'
                },
                timestamp: message.created_at,
                status: message.status || 'sent',
                isOwn: String(message.sender.id) === String(user?.id),
                conversation: currentThread.parentMessage.conversation,
                conversation_id: currentThread.parentMessage.conversation,
                message_type: message.message_type || 'text',
                files: message.files || [],
                isThreadReply: true,
                parent_message_id: currentThread.parentMessage.id,
                thread_id: currentThread.id,
                attachments: message.files?.map((file: any) => ({
                  id: file.id,
                  type: file.file_type || 'file',
                  url: file.url || file.file,
                  thumbnail: file.thumbnail_url || '',
                  fileName: file.file_name,
                  fileSize: file.file_size,
                  duration: file.duration
                })) || []
              };

              if (existingIndex >= 0) {
                updatedReplies[existingIndex] = newMessage;
              } else {
                updatedReplies.push(newMessage);
              }

              const updatedThread = {
                ...prev,
                replies: updatedReplies,
                repliesCount: updatedReplies.length,
                lastReplyAt: message.created_at || prev.lastReplyAt,
                participantsCount: Math.max(prev.participantsCount || 0, 
                  new Set([...updatedReplies.map(r => r.sender.id)]).size)
              };

              console.log('Updated thread with new message:', updatedThread);
              threadRef.current = updatedThread;
              return updatedThread;
            });
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    window.addEventListener('message', handleWebSocketMessage);
    return () => {
      window.removeEventListener('message', handleWebSocketMessage);
    };
  }, [user?.id]);

  // Scroll to bottom when replies change
  useEffect(() => {
    if (localThread?.replies?.length) {
      console.log('Scrolling to bottom, replies count:', localThread.replies.length);
      scrollToBottom();
    }
  }, [localThread?.replies]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() && selectedFiles.length === 0) {
      return;
    }

    try {
      if (!localThread?.parentMessage) {
        toast.error('Invalid thread data');
        return;
      }

      const conversationId = localThread.parentMessage.conversation || localThread.parentMessage.conversation_id;
      
      if (!conversationId) {
        toast.error('Invalid conversation - missing conversation ID');
        return;
      }

      await onSendReply(replyContent, localThread.parentMessage.id, selectedFiles);
      
      // Clear the input and files after successful send
      setReplyContent('');
      setSelectedFiles([]);
      setImagePreviews({});
      
      // Fetch updated thread data after sending reply
      const response = await api.get(
        `/api/chat/conversations/${conversationId}/messages/${localThread.parentMessage.id}/threads/`
      );

      if (response.data) {
        const updatedThread: MessageThread = {
          ...localThread,
          replies: (response.data.messages || []).map((msg: any) => ({
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
            conversation: conversationId,
            conversation_id: conversationId,
            message_type: msg.message_type || 'text',
            files: msg.files || [],
            isThreadReply: true,
            parent_message_id: localThread.parentMessage.id,
            thread_id: localThread.id,
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
          participantsCount: response.data.participants?.length || 0,
          lastReplyAt: response.data.last_reply_at || response.data.created_at,
          repliesCount: response.data.messages?.length || 0
        };
        threadRef.current = updatedThread;
        setLocalThread(updatedThread);
      }

      scrollToBottom();
    } catch (error) {
      console.error('Error sending thread reply:', error);
      toast.error('Failed to send reply');
    }
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    
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
    if (user.username && typeof user.username === 'string' && user.username.trim()) {
      return user.username;
    }
    
    return 'Unknown User';
  };

  const getAvatar = (avatarUrl?: string) => {
    if (!avatarUrl) return DEFAULT_AVATAR;
    return avatarUrl.startsWith('http') ? avatarUrl : `${process.env.REACT_APP_API_URL}${avatarUrl}`;
  };

  const isOwn = (message: Message) => {
    return message?.sender?.id === user?.id;
  };

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
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl h-[85vh] bg-gray-50 dark:bg-dark-bg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col backdrop-blur-lg animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Thread</h2>
            <span className="px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 rounded-full shadow-sm">
              {localThread?.participantsCount || 0} participants
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out transform hover:scale-110"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-gradient-to-b from-gray-50 to-purple-50/50 dark:from-dark-bg dark:to-gray-900/60 custom-scrollbar">
          {/* Parent Message */}
          {localThread?.parentMessage && (
            <div className="group relative">
              <div className={`flex ${isOwn(localThread.parentMessage) ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`flex items-start space-x-2 max-w-[70%] ${
                  isOwn(localThread.parentMessage) ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {/* Avatar */}
                  <img
                    src={getAvatar(localThread.parentMessage?.sender?.avatarUrl)}
                    alt={getDisplayName(localThread.parentMessage?.sender)}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = DEFAULT_AVATAR;
                    }}
                  />
                  {/* Message content and actions */}
                  <div className={`flex flex-col space-y-1 relative ${
                    isOwn(localThread.parentMessage) ? 'items-end' : 'items-start'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {getDisplayName(localThread.parentMessage?.sender)}
                      </span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl ${
                      isOwn(localThread.parentMessage)
                        ? isDarkMode
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-100'
                          : 'bg-gray-100 text-gray-900'
                    }`}>
                      {localThread.parentMessage?.content}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <MessageStatusIcon status={localThread.parentMessage.status || 'sent'} />
                      <span className="text-xs text-gray-400 dark:text-gray-400">
                        {new Date(localThread.parentMessage?.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {localThread?.replies && localThread.replies.length > 0 ? (
            localThread.replies.map((reply) => (
              <div key={reply.id} className={`flex ${isOwn(reply) ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`flex items-start space-x-2 max-w-[70%] ${
                  isOwn(reply) ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {/* Avatar */}
                  <img
                    src={getAvatar(reply?.sender?.avatarUrl)}
                    alt={getDisplayName(reply?.sender)}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = DEFAULT_AVATAR;
                    }}
                  />
                  {/* Message content and actions */}
                  <div className={`flex flex-col space-y-1 relative ${
                    isOwn(reply) ? 'items-end' : 'items-start'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {getDisplayName(reply?.sender)}
                      </span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl ${
                      isOwn(reply)
                        ? isDarkMode
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-100'
                          : 'bg-gray-100 text-gray-900'
                    }`}>
                      {reply?.content}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <MessageStatusIcon status={reply.status || 'sent'} />
                      <span className="text-xs text-gray-400 dark:text-gray-400">
                        {new Date(reply?.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No replies yet
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md z-10 shadow-lg">
          <div className="flex items-end gap-3">
            {/* Left: Attach buttons */}
            <div className="flex items-center gap-2 self-end pb-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 ${isDarkMode ? 'bg-dark-card-hover hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} rounded-full transition-colors`}
              >
                <PlusCircleIcon className="w-4 h-4 text-purple-600" />
              </button>
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
              <div className="relative">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Reply to thread..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    className={`flex-1 ${isDarkMode 
                      ? 'bg-gray-800 text-dark-text placeholder-gray-400 border border-gray-700 shadow-sm' 
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500 border border-gray-200 shadow-sm'} px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors`}
                  />
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2.5 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition-colors`}
                  >
                    <FaceSmileIcon className="w-4 h-4 text-yellow-400" />
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyContent.trim() && selectedFiles.length === 0}
                    className={`p-2.5 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <PaperAirplaneIcon className="w-4 h-4 text-purple-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* File Previews */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  {file.type.startsWith('image/') ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <img
                        src={imagePreviews[file.name] || URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {getFileIcon(file)}
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 text-gray-500 hover:text-red-500"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4 z-50 animate-fadeIn" ref={emojiPickerRef}>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setReplyContent(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Message Info Modal */}
      {showMessageInfo && selectedMessageInfo && (
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

      {/* Forward Message Modal */}
      {showForwardModal && selectedMessageToForward && (
        <ForwardMessageModal
          isOpen={showForwardModal}
          onClose={() => {
            setShowForwardModal(false);
            setSelectedMessageToForward(null);
          }}
          onForward={async (conversationIds: string[]) => {
            try {
              await Promise.all(
                conversationIds.map(convId =>
                  api.post(`/api/chat/conversations/${convId}/messages/`, {
                    content: selectedMessageToForward.content,
                    forwarded_from: selectedMessageToForward.id,
                    attachments: selectedMessageToForward.attachments
                  })
                )
              );
              toast.success('Message forwarded successfully');
            } catch (error) {
              console.error('Error forwarding message:', error);
              toast.error('Failed to forward message');
            }
            setShowForwardModal(false);
            setSelectedMessageToForward(null);
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default ThreadView; 