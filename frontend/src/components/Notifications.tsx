import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  UserPlus, 
  Users, 
  MessageSquare, 
  Award, 
  Calendar,
  Heart,
  Star,
  ThumbsUp,
  UserCheck,
  UserX,
  Shield,
  Crown,
  Trophy,
  Sparkles,
  Rocket,
  Megaphone,
  Flag,
  MessageSquareMore,
  Link,
  Share,
  Bookmark,
  BellRing,
  BellOff,
  BellPlus,
  BellMinus,
  XCircle,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { formatDistanceToNow } from 'date-fns';
import { useWebSocket } from '../context/WebSocketContext';
import { toast } from 'react-hot-toast';

// Add the Switch component
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, className = '' }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={className}
    >
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  );
};

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name: string | null;
  time_ago: string;
  content_type_name: string | null;
  data: {
    community_type?: 'private' | 'public';
    community_id?: number;
    community_slug?: string;
    community_name?: string;
    inviter_name?: string;
    request_id?: number;
    event_id?: number;
    role?: string;
  };
}

interface NotificationPreferences {
  email_connection_requests: boolean;
  email_community_invites: boolean;
  email_messages: boolean;
  email_achievements: boolean;
  email_events: boolean;
  email_community_join: boolean;
  email_community_role_change: boolean;
  email_message_reaction: boolean;
  email_message_reply: boolean;
  email_post_like: boolean;
  email_post_comment: boolean;
  email_post_share: boolean;
  email_post_bookmark: boolean;
  email_system_update: boolean;
  email_system_alert: boolean;
  email_system_maintenance: boolean;
  
  push_connection_requests: boolean;
  push_community_invites: boolean;
  push_messages: boolean;
  push_achievements: boolean;
  push_events: boolean;
  push_community_join: boolean;
  push_community_role_change: boolean;
  push_message_reaction: boolean;
  push_message_reply: boolean;
  push_post_like: boolean;
  push_post_comment: boolean;
  push_post_share: boolean;
  push_post_bookmark: boolean;
  push_system_update: boolean;
  push_system_alert: boolean;
  push_system_maintenance: boolean;
  
  in_app_connection_requests: boolean;
  in_app_community_invites: boolean;
  in_app_messages: boolean;
  in_app_achievements: boolean;
  in_app_events: boolean;
  in_app_community_join: boolean;
  in_app_community_role_change: boolean;
  in_app_message_reaction: boolean;
  in_app_message_reply: boolean;
  in_app_post_like: boolean;
  in_app_post_comment: boolean;
  in_app_post_share: boolean;
  in_app_post_bookmark: boolean;
  in_app_system_update: boolean;
  in_app_system_alert: boolean;
  in_app_system_maintenance: boolean;
}

interface NotificationsProps {
  variant?: 'full' | 'minimal';
}

const Notifications: React.FC<NotificationsProps> = ({ variant = 'full' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { isConnected, lastMessage, connect, sendMessage } = useWebSocket();
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(new Set());
  const [showNewNotification, setShowNewNotification] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const processedNotificationIds = useRef<Set<string>>(new Set());
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLLING_INTERVAL = 1000; // 1 second
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_connection_requests: true,
    email_community_invites: true,
    email_messages: true,
    email_achievements: true,
    email_events: true,
    email_community_join: true,
    email_community_role_change: true,
    email_message_reaction: true,
    email_message_reply: true,
    email_post_like: true,
    email_post_comment: true,
    email_post_share: true,
    email_post_bookmark: true,
    email_system_update: true,
    email_system_alert: true,
    email_system_maintenance: true,
    
    push_connection_requests: true,
    push_community_invites: true,
    push_messages: true,
    push_achievements: true,
    push_events: true,
    push_community_join: true,
    push_community_role_change: true,
    push_message_reaction: true,
    push_message_reply: true,
    push_post_like: true,
    push_post_comment: true,
    push_post_share: true,
    push_post_bookmark: true,
    push_system_update: true,
    push_system_alert: true,
    push_system_maintenance: true,
    
    in_app_connection_requests: true,
    in_app_community_invites: true,
    in_app_messages: true,
    in_app_achievements: true,
    in_app_events: true,
    in_app_community_join: true,
    in_app_community_role_change: true,
    in_app_message_reaction: true,
    in_app_message_reply: true,
    in_app_post_like: true,
    in_app_post_comment: true,
    in_app_post_share: true,
    in_app_post_bookmark: true,
    in_app_system_update: true,
    in_app_system_alert: true,
    in_app_system_maintenance: true
  });
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  // Initialize notification sound
  useEffect(() => {
    console.log('🔊 Initializing notification sound...');
    
    // Create and load the audio element
    notificationSound.current = new Audio('/sounds/notification.mp3');
    
    // Add event listeners for debugging
    notificationSound.current.addEventListener('loadstart', () => console.log('🔊 Sound loading started'));
    notificationSound.current.addEventListener('canplay', () => console.log('🔊 Sound can play'));
    notificationSound.current.addEventListener('play', () => console.log('🔊 Sound started playing'));
    notificationSound.current.addEventListener('ended', () => console.log('🔊 Sound finished playing'));
    notificationSound.current.addEventListener('error', (e) => console.error('❌ Sound error:', e));
    
    notificationSound.current.load();
    
    // Set hasUserInteracted to true after first user interaction
    const handleUserInteraction = () => {
      console.log('🔊 User interaction detected, attempting to unlock audio...');
      setHasUserInteracted(true);
      // Try playing a silent sound to unlock audio
      if (notificationSound.current) {
        notificationSound.current.volume = 0;
        notificationSound.current.play()
          .then(() => {
            console.log('✅ Audio unlocked successfully');
            notificationSound.current?.pause();
            notificationSound.current!.currentTime = 0;
            notificationSound.current!.volume = 1.0;
          })
          .catch(err => {
            console.error('❌ Error unlocking audio:', err);
          });
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    
    return () => {
      console.log('🔊 Cleaning up notification sound...');
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      if (notificationSound.current) {
        notificationSound.current.pause();
        notificationSound.current = null;
      }
    };
  }, []);

  // Initial fetch of notifications
  useEffect(() => {
    console.log('[Frontend] Initial notifications fetch');
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (isFetchingRef.current) {
      console.log('⚠️ Fetch already in progress, skipping');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      console.log('[Frontend] Fetching notifications...');
      const response = await axios.get('notifications/notifications/');
      console.log('[Frontend] Notifications API response:', response.data);
      
      // Ensure response.data is an array
      const notificationsData = Array.isArray(response.data) ? response.data : [];
      console.log('[Frontend] Processed notifications data:', notificationsData);
      
      // Only update if we have new notifications
      if (notificationsData.length > 0) {
        setNotifications(prevNotifications => {
          // Merge new notifications with existing ones, avoiding duplicates
          const existingIds = new Set(prevNotifications.map(n => n.id));
          const newNotifications = notificationsData.filter(n => !existingIds.has(n.id));
          return [...newNotifications, ...prevNotifications];
        });
      }
      setError(null);
    } catch (err) {
      console.error('[Frontend] Error fetching notifications:', err);
      setError('Failed to fetch notifications');
      // Don't clear notifications on error
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log('[Frontend] WebSocket message received:', {
      type: lastMessage.type,
      timestamp: new Date().toISOString()
    });

    switch (lastMessage.type) {
      case 'notification_message':
        if (lastMessage.data) {
          const notificationData = lastMessage.data;
          console.log('[Frontend] Processing new notification:', notificationData);
          
          // Update notifications list immediately
          setNotifications(prevNotifications => {
            // Check if notification already exists
            const exists = prevNotifications.some(n => n.id === notificationData.id);
            if (exists) {
              console.log('[Frontend] Notification already exists, skipping:', notificationData.id);
              return prevNotifications;
            }
            
            // Create a new notification object with all required fields
            const newNotification = {
              id: notificationData.id,
              notification_type: notificationData.notification_type,
              title: notificationData.title,
              message: notificationData.message,
              is_read: notificationData.is_read || false,
              created_at: notificationData.created_at || new Date().toISOString(),
              sender_name: notificationData.sender_name || null,
              time_ago: notificationData.time_ago || 'just now',
              content_type_name: notificationData.content_type_name || null,
              data: notificationData.data || {}
            };
            
            // Add new notification at the beginning and force a new array reference
            const updatedNotifications = [newNotification, ...prevNotifications];
            console.log('[Frontend] Notifications updated, new count:', updatedNotifications.length);
            
            // Trigger notification effects
            handleNotificationEffects(newNotification);
            
            // Force a new array reference to ensure React detects the change
            return [...updatedNotifications];
          });

          // Show toast for important notifications
          if (['connection_request', 'community_invite', 'message'].includes(notificationData.notification_type)) {
            toast.success(notificationData.message, {
              duration: 5000,
              position: 'top-right',
              icon: getNotificationIcon(notificationData.notification_type)
            });
          }
        }
        break;
      case 'notification_update':
        if (lastMessage.data) {
          console.log('[Frontend] Processing notification update:', lastMessage.data);
          setNotifications(prevNotifications => {
            const updatedNotifications = prevNotifications.map(notification => 
              notification.id === lastMessage.data.id
                ? { ...notification, ...lastMessage.data.updates }
                : notification
            );
            // Force a new array reference
            return [...updatedNotifications];
          });
        }
        break;
      case 'notification_delete':
        if (lastMessage.data) {
          console.log('[Frontend] Processing notification deletion:', lastMessage.data);
          setNotifications(prevNotifications => {
            const updatedNotifications = prevNotifications.filter(
              notification => notification.id !== lastMessage.data.id
            );
            // Force a new array reference
            return [...updatedNotifications];
          });
        }
        break;
      case 'connection_established':
        console.log('[Frontend] Connection established, checking for missed notifications');
        // Only fetch if we don't have any notifications
        if (notifications.length === 0) {
          fetchNotifications();
        }
        break;
      case 'error':
        console.error('[Frontend] WebSocket error:', lastMessage.message);
        setError(lastMessage.message);
        // Attempt to reconnect on error
        if (lastMessage.message.includes('connection')) {
          setTimeout(() => {
            console.log('[Frontend] Attempting to reconnect after error...');
            connect();
          }, 3000);
        }
        break;
    }
  }, [lastMessage]);

  const handleNotificationEffects = (notificationData: Notification) => {
    console.log('🔊 Notification received, checking sound settings:', {
      hasUserInteracted,
      soundEnabled: preferences[`in_app_${notificationData.notification_type}` as keyof NotificationPreferences],
      notificationType: notificationData.notification_type,
      soundElement: notificationSound.current ? 'exists' : 'missing'
    });

    // Play notification sound if enabled
    if (notificationSound.current) {
      const preferenceKey = `in_app_${notificationData.notification_type}` as keyof NotificationPreferences;
      const soundEnabled = preferences[preferenceKey];
      
      console.log('🔊 Sound playback attempt:', {
        preferenceKey,
        soundEnabled,
        audioState: {
          readyState: notificationSound.current.readyState,
          paused: notificationSound.current.paused,
          volume: notificationSound.current.volume,
          currentTime: notificationSound.current.currentTime
        }
      });
      
      // Play sound if enabled in preferences
      if (soundEnabled) {
        try {
          // Reset the audio to the beginning
          notificationSound.current.currentTime = 0;
          // Set volume to 100%
          notificationSound.current.volume = 1.0;
          // Play the sound
          const playPromise = notificationSound.current.play();
          
          // Handle any play errors
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Notification sound played successfully');
              })
              .catch(err => {
                console.error('❌ Error playing notification sound:', err);
                // If the error is due to user interaction requirement, set hasUserInteracted to true
                if (err.name === 'NotAllowedError') {
                  console.log('🔊 Setting hasUserInteracted to true and retrying...');
                  setHasUserInteracted(true);
                  // Try playing again
                  notificationSound.current?.play()
                    .then(() => console.log('✅ Sound played successfully after retry'))
                    .catch(e => console.error('❌ Failed to play sound after retry:', e));
                }
              });
          }
        } catch (err) {
          console.error('❌ Error with notification sound:', err);
        }
      } else {
        console.log('🔊 Sound disabled for notification type:', notificationData.notification_type);
      }
    } else {
      console.error('❌ Notification sound element is missing');
    }

    // Show visual notification immediately
    setNewNotification(notificationData);
    setShowNewNotification(true);

    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Hide notification after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setShowNewNotification(false);
      setNewNotification(null);
    }, 5000);

    // Show toast for important notifications immediately
    if (['connection_request', 'community_invite', 'message'].includes(notificationData.notification_type)) {
      toast.success(notificationData.message, {
        duration: 5000,
        position: 'top-right',
        icon: getNotificationIcon(notificationData.notification_type)
      });
    }
  };

  // Add a new effect to handle WebSocket connection status
  useEffect(() => {
    if (!isConnected) {
      console.log('[Frontend] WebSocket disconnected, waiting for automatic reconnection...');
      return;
    }
    
    // When connection is restored, check for missed notifications
    if (notifications.length === 0) {
      console.log('[Frontend] Connection restored, fetching notifications');
      fetchNotifications();
    }

    // Set up periodic health check
    const healthCheckInterval = setInterval(() => {
      if (isConnected) {
        console.log('[Frontend] Performing WebSocket health check...');
        // Send a ping message to keep the connection alive
        sendMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [isConnected, notifications.length]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      if (!notification.is_read) {
        // Skip API call for system notifications
        if (!notification.id.startsWith('system_')) {
          await axios.post(`/notifications/notifications/${notification.id}/mark-read/`);
        }
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      }

      // Handle navigation based on notification type
      switch (notification.notification_type) {
        case 'connection_request':
          navigate('/connections/requests');
          break;
        case 'community_invite':
          navigate(`/communities/${notification.data.community_slug}/invite`);
          break;
        case 'message':
          navigate('/messages');
          break;
        case 'achievement':
          navigate('/profile/achievements');
          break;
        case 'event':
          navigate(`/events/${notification.data.event_id}`);
          break;
        default:
          console.log('Unhandled notification type:', notification.notification_type);
      }
      
      setIsOpen(false);
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const handleAcceptInvite = async (notification: Notification) => {
    try {
      console.log(`[Frontend] Accepting invite for notification ${notification.id}`, {
        type: notification.notification_type,
        data: notification.data
      });

      setProcessingInvites(prev => new Set([...prev, notification.id]));
      
      let response;
      if (notification.notification_type === 'community_invite') {
        if (!notification.data.community_slug) {
          throw new Error('Community slug is missing from notification data');
        }
        // Use the community slug directly from the notification data
        response = await axios.post(`/communities/${notification.data.community_slug}/join/`);
        console.log(`[Frontend] Successfully joined community ${notification.data.community_slug}`);
      } else if (notification.notification_type === 'connection_request') {
        if (!notification.data.request_id) {
          throw new Error('Request ID is missing from notification data');
        }
        response = await axios.post(`/connections/requests/${notification.data.request_id}/accept/`);
        console.log(`[Frontend] Successfully accepted connection request ${notification.data.request_id}`);
      }

      // Update notification state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      console.log(`[Frontend] Updated notification ${notification.id} status to accepted`);

      // Show success message
      toast.success('Invite accepted successfully');
      console.log(`[Frontend] Success message displayed for notification ${notification.id}`);

    } catch (error) {
      console.error(`[Frontend] Error accepting invite for notification ${notification.id}:`, error);
      toast.error('Failed to accept invite');
    } finally {
      setProcessingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleRejectInvite = async (notification: Notification) => {
    try {
      console.log(`[Frontend] Rejecting invite for notification ${notification.id}`, {
        type: notification.notification_type,
        data: notification.data
      });

      setProcessingInvites(prev => new Set([...prev, notification.id]));
      
      let response;
      if (notification.notification_type === 'community_invite') {
        if (!notification.data.community_slug) {
          throw new Error('Community slug is missing from notification data');
        }
        response = await axios.post(`/communities/${notification.data.community_slug}/reject/`);
        console.log(`[Frontend] Successfully rejected community invite ${notification.data.community_slug}`);
      } else if (notification.notification_type === 'connection_request') {
        if (!notification.data.request_id) {
          throw new Error('Request ID is missing from notification data');
        }
        response = await axios.post(`/connections/requests/${notification.data.request_id}/reject/`);
        console.log(`[Frontend] Successfully rejected connection request ${notification.data.request_id}`);
      }

      // Update notification state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      console.log(`[Frontend] Updated notification ${notification.id} status to rejected`);

      // Show success message
      toast.success('Invite rejected successfully');
      console.log(`[Frontend] Success message displayed for notification ${notification.id}`);

    } catch (error) {
      console.error(`[Frontend] Error rejecting invite for notification ${notification.id}:`, error);
      toast.error('Failed to reject invite');
    } finally {
      setProcessingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const isInviteNotification = (type: string) => {
    return ['community_invite', 'connection_request'].includes(type);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      // Connection related
      case 'connection_request':
        return <UserPlus className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case 'connection_accepted':
        return <UserCheck className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case 'connection_rejected':
        return <UserX className="w-5 h-5 text-red-500 dark:text-red-400" />;
      
      // Community related
      case 'community_invite':
        return <Megaphone className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
      case 'community_join':
        return <Users className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
      case 'community_join_accepted':
        return <Shield className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case 'community_join_rejected':
        return <Flag className="w-5 h-5 text-red-500 dark:text-red-400" />;
      case 'community_role_change':
        return <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      
      // Message related
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
      case 'message_reaction':
        return <Heart className="w-5 h-5 text-pink-500 dark:text-pink-400" />;
      case 'message_reply':
        return <MessageSquareMore className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      
      // Achievement related
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      case 'achievement_level_up':
        return <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
      case 'achievement_badge':
        return <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      
      // Event related
      case 'event':
        return <Calendar className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case 'event_reminder':
        return <BellRing className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
      case 'event_update':
        return <Megaphone className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      
      // Content related
      case 'post_like':
        return <ThumbsUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case 'post_comment':
        return <MessageSquareMore className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
      case 'post_share':
        return <Share className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case 'post_bookmark':
        return <Bookmark className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      
      // System notifications
      case 'system_update':
        return <Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case 'system_alert':
        return <BellRing className="w-5 h-5 text-red-500 dark:text-red-400" />;
      case 'system_maintenance':
        return <Rocket className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
      
      // Default
      default:
        return <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getNotificationStyle = (notification: Notification) => {
    if (!notification.is_read) {
      return 'bg-blue-50 dark:bg-blue-900/20';
    }
    return '';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Add these new functions for notification preferences
  const fetchNotificationPreferences = async () => {
    try {
      setIsPreferencesLoading(true);
      console.log('Fetching notification preferences...');
      const response = await axios.get('notifications/preferences');
      console.log('Notification preferences response:', response.data);
      
      // Ensure we have all required fields with default values
      const defaultPreferences: NotificationPreferences = {
        email_connection_requests: true,
        email_community_invites: true,
        email_messages: true,
        email_achievements: true,
        email_events: true,
        email_community_join: true,
        email_community_role_change: true,
        email_message_reaction: true,
        email_message_reply: true,
        email_post_like: true,
        email_post_comment: true,
        email_post_share: true,
        email_post_bookmark: true,
        email_system_update: true,
        email_system_alert: true,
        email_system_maintenance: true,
        
        push_connection_requests: true,
        push_community_invites: true,
        push_messages: true,
        push_achievements: true,
        push_events: true,
        push_community_join: true,
        push_community_role_change: true,
        push_message_reaction: true,
        push_message_reply: true,
        push_post_like: true,
        push_post_comment: true,
        push_post_share: true,
        push_post_bookmark: true,
        push_system_update: true,
        push_system_alert: true,
        push_system_maintenance: true,
        
        in_app_connection_requests: true,
        in_app_community_invites: true,
        in_app_messages: true,
        in_app_achievements: true,
        in_app_events: true,
        in_app_community_join: true,
        in_app_community_role_change: true,
        in_app_message_reaction: true,
        in_app_message_reply: true,
        in_app_post_like: true,
        in_app_post_comment: true,
        in_app_post_share: true,
        in_app_post_bookmark: true,
        in_app_system_update: true,
        in_app_system_alert: true,
        in_app_system_maintenance: true
      };

      // Merge server response with defaults
      const mergedPreferences = {
        ...defaultPreferences,
        ...response.data
      };

      setPreferences(mergedPreferences);
      setPreferencesError(null);
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      setPreferencesError('Failed to fetch notification preferences');
      toast.error('Failed to load notification preferences');
    } finally {
      setIsPreferencesLoading(false);
    }
  };

  const updateNotificationPreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      console.log(`Updating notification preference: ${key} to ${value}`);
      
      // Optimistically update the UI
      setPreferences(prev => ({ ...prev, [key]: value }));
      
      const updatedPreferences = { ...preferences, [key]: value };
      const response = await axios.put('notifications/preferences', updatedPreferences);
      console.log('Updated preferences response:', response.data);
      
      // Update with server response
      setPreferences(response.data);
      toast.success('Notification preferences updated');
    } catch (err) {
      console.error('Error updating notification preference:', err);
      toast.error('Failed to update notification preference');
      // Revert the change in the UI
      setPreferences(prev => ({ ...prev, [key]: !value }));
    }
  };

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  // Add loading state to the preferences UI
  const renderNotificationPreferences = () => (
    <div className="p-6 border-t border-gray-200 dark:border-dark-border">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Notification Preferences</h3>
      
      {isPreferencesLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600 dark:text-dark-text-secondary">Loading preferences...</span>
        </div>
      ) : preferencesError ? (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {preferencesError}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-card-hover">
              <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Email Notifications</h4>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(preferences)
                .filter(([key]) => key.startsWith('email_'))
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-dark-text-secondary">
                      {key.replace('email_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <Switch
                      checked={value}
                      onChange={(checked) => updateNotificationPreference(key as keyof NotificationPreferences, checked)}
                      className={`${
                        value ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-card-hover">
              <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Push Notifications</h4>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(preferences)
                .filter(([key]) => key.startsWith('push_'))
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-dark-text-secondary">
                      {key.replace('push_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <Switch
                      checked={value}
                      onChange={(checked) => updateNotificationPreference(key as keyof NotificationPreferences, checked)}
                      className={`${
                        value ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* In-App Notifications */}
          <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-card-hover">
              <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">In-App Notifications</h4>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(preferences)
                .filter(([key]) => key.startsWith('in_app_'))
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-dark-text-secondary">
                      {key.replace('in_app_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <Switch
                      checked={value}
                      onChange={(checked) => updateNotificationPreference(key as keyof NotificationPreferences, checked)}
                      className={`${
                        value ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const formatNotificationDate = (dateString: string) => {
    try {
      // First try parsing the date string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Just now';
      }
      
      // Format the date using date-fns
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Just now';
    }
  };

  return (
    <div className="relative">
      {/* New Notification Toast */}
      {showNewNotification && newNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slideDown">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                {getNotificationIcon(newNotification.notification_type)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-dark-text">{newNotification.title}</h4>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">{newNotification.message}</p>
              </div>
              <button
                onClick={() => setShowNewNotification(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-card-hover rounded-lg transition-all"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-dark-text-secondary" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing notification bell and dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-hover hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-xl transition-all group"
      >
        <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-dark-card rounded-xl shadow-xl overflow-hidden z-50 border border-gray-200 dark:border-dark-border">
          <div className="p-5 border-b border-gray-200 dark:border-dark-border">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
              Notifications
            </h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-6 text-center text-gray-500 dark:text-dark-text-secondary">
                Loading notifications...
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500 dark:text-red-400">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-dark-text-secondary">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={`${notification.id}-${notification.created_at}`}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-5 hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-all duration-200 cursor-pointer transform hover:scale-[1.01] ${getNotificationStyle(notification)}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-3 bg-gray-100 dark:bg-dark-card-hover rounded-xl">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-gray-900 dark:text-dark-text">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-400 dark:text-dark-text-secondary">
                        {formatNotificationDate(notification.created_at)}
                      </p>
                      
                      {/* Action Buttons for Invites */}
                      {isInviteNotification(notification.notification_type) && !notification.is_read && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptInvite(notification);
                            }}
                            disabled={processingInvites.has(notification.id)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingInvites.has(notification.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectInvite(notification);
                            }}
                            disabled={processingInvites.has(notification.id)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingInvites.has(notification.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Add the preferences section */}
          {variant === 'full' && renderNotificationPreferences()}
        </div>
      )}
    </div>
  );
};

export default Notifications; 