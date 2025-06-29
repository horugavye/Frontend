import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

// Add at the top of the file, after imports
const API_BASE_URL = import.meta.env.VITE_API_URL;
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
const KEEP_ALIVE_INTERVAL = 30000;

// Add connection tracking
let activeConnections = new Map<string, WebSocket>();
let connectionLocks = new Map<string, boolean>();

// Define a union type for WebSocket messages
type WebSocketMessage =
  | { type: 'pong'; timestamp: number }
  | { type: 'connection_established'; message: string }
  | { type: 'notification_message'; data: any }
  | { type: 'error'; message: string }
  | { type: string; [key: string]: any };

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  reconnect: () => void;
  connect: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const notificationsWsRef = useRef<WebSocket | null>(null);
  const { token, refreshToken } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const isConnectingRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastPongRef = useRef<number>(Date.now());
  const cleanupRef = useRef<(() => void) | null>(null);

  const getConnectionKey = () => {
    return `notifications_${token}`;
  };

  const cleanup = () => {
    if (notificationsWsRef.current && notificationsWsRef.current.readyState === WebSocket.OPEN) {
      notificationsWsRef.current.close(1000, 'Cleanup');
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
  };

  const handlePong = (timestamp: number) => {
    // Convert timestamp from seconds to milliseconds if it's in Unix epoch seconds
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const now = Date.now();
    
    // Validate timestamp is not in the future and not too old
    if (timestampMs > now + 5000) { // Allow 5 second clock skew
      console.error('[WebSocket] Invalid future timestamp received:', {
        received: new Date(timestampMs).toISOString(),
        current: new Date(now).toISOString()
      });
      return;
    }
    
    if (timestampMs < now - 300000) { // Ignore timestamps older than 5 minutes
      console.error('[WebSocket] Invalid old timestamp received:', {
        received: new Date(timestampMs).toISOString(),
        current: new Date(now).toISOString()
      });
      return;
    }

    const latency = now - timestampMs;
    lastPongRef.current = now;
    
    if (latency > 1000) {
      console.warn('[WebSocket] High latency detected:', {
        latency: `${latency}ms`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case 'pong':
        handlePong(data.timestamp);
        break;
      case 'connection_established':
        console.log('✅ Connection established:', data.message);
        setIsConnected(true);
        break;
      case 'notification_message':
        if (data.data) {
          setLastMessage({
            type: 'notification_message',
            data: data.data
          });
        }
        break;
      case 'error':
        console.error('❌ WebSocket error:', data.message);
        setLastMessage({
          type: 'error',
          message: data.message
        });
        break;
      default:
        console.log('📨 Unhandled message type:', data.type);
    }
  };

  const setupHeartbeat = (ws: WebSocket) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    let missedHeartbeats = 0;
    const MAX_MISSED_HEARTBEATS = 3;

    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const now = Date.now();
        const lastPong = lastPongRef.current;
        
        if (now - lastPong > 30000) {
          missedHeartbeats++;
          console.warn(`[WebSocket] Missed heartbeat (${missedHeartbeats}/${MAX_MISSED_HEARTBEATS})`);
          
          if (missedHeartbeats >= MAX_MISSED_HEARTBEATS) {
            console.warn('[WebSocket] Too many missed heartbeats, closing connection');
            try {
              ws.close(1000, 'Heartbeat timeout');
            } catch (error) {
              console.error('[WebSocket] Error closing connection during heartbeat timeout:', error);
            }
            return;
          }
        }

        try {
          ws.send(JSON.stringify({ 
            type: 'ping',
            timestamp: now
          }));
        } catch (error) {
          console.error('[WebSocket] Error sending heartbeat:', error);
          try {
            ws.close(1000, 'Heartbeat send failed');
          } catch (closeError) {
            console.error('[WebSocket] Error closing connection after heartbeat failure:', closeError);
          }
        }
      }
    }, 10000); // Reduced from 30000 to 10000 for more frequent checks

    heartbeatIntervalRef.current = heartbeatInterval;
  };

  const setupKeepAlive = (ws: WebSocket) => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
    }

    keepAliveIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.error('Error sending keepalive:', error);
          ws.close(1000, 'Keepalive failed');
        }
      }
    }, KEEP_ALIVE_INTERVAL);
  };

  const connect = async (): Promise<void> => {
    const connectionKey = getConnectionKey();

    // Check if we already have an active connection
    if (activeConnections.has(connectionKey)) {
      const existingWs = activeConnections.get(connectionKey);
      if (existingWs?.readyState === WebSocket.OPEN) {
        console.log('✅ Using existing WebSocket connection');
        notificationsWsRef.current = existingWs;
        setIsConnected(true);
        return;
      }
      // Clean up existing connection
      existingWs?.close();
      activeConnections.delete(connectionKey);
    }

    // Check if there's a connection attempt in progress
    if (connectionLocks.get(connectionKey)) {
      console.log('Connection attempt already in progress');
      return;
    }

    if (isConnectingRef.current || !token) {
      console.log('Connection attempt skipped:', {
        isConnecting: isConnectingRef.current,
        hasToken: !!token
      });
      return;
    }

    isConnectingRef.current = true;
    connectionLocks.set(connectionKey, true);
    setIsConnected(false);
    clearTimeout(connectionTimeoutRef.current);

    try {
      console.log('🔄 Attempting WebSocket connection...');
      
      // Get the current token
      const currentToken = localStorage.getItem('access_token');
      if (!currentToken) {
        console.error('No access token available');
        throw new Error('No access token available');
      }

      // Construct WebSocket URL with token
      const wsUrl = `${WS_BASE_URL}/ws/notifications/?token=${currentToken}`;
      console.log('WebSocket URL:', wsUrl);

      // Create WebSocket connection
      const notificationsWs = new WebSocket(wsUrl);
      notificationsWsRef.current = notificationsWs;
      activeConnections.set(connectionKey, notificationsWs);

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        console.log('Connection timeout reached');
        if (notificationsWs.readyState !== WebSocket.OPEN) {
          notificationsWs.close();
          activeConnections.delete(connectionKey);
          handleTokenExpired(); // Try token refresh on timeout
        }
      }, CONNECTION_TIMEOUT);

      notificationsWs.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        clearTimeout(connectionTimeoutRef.current);
        setIsConnected(true);
        isConnectingRef.current = false;
        connectionLocks.delete(connectionKey);
        reconnectAttemptsRef.current = 0;
        
        // Start heartbeat
        setupHeartbeat(notificationsWs);
        
        // Start keep-alive
        setupKeepAlive(notificationsWs);
      };

      notificationsWs.onclose = (event) => {
        console.log('❌ WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          timestamp: new Date().toISOString()
        });
        
        clearTimeout(connectionTimeoutRef.current);
        setIsConnected(false);
        isConnectingRef.current = false;
        connectionLocks.delete(connectionKey);
        activeConnections.delete(connectionKey);
        notificationsWsRef.current = null;

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = undefined;
        }

        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = undefined;
        }

        // Handle specific close codes
        if (event.code === 4000) {
          console.log('Duplicate connection detected');
          return;
        }

        if (event.code === 4001 || event.code === 1008) {
          // Token expired or invalid
          handleTokenExpired();
          return;
        }

        // For abnormal closure (1006), wait before reconnecting
        if (event.code === 1006) {
          console.log('Abnormal closure detected, waiting before reconnect');
          setTimeout(() => {
            if (!isConnectingRef.current) {
              handleReconnect();
            }
          }, 5000);
          return;
        }

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000) {
          handleReconnect();
        }
      };

      notificationsWs.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setLastMessage({
          type: 'error',
          message: 'Connection error. Please check your network connection.'
        });
        notificationsWs.close();
        activeConnections.delete(connectionKey);
        connectionLocks.delete(connectionKey);
        
        // Wait before attempting reconnect
        setTimeout(() => {
          if (!isConnectingRef.current) {
            handleReconnect();
          }
        }, 5000);
      };

      notificationsWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('❌ Error processing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('❌ Error setting up WebSocket connection:', error);
      isConnectingRef.current = false;
      connectionLocks.delete(connectionKey);
      setIsConnected(false);
      notificationsWsRef.current = null;
      setLastMessage({
        type: 'error',
        message: 'Failed to establish connection. Please try again.'
      });
      
      handleReconnect();
    }
  };

  const handleTokenExpired = async () => {
    if (isRefreshingRef.current) {
      console.log('Token refresh already in progress');
      return;
    }

    isRefreshingRef.current = true;
    try {
      console.log('Token expired, attempting refresh...');
      const newToken = await refreshToken();
      if (newToken) {
        console.log('Token refreshed successfully, reconnecting WebSocket...');
        // Close existing connection
        if (notificationsWsRef.current) {
          notificationsWsRef.current.close(1000, 'Token refresh');
        }
        // Reset connection state
        setIsConnected(false);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        // Add a small delay before reconnecting to ensure token is properly set
        setTimeout(() => {
          connect();
        }, 1000);
      } else {
        console.error('Token refresh failed, WebSocket will not reconnect');
        // Clear connection state
        if (notificationsWsRef.current) {
          notificationsWsRef.current.close(1000, 'Token refresh failed');
        }
        setIsConnected(false);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
      // Clear connection state
      if (notificationsWsRef.current) {
        notificationsWsRef.current.close(1000, 'Token refresh error');
      }
      setIsConnected(false);
      isConnectingRef.current = false;
      reconnectAttemptsRef.current = 0;
      window.location.href = '/login';
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (!notificationsWsRef.current || notificationsWsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      setLastMessage({
        type: 'error',
        message: 'Not connected to server. Attempting to reconnect...'
      });
      notificationsWsRef.current = null;
      setIsConnected(false);
      connect();
      return;
    }

    try {
      console.log('Sending WebSocket message:', message);
      notificationsWsRef.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      setLastMessage({
        type: 'error',
        message: 'Failed to send message. Please try again.'
      });
      notificationsWsRef.current = null;
      setIsConnected(false);
      connect();
    }
  };

  const reconnect = () => {
    console.log('Manual reconnection requested');
    if (isConnectingRef.current) {
      console.log('Connection attempt already in progress, skipping reconnection');
      return;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectAttemptsRef.current = 0;
    connect();
  };

  const handleReconnect = () => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      setLastMessage({
        type: 'error',
        message: 'Connection lost. Please refresh the page.'
      });
      return;
    }

    const delay = Math.min(
      RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
      RECONNECT_DELAY
    );

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connect();
    }, delay);
  };

  useEffect(() => {
    if (token) {
      if (!isConnected && !isConnectingRef.current && 
          (!notificationsWsRef.current || notificationsWsRef.current.readyState !== WebSocket.OPEN)) {
        connect();
      }
    }
    window.addEventListener('token-expired', handleTokenExpired);
    
    cleanupRef.current = () => {
      cleanup();
      window.removeEventListener('token-expired', handleTokenExpired);
    };
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [token]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (notificationsWsRef.current) {
        notificationsWsRef.current.close();
      }
    };
  }, []);

  // Add network awareness
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected) reconnect();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isConnected]);

  // Add visibility awareness
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && notificationsWsRef.current) {
        notificationsWsRef.current.close(1000, 'Tab hidden');
      } else if (!document.hidden && !isConnected) {
        reconnect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected]);

  const value = {
    isConnected,
    sendMessage,
    lastMessage,
    reconnect,
    connect
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Use exponential backoff with jitter for reconnection
const getReconnectDelay = (attempt: number) => {
  const base = Math.min(1000 * Math.pow(2, attempt), 30000);
  const jitter = Math.random() * 1000;
  return base + jitter;
};
