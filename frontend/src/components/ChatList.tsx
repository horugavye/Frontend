import { FC, useState } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Chat from './Chat';

interface Conversation {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
}

const ChatList: FC = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const conversations: Conversation[] = [
    {
      id: '1',
      user: {
        name: 'Dr. Amanda Foster',
        avatarUrl: 'https://i.pravatar.cc/150?img=23',
        isOnline: true
      },
      lastMessage: {
        content: "Thanks! Yes, I'm particularly interested in how dopamine plays a role...",
        timestamp: '2 min ago',
        isRead: true
      }
    },
    {
      id: '2',
      user: {
        name: 'Ryan Chang',
        avatarUrl: 'https://i.pravatar.cc/150?img=18',
        isOnline: true
      },
      lastMessage: {
        content: 'The temples in Kyoto are absolutely breathtaking! 🏯',
        timestamp: '1 hour ago',
        isRead: false
      }
    },
    {
      id: '3',
      user: {
        name: 'Emily Rodriguez',
        avatarUrl: 'https://i.pravatar.cc/150?img=15',
        isOnline: false
      },
      lastMessage: {
        content: "I'll share my sourdough starter recipe with you! 🍞",
        timestamp: '2 hours ago',
        isRead: true
      }
    }
  ];

  return (
    <div className="fixed bottom-0 right-4 w-[320px] bg-gray-800 rounded-t-xl shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-gray-200 font-semibold">Messages</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">3 unread</span>
          <button className="p-1.5 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700">
            <ChevronDownIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-gray-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-h-[400px] overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-700 transition-colors duration-200 relative"
            onClick={() => setActiveChat(conversation.id)}
          >
            <div className="relative">
              <img
                src={conversation.user.avatarUrl}
                alt={conversation.user.name}
                className="w-12 h-12 rounded-full"
              />
              {conversation.user.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-200 font-medium truncate">{conversation.user.name}</h3>
                <span className="text-xs text-gray-400 flex-shrink-0">{conversation.lastMessage.timestamp}</span>
              </div>
              <p className={`text-sm truncate ${conversation.lastMessage.isRead ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>
                {conversation.lastMessage.content}
              </p>
            </div>
            {!conversation.lastMessage.isRead && (
              <div className="absolute top-1/2 right-4 transform -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Active Chat Window */}
      {activeChat && (
        <Chat
          isOpen={true}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
};

export default ChatList; 