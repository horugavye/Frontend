import { FC, useState } from 'react';
import {
  PaperAirplaneIcon,
  PlusCircleIcon,
  FaceSmileIcon,
  PhotoIcon,
  GifIcon,
  XMarkIcon,
  ChevronDownIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  content: string;
  sender: {
    name: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isOwn: boolean;
}

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chat: FC<ChatProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  // Sample messages
  const messages: Message[] = [
    {
      id: '1',
      content: "Hey! I saw your post about habit formation. Really interesting stuff! 🧠",
      sender: {
        name: "Alex Morgan",
        avatarUrl: "https://i.pravatar.cc/150?img=12",
        isOnline: true
      },
      timestamp: "2 min ago",
      status: 'read',
      isOwn: true
    },
    {
      id: '2',
      content: "Thanks! Yes, I'm particularly interested in how dopamine plays a role in habit loops. Would love to discuss more!",
      sender: {
        name: "Dr. Amanda Foster",
        avatarUrl: "https://i.pravatar.cc/150?img=23",
        isOnline: true
      },
      timestamp: "1 min ago",
      status: 'delivered',
      isOwn: false
    },
    {
      id: '3',
      content: "Absolutely! I've been reading some fascinating research on that. Have you seen the latest studies on habit stacking?",
      sender: {
        name: "Alex Morgan",
        avatarUrl: "https://i.pravatar.cc/150?img=12",
        isOnline: true
      },
      timestamp: "Just now",
      status: 'sent',
      isOwn: true
    }
  ];

  const MessageStatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <div className="flex space-x-0.5">
          <CheckCircleIcon className="h-3 w-3 text-gray-400" />
          <CheckCircleIcon className="h-3 w-3 text-gray-400" />
        </div>;
      case 'read':
        return <div className="flex space-x-0.5">
          <CheckCircleIcon className="h-3 w-3 text-blue-400" />
          <CheckCircleIcon className="h-3 w-3 text-blue-400" />
        </div>;
      case 'failed':
        return <XCircleIcon className="h-3 w-3 text-red-400" />;
      default:
        return <ClockIcon className="h-3 w-3 text-gray-400 animate-spin" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-0 right-4 w-[380px] bg-gray-800 rounded-t-xl shadow-xl flex flex-col transition-all duration-300 ease-in-out ${
      isMinimized ? 'h-[60px]' : 'h-[600px]'
    }`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src="https://i.pravatar.cc/150?img=23"
              alt="Dr. Amanda Foster"
              className="w-10 h-10 rounded-full"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
          </div>
          <div>
            <h3 className="text-gray-200 font-medium">Dr. Amanda Foster</h3>
            <p className="text-green-500 text-xs">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700">
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700">
            <VideoCameraIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700">
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700"
            onClick={onClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[80%]`}>
                  {!msg.isOwn && (
                    <img
                      src={msg.sender.avatarUrl}
                      alt={msg.sender.name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        msg.isOwn
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-700 text-gray-200 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs text-gray-400">{msg.timestamp}</span>
                      {msg.isOwn && (
                        <div className="flex items-center space-x-1">
                          <MessageStatusIcon status={msg.status} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700">
                  <PlusCircleIcon className="w-6 h-6" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700">
                  <PhotoIcon className="w-6 h-6" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700">
                  <GifIcon className="w-6 h-6" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700">
                  <FaceSmileIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-gray-700 text-gray-200 rounded-full pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-purple-500 hover:text-purple-400 rounded-full hover:bg-gray-600">
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat; 