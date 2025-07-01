import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
let connectionLocks = new Map<string, boolean>();
let lastConnectionAttempt = new Map<string, number>();

// Constants
const API_BASE_URL = import.meta.env.VITE_API_URL;
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
const CONNECTION_TIMEOUT = 5000; // 5 seconds to match backend token validation timeout
const MAX_MISSED_HEARTBEATS = 3;
const CONNECTION_DEBOUNCE = 500;
const HEALTH_CHECK_INTERVAL = 10000;
const PING_INTERVAL = 30000;
const PONG_TIMEOUT = 10000;
const MAX_LATENCY = 3000;
const CONNECTION_CHECK_INTERVAL = 10000;
const INITIAL_CONNECTION_DELAY = 100;
const RECONNECTION_BACKOFF = 500;
const MAX_RECONNECTION_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;
const MESSAGE_QUEUE_PROCESS_INTERVAL = 1000;
const CONNECTION_STABLE_DELAY = 1000;

// Define types for chat WebSocket messages
type ChatWebSocketMessage = {
  type: 'chat_message' | 'thread_message' | 'reaction' | 'effect' | 'link_preview' | 
        'edit_message' | 'pin_message' | 'forward_message' | 'typing' | 'read' | 
        'ping' | 'pong' | 'error' | 'initial_messages' | 'message_edited' | 
        'message_pinned' | 'message_forwarded' | 'message_effect_added' | 
        'typing_status' | 'message_status' | 'read_status' | 'online_status_change';
  conversation_id?: string;
  message?: Message;
  messages?: Message[];
  reaction?: MessageReaction;
  effect?: MessageEffect;
  link_preview?: LinkPreview;
  error?: string;
  timestamp?: number;
  user_id?: string;
  is_typing?: boolean;
  message_ids?: string[];
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  online_status?: string;
  is_online?: boolean;
  last_active?: string;
};

type File = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: 'image' | 'video' | 'audio' | 'document' | 'other';
  thumbnail?: string;
  duration?: number;
  created_at: string;
  uploaded_by: string;
  url: string;
  file?: string;
};

type Message = {
  id: string;
  conversation: string;
  sender: {
    id: string;
    username: string;
    name?: string;
    avatarUrl?: string;
  };
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'mixed';
  files: File[];
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_pinned: boolean;
  is_forwarded: boolean;
  reply_to?: {
    id: string;
    content: string;
    sender: {
      id: string;
      username: string;
      name?: string;
      avatarUrl?: string;
    };
    files: File[];
  };
  thread?: string;
  reactions: MessageReaction[];
  isOwn?: boolean;
  story?: string;
};

interface MessageReaction {
  id: string;
  message: string;
  user: User;
  emoji: string;
  created_at: string;
}

interface MessageEffect {
  id: string;
  message: string;
  effect_type: 'confetti' | 'hearts' | 'fireworks';
  intensity: number;
  created_at: string;
}

interface LinkPreview {
  id: string;
  message: string;
  url: string;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
}

interface MessageThread {
  id: string;
  parent_message: Message;
  participants: User[];
  messages: Message[];
  last_reply_at: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
  online_status: string;
  is_online: boolean;
  bio?: string;
  personality_tags?: string[];
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  user?: {
    id: string;
    name: string;
    avatarUrl: string;
    isOnline: boolean;
    status: 'online' | 'offline' | 'away' | 'busy';
    bio: string;
    personality_tags: string[];
  };
  group?: {
    id: string;
    name: string;
    acronym: string;
    color: string;
    members: number;
    isActive: boolean;
    avatarUrl: string;
    description: string;
  };
}

interface ChatWebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: ChatWebSocketMessage) => void;
  lastMessage: ChatWebSocketMessage | null;
  connect: (conversationId: string) => Promise<void>;
  disconnect: () => void;
  lastError: string | null;
  reconnect: () => void;
  connectionState: {
    isConnected: boolean;
    isConnecting: boolean;
    isUnmounting: boolean;
    currentConversationId: string | null;
    wsExists: boolean;
    wsReadyState: number | undefined;
    latency: number;
    quality: string;
  };
}

const ChatWebSocketContext = createContext<ChatWebSocketContextType | null>(null);

interface ChatWebSocketProviderProps {
  children: React.ReactNode;
  conversationId: string;
}

// Add file extension mapping
const FILE_EXTENSION_MAPPING = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'heic', 'heif'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp', 'mpeg', 'mpg'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma', 'aiff', 'mid', 'midi'],
  document: [
    // Text documents
    'txt', 'rtf', 'doc', 'docx', 'odt', 'pages',
    // Spreadsheets
    'xls', 'xlsx', 'csv', 'ods', 'numbers',
    // Presentations
    'ppt', 'pptx', 'key', 'odp',
    // PDFs
    'pdf',
    // Archives
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
    // Code files
    'py', 'js', 'html', 'css', 'php', 'java', 'cpp', 'c', 'h', 'ts', 'jsx', 'tsx',
    // Markup
    'md', 'markdown', 'xml', 'json', 'yaml', 'yml',
    // Other documents
    'epub', 'mobi', 'azw3', 'djvu'
  ]
};

// Helper function to get file category from extension
const getFileCategory = (extension: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  for (const [category, extensions] of Object.entries(FILE_EXTENSION_MAPPING)) {
    if (extensions.includes(extension.toLowerCase())) {
      return category as 'image' | 'video' | 'audio' | 'document' | 'other';
    }
  }
  return 'other';
};

// Helper function to prepare file data for upload
const prepareFileData = (file: File): File => {
  const extension = file.file_name.split('.').pop()?.toLowerCase() || '';
  return {
    ...file,
    file_type: extension,
    category: getFileCategory(extension)
  };
};

// Add helper function for date handling
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
        console.warn('[ChatWebSocket] Empty date string received');
        return new Date().toISOString();
    }

    try {
        // Debug log the input
        console.log('[ChatWebSocket] Formatting date:', {
            input: dateString,
            type: typeof dateString,
            length: dateString.length
        });

        // Clean the input string - remove any extra whitespace and ensure proper formatting
        const cleanDateString = dateString.trim().replace(/\s+/g, ' ');

        // Handle numeric timestamps (milliseconds or seconds)
        if (!isNaN(Number(cleanDateString))) {
            const timestamp = Number(cleanDateString);
            // If timestamp is in seconds, convert to milliseconds
            const milliseconds = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
            const date = new Date(milliseconds);
            if (isNaN(date.getTime())) {
                console.error('[ChatWebSocket] Invalid numeric timestamp:', {
                    input: cleanDateString,
                    timestamp,
                    milliseconds
                });
                return new Date().toISOString();
            }
            return date.toISOString();
        }

        // Handle ISO string formats
        if (cleanDateString.includes('T') || cleanDateString.includes('Z') || cleanDateString.includes('+')) {
            // Ensure the string is properly terminated and formatted
            let fixedDateString = cleanDateString;
            
            // Fix common formatting issues
            if (!fixedDateString.includes('T')) {
                fixedDateString = fixedDateString.replace(/(\d{4}-\d{2}-\d{2})/, '$1T00:00:00');
            }
            if (!fixedDateString.includes('Z') && !fixedDateString.includes('+')) {
                fixedDateString += 'Z';
            }

            const date = new Date(fixedDateString);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
            console.error('[ChatWebSocket] Invalid ISO date string:', {
                original: cleanDateString,
                fixed: fixedDateString
            });
        }

        // Handle date strings without timezone
        const date = new Date(cleanDateString + 'Z');
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }

        // If all parsing attempts fail, log detailed error and return current time
        console.error('[ChatWebSocket] Failed to parse date:', {
            original: dateString,
            cleaned: cleanDateString,
            attempts: {
                numeric: !isNaN(Number(cleanDateString)),
                iso: cleanDateString.includes('T') || cleanDateString.includes('Z') || cleanDateString.includes('+'),
                withTimezone: !isNaN(new Date(cleanDateString + 'Z').getTime())
            }
        });
        return new Date().toISOString();
    } catch (error) {
        console.error('[ChatWebSocket] Error formatting date:', {
            error,
            input: dateString,
            stack: error instanceof Error ? error.stack : undefined
        });
        return new Date().toISOString();
    }
};

// Add this helper function at the top level
const getFullUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:')) return path;
    
    // Clean the path
    let cleanPath = path;
    // Remove any duplicate media/ prefixes
    cleanPath = cleanPath.replace(/^\/media\/media\//, '/media/');
    // Remove any leading slashes
    cleanPath = cleanPath.replace(/^\/+/,'');
    // Remove any duplicate media/ in the middle of the path
    cleanPath = cleanPath.replace(/\/media\/media\//, '/media/');
    
    // Construct the full URL
    const fullUrl = `${API_BASE_URL}/media/${cleanPath.replace(/^media\//, '')}`;
    console.log('[ChatWebSocket] Path processing:', {
        originalPath: path,
        cleanedPath: cleanPath,
        fullUrl: fullUrl
    });
    return fullUrl;
};

export const ChatWebSocketProvider: React.FC<ChatWebSocketProviderProps> = ({ children, conversationId }) => {
  const { token, refreshToken, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ChatWebSocketMessage | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({});
  const chatWsRef = useRef<WebSocket | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout>();
  const lastPongRef = useRef<number>(Date.now());
  const isConnectingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const messageQueueRef = useRef<ChatWebSocketMessage[]>([]);
  const isProcessingQueueRef = useRef(false);
  const lastConnectionAttemptRef = useRef<number>(0);
  const isUnmountingRef = useRef(false);
  const mountedRef = useRef(true);
  const [isIntentionalClose, setIsIntentionalClose] = useState(false);
  const lastReconnectAttemptRef = useRef<number>(0);

  // Add connection state tracking
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    isConnecting: false,
    lastError: null as string | null,
    reconnectAttempts: 0
  });

  // Add new state for tracking conversation changes
  const [isConversationChanging, setIsConversationChanging] = useState(false);
  const conversationChangeTimeoutRef = useRef<NodeJS.Timeout>();

  // Add message queue processing interval ref
  const messageQueueIntervalRef = useRef<NodeJS.Timeout>();

  // Add new state for tracking connection lifecycle
  const [isConnectionStable, setIsConnectionStable] = useState(false);
  const connectionStableTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionAttemptsRef = useRef(0);
  const MAX_CONSECUTIVE_ATTEMPTS = 3;

  // Add connection start time tracking
  const connectionStartTimeRef = useRef(Date.now());

  const getConnectionState = () => ({
    isConnected,
    isConnecting: isConnectingRef.current,
    isUnmounting: isUnmountingRef.current,
    currentConversationId: currentConversationIdRef.current,
    wsExists: !!chatWsRef.current,
    wsReadyState: chatWsRef.current?.readyState
  });

  const cleanup = () => {
    if (chatWsRef.current) {
        try {
            // Only close if the connection is open or connecting
            if (chatWsRef.current.readyState === WebSocket.OPEN || 
                chatWsRef.current.readyState === WebSocket.CONNECTING) {
                // Don't close if we're in the middle of establishing a stable connection
                if (!isConnectionStable && chatWsRef.current.readyState === WebSocket.OPEN) {
                    console.log('[ChatWebSocket] Connection not yet stable, waiting...');
                    return;
                }
                chatWsRef.current.close(1000, 'Cleanup');
            }
        } catch (error) {
            console.error('[ChatWebSocket] Error during cleanup:', error);
        }
        chatWsRef.current = null;
    }
    isConnectingRef.current = false;
    setIsConnected(false);
    setIsConnectionStable(false);
    connectionAttemptsRef.current = 0;
    clearTimeout(connectionTimeoutRef.current);
    if (connectionStableTimeoutRef.current) {
        clearTimeout(connectionStableTimeoutRef.current);
    }
    if (messageQueueIntervalRef.current) {
        clearInterval(messageQueueIntervalRef.current);
    }
    messageQueueRef.current = [];
    connectionLocks.delete(getConnectionKey(currentConversationIdRef.current!));
    setIsConversationChanging(false);
  };

  const disconnect = () => {
    // Don't disconnect if we're already disconnected
    if (!chatWsRef.current) {
      return;
    }

    // Only proceed with disconnect if we're unmounting, not mounted, or conversation changed
    if (isUnmountingRef.current || !mountedRef.current || 
        (currentConversationIdRef.current !== conversationId)) {
      cleanup();
    }
  };

  const getConnectionKey = (conversationId: string) => {
    return `chat_${conversationId}_${token}`;
  };

  const handlePong = (timestamp: number) => {
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const now = Date.now();
    
    if (isNaN(timestampMs) || timestampMs <= 0) {
      console.error('[ChatWebSocket] Invalid timestamp received:', {
        received: timestamp,
        converted: timestampMs
      });
      return;
    }
    
    const latency = now - timestampMs;
    lastPongRef.current = now;
    
    if (latency > MAX_LATENCY) {
      console.warn('[ChatWebSocket] High latency detected:', {
        latency: `${latency}ms`,
        timestamp: new Date().toISOString()
      });
      
      // If latency is extremely high, consider reconnecting
      if (latency > MAX_LATENCY * 2) {
        console.warn('[ChatWebSocket] Extremely high latency, reconnecting...');
        if (chatWsRef.current) {
          chatWsRef.current.close(1000, 'High latency');
          handleReconnect();
        }
      }
    }
  };

  const setupHeartbeat = (ws: WebSocket) => {
    if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
    }

    let missedHeartbeats = 0;
    let lastPingTime = Date.now();
    let pongTimeoutId: NodeJS.Timeout | null = null;

    heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            const now = Date.now();
            const lastPong = lastPongRef.current;
            const timeSinceLastPing = now - lastPingTime;
            
            // More lenient check for missed heartbeats
            if (timeSinceLastPing > PING_INTERVAL * 1.5 && now - lastPong > PONG_TIMEOUT * 1.5) {
                missedHeartbeats++;
                console.warn(`[ChatWebSocket] Missed heartbeat (${missedHeartbeats}/${MAX_MISSED_HEARTBEATS})`);
                
                // Only reconnect after multiple missed heartbeats
                if (missedHeartbeats >= MAX_MISSED_HEARTBEATS) {
                    console.warn('[ChatWebSocket] Too many missed heartbeats, reconnecting...');
                    try {
                        ws.close(1000, 'Heartbeat timeout');
                        handleReconnect();
                    } catch (error) {
                        console.error('[ChatWebSocket] Error during heartbeat timeout:', error);
                    }
                    return;
                }
            }

            try {
                const pingMessage = {
                    type: 'ping',
                    timestamp: Math.floor(now / 1000)
                };
                ws.send(JSON.stringify(pingMessage));
                lastPingTime = now;

                // More lenient pong timeout
                if (pongTimeoutId) {
                    clearTimeout(pongTimeoutId);
                }
                pongTimeoutId = setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        console.warn('[ChatWebSocket] Pong timeout, checking connection...');
                        // Instead of immediately reconnecting, check connection health
                        checkConnectionHealth();
                    }
                }, PONG_TIMEOUT * 1.5); // Increased timeout
            } catch (error) {
                console.error('[ChatWebSocket] Error sending heartbeat:', error);
                // Don't immediately close on heartbeat error
                missedHeartbeats++;
                if (missedHeartbeats >= MAX_MISSED_HEARTBEATS) {
                    try {
                        ws.close(1000, 'Heartbeat send failed');
                        handleReconnect();
                    } catch (closeError) {
                        console.error('[ChatWebSocket] Error closing connection after heartbeat failure:', closeError);
                    }
                }
            }
        }
    }, PING_INTERVAL);
  };

  // Add WebSocket state constants for better type safety
  const WS_STATE = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  } as const;

  // Update the connection health check to use the constants
  const isConnectionHealthy = (ws: WebSocket | null): boolean => {
    if (!ws) return false;
    
    const state = ws.readyState;
    return state === WS_STATE.OPEN || state === WS_STATE.CONNECTING;
  };

  // Update the checkConnectionHealth function to use the new helper
  const checkConnectionHealth = () => {
    if (isUnmountingRef.current || !mountedRef.current) {
        return;
    }

    if (isConnectingRef.current) {
        const ws = chatWsRef.current;
        if (ws && ws.readyState === WebSocket.CONNECTING) {
            const connectionStartTime = Date.now() - connectionStartTimeRef.current;
            if (connectionStartTime > CONNECTION_TIMEOUT) {
                console.warn('[ChatWebSocket] Connection stuck in CONNECTING state:', {
                    duration: connectionStartTime,
                    readyState: ws.readyState,
                    timestamp: new Date().toISOString()
                });
                // Force close the connection
                try {
                    ws.close(1006, 'Connection timeout');
                } catch (error) {
                    console.error('[ChatWebSocket] Error closing stuck connection:', error);
                }
                handleReconnect();
            }
        }
    }

    const ws = chatWsRef.current;
    const now = Date.now();
    const lastPong = lastPongRef.current;
    const timeSinceLastPong = now - lastPong;

    // Only consider unhealthy if we have a significant delay in pong response
    const isUnhealthy = !isConnectionHealthy(ws) || 
        (timeSinceLastPong >= PONG_TIMEOUT * 2) || // Doubled the timeout threshold
        (ws?.readyState === WS_STATE.CLOSED && !isIntentionalClose && timeSinceLastPong > PONG_TIMEOUT);

    if (isUnhealthy) {
        console.log('[ChatWebSocket] Unhealthy connection detected:', {
            wsExists: !!ws,
            readyState: ws?.readyState,
            timeSinceLastPong,
            isIntentionalClose,
            timestamp: new Date().toISOString()
        });

        // Only close if we're sure the connection is dead
        if (ws && ws.readyState === WS_STATE.OPEN && timeSinceLastPong > PONG_TIMEOUT * 2) {
            try {
                ws.close(1000, 'Health check reconnection');
            } catch (error) {
                console.error('[ChatWebSocket] Error closing connection during health check:', error);
            }
        }
        handleReconnect();
    }
  };

  // Add connection quality monitoring with proper WebSocket state handling
  const monitorConnectionQuality = () => {
    if (!chatWsRef.current || chatWsRef.current.readyState !== WebSocket.OPEN) {
        return;
    }

    const now = Date.now();
    const lastPong = lastPongRef.current;
    const latency = now - lastPong;

    if (latency > MAX_LATENCY) {
        console.warn('[ChatWebSocket] High latency detected:', {
            latency: `${latency}ms`,
            timestamp: new Date().toISOString()
        });

        // If latency is extremely high, consider reconnecting
        if (latency > MAX_LATENCY * 2) {
            console.warn('[ChatWebSocket] Extremely high latency, reconnecting...');
            if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
                chatWsRef.current.close(1000, 'High latency');
                handleReconnect();
            }
        }
    }
  };

  // Add connection quality monitoring to the health check interval
  useEffect(() => {
    if (!mountedRef.current || isUnmountingRef.current) {
        return;
    }

    const healthCheckInterval = setInterval(() => {
        checkConnectionHealth();
        monitorConnectionQuality();
    }, HEALTH_CHECK_INTERVAL);

    return () => {
        clearInterval(healthCheckInterval);
    };
}, [conversationId]);

  const setupWebSocket = (ws: WebSocket) => {
    let connectionStableTimeout: NodeJS.Timeout | null = null;
    let connectionTimeout: NodeJS.Timeout | null = null;

    ws.onopen = () => {
        if (isUnmountingRef.current || !mountedRef.current) {
            console.log('[ChatWebSocket] Component unmounting during connection');
            ws.close(1000, 'Component unmounting');
            return;
        }

        console.log('[ChatWebSocket] Connection established successfully');
        isConnectingRef.current = false;
        connectionLocks.delete(getConnectionKey(currentConversationIdRef.current!));
        setIsConnected(true);
        setConnectionState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            lastError: null,
            reconnectAttempts: 0
        }));
        reconnectAttemptsRef.current = 0;
        setupHeartbeat(ws);
        clearTimeout(connectionTimeoutRef.current);
        startMessageQueueProcessing();
        processMessageQueue();

        // Clear any existing connection stable timeout
        if (connectionStableTimeout) {
            clearTimeout(connectionStableTimeout);
        }

        // Set connection as stable after a delay
        connectionStableTimeout = setTimeout(() => {
            if (!isUnmountingRef.current && mountedRef.current) {
                console.log('[ChatWebSocket] Connection marked as stable');
                setIsConnectionStable(true);
                connectionAttemptsRef.current = 0;
            }
        }, CONNECTION_STABLE_DELAY);

        // Set connection timeout
        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
        }
        connectionTimeout = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN && !isConnectionStable) {
                console.log('[ChatWebSocket] Connection timeout before stability');
                // Don't close the connection, just mark it as unstable
                setIsConnectionStable(false);
            }
        }, CONNECTION_TIMEOUT);
    };

    ws.onclose = (event) => {
        // Clear timeouts
        if (connectionStableTimeout) {
            clearTimeout(connectionStableTimeout);
        }
        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
        }

        console.log('[ChatWebSocket] Connection closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            readyState: ws.readyState,
            isConnectionStable,
            consecutiveAttempts: connectionAttemptsRef.current,
            timestamp: new Date().toISOString()
        });
        
        if (isUnmountingRef.current || !mountedRef.current) {
            return;
        }

        setIsConnectionStable(false);
        setConnectionState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false
        }));

        // Clear message queue processing
        if (messageQueueIntervalRef.current) {
            clearInterval(messageQueueIntervalRef.current);
        }

        // Handle different close codes
        if (event.code === 1008) {
            // Token validation failed
            console.log('[ChatWebSocket] Token validation failed, attempting token refresh');
            handleTokenExpired();
            return;
        } else if (event.code === 1000) {
            // Clean close
            if (!isConnectionStable) {
                console.log('[ChatWebSocket] Clean close before stability, attempting reconnection');
                const backoffDelay = Math.min(
                    RECONNECTION_BACKOFF * Math.pow(1.5, connectionAttemptsRef.current),
                    MAX_RECONNECTION_DELAY
                );
                setTimeout(() => {
                    if (!isUnmountingRef.current && mountedRef.current) {
                        handleReconnect();
                    }
                }, backoffDelay);
            }
        } else if (event.code === 1006) {
            // Abnormal closure
            console.log('[ChatWebSocket] Abnormal closure detected, attempting immediate reconnection');
            setTimeout(() => {
                if (!isUnmountingRef.current && mountedRef.current) {
                    handleReconnect();
                }
            }, RECONNECTION_BACKOFF);
        } else {
            // Other close codes
            if (!isUnmountingRef.current && mountedRef.current) {
                setTimeout(() => {
                    handleReconnect();
                }, RECONNECTION_BACKOFF);
            }
        }
    };

    ws.onerror = (error) => {
        console.error('[ChatWebSocket] Connection error:', {
            error,
            readyState: ws.readyState,
            timestamp: new Date().toISOString(),
            lastPong: lastPongRef.current
        });
        
        setConnectionState(prev => ({
            ...prev,
            lastError: 'Connection error occurred'
        }));
    };

    ws.onmessage = (event) => {
        if (isUnmountingRef.current || !mountedRef.current) {
            return;
        }
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'chat_message') {
                // Process chat_message as usual
                if (data.message && typeof data.message === 'object') {
                    const senderId = typeof data.message.sender === 'object' ? data.message.sender.id : data.message.sender;
                    const currentUserId = user?.id;
                    const isOwn = currentUserId ? String(senderId) === String(currentUserId) : false;
                    data.message.isOwn = isOwn;
                    
                    // Ensure all required fields are present and properly formatted
                    const now = new Date().toISOString();
                    
                    // Ensure timestamps are properly formatted
                    data.message.created_at = data.message.created_at ? formatDate(data.message.created_at) : now;
                    data.message.updated_at = data.message.updated_at ? formatDate(data.message.updated_at) : now;
                    
                    // Ensure message type is set
                    data.message.message_type = data.message.message_type || 'text';
                    
                    // Ensure status is set
                    if (isOwn) {
                        data.message.status = data.message.status || 'sent';
                    } else {
                        data.message.status = data.message.status || 'delivered';
                    }
                    
                    // Ensure sender object is properly formatted
                    if (typeof data.message.sender === 'object') {
                        data.message.sender = {
                            id: data.message.sender.id,
                            username: data.message.sender.username || '',
                            name: data.message.sender.name || data.message.sender.username || '',
                            // Only set avatarUrl for messages from other users
                            ...(isOwn ? {} : { avatarUrl: data.message.sender.avatarUrl })
                        };
                    } else {
                        // If sender is just an ID, create a minimal sender object
                        data.message.sender = {
                            id: data.message.sender,
                            username: '',
                            name: '',
                            // Only set avatarUrl for messages from other users
                            ...(isOwn ? {} : { avatarUrl: undefined })
                        };
                    }

                    // Process files array
                    if (data.message.files && Array.isArray(data.message.files)) {
                        data.message.files = data.message.files.map((file: any) => {
                            // Ensure file has all required fields
                            const processedFile = {
                                id: file.id || Math.random().toString(36).substr(2, 9),
                                file_name: file.file_name || file.fileName || 'unnamed_file',
                                file_type: file.file_type || file.type || 'application/octet-stream',
                                file_size: file.file_size || file.size || 0,
                                category: file.category || getFileCategory((file.file_name || file.fileName || '').split('.').pop()?.toLowerCase() || ''),
                                url: getFullUrl(file.url || file.file) || '',
                                thumbnail: getFullUrl(file.thumbnail || file.thumbnail_url) || '',
                                created_at: file.created_at || now,
                                uploaded_by: file.uploaded_by || senderId
                            };

                            // Log processed file for debugging
                            console.log('[ChatWebSocket] Processed file:', {
                                original: file,
                                processed: processedFile
                            });

                            return processedFile;
                        });
                    } else {
                        data.message.files = [];
                    }

                    // Ensure reactions array exists
                    if (!data.message.reactions) {
                        data.message.reactions = [];
                    }

                    console.log('[ChatWebSocket] Message processed:', {
                        message: data.message,
                        isOwn: data.message.isOwn,
                        status: data.message.status,
                        created_at: data.message.created_at,
                        updated_at: data.message.updated_at,
                        sender: data.message.sender,
                        files: data.message.files
                    });
                } else if (typeof data.message === 'string') {
                    // Handle error message string
                    console.error('[ChatWebSocket] Error from server:', data.message);
                    // Optionally, you can show a toast or set an error state here
                }

                // Process batch messages
                if (data.messages) {
                    data.messages = data.messages.map((msg: Message) => {
                        const senderId = typeof msg.sender === 'object' ? msg.sender.id : msg.sender;
                        const currentUserId = user?.id;
                        const isOwn = currentUserId ? String(senderId) === String(currentUserId) : false;

                        // Ensure all required fields are present and properly formatted
                        const now = new Date().toISOString();
                        
                        // Ensure timestamps are properly formatted
                        msg.created_at = msg.created_at ? formatDate(msg.created_at) : now;
                        msg.updated_at = msg.updated_at ? formatDate(msg.updated_at) : now;
                        
                        // Ensure message type is set
                        msg.message_type = msg.message_type || 'text';
                        
                        // Ensure status is set
                        const status = isOwn ? (msg.status || 'sent') : (msg.status || 'delivered');
                        
                        // Ensure sender object is properly formatted
                        if (typeof msg.sender === 'object') {
                            msg.sender = {
                                id: msg.sender.id,
                                username: msg.sender.username || '',
                                name: msg.sender.name || msg.sender.username || '',
                                // Only set avatarUrl for messages from other users
                                ...(isOwn ? {} : { avatarUrl: msg.sender.avatarUrl })
                            };
                        } else {
                            // If sender is just an ID, create a minimal sender object
                            msg.sender = {
                                id: msg.sender,
                                username: '',
                                name: '',
                                // Only set avatarUrl for messages from other users
                                ...(isOwn ? {} : { avatarUrl: undefined })
                            };
                        }

                        // Process files array
                        if (msg.files && Array.isArray(msg.files)) {
                            msg.files = msg.files.map((file: any) => {
                                // Ensure file has all required fields
                                const processedFile = {
                                    id: file.id || Math.random().toString(36).substr(2, 9),
                                    file_name: file.file_name || file.fileName || 'unnamed_file',
                                    file_type: file.file_type || file.type || 'application/octet-stream',
                                    file_size: file.file_size || file.size || 0,
                                    category: file.category || getFileCategory((file.file_name || file.fileName || '').split('.').pop()?.toLowerCase() || ''),
                                    url: getFullUrl(file.url || file.file) || '',
                                    thumbnail: getFullUrl(file.thumbnail || file.thumbnail_url) || '',
                                    created_at: file.created_at || now,
                                    uploaded_by: file.uploaded_by || senderId
                                };

                                // Log processed file for debugging
                                console.log('[ChatWebSocket] Processed file in batch:', {
                                    original: file,
                                    processed: processedFile
                                });

                                return processedFile;
                            });
                        } else {
                            msg.files = [];
                        }

                        // Ensure reactions array exists
                        if (!msg.reactions) {
                            msg.reactions = [];
                        }

                        return {
                            ...msg,
                            isOwn,
                            status
                        };
                    });
                }

                // Handle online status change messages
                if (data.type === 'online_status_change') {
                    console.log('[ChatWebSocket] Online status change received:', {
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
                }

                setLastMessage(data);
            } else {
                // Ignore all other event types
                // Optionally log for debugging
                // console.log('[ChatWebSocket] Ignoring non-chat_message event:', data.type);
            }
        } catch (error) {
            console.error('[ChatWebSocket] Error parsing WebSocket message:', error);
        }
    };
  };

  const connect = async (conversationId: string) => {
    connectionStartTimeRef.current = Date.now();
    if (isUnmountingRef.current || !mountedRef.current) {
        console.log('[ChatWebSocket] Component unmounting or not mounted, skipping connection');
        return;
    }

    // Check if we're in the middle of a conversation change
    if (isConversationChanging) {
        console.log('[ChatWebSocket] Conversation change in progress, skipping connection');
        return;
    }

    // Check if a connection is already in progress
    if (isConnectingRef.current || chatWsRef.current?.readyState === WebSocket.CONNECTING) {
        console.log('[ChatWebSocket] Connection already in progress, skipping');
        return;
    }

    if (!token) {
        console.log('[ChatWebSocket] No token available');
        return;
    }

    if (!conversationId) {
        console.log('[ChatWebSocket] No conversation ID provided');
        return;
    }

    const connectionKey = getConnectionKey(conversationId);
    const now = Date.now();
    const lastAttempt = lastConnectionAttempt.get(connectionKey) || 0;

    // More aggressive connection debouncing
    if (now - lastAttempt < CONNECTION_DEBOUNCE) {
        console.log('[ChatWebSocket] Connection attempt debounced');
        return;
    }

    // Check for too many consecutive attempts
    if (connectionAttemptsRef.current >= MAX_CONSECUTIVE_ATTEMPTS) {
        console.log('[ChatWebSocket] Too many consecutive connection attempts, waiting...');
        setTimeout(() => {
            connectionAttemptsRef.current = 0;
            if (!isUnmountingRef.current && mountedRef.current) {
                connect(conversationId);
            }
        }, CONNECTION_DEBOUNCE * 2);
        return;
    }

    // Set connection state
    lastConnectionAttempt.set(connectionKey, now);
    currentConversationIdRef.current = conversationId;
    isConnectingRef.current = true;
    connectionLocks.set(connectionKey, true);
    setIsConnected(false);
    setIsConnectionStable(false);
    clearTimeout(connectionTimeoutRef.current);
    connectionAttemptsRef.current++;

    try {
        const currentToken = localStorage.getItem('access_token');
        if (!currentToken) {
            throw new Error('No access token available');
        }

        // Clean up any existing connection before creating a new one
        if (chatWsRef.current) {
            cleanup();
        }

        const wsUrl = `${WS_BASE_URL}/ws/chat/${conversationId}/?token=${encodeURIComponent(currentToken)}`;
        console.log('[ChatWebSocket] Attempting connection to:', wsUrl);

        const ws = new WebSocket(wsUrl);
        
        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                console.log('[ChatWebSocket] Connection attempt timed out');
                ws.close(1000, 'Connection timeout');
            }
        }, CONNECTION_TIMEOUT);

        ws.onopen = () => {
            clearTimeout(connectionTimeout);
            setupWebSocket(ws);
        };

        chatWsRef.current = ws;

    } catch (error) {
        console.error('[ChatWebSocket] Error during connection:', error);
        cleanup();
        setConnectionState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false,
            lastError: 'Connection failed'
        }));
        handleTokenExpired();
    }
};

  const sendMessage = (message: ChatWebSocketMessage) => {
    // Only allow sending chat_message events
    if (message.type !== 'chat_message') {
      console.warn('[ChatWebSocket] Only chat_message events are allowed to be sent. Ignoring:', message.type);
      return;
    }
    if (!chatWsRef.current || chatWsRef.current.readyState !== WebSocket.OPEN) {
        console.log('[ChatWebSocket] WebSocket not connected, queueing message');
        // Add isOwn flag and status to queued messages
        if (message.message && user) {
            message.message.isOwn = true;
            message.message.status = 'pending';
            // Set current timestamp in ISO format
            const now = new Date().toISOString();
            message.message.created_at = now;
            message.message.updated_at = now;
            
            // Ensure sender ID matches current user
            if (typeof message.message.sender === 'object') {
                message.message.sender.id = user.id;
            } else {
                message.message.sender = { id: user.id, username: user.username };
            }
        }
        messageQueueRef.current.push(message);
        
        // If we're not connected and not already connecting, try to connect
        if (!isConnected && !isConnectingRef.current && currentConversationIdRef.current) {
            connect(currentConversationIdRef.current);
        }
        return;
    }

    try {
        // Add isOwn flag and status to outgoing messages
        if (message.message && user) {
            message.message.isOwn = true;
            message.message.status = 'sent';
            
            // Ensure timestamps are in ISO format
            const now = new Date().toISOString();
            if (!message.message.created_at || isNaN(new Date(message.message.created_at).getTime())) {
                message.message.created_at = now;
            }
            message.message.updated_at = now;
            
            // Ensure sender ID matches current user
            if (typeof message.message.sender === 'object') {
                message.message.sender.id = user.id;
            } else {
                message.message.sender = { id: user.id, username: user.username };
            }

            // Validate timestamps before sending
            try {
                const createdDate = new Date(message.message.created_at);
                const updatedDate = new Date(message.message.updated_at);
                
                if (isNaN(createdDate.getTime()) || isNaN(updatedDate.getTime())) {
                    throw new Error('Invalid timestamp format');
                }
                
                // Ensure timestamps are in ISO format
                message.message.created_at = createdDate.toISOString();
                message.message.updated_at = updatedDate.toISOString();
            } catch (error) {
                console.error('[ChatWebSocket] Invalid timestamp format:', error);
                // Reset timestamps to current time if invalid
                const now = new Date().toISOString();
                message.message.created_at = now;
                message.message.updated_at = now;
            }
        }
        const messageStr = JSON.stringify(message);
        chatWsRef.current.send(messageStr);
    } catch (error) {
        console.error('[ChatWebSocket] Error sending message:', error);
        // Add isOwn flag and status to failed messages that get queued
        if (message.message && user) {
            message.message.isOwn = true;
            message.message.status = 'failed';
            // Set current timestamp in ISO format
            const now = new Date().toISOString();
            message.message.created_at = now;
            message.message.updated_at = now;
            
            // Ensure sender ID matches current user
            if (typeof message.message.sender === 'object') {
                message.message.sender.id = user.id;
            } else {
                message.message.sender = { id: user.id, username: user.username };
            }
        }
        messageQueueRef.current.push(message);
    }
  };

  // Add these functions before setupWebSocket
  const processMessageQueue = () => {
    if (!chatWsRef.current || chatWsRef.current.readyState !== WebSocket.OPEN) {
        return;
    }

    if (isProcessingQueueRef.current) {
        return;
    }

    isProcessingQueueRef.current = true;

    try {
        while (messageQueueRef.current.length > 0) {
            const message = messageQueueRef.current[0];
            try {
                // Ensure isOwn flag and status are set for queued messages
                if (message.message && user) {
                    message.message.isOwn = true;
                    message.message.status = 'sent';
                    
                    // Ensure timestamps are in ISO format
                    const now = new Date().toISOString();
                    if (!message.message.created_at || isNaN(new Date(message.message.created_at).getTime())) {
                        message.message.created_at = now;
                    }
                    message.message.updated_at = now;
                    
                    // Validate timestamps before sending
                    try {
                        const createdDate = new Date(message.message.created_at);
                        const updatedDate = new Date(message.message.updated_at);
                        
                        if (isNaN(createdDate.getTime()) || isNaN(updatedDate.getTime())) {
                            throw new Error('Invalid timestamp format');
                        }
                        
                        // Ensure timestamps are in ISO format
                        message.message.created_at = createdDate.toISOString();
                        message.message.updated_at = updatedDate.toISOString();
                    } catch (error) {
                        console.error('[ChatWebSocket] Invalid timestamp format in queued message:', error);
                        // Reset timestamps to current time if invalid
                        const now = new Date().toISOString();
                        message.message.created_at = now;
                        message.message.updated_at = now;
                    }
                    
                    // Ensure sender ID matches current user
                    if (typeof message.message.sender === 'object') {
                        message.message.sender.id = user.id;
                    } else {
                        message.message.sender = { id: user.id, username: user.username };
                    }
                }
                const messageStr = JSON.stringify(message);
                chatWsRef.current.send(messageStr);
                messageQueueRef.current.shift(); // Remove the sent message from queue
            } catch (error) {
                console.error('[ChatWebSocket] Error processing queued message:', error);
                break; // Stop processing if we encounter an error
            }
        }
    } finally {
        isProcessingQueueRef.current = false;
    }
  };

  const startMessageQueueProcessing = () => {
    if (messageQueueIntervalRef.current) {
        clearInterval(messageQueueIntervalRef.current);
    }

    messageQueueIntervalRef.current = setInterval(() => {
        if (chatWsRef.current?.readyState === WebSocket.OPEN) {
            processMessageQueue();
        }
    }, MESSAGE_QUEUE_PROCESS_INTERVAL);
  };

  const handleReconnect = () => {
    if (isUnmountingRef.current || !mountedRef.current) {
        console.log('[ChatWebSocket] Component unmounting or not mounted, skipping reconnection');
        return;
    }

    if (isConnectingRef.current || chatWsRef.current?.readyState === WebSocket.CONNECTING) {
        console.log('[ChatWebSocket] Connection attempt already in progress, skipping reconnection');
        return;
    }

    const now = Date.now();
    const lastAttempt = lastReconnectAttemptRef.current;
    const attempt = reconnectAttemptsRef.current;
    const delay = getReconnectionDelay(attempt);

    // More lenient debouncing for reconnection attempts
    if (now - lastAttempt < Math.min(delay, 2000)) {
        console.log('[ChatWebSocket] Reconnection attempt too soon, waiting...');
        return;
    }

    if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        console.log('[ChatWebSocket] Max reconnection attempts reached');
        setConnectionState(prev => ({
            ...prev,
            lastError: 'Connection failed after multiple attempts. Please refresh the page.'
        }));
        return;
    }

    console.log(`[ChatWebSocket] Attempting reconnection in ${delay}ms (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    
    lastReconnectAttemptRef.current = now;
    reconnectAttemptsRef.current = attempt + 1;

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
    }

    // Clean up existing connection before attempting reconnection
    cleanup();

    reconnectTimeoutRef.current = setTimeout(() => {
        if (!isUnmountingRef.current && mountedRef.current && currentConversationIdRef.current) {
            connect(currentConversationIdRef.current);
        }
    }, delay);
};

  const reconnect = () => {
    if (!isUnmountingRef.current && mountedRef.current && currentConversationIdRef.current) {
      console.log('[ChatWebSocket] Manual reconnection requested');
      reconnectAttemptsRef.current = 0; // Reset attempt counter for manual reconnection
      connect(currentConversationIdRef.current);
    }
  };

  // Improved reconnection delay calculation
  const getReconnectionDelay = (attempt: number) => {
    const baseDelay = Math.min(RECONNECTION_BACKOFF * Math.pow(1.5, attempt), MAX_RECONNECTION_DELAY);
    const jitter = Math.random() * 1000; // Reduced jitter to 1 second
    return baseDelay + jitter;
  };

  useEffect(() => {
    mountedRef.current = true;
    isUnmountingRef.current = false;

    // Delay initial connection to allow component to fully mount
    const initTimeout = setTimeout(() => {
      if (conversationId && token) {
        connect(conversationId);
      }
    }, INITIAL_CONNECTION_DELAY);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [conversationId, token]);

  // Update currentConversationIdRef when conversationId prop changes
  useEffect(() => {
    const handleConversationChange = async () => {
        if (!mountedRef.current || isUnmountingRef.current) {
            console.log('[ChatWebSocket] Component unmounting or already unmounted, skipping conversation change');
            return;
        }

        if (conversationId && conversationId !== currentConversationIdRef.current) {
            console.log('[ChatWebSocket] Conversation ID changed:', conversationId);
            
            // Set conversation changing state
            setIsConversationChanging(true);
            
            // Clear any existing conversation change timeout
            if (conversationChangeTimeoutRef.current) {
                clearTimeout(conversationChangeTimeoutRef.current);
            }

            // Clean up existing connection
            if (chatWsRef.current) {
                console.log('[ChatWebSocket] Closing existing connection for new conversation');
                cleanup();
            }

            // Wait a short time before connecting to the new conversation
            conversationChangeTimeoutRef.current = setTimeout(() => {
                if (token && !isUnmountingRef.current) {
                    console.log('[ChatWebSocket] Connecting to new conversation');
                    currentConversationIdRef.current = conversationId;
                    connect(conversationId);
                }
                setIsConversationChanging(false);
            }, 1000);
        }
    };

    handleConversationChange();

    return () => {
        if (conversationChangeTimeoutRef.current) {
            clearTimeout(conversationChangeTimeoutRef.current);
        }
    };
}, [conversationId, token]);

  // Add network awareness
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected && !isConnectingRef.current) {
        console.log('[ChatWebSocket] Network is back online, attempting to reconnect');
        reconnect();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isConnected]);

  // Add visibility awareness
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && chatWsRef.current) {
        console.log('[ChatWebSocket] Tab hidden, closing connection');
        chatWsRef.current.close(1000, 'Tab hidden');
      } else if (!document.hidden && !isConnected && !isConnectingRef.current) {
        console.log('[ChatWebSocket] Tab visible again, attempting to reconnect');
        reconnect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected]);

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
        if (chatWsRef.current) {
          chatWsRef.current.close(1000, 'Token refresh');
        }
        // Reset connection state
        setIsConnected(false);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        // Add a small delay before reconnecting to ensure token is properly set
        setTimeout(() => {
          if (currentConversationIdRef.current) {
            connect(currentConversationIdRef.current);
          }
        }, 1000);
      } else {
        console.error('Token refresh failed');
        // Clear connection state
        if (chatWsRef.current) {
          chatWsRef.current.close(1000, 'Token refresh failed');
        }
        setIsConnected(false);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
      // Clear connection state
      if (chatWsRef.current) {
        chatWsRef.current.close(1000, 'Token refresh error');
      }
      setIsConnected(false);
      isConnectingRef.current = false;
      reconnectAttemptsRef.current = 0;
      window.location.href = '/login';
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const clearHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Add a function to check connection and reconnect if needed
  const ensureConnection = () => {
    if (!isConnected && !isConnectingRef.current && currentConversationIdRef.current) {
      connect(currentConversationIdRef.current);
    }
  };

  // Modify the useEffect for connection management
  useEffect(() => {
    if (!mountedRef.current || isUnmountingRef.current) {
      return;
    }

    // Ensure connection is established when component mounts
    ensureConnection();

    // Set up periodic connection check
    const connectionCheckInterval = setInterval(() => {
      if (!isConnected && !isConnectingRef.current && currentConversationIdRef.current) {
        ensureConnection();
      }
    }, CONNECTION_CHECK_INTERVAL);

    return () => {
      clearInterval(connectionCheckInterval);
    };
  }, [conversationId]); // Only re-run when conversationId changes

  // Update the value object to include connection quality metrics
  const value = {
    isConnected,
    sendMessage,
    lastMessage,
    connect,
    disconnect,
    lastError: connectionState.lastError,
    reconnect,
    connectionState: {
        ...getConnectionState(),
        latency: Date.now() - lastPongRef.current,
        quality: lastPongRef.current ? 'good' : 'unknown'
    }
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
        isUnmountingRef.current = true;
        if (chatWsRef.current) {
            try {
                chatWsRef.current.close(1000, 'Component unmounting');
            } catch (error) {
                console.error('[ChatWebSocket] Error during cleanup:', error);
            }
        }
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }
        if (keepAliveIntervalRef.current) {
            clearInterval(keepAliveIntervalRef.current);
        }
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (messageQueueIntervalRef.current) {
            clearInterval(messageQueueIntervalRef.current);
        }
        if (connectionStableTimeoutRef.current) {
            clearTimeout(connectionStableTimeoutRef.current);
        }
    };
  }, []);

  return (
    <ChatWebSocketContext.Provider value={value}>
      {children}
    </ChatWebSocketContext.Provider>
  );
};

export const useChatWebSocket = () => {
  const context = useContext(ChatWebSocketContext);
  if (!context) {
    throw new Error('useChatWebSocket must be used within a ChatWebSocketProvider');
  }
  return context;
}; 