import { Link } from 'react-router-dom';
import {
  HomeIcon,
  SparklesIcon,
  UserGroupIcon,
  BookmarkIcon,
  StarIcon,
  BeakerIcon,
  CommandLineIcon,
  CakeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  return (
    <div className="fixed w-64 h-full bg-[#1a1d24] pt-16 border-r border-gray-700">
      <div className="px-4 py-6">
        <nav className="space-y-1">
          <div className="mb-8">
            <h2 className="px-3 text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Navigation
            </h2>
            <div className="space-y-1">
              <Link to="/"
                className="flex items-center px-3 py-2 text-white bg-purple-600 rounded-md group"
              >
                <HomeIcon className="mr-3 h-6 w-6" />
                Home Feed
              </Link>
              <Link to="/discover"
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md group"
              >
                <SparklesIcon className="mr-3 h-6 w-6" />
                Discover
              </Link>
              <Link to="/connections"
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md group relative"
              >
                <UserGroupIcon className="mr-3 h-6 w-6" />
                Connection Requests
                <span className="ml-auto bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  4
                </span>
              </Link>
              <Link to="/communities"
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md group"
              >
                <UserGroupIcon className="mr-3 h-6 w-6" />
                Communities
              </Link>
              <Link to="/saved"
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md group"
              >
                <BookmarkIcon className="mr-3 h-6 w-6" />
                Saved Posts
              </Link>
              <Link to="/ratings"
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md group"
              >
                <StarIcon className="mr-3 h-6 w-6" />
                Your Ratings
              </Link>
            </div>
          </div>

          <div>
            <h2 className="px-3 text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Your Communities
            </h2>
            <div className="space-y-1">
              <Link to="/communities/philosophy"
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md group"
              >
                <BeakerIcon className="mr-3 h-6 w-6" />
                Philosophy
              </Link>
              <Link to="/communities/programming"
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md group"
              >
                <CommandLineIcon className="mr-3 h-6 w-6" />
                Programming
              </Link>
              <Link to="/communities/cooking"
                className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md group"
              >
                <CakeIcon className="mr-3 h-6 w-6" />
                Cooking
              </Link>
              <button
                className="flex items-center px-3 py-2 w-full text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md group transition-colors"
              >
                <PlusIcon className="mr-3 h-6 w-6" />
                Browse More
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
} 