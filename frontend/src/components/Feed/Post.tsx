import { UserCircleIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftIcon, HandThumbUpIcon, ShareIcon } from '@heroicons/react/24/outline';

interface PostProps {
  author: {
    name: string;
    community: string;
    badges: string[];
    timeAgo: string;
  };
  content: {
    title: string;
    body: string;
  };
  stats: {
    rating: number;
    comments: number;
  };
}

export default function Post({ author, content, stats }: PostProps) {
  return (
    <div className="bg-[#1e2128] rounded-lg shadow mb-4">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <UserCircleIcon className="h-10 w-10 text-gray-400" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-white">{author.name}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">r/{author.community}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">{author.timeAgo}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              {author.badges.map((badge, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    badge === 'Deep Thinker' ? 'bg-purple-500 text-white' :
                    badge === 'Empathetic' ? 'bg-blue-500 text-white' :
                    'bg-gray-600 text-white'
                  }`}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <h2 className="text-lg font-semibold text-white">{content.title}</h2>
          <p className="mt-2 text-gray-300">{content.body}</p>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1 text-gray-400 hover:text-gray-300">
              <HandThumbUpIcon className="h-5 w-5" />
              <span>{stats.rating}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-400 hover:text-gray-300">
              <ChatBubbleLeftIcon className="h-5 w-5" />
              <span>{stats.comments} comments</span>
            </button>
          </div>
          <button className="flex items-center space-x-1 text-gray-400 hover:text-gray-300">
            <ShareIcon className="h-5 w-5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
} 