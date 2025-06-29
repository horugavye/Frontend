import { PhotoIcon, LinkIcon, ChartBarIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

export default function CreatePost() {
  return (
    <div className="bg-[#1e2128] rounded-lg shadow p-4 mb-4">
      <div className="flex items-center space-x-4">
        <UserCircleIcon className="h-10 w-10 text-gray-400" />
        <input
          type="text"
          placeholder="Share something meaningful..."
          className="flex-1 bg-[#2a2f38] border border-transparent rounded-lg px-4 py-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>
      <div className="flex items-center space-x-4 mt-4">
        <button className="flex items-center space-x-2 text-gray-400 hover:text-gray-300">
          <PhotoIcon className="h-6 w-6" />
          <span>Photo</span>
        </button>
        <button className="flex items-center space-x-2 text-gray-400 hover:text-gray-300">
          <LinkIcon className="h-6 w-6" />
          <span>Link</span>
        </button>
        <button className="flex items-center space-x-2 text-gray-400 hover:text-gray-300">
          <ChartBarIcon className="h-6 w-6" />
          <span>Poll</span>
        </button>
        <button className="flex items-center space-x-2 text-gray-400 hover:text-gray-300">
          <MicrophoneIcon className="h-6 w-6" />
          <span>Voice</span>
        </button>
      </div>
    </div>
  );
} 