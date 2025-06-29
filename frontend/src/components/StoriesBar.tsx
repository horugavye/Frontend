import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface Story {
  id: string;
  type: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    first_name?: string;
    last_name?: string;
    id: string;
  };
  created_at: string;
  duration: number;
  viewed: boolean;
}

const VISIBLE_COUNT = 5;

const ChevronLeft = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getAvatarUrl = (avatar: string) => {
  if (!avatar || avatar === '' || avatar === '/default.jpg') {
    return undefined;
  }
  
  if (avatar.startsWith('http')) {
    return avatar;
  }
  
  return `${API_BASE_URL}/media/${avatar}`;
};

const StoriesBar: React.FC = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIdx, setStartIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        // Fetch friends
        const friendsResponse = await api.get('/api/connections/connections/friends/');
        const friends = friendsResponse.data;
        // Fetch all stories
        const storiesResponse = await api.get('/api/stories/stories/');
        // Filter stories to only those from friends or the current user
        const userId = user ? String(user.id) : null;
        const friendIds = new Set(friends.map((f: any) => String(f.id)));
        const now = new Date();
        const filteredStories = storiesResponse.data.filter((story: any) => {
          const authorId = String(story.author.id);
          const createdAt = new Date(story.created_at);
          const isRecent = (now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000; // 24 hours in ms
          return (friendIds.has(authorId) || (userId && authorId === userId)) && isRecent;
        });
        setStories(filteredStories);
      } catch (error) {
        setStories([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchStories();
  }, [user]);

  const handlePrev = () => {
    setStartIdx((prev) => Math.max(prev - VISIBLE_COUNT, 0));
  };

  const handleNext = () => {
    setStartIdx((prev) =>
      Math.min(prev + VISIBLE_COUNT, stories.length - VISIBLE_COUNT)
    );
  };

  // Deduplicate stories by author.id
  const uniqueStories = React.useMemo(() => {
    const seen = new Set();
    return stories.filter((story) => {
      if (seen.has(story.author.id)) return false;
      seen.add(story.author.id);
      return true;
    });
  }, [stories]);

  const visibleStories = uniqueStories.slice(startIdx, startIdx + VISIBLE_COUNT);
  const showPrev = startIdx > 0;
  const showNext = startIdx + VISIBLE_COUNT < uniqueStories.length;

  if (loading) {
    return (
      <div className="w-full py-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 bg-white dark:bg-dark-card rounded-xl shadow-sm flex items-center justify-start">
      {showPrev && (
        <button
          onClick={handlePrev}
          className={`mr-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition flex items-center justify-center`}
          aria-label="Previous stories"
        >
          <ChevronLeft />
        </button>
      )}
      <div className="flex space-x-6 px-2">
        {visibleStories.map((story) => (
          <div
            key={story.id}
            className="flex flex-col items-center min-w-[70px] cursor-pointer"
            onClick={() => navigate(`/stories?user=${story.author.id}`)}
          >
            <div
              className={`w-16 h-16 rounded-full p-1 mb-1 ${story.viewed ? 'bg-gradient-to-tr from-gray-300 via-gray-400 to-gray-500' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`}
            >
              <div className="w-full h-full rounded-full bg-white dark:bg-dark-card flex items-center justify-center">
                {getAvatarUrl(story.author.avatar) ? (
                  <img
                    src={getAvatarUrl(story.author.avatar)}
                    alt={((story.author.first_name || story.author.last_name) ? `${story.author.first_name || ''} ${story.author.last_name || ''}`.trim() : (story.author.name || story.author.username))}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-dark-card"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center border-2 border-white dark:border-dark-card">
                    <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-200 truncate w-16 text-center">
              {((story.author.first_name || story.author.last_name) ? `${story.author.first_name || ''} ${story.author.last_name || ''}`.trim() : (story.author.name || story.author.username))}
            </span>
          </div>
        ))}
      </div>
      {showNext && (
        <button
          onClick={handleNext}
          className={`ml-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition flex items-center justify-center`}
          aria-label="Next stories"
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
};

export default StoriesBar; 