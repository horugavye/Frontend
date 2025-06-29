import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

// Constants
const API_BASE_URL = import.meta.env.VITE_API_URL;
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
const CONNECTION_TIMEOUT = 15000;
const MAX_MISSED_HEARTBEATS = 3;
const PING_INTERVAL = 30000;
const PONG_TIMEOUT = 10000;
const MAX_LATENCY = 3000;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const CONNECTION_DEBOUNCE = 500;

// Define types for global chat WebSocket messages
type GlobalChatWebSocketMessage = {
  type: 'chat_message' | 'ping' | 'pong' | 'error' | 'connection_established' | 'unread_count_update' | 'online_status_change';
  message?: {
    content: string;
    sender: {
      id: string;
      username: string;
    };
    created_at: string;
    message_type: string;
  };
  error?: string;
  status_message?: string;
  timestamp?: number;
  unread_count?: number;
  user_id?: string;
  username?: string;
  online_status?: string;
  is_online?: boolean;
  last_active?: string;
};

interface GlobalChatWebSocketContextType {
  isConnected: boolean;
  lastMessage: GlobalChatWebSocketMessage | null;
  reconnect: () => void;
  sendMessage: (content: string) => void;
  unreadCount: number;
}

const GlobalChatWebSocketContext = createContext<GlobalChatWebSocketContextType | null>(null);

export const GlobalChatWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, refreshToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<GlobalChatWebSocketMessage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadCountRef = useRef(0); // Add a ref to track unread count
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPongRef = useRef<number>(Date.now());
  const isConnectingRef = useRef(false);
  const lastConnectionAttemptRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const tokenRefreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Add token expiration check
  const checkTokenExpiration = () => {
    if (!token) return;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      // If token expires in less than 5 minutes, schedule a refresh
      if (timeUntilExpiration < 300000) { // 5 minutes in milliseconds
        console.log('[GlobalChatWebSocket] Token expiring soon, scheduling refresh');
        if (tokenRefreshTimeoutRef.current) {
          clearTimeout(tokenRefreshTimeoutRef.current);
        }
        // Schedule refresh 1 minute before expiration
        tokenRefreshTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            console.log('[GlobalChatWebSocket] Refreshing token');
            cleanup();
            reconnect();
          }
        }, Math.max(0, timeUntilExpiration - 60000)); // 1 minute before expiration
      }
    } catch (error) {
      console.error('[GlobalChatWebSocket] Error checking token expiration:', error);
    }
  };

  const cleanup = () => {
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, 'Cleanup');
        }
      } catch (error) {
        console.error('[GlobalChatWebSocket] Error during cleanup:', error);
      }
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    isConnectingRef.current = false;
    setIsConnected(false);
  };

  const setupHeartbeat = (ws: WebSocket) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, PING_INTERVAL);
  };

  const connect = async () => {
    if (!mountedRef.current) {
      console.log('[GlobalChatWebSocket] Component not mounted, skipping connection');
      return;
    }

    if (isConnectingRef.current || !token) {
      console.log('[GlobalChatWebSocket] Already connecting or no token, skipping connection');
      return;
    }

    const now = Date.now();
    if (now - lastConnectionAttemptRef.current < CONNECTION_DEBOUNCE) {
      console.log('[GlobalChatWebSocket] Connection attempt debounced');
      return;
    }

    isConnectingRef.current = true;
    lastConnectionAttemptRef.current = now;
    cleanup();

    try {
      const wsUrl = `${WS_BASE_URL}/ws/chat/global/?token=${encodeURIComponent(token)}`;
      console.log('[GlobalChatWebSocket] Connecting to:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('[GlobalChatWebSocket] Connection timeout');
          ws.close();
          handleReconnect();
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        console.log('[GlobalChatWebSocket] Connected');
        clearTimeout(connectionTimeoutRef.current);
        setIsConnected(true);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        setupHeartbeat(ws);
        checkTokenExpiration(); // Check token expiration after successful connection
      };

      ws.onclose = (event) => {
        console.log('[GlobalChatWebSocket] Closed:', event.code, event.reason);
        cleanup();
        setIsConnected(false);
        isConnectingRef.current = false;
        
        // Handle specific close codes
        if (event.code === 1006) {
          console.log('[GlobalChatWebSocket] Abnormal closure, attempting to reconnect');
          handleReconnect();
        } else if (event.code === 4001) {
          console.log('[GlobalChatWebSocket] Authentication failed, token may be invalid');
          setLastMessage({
            type: 'error',
            error: 'Authentication failed. Please try logging in again.'
          });
        } else if (event.code === 4003) {
          console.log('[GlobalChatWebSocket] Access denied to global chat');
          setLastMessage({
            type: 'error',
            error: 'Access denied to global chat. Please contact support.'
          });
        } else if (event.code !== 1000 && mountedRef.current) {
          handleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('[GlobalChatWebSocket] Error:', error);
        setLastMessage({
          type: 'error',
          error: 'Connection error'
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as GlobalChatWebSocketMessage;
          console.log('[GlobalChatWebSocket] Message received:', {
            type: data.type,
            unread_count: data.unread_count,
            timestamp: new Date().toISOString(),
            rawMessage: data,
            currentUnreadCount: unreadCountRef.current
          });

          if (data.type === 'pong') {
            lastPongRef.current = Date.now();
          } else if (data.type === 'unread_count_update') {
            if (data.unread_count !== undefined) {
              updateUnreadCount(data.unread_count);
            }
            setLastMessage(data);
          } else if (data.type === 'chat_message') {
            // For new messages, increment the unread count if we're not in the messenger page
            if (!window.location.pathname.includes('/messenger')) {
              updateUnreadCount(unreadCountRef.current + 1);
            }
            setLastMessage(data);
          } else if (data.type === 'connection_established') {
            // When connection is established, fetch the initial unread count
            fetchInitialUnreadCount();
            setLastMessage(data);
          } else if (data.type === 'online_status_change') {
            // Handle online status change messages
            console.log('[GlobalChatWebSocket] Online status change received:', {
              user_id: data.user_id,
              username: data.username,
              online_status: data.online_status,
              is_online: data.is_online,
              last_active: data.last_active
            });
            
            // Dispatch a custom event for online status changes
            const onlineStatusEvent = new CustomEvent('onlineStatusChange', {
              detail: {
                user_id: data.user_id,
                username: data.username,
                online_status: data.online_status,
                is_online: data.is_online,
                last_active: data.last_active
              }
            });
            window.dispatchEvent(onlineStatusEvent);
            
            setLastMessage(data);
          } else {
            setLastMessage(data);
          }
        } catch (error) {
          console.error('[GlobalChatWebSocket] Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('[GlobalChatWebSocket] Connection error:', error);
      cleanup();
      handleReconnect();
    }
  };

  const handleReconnect = () => {
    if (!mountedRef.current) {
      console.log('[GlobalChatWebSocket] Component not mounted, skipping reconnection');
      return;
    }

    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[GlobalChatWebSocket] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current), RECONNECT_DELAY);
    console.log(`[GlobalChatWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connect();
    }, delay);
  };

  const reconnect = () => {
    console.log('[GlobalChatWebSocket] Manual reconnection requested');
    reconnectAttemptsRef.current = 0;
    connect();
  };

  const sendMessage = (content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('[GlobalChatWebSocket] WebSocket not connected, cannot send message');
      setLastMessage({
        type: 'error',
        error: 'Not connected to global chat'
      });
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        content
      }));
    } catch (error) {
      console.error('[GlobalChatWebSocket] Error sending message:', error);
      setLastMessage({
        type: 'error',
        error: 'Failed to send message'
      });
    }
  };

  // Handle component mount/unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  // Handle token changes
  useEffect(() => {
    console.log('[GlobalChatWebSocket] Token changed:', { 
      hasToken: !!token, 
      isConnected, 
      isConnecting: isConnectingRef.current,
      isMounted: mountedRef.current 
    });
    if (token) {
      checkTokenExpiration();
      if (!isConnected && !isConnectingRef.current && mountedRef.current) {
        console.log('[GlobalChatWebSocket] Initiating connection with token');
        connect();
      }
    }
    return () => {
      if (tokenRefreshTimeoutRef.current) {
        clearTimeout(tokenRefreshTimeoutRef.current);
      }
    };
  }, [token]);

  // Handle network status
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected && !isConnectingRef.current && mountedRef.current) {
        console.log('[GlobalChatWebSocket] Network is back online, attempting to reconnect');
        reconnect();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isConnected]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && wsRef.current) {
        console.log('[GlobalChatWebSocket] Tab hidden, closing connection');
        wsRef.current.close(1000, 'Tab hidden');
      } else if (!document.hidden && !isConnected && !isConnectingRef.current && mountedRef.current) {
        console.log('[GlobalChatWebSocket] Tab visible again, attempting to reconnect');
        reconnect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected]);

  // Add effect to fetch initial unread count on connection
  useEffect(() => {
    console.log('[GlobalChatWebSocket] Connection status changed:', { 
      isConnected, 
      hasToken: !!token,
      currentUnreadCount: unreadCountRef.current
    });
    if (isConnected && token) {
      console.log('[GlobalChatWebSocket] Fetching initial unread count');
      fetchInitialUnreadCount();
    }
  }, [isConnected, token]);

  // Update the unread count state and ref
  const updateUnreadCount = (newCount: number) => {
    console.log('[GlobalChatWebSocket] Updating unread count:', {
      oldCount: unreadCountRef.current,
      newCount,
      timestamp: new Date().toISOString()
    });
    unreadCountRef.current = newCount;
    setUnreadCount(newCount);
  };

  // Update fetchInitialUnreadCount to use the new updateUnreadCount function
  const fetchInitialUnreadCount = async () => {
    console.log('[GlobalChatWebSocket] Starting fetchInitialUnreadCount');
    if (!token) {
      console.error('[GlobalChatWebSocket] No token available for fetching unread count');
      return;
    }

    try {
      console.log('[GlobalChatWebSocket] Making API request to fetch unread count');
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('[GlobalChatWebSocket] API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        
        // Get the current user's ID from the token
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = tokenPayload.user_id;
        
        // Calculate total unread count across all conversations
        const totalUnread = data.reduce((sum: number, conv: any) => {
          const currentUserMember = conv.members?.find((m: any) => m.user?.id === currentUserId);
          const convUnread = currentUserMember?.unread_count || 0;
          
          console.log(`[GlobalChatWebSocket] Adding unread count for conversation ${conv.id}:`, {
            conversationId: conv.id,
            currentUserId,
            memberUnreadCount: convUnread,
            runningTotal: sum + convUnread,
            member: currentUserMember ? {
              userId: currentUserMember.user?.id,
              username: currentUserMember.user?.username,
              unreadCount: currentUserMember.unread_count
            } : null
          });
          
          return sum + convUnread;
        }, 0);
        
        console.log('[GlobalChatWebSocket] Setting initial unread count:', totalUnread);
        updateUnreadCount(totalUnread);
      } else {
        console.error('[GlobalChatWebSocket] API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[GlobalChatWebSocket] Error fetching initial unread count:', error);
    }
  };

  // Add cleanup for unread count ref
  useEffect(() => {
    return () => {
      unreadCountRef.current = 0;
    };
  }, []);

  const value = {
    isConnected,
    lastMessage,
    reconnect,
    sendMessage,
    unreadCount
  };

  return (
    <GlobalChatWebSocketContext.Provider value={value}>
      {children}
    </GlobalChatWebSocketContext.Provider>
  );
};

export const useGlobalChatWebSocket = () => {
  const context = useContext(GlobalChatWebSocketContext);
  if (!context) {
    throw new Error('useGlobalChatWebSocket must be used within a GlobalChatWebSocketProvider');
  }
  return context;
}; 