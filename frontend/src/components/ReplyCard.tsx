import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

// Default avatar fallback
const DEFAULT_AVATAR = '/default.jpg';

// Helper function to get avatar URL with fallback
const getAvatarUrl = (avatarUrl: string | null | undefined): string => {
  if (!avatarUrl || avatarUrl === '') {
    return DEFAULT_AVATAR;
  }
  return avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_API_URL}${avatarUrl}`;
};

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
  badges?: string[];
  isOnline?: boolean;
  personalityTags?: {
    name: string;
    color: string;
  }[];
}

interface Reply {
  id: number;
  comment: {
    id: number;
    post: {
      id: number;
      community: {
        slug: string;
      };
    };
  };
  author: User;
  content: string;
  created_at: string;
  updated_at: string;
  rating: number;
  total_ratings: number;
  user_rating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface ReplyCardProps {
  reply: Reply;
  onRatingChange?: (replyId: number, rating: number) => void;
  onDelete?: (replyId: number) => void;
  isCommunityAdmin?: boolean;
  isCommunityModerator?: boolean;
  onReplyRatingChange?: (commentId: number, replyId: number, rating: number) => void;
}

const ReplyCard: React.FC<ReplyCardProps> = ({ 
  reply, 
  onRatingChange,
  onDelete,
  isCommunityAdmin = false,
  isCommunityModerator = false,
  onReplyRatingChange
}) => {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(reply.user_rating || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const rateButtonRef = useRef<HTMLButtonElement>(null);

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleReplyDeleted = (data: any) => {
      if (data.reply_id === reply.id) {
        if (onDelete) {
          onDelete(reply.id);
        }
      }
    };

    socket.on('reply_deleted', handleReplyDeleted);

    return () => {
      socket.off('reply_deleted', handleReplyDeleted);
    };
  }, [socket, reply.id, onDelete]);

  // Check if user can delete the reply
  const canDeleteReply = user && (
    user.id === reply.author.id || 
    isCommunityAdmin || 
    isCommunityModerator
  );

  // Helper for formatting counts
  const formatCount = (count: number): string => {
    if (!count) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return count.toString();
  };

  // Add click outside handler for menu
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRateClick = () => {
    setHoverRating(reply.user_rating || 0);
    setIsRatingModalOpen(true);
  };

  const handleStarHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleStarClick = async (rating: number) => {
    try {
      // If clicking the same rating, unrate
      if (rating === reply.user_rating) {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/communities/${reply.comment.post.community.slug}/posts/${reply.comment.post.id}/comments/${reply.comment.id}/replies/${reply.id}/rate/`, { rating: 0 });
        if (onRatingChange) {
          onRatingChange(reply.id, 0);
        }
        if (onReplyRatingChange) {
          onReplyRatingChange(reply.comment.id, reply.id, 0);
        }
        // Update the reply with the response data
        const updatedReply = response.data.reply;
        reply.rating = updatedReply.rating;
        reply.total_ratings = updatedReply.total_ratings;
        reply.user_rating = 0;
        setSelectedRating(0);
        setIsRatingModalOpen(false);
        return;
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/communities/${reply.comment.post.community.slug}/posts/${reply.comment.post.id}/comments/${reply.comment.id}/replies/${reply.id}/rate/`, { rating });
      if (onRatingChange) {
        onRatingChange(reply.id, rating);
      }
      if (onReplyRatingChange) {
        onReplyRatingChange(reply.comment.id, reply.id, rating);
      }
      // Update the reply with the response data
      const updatedReply = response.data.reply;
      reply.rating = updatedReply.rating;
      reply.total_ratings = updatedReply.total_ratings;
      reply.user_rating = rating;
      setSelectedRating(rating);
      setIsRatingModalOpen(false);
      toast.success('Rating submitted successfully');
    } catch (error) {
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating. Please try again.');
    }
  };

  const handleDeleteReply = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/communities/${reply.comment.post.community.slug}/posts/${reply.comment.post.id}/comments/${reply.comment.id}/replies/${reply.id}/`);
      toast.success('Reply deleted successfully');
      setShowDeleteModal(false);
      setShowMenu(false);
      if (onDelete) {
        onDelete(reply.id);
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    }
  };

  const renderStarRating = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`p-0.5 transition-transform ${interactive ? 'hover:scale-110' : ''}`}
              onMouseEnter={() => interactive && handleStarHover(star)}
              onMouseLeave={() => interactive && handleStarHover(reply.user_rating || 0)}
              onClick={() => interactive && handleStarClick(star)}
            >
              <StarIconSolid
                className={`w-4 h-4 ${
                  star <= (interactive ? (hoverRating || reply.user_rating || 0) : rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>
        {!interactive && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-start gap-4">
      <div className="relative">
        <img
          src={getAvatarUrl(reply.author?.avatar)}
          alt={reply.author?.name || 'User'}
          className="w-8 h-8 rounded-full ring-2 ring-purple-500 dark:ring-purple-400"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== DEFAULT_AVATAR) {
              target.src = DEFAULT_AVATAR;
            }
          }}
        />
      </div>
      <div className="flex-1">
        <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                <a 
                  href={`/profile/${reply.author.username}`}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  {reply.author?.name || 'Anonymous'}
                </a>
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: false })}
              </span>
            </div>
            {canDeleteReply && (
              <div className="relative" ref={menuRef}>
                <button 
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-colors"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <EllipsisHorizontalIcon className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border py-1 z-10">
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete Reply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{reply.content}</p>
          
          {/* Reply Rating */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {renderStarRating(reply.rating)}
              <button
                ref={rateButtonRef}
                onClick={handleRateClick}
                className="ml-2 px-3 py-1 text-xs bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full transition-colors flex items-center space-x-1"
              >
                <StarIconSolid className={`w-4 h-4 ${reply.user_rating ? 'text-yellow-400' : 'text-gray-400'}`} />
                <span>Rate</span>
                {reply.total_ratings > 0 && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    ({formatCount(reply.total_ratings)})
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsRatingModalOpen(false)}>
          <div className="absolute" style={{
            top: rateButtonRef.current ? rateButtonRef.current.getBoundingClientRect().top - 80 : 0,
            left: rateButtonRef.current ? rateButtonRef.current.getBoundingClientRect().left - 50 : 0,
          }}>
            <div className="relative bg-white dark:bg-dark-card rounded-lg p-2 shadow-xl border border-gray-200 dark:border-dark-border transform transition-all">
              <div className="flex flex-col items-center space-y-1">
                <div className="flex items-center space-x-0.5">
                  <button
                    className="p-0.5 transition-transform hover:scale-110"
                    onMouseEnter={() => handleStarHover(0)}
                    onMouseLeave={() => handleStarHover(reply.user_rating || 0)}
                    onClick={() => handleStarClick(0)}
                  >
                    <span className={`text-sm font-medium ${reply.user_rating === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>0</span>
                  </button>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="p-0.5 transition-transform hover:scale-110"
                      onMouseEnter={() => handleStarHover(star)}
                      onMouseLeave={() => handleStarHover(reply.user_rating || 0)}
                      onClick={() => handleStarClick(star)}
                    >
                      {star <= (hoverRating || reply.user_rating || 0) ? (
                        <StarIconSolid className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-6 h-6 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hoverRating === 0 ? 'Unrate' : hoverRating ? `Rate ${hoverRating} stars` : reply.user_rating ? `Your rating: ${reply.user_rating} stars` : 'Select your rating'}
                </p>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <ChevronDownIcon className="w-4 h-4 text-white dark:text-dark-card" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-dark-card rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Reply</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Are you sure you want to delete this reply? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReply}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplyCard; 