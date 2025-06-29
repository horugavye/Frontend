import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, BellIcon, EnvelopeIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsProfileMenuOpen(false);
  };

  const handleViewProfile = () => {
    if (!user?.username) {
      console.error('No username available');
      return;
    }
    navigate(`/profile/${user.username}`);
    setIsProfileMenuOpen(false);
  };

  // Add effect to log user state changes
  useEffect(() => {
    console.log('Current user state:', user);
  }, [user]);
  
  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-blue-600 text-2xl font-bold">Superlink</span>
            </Link>
            <div className="ml-10 flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full bg-gray-100 border border-gray-200 rounded-full py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Search communities, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full relative">
              <BellIcon className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-4 h-4 text-xs flex items-center justify-center text-white">3</span>
            </button>
            <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full relative">
              <EnvelopeIcon className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-4 h-4 text-xs flex items-center justify-center text-white">2</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg transition duration-150 ease-in-out"
              >
                {user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl}
                    alt={`${user.username}'s profile`}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-600" />
                )}
                <span className="text-gray-700 text-sm font-medium">
                  {user?.username || 'User'}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </button>

              <Transition
                show={isProfileMenuOpen}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={handleViewProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      View Profile
                    </button>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 