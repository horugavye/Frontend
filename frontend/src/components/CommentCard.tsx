import React, { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  FaceSmileIcon,
  ChevronDownIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import EmojiPicker from './EmojiPicker';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ReplyCard from './ReplyCard';
import { useAuth } from '../context/AuthContext';

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

interface Comment {
  id: number;
  post: {
    id: number;
    community: {
      slug: string;
    };
  };
  author: User;
  content: string;
  created_at: string;
  updated_at: string;
  rating: number;
  total_ratings: number;
  hasRated: boolean;
  user_rating: number;
  replies?: Reply[];
  is_top_comment?: boolean;
  author_role?: string;
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
  hasRated: boolean;
  user_rating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface CommentCardProps {
  comment: Comment;
  onReply: (content: string, commentId: number, parentReplyId?: number) => void;
  onRatingChange?: (commentId: number, rating: number) => void;
  onDelete?: (commentId: number) => void;
  onReplyDelete?: (commentId: number, replyId: number) => void;
  isCommunityAdmin?: boolean;
  isCommunityModerator?: boolean;
  onReplyRatingChange?: (commentId: number, replyId: number, rating: number) => void;
}

// Default avatar fallback
const DEFAULT_AVATAR = '/default.jpg';  // Points to frontend/public/default.jpg

// Helper function to get avatar URL with fallback
const getAvatarUrl = (avatarUrl: string | null | undefined): string => {
  if (!avatarUrl || avatarUrl === '') {
    return DEFAULT_AVATAR;
  }
  return avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_API_URL}${avatarUrl}`;
};

const CommentCard: React.FC<CommentCardProps> = ({ 
  comment, 
  onReply, 
  onRatingChange, 
  onDelete,
  onReplyDelete,
  isCommunityAdmin = false,
  isCommunityModerator = false,
  onReplyRatingChange
}) => {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(comment.user_rating || 0);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const COMMENT_PREVIEW_LENGTH = 150; // Characters to show in preview
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const rateButtonRef = useRef<HTMLButtonElement>(null);
  const { isDarkMode } = useTheme();

  // Calculate total replies
  const totalReplies = comment.replies?.length || 0;

  // Check if user can delete the comment
  const canDeleteComment = user && (
    user.id === comment.author.id || 
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

  // Add click outside handler for emoji picker
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleEmojiSelect = (emoji: string) => {
    setReplyContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent, comment.id);
      setReplyContent('');
      setShowReplyInput(false);
    }
  };

  const handleRateClick = () => {
    setHoverRating(comment.user_rating || 0);
    setIsRatingModalOpen(true);
  };

  const handleStarHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleStarClick = async (rating: number) => {
    try {
      // If clicking the same rating, unrate
      if (rating === comment.user_rating) {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/communities/${comment.post.community.slug}/posts/${comment.post.id}/comments/${comment.id}/rate/`, { rating: 0 });
        if (onRatingChange) {
          onRatingChange(comment.id, 0);
        }
        // Update the comment with the response data
        const updatedComment = response.data.comment;
        if (onRatingChange) {
          onRatingChange(comment.id, 0);
        }
        setSelectedRating(0);
        setIsRatingModalOpen(false);
        return;
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/communities/${comment.post.community.slug}/posts/${comment.post.id}/comments/${comment.id}/rate/`, { rating });
      if (onRatingChange) {
        onRatingChange(comment.id, rating);
      }
      // Update the comment with the response data
      const updatedComment = response.data.comment;
      if (onRatingChange) {
        onRatingChange(comment.id, rating);
      }
      setSelectedRating(rating);
      setIsRatingModalOpen(false);
      toast.success('Rating submitted successfully');
    } catch (error) {
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating. Please try again.');
    }
  };

  const handleDeleteComment = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/communities/${comment.post.community.slug}/posts/${comment.post.id}/comments/${comment.id}/`);
      toast.success('Comment deleted successfully');
      setShowDeleteModal(false);
      setShowMenu(false);
      if (onDelete) {
        onDelete(comment.id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const renderReplyInput = () => (
    <div className="mt-2">
      <div className="flex items-start gap-1.5">
        <input
          type="text"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Write a reply..."
          className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none border border-gray-200 dark:border-gray-700"
        />
        <div className="relative" ref={emojiPickerRef}>
          <button 
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-lg transition-all border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 shadow-sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FaceSmileIcon className="w-3.5 h-3.5" />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-[9999]">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} isDarkMode={isDarkMode} />
            </div>
          )}
        </div>
        <button
          onClick={handleReply}
          disabled={!replyContent.trim()}
          className="px-2 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reply
        </button>
      </div>
    </div>
  );

  const renderReplies = (replies: Reply[]) => {
    if (!replies || replies.length === 0) return null;

    return (
      <div className="mt-4 space-y-4 pl-6 border-l-2 border-purple-100 dark:border-purple-900/20">
        {replies.map((reply) => (
          <div key={reply.id} className="flex items-start gap-4">
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
                      {reply.author?.name || 'Anonymous'}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: false })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{reply.content}</p>
                
                {/* Reply Rating */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    {renderStarRating(reply.rating)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({reply.total_ratings})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
              onMouseLeave={() => interactive && handleStarHover(selectedRating)}
              onClick={() => interactive && handleStarClick(star)}
            >
              <StarIconSolid
                className={`w-4 h-4 ${
                  star <= (interactive ? (hoverRating || selectedRating) : rating)
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
    <div className="flex items-start gap-4 group">
      <div className="relative">
        <img
          src={getAvatarUrl(comment.author?.avatar)}
          alt={comment.author?.name || 'User'}
          className="w-10 h-10 rounded-full ring-2 ring-purple-500 dark:ring-purple-400"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== DEFAULT_AVATAR) {
              target.src = DEFAULT_AVATAR;
            }
          }}
        />
        {comment.author?.badges?.map((badge, index) => (
          <span
            key={index}
            className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full"
          >
            {badge}
          </span>
        ))}
      </div>
      <div className="flex-1">
        <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  <a 
                    href={`/profile/${comment.author.username}`}
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    {comment.author?.name || 'Anonymous'}
                  </a>
                </h3>
                <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full ${
                  comment.author_role === 'admin' 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                    : comment.author_role === 'moderator'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                }`}>
                  <span className="text-xs font-medium whitespace-nowrap">
                    {(comment.author_role ? comment.author_role.charAt(0).toUpperCase() + comment.author_role.slice(1) : 'Member')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: false })}
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {canDeleteComment && (
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
                        Delete Comment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {comment.author?.personalityTags && comment.author.personalityTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {comment.author.personalityTags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${tag.color}`}
                  style={{
                    backgroundColor: tag.color.startsWith('#')
                      ? tag.color
                      : undefined,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <div className="mt-1 text-gray-700 dark:text-gray-300">
            {comment.content.length > COMMENT_PREVIEW_LENGTH && !isCommentExpanded ? (
              <>
                <p>{comment.content.slice(0, COMMENT_PREVIEW_LENGTH)}...</p>
                <button
                  onClick={() => setIsCommentExpanded(true)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium mt-1"
                >
                  Show more
                </button>
              </>
            ) : (
              <>
                <p>{comment.content}</p>
                {comment.content.length > COMMENT_PREVIEW_LENGTH && (
                  <button
                    onClick={() => setIsCommentExpanded(false)}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium mt-1"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {renderStarRating(comment.rating)}
              <button
                ref={rateButtonRef}
                onClick={handleRateClick}
                className="ml-2 px-3 py-1 text-xs bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full transition-colors flex items-center space-x-1"
              >
                <StarIconSolid className={`w-4 h-4 ${comment.user_rating ? 'text-yellow-400' : 'text-gray-400'}`} />
                <span>Rate</span>
                {comment.total_ratings > 0 && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    ({formatCount(comment.total_ratings)})
                  </span>
                )}
              </button>
            </div>
            <button
              className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-1.5 rounded-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800"
              onClick={() => setShowReplies(!showReplies)}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              {formatCount(totalReplies)} {totalReplies === 1 ? 'reply' : 'replies'}
            </button>
            <button
              className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-1.5 rounded-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800"
              onClick={() => {
                setShowReplyInput(!showReplyInput);
                setShowReplies(true);
                setReplyContent('');
              }}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Reply
            </button>
          </div>

          {/* Reply Input */}
          {showReplyInput && renderReplyInput()}

          {/* Replies */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  onRatingChange={(replyId, rating) => {
                    // Update the reply's rating in the comment's replies array
                    if (comment.replies) {
                      const updatedReplies = comment.replies.map((r) =>
                        r.id === replyId ? { ...r, user_rating: rating } : r
                      );
                      comment.replies = updatedReplies;
                    }
                    if (typeof onReplyRatingChange === 'function') {
                      onReplyRatingChange(comment.id, replyId, rating);
                    }
                  }}
                  onDelete={(replyId) => {
                    if (onReplyDelete) {
                      onReplyDelete(comment.id, replyId);
                    }
                  }}
                  isCommunityAdmin={isCommunityAdmin}
                  isCommunityModerator={isCommunityModerator}
                />
              ))}
            </div>
          )}
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
                    onMouseLeave={() => handleStarHover(comment.user_rating || 0)}
                    onClick={() => handleStarClick(0)}
                  >
                    <span className={`text-sm font-medium ${comment.user_rating === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>0</span>
                  </button>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="p-0.5 transition-transform hover:scale-110"
                      onMouseEnter={() => handleStarHover(star)}
                      onMouseLeave={() => handleStarHover(comment.user_rating || 0)}
                      onClick={() => handleStarClick(star)}
                    >
                      {star <= (hoverRating || (comment.user_rating || 0)) ? (
                        <StarIconSolid className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-6 h-6 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hoverRating === 0 ? 'Unrate' : hoverRating ? `Rate ${hoverRating} stars` : comment.user_rating ? `Your rating: ${comment.user_rating} stars` : 'Select your rating'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Comment</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteComment}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentCard; 