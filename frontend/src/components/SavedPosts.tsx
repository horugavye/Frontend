import { FC, useState, useEffect } from 'react';
import {
  BookmarkIcon,
  ClockIcon,
  ChartBarIcon,
  FolderIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  EyeIcon,
  ArrowPathIcon,
  SparklesIcon,
  ShareIcon,
  ArchiveBoxIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Navigation from './Navigation';
import PostCard from './PostCard';
import api from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  thumbnail?: string;
}

interface SavedCategory {
  name: string;
  count: number;
  icon: string;
  color: string;
}

interface ReadingStats {
  totalReadingTime: number;
  postsRead: number;
  averageRating: number;
  savedThisWeek: number;
}

// CardContainer for consistent UI
const CardContainer: FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm transition-colors duration-200 ${className}`}>
    {children}
  </div>
);

const SavedPosts: FC = () => {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`${API_ENDPOINTS.SAVED_POSTS}/`);
      console.log('Fetched saved posts:', response.data);
      
      // Transform the API response to match our Post interface
      const transformedPosts = response.data.map((post: any) => ({
        id: post.post.id,
        originalId: post.post.id.toString(),
        title: post.post.title,
        content: post.post.content,
      author: {
          name: post.post.author?.first_name && post.post.author?.last_name 
            ? `${post.post.author.first_name} ${post.post.author.last_name}`
            : post.post.author?.name || 'Anonymous User',
          username: post.post.author?.username || 'anonymous',
          avatarUrl: post.post.author?.avatar || 'https://ui-avatars.com/api/?background=random',
          personalityTags: post.post.author?.personality_tags?.map((tag: any) => ({
            name: tag.name,
            color: tag.color || 'bg-purple-500 text-white'
          })) || [],
          role: post.post.visibility?.startsWith('personal_') ? post.post.author?.role : post.post.community?.name || 'Community'
        },
        author_role: post.post.visibility?.startsWith('personal_') ? post.post.author_role : post.post.community?.name || 'Community',
        isPersonal: post.post.visibility?.startsWith('personal_'),
        timestamp: post.post.created_at,
        rating: post.post.rating || 0,
        userRating: post.post.user_rating || 0,
        totalRatings: post.post.total_ratings || 0,
        commentCount: post.post.comment_count || 0,
        media: post.post.media?.map((item: any) => ({
          type: item.type,
          url: item.file,
          thumbnail: item.thumbnail || (item.type === 'video' ? item.file : undefined),
          alt: `Media for ${post.post.title}`
        })).sort((a: any, b: any) => a.order - b.order) || [],
        community: post.post.community?.slug || null,
        tags: post.post.topics?.map((topic: any) => ({
          name: topic.name || topic,
          color: topic.color || 'bg-purple-500 text-white'
        })) || [],
        isSaved: true
      }));

      setSavedPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      setError('Failed to load saved posts. Please try again later.');
      toast.error('Failed to load saved posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const categories: SavedCategory[] = [
    { name: 'Technology', count: 12, icon: '💻', color: 'bg-blue-100 text-blue-600' },
    { name: 'Science', count: 8, icon: '🔬', color: 'bg-green-100 text-green-600' },
    { name: 'Philosophy', count: 5, icon: '🤔', color: 'bg-purple-100 text-purple-600' },
    { name: 'Art', count: 4, icon: '🎨', color: 'bg-pink-100 text-pink-600' },
  ];

  const readingStats: ReadingStats = {
    totalReadingTime: 120, // minutes
    postsRead: 15,
    averageRating: 4.5,
    savedThisWeek: 8,
  };

  const recommendedPosts = [
    {
      title: "Machine Learning Ethics",
      author: "Dr. Sarah Chen",
      timestamp: "2 days ago",
      matchScore: 95,
    },
    {
      title: "The Future of Quantum Computing",
      author: "Alex Morgan",
      timestamp: "1 day ago",
      matchScore: 92,
    },
  ];

  return (
    <div className="flex-1 bg-gray-100 dark:bg-dark-bg transition-colors duration-200 min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
              <CardContainer>
                <Navigation />
              </CardContainer>
            </div>
          </div>

          {/* Main Content - Saved Posts */}
          <div className="lg:col-span-6 order-2 lg:order-2">
            <div className="space-y-4">
              {/* Header */}
              <CardContainer>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <BookmarkIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Saved Posts</h1>
                  </div>
                  <button 
                    onClick={fetchSavedPosts}
                    className="w-full sm:w-auto p-2 bg-white dark:bg-dark-card text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900/30"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                  </button>
                </div>
              </CardContainer>

              {/* Saved Posts List */}
              <CardContainer>
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 sm:py-12">
                      <BookmarkIcon className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-4" />
                      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Posts</h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{error}</p>
                      <button 
                        onClick={fetchSavedPosts}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : savedPosts.length > 0 ? (
                    savedPosts.map((post) => (
                      <PostCard 
                        key={`${post.isPersonal ? 'personal' : 'community'}-${post.id}`}
                        {...post}
                        onPostUnsave={() => {
                          setSavedPosts(prev => prev.filter(p => p.id !== post.id || p.isPersonal !== post.isPersonal));
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <BookmarkIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">No Saved Posts Yet</h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Posts you save will appear here for easy access later.</p>
                    </div>
                  )}
                </div>
              </CardContainer>
            </div>
          </div>

          {/* Right Sidebar - Reading Stats and Features - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3 order-3 lg:order-3">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
              <div className="space-y-4">
                {/* Reading Stats */}
                <CardContainer>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 dark:text-purple-400" />
                      Reading Stats
                    </h2>
                    <button className="p-2 bg-white dark:bg-dark-card text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900/30">
                      <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Reading Time</span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium text-sm sm:text-base">{readingStats.totalReadingTime} mins</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Posts Read</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium text-sm sm:text-base">{readingStats.postsRead}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Average Rating</span>
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        <span className="text-green-600 dark:text-green-400 font-medium text-sm sm:text-base">{readingStats.averageRating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Saved This Week</span>
                      <span className="text-orange-600 dark:text-orange-400 font-medium text-sm sm:text-base">{readingStats.savedThisWeek}</span>
                    </div>
                  </div>
                </CardContainer>

                {/* Categories */}
                <CardContainer>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FolderIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 dark:text-purple-400" />
                    Categories
                  </h2>
                  <div className="space-y-3">
                    {categories.map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl sm:text-2xl">{category.icon}</span>
                          <span className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">{category.name}</span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{category.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContainer>

                {/* Recommended Posts */}
                <CardContainer>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 dark:text-purple-400" />
                    Recommended
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    {recommendedPosts.map((post, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{post.title}</h3>
                          <span className="text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium">{post.matchScore}% match</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{post.author}</span>
                          <span className="text-gray-500 dark:text-gray-400">{post.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContainer>

                {/* Quick Actions */}
                <CardContainer>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-sm sm:text-base">
                      <TagIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      Organize Posts
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-sm sm:text-base">
                      <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      View Reading History
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-sm sm:text-base">
                      <ArchiveBoxIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      Archive Old Posts
                    </button>
                  </div>
                </CardContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedPosts; 