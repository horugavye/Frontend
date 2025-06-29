import { FC, useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ChatWebSocketProvider } from './context/ChatWebSocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Header from './components/Header';
import Navigation from './components/Navigation';
import CreatePost from './components/CreatePost';
import PostCard from './components/PostCard';
import SuggestedCommunities from './components/aisuggested';
import MessengerUI from './components/MessengerUI';
import UserProfile from './components/UserProfile';
import Discover from './components/Discover';
import Communities from './components/Communities';
import SavedPosts from './components/SavedPosts';
import ConnectionRequest from './components/ConnectionRequest';
import CommunityView from './components/CommunityView';
import PostDetail from './components/PostDetail';
import Settings from './pages/Settings';
import Research from './pages/Research';
import Stories from './pages/Stories';
import api from './utils/axios';
import axios from 'axios';
import { API_ENDPOINTS } from './config/api';
import { GlobalChatWebSocketProvider } from './context/GlobalChatWebSocketContext';
import AssistantUI from './components/AssistantUI';
import StoriesBar from './components/StoriesBar';
import ReactModal from 'react-modal';

// Helper function to get avatar URL
const getAvatarUrl = (avatar: string | null): string => {
  if (!avatar) {
    return '/default.jpg';  // Points to frontend/public/default.jpg (not backend media)
  }
  return avatar.startsWith('http') ? avatar : `${import.meta.env.VITE_API_URL}${avatar}`;
};

// Landing page component
const Landing: FC = () => {
  const { isAuthenticated, loading } = useAuth();
  console.log('[Landing] Render', { isAuthenticated, loading });

  if (loading) {
    // Show nothing or a spinner while loading
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 transition-colors duration-200">
            Welcome to Superlink
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto transition-colors duration-200">
            Connect with like-minded individuals, share your thoughts, and build meaningful relationships in a community that values authentic interactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/register"
              className="px-6 sm:px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all duration-200 text-center"
            >
              Get Started
            </Link>
            <a
              href="/login"
              className="px-6 sm:px-8 py-3 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium transition-all duration-200 text-center"
            >
              Sign In
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto mb-8 sm:mb-12">
          <div className="text-center p-4 sm:p-6 bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-gray-800 transition-colors duration-200">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-colors duration-200">
              <span role="img" aria-label="community" className="text-xl sm:text-2xl">🤝</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Meaningful Connections</h3>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 transition-colors duration-200">Connect with people who share your interests and values.</p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-gray-800 transition-colors duration-200">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-colors duration-200">
              <span role="img" aria-label="rating" className="text-xl sm:text-2xl">⭐</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Rating System</h3>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 transition-colors duration-200">Build trust and credibility through our unique rating system.</p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-gray-800 transition-colors duration-200 md:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-colors duration-200">
              <span role="img" aria-label="community" className="text-xl sm:text-2xl">💬</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Rich Discussions</h3>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 transition-colors duration-200">Engage in meaningful conversations that matter to you.</p>
          </div>
        </div>

        {/* Assistant UI below the welcome section */}
        <div className="flex justify-center">
          <AssistantUI />
        </div>
      </div>
    </div>
  );
};

// Dashboard component
const Dashboard: FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const handleRate = (rating: number, updatedPost: any) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === updatedPost.id) {
          // If unrating (rating = 0), recalculate the average rating
          if (rating === 0) {
            const previousUserRating = post.userRating;
            const totalRatings = post.totalRatings - 1;
            // Recalculate average rating: (current_total - user's_previous_rating) / (total_raters - 1)
            const newRating = totalRatings > 0 
              ? ((post.rating * post.totalRatings) - previousUserRating) / totalRatings
              : 0;

            return {
              ...post,
              rating: Number(newRating.toFixed(1)), // Round to 1 decimal place
              totalRatings: totalRatings,
              userRating: 0
            };
          }
          
          // For new ratings or rating changes
          const hasExistingRating = post.userRating > 0;
          const isNewRating = !hasExistingRating && rating > 0;
          
          // Calculate new average rating
          let newRating;
          if (isNewRating) {
            // New rating: (current_total + new_rating) / (total_raters + 1)
            newRating = ((post.rating * post.totalRatings) + rating) / (post.totalRatings + 1);
          } else {
            // Changing rating: (current_total - old_rating + new_rating) / total_raters
            newRating = ((post.rating * post.totalRatings) - post.userRating + rating) / post.totalRatings;
          }

          return {
            ...post,
            rating: Number(newRating.toFixed(1)), // Round to 1 decimal place
            totalRatings: isNewRating ? post.totalRatings + 1 : post.totalRatings,
            userRating: rating
          };
        }
        return post;
      })
    );
  };

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('=== Starting to fetch posts ===');
      
      // Fetch both personal and community posts using the feed endpoint
      const [personalResponse, communityResponse] = await Promise.all([
        api.get(`${API_ENDPOINTS.COMMUNITIES}/posts/feed/`, {
          params: {
            type: 'personal'
          }
        }),
        api.get(`${API_ENDPOINTS.COMMUNITIES}/posts/feed/`, {
          params: {
            type: 'community'
          }
        })
      ]);

      console.log('=== API Responses Received ===');
      console.log('Personal Posts:', personalResponse.data);
      console.log('Community Posts:', communityResponse.data);
      
      // Combine and sort posts by timestamp
      const allPosts = [
        ...personalResponse.data.posts.map((post: any) => ({ ...post, id: `personal_${post.id}` })),
        ...communityResponse.data.posts.map((post: any) => ({ ...post, id: `community_${post.id}` }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('Combined posts:', allPosts);
      
      // Transform the API response to match our Post interface
      console.log('=== Starting Post Transformation ===');
      const transformedPosts = allPosts.map((post: any, index: number) => {
        // Debug: log the raw post
        console.log('Raw post from API:', post);

        // Determine if the post is personal or community
        const isPersonal = post.id.startsWith('personal_');

        // Robustly extract the community slug
        let communitySlug = null;
        if (post.community) {
          if (typeof post.community === 'object' && post.community.slug) {
            communitySlug = post.community.slug;
          } else if (typeof post.community === 'string') {
            communitySlug = post.community;
          }
        }

        const transformedPost = {
          id: post.id,
          originalId: post.id.replace(/^(personal_|community_)/, ''),
          title: post.title,
          content: post.content,
          author: {
            name: post.author?.first_name && post.author?.last_name 
              ? `${post.author.first_name} ${post.author.last_name}`
              : post.author?.name || 'Anonymous User',
            username: post.author?.username || 'anonymous',
            avatarUrl: post.author?.avatar || getAvatarUrl(null),
            personalityTags: post.author?.personality_tags?.map((tag: any) => ({
              name: tag.name,
              color: tag.color || 'bg-purple-500 text-white'
            })) || [],
            role: isPersonal ? post.author?.role : (post.community?.name || 'Community')
          },
          author_role: isPersonal ? post.author_role : (post.community?.name || 'Community'),
          isPersonal: isPersonal,
          communityName: !isPersonal ? (post.community?.name || (typeof post.community === 'string' ? post.community : 'Community')) : '',
          timestamp: post.created_at,
          rating: post.rating || 0,
          userRating: post.user_rating || 0,
          totalRatings: post.total_ratings || 0,
          commentCount: post.comment_count || 0,
          media: post.media?.map((item: any) => ({
            type: item.type,
            url: item.file,
            thumbnail: item.thumbnail || (item.type === 'video' ? item.file : undefined),
            alt: `Media for ${post.title}`
          })).sort((a: any, b: any) => a.order - b.order) || [],
          community: communitySlug,
          tags: post.topics?.map((topic: any) => ({
            name: topic.name || topic,
            color: topic.color || 'bg-purple-500 text-white'
          })) || [],
          isSaved: post.is_saved || false
        };

        // Debug: log the transformed post
        console.log('Transformed post:', transformedPost);
        return transformedPost;
      });
      
      console.log('=== Post Transformation Complete ===');
      console.log('Final transformed posts:', transformedPosts);
      console.log('Number of transformed posts:', transformedPosts.length);
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error('=== Error Fetching Posts ===');
      console.error('Error object:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            params: error.config?.params
          }
        });
      }
    } finally {
      setIsLoading(false);
      console.log('=== Fetch Posts Process Complete ===');
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, user]);

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

          {/* Main Content - Stories, Create Post and Posts */}
          <div className="lg:col-span-6 order-2 lg:order-2">
            <div className="space-y-4">
              {/* Instagram-style Stories Bar */}
              <CardContainer className="mt-4">
                <StoriesBar />
              </CardContainer>
              {/* Facebook-style Stories (commented out) */}
              {/* <CardContainer className="mt-4">
                <Stories />
              </CardContainer> */}
              <CardContainer className="mt-4">
                <CreatePost onPostCreated={fetchPosts} />
              </CardContainer>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No posts to display. Start by creating your first post!
                  </div>
                ) : (
                  posts.map((post) => (
                    <CardContainer key={post.id}>
                      <PostCard 
                        {...post} 
                        onRate={handleRate}
                      />
                    </CardContainer>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Suggested Communities - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3 order-3 lg:order-3">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent dark:scrollbar-track-gray-800">
              <CardContainer>
                <SuggestedCommunities />
              </CardContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FloatingAssistantButton = ({ onClick }: { onClick: () => void }) => (
  <button
    className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none"
    onClick={onClick}
    aria-label="Open Superlink Assistant"
  >
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 sm:w-8 sm:h-8 fill-current"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h1a7 7 0 0 1 7 7h1a1 1 0 1 1 0 2h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1H3a1 1 0 1 1 0-2h1a7 7 0 0 1 7-7h1V5.72c-.6-.34-1-.98-1-1.72a2 2 0 0 1 2-2zM7.5 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    </svg>
  </button>
);

// Wrapper to fetch or create a 'stories' conversation and provide its ID
const StoriesChatWrapper: FC = () => {
  return (
    <ChatWebSocketProvider conversationId="">
      <Stories />
    </ChatWebSocketProvider>
  );
};

// Main App component
const AppContent: FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const params = useParams();
  const [showAssistant, setShowAssistant] = useState(false);
  const [showPrototypeModal, setShowPrototypeModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && localStorage.getItem('showPrototypeModal') === 'true') {
      setShowPrototypeModal(true);
      localStorage.removeItem('showPrototypeModal');
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Hide FAB on landing page (assistant is already shown there)
  const isLanding = window.location.pathname === '/';

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg transition-colors duration-200">
        <Header />
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 bg-gray-100 dark:bg-dark-bg">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            <Route path="/communities" element={<ProtectedRoute><Communities /></ProtectedRoute>} />
            <Route path="/communities/:slug" element={<ProtectedRoute><CommunityView /></ProtectedRoute>} />
            <Route path="/posts/:type/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
            <Route path="/posts/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
            <Route path="/connections" element={<ProtectedRoute><ConnectionRequest /></ProtectedRoute>} />
            <Route path="/connections/:id" element={<ProtectedRoute><ConnectionRequest /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
            <Route path="/stories" element={
              <ProtectedRoute>
                <StoriesChatWrapper />
              </ProtectedRoute>
            } />
            <Route path="/messenger" element={
              <ProtectedRoute>
                <ChatWebSocketProvider conversationId="">
                  <MessengerUI />
                </ChatWebSocketProvider>
              </ProtectedRoute>
            } />
            <Route path="/messages" element={<Navigate to="/messenger" replace />} />
            <Route path="/messages/:conversationId" element={
              <ProtectedRoute>
                <ChatWebSocketProvider conversationId={params.conversationId || ""}>
                  <MessengerUI />
                </ChatWebSocketProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        {/* Floating Assistant Button and AssistantUI panel */}
        {!isLanding && !showAssistant && (
          <FloatingAssistantButton onClick={() => setShowAssistant(true)} />
        )}
        {showAssistant && (
          <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end">
            <AssistantUI onClose={() => setShowAssistant(false)} />
          </div>
        )}
        {/* Prototype Modal */}
        <ReactModal
          isOpen={showPrototypeModal}
          onRequestClose={() => setShowPrototypeModal(false)}
          className="fixed inset-0 flex items-center justify-center z-50 outline-none p-4"
          overlayClassName="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300"
          ariaHideApp={false}
          shouldCloseOnOverlayClick={true}
          closeTimeoutMS={300}
        >
          <div
            className="bg-white dark:bg-dark-card rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 max-w-sm sm:max-w-md lg:max-w-xl w-full text-center border-4 border-purple-500 dark:border-purple-700 animate-fade-in-scale max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 8px 40px 0 rgba(80, 0, 120, 0.25)' }}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4 animate-bounce">
                <svg width="40" height="40" fill="none" viewBox="0 0 40 40" className="sm:w-12 sm:h-12"><circle cx="20" cy="20" r="20" fill="#a78bfa"/><path d="M20 12v10m0 3h.02" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-purple-700 dark:text-purple-300 drop-shadow">Prototype Notice</h2>
              <p className="mb-4 text-sm sm:text-base lg:text-lg text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                Some sidebars may contain static information, and some buttons or features may not work because this is a <span className="font-bold text-purple-600 dark:text-purple-400">prototype</span>. These will work soon when the app is fully built.<br/><br/>
                The <span className="font-bold text-purple-600 dark:text-purple-400">AI assistant</span> or <span className="font-bold text-purple-600 dark:text-purple-400">message assistant</span> might not work reliably for a day because the API is not enough for all users.<br/><br/>
                <span className="block mt-2 text-purple-700 dark:text-purple-300 font-semibold">If you are a new user:</span>
                <span className="block mt-1">Go to the <span className="font-bold text-purple-600 dark:text-purple-400">Suggested</span> tab to generate users. This may take a few seconds.</span>
                <span className="block mt-4 text-red-600 dark:text-red-400 font-semibold text-sm sm:text-base">If you forget your password, contact <a href="mailto:horugavye.official@gmail.com" className="underline">horugavye.official@gmail.com</a> because the app does not support password reset yet.</span>
                <span className="block mt-6 text-green-700 dark:text-green-400 font-bold text-base sm:text-lg">
                  <span className="block mb-1">Explore SuperLink's core features and help us shape the future of social networking!</span>
                  <ul className="text-left text-sm sm:text-base font-medium text-green-800 dark:text-green-200 list-disc list-inside mb-2">
                    <li>Quick onboarding: Sign up, set your interests, and personalize your profile.</li>
                    <li>Interest-based matching: Connect with people who share your passions and see why you matched.</li>
                    <li>Suggested communities: Join groups aligned with your interests and share posts, questions, or photos.</li>
                    <li>Personalized feed: Enjoy a feed tailored to you, with AI-powered recommendations and filters.</li>
                    <li>Rate system: Rate posts (1–5 stars or tags like Inspiring, Helpful) to shape the community and improve your feed.</li>
                    <li>SuperBot Lite: Get AI-powered help drafting replies, post ideas, and discovering new communities.</li>
                    <li>Interest Alchemy: Discover new ideas and micro-communities through unique, AI-driven connections.</li>
                  </ul>
                  <span className="block mt-2">Thank you for trying SuperLink MVP. Your feedback will help us improve and build the best experience for like-minded individuals!</span>
                </span>
              </p>
              <button
                className="mt-6 px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-base sm:text-lg rounded-2xl font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300"
                onClick={() => setShowPrototypeModal(false)}
              >
                OK, Got it!
              </button>
            </div>
          </div>
        </ReactModal>
      </div>
    </WebSocketProvider>
  );
};

const App: FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <GoogleOAuthProvider clientId="325560185495-6p6v7v7v7v7v7v7v7v7v7v7v7v7v7v7.apps.googleusercontent.com">
            <div className="min-h-screen bg-gray-100 dark:bg-dark-bg transition-colors duration-200">
              <GlobalChatWebSocketProvider>
                <AppContent />
              </GlobalChatWebSocketProvider>
            </div>
          </GoogleOAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

// CardContainer for consistent UI
const CardContainer: FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm transition-colors duration-200 ${className}`}>
    {children}
  </div>
);

// Tailwind animation for fade-in and scale
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in-scale {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-fade-in-scale {
  animation: fade-in-scale 0.4s cubic-bezier(0.4,0,0.2,1) both;
}
`;
document.head.appendChild(style);

export default App;
