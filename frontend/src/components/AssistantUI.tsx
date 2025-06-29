import React, { useState, useRef, useEffect } from 'react';
import { FaRegPaperPlane, FaMicrophone, FaStop } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { connectionApi } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Constants
const API_BASE_URL = import.meta.env.VITE_API_URL;
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
const CONNECTION_TIMEOUT = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000; // 30 seconds

interface AssistantUIProps {
  onClose?: () => void;
}

interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string;
    role?: string;
    isOnline?: boolean;
    lastSeen?: string;
    mutualConnections?: number;
  };
}

const AssistantUI: React.FC<AssistantUIProps> = ({ onClose }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ message: string; is_user_message: boolean }>>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const { token, user } = useAuth();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ label: string; color: string }>>([]);
  const [lastStreamedMessage, setLastStreamedMessage] = useState('');
  const [streamingInProgress, setStreamingInProgress] = useState(false);
  const [justStreamed, setJustStreamed] = useState(false);
  const [fullStreamedMessage, setFullStreamedMessage] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);

  const getSuggestionColor = (index: number) => {
    const colors = [
      'bg-purple-100 text-purple-700 dark:bg-purple-100 dark:text-purple-700 border border-purple-200 dark:border-purple-800',
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800',
      'bg-white text-gray-700 dark:bg-dark-card dark:text-gray-200 border border-gray-200 dark:border-gray-700',
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
    ];
    return colors[index % colors.length];
  };

  const getSuggestions = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'get_suggestions',
        conversation_id: conversationId
      }));
    }
  };

  const connectWebSocket = () => {
    if (!token) {
      setConnectionError('Authentication required');
      return;
    }

    // Clear any existing connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    try {
      const wsUrl = `${WS_BASE_URL}/ws/assistant/chat/?token=${encodeURIComponent(token)}`;
      console.log('[AssistantUI] Attempting to connect to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('[AssistantUI] Connection timeout');
          ws.close();
          setConnectionError('Connection timeout. Please try again.');
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        console.log('[AssistantUI] WebSocket connected');
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }

        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            } catch (error) {
              console.error('[AssistantUI] Error sending ping:', error);
              handleReconnect();
            }
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[AssistantUI] Received message:', data);
          
          if (data.type === 'auth_success') {
            setConversationId(data.conversation_id);
          } else if (data.type === 'chat_message') {
            // Prevent duplicate if the last assistant message matches the new message
            setJustStreamed(false);
            setFullStreamedMessage('');
            setIsLoading(false);
            // Only add if not a duplicate of the last assistant message
            setMessages(prev => {
              if (
                prev.length > 0 &&
                !prev[prev.length - 1].is_user_message &&
                prev[prev.length - 1].message === data.message
              ) {
                getSuggestions();
                return prev;
              }
              const updated = [...prev, { message: data.message, is_user_message: false }];
              getSuggestions();
              return updated;
            });
          } else if (data.type === 'stream_chunk') {
            setIsStreaming(true);
            setIsLoading(false);
            setStreamingInProgress(true);
            handleStreamingMessage(data.content);
          } else if (data.type === 'stream_complete') {
            handleStreamComplete();
          } else if (data.type === 'suggestions') {
            setSuggestions(data.suggestions.map((suggestion: string, index: number) => ({
              label: suggestion,
              color: getSuggestionColor(index)
            })));
          } else if (data.type === 'welcome_message') {
            setMessages(prev => [...prev, { message: data.message, is_user_message: false }]);
            getSuggestions();
          } else if (data.type === 'typing_start') {
            setIsLoading(true);
            setIsStreaming(false);
          } else if (data.type === 'error') {
            if (data.message.includes('token validation')) {
              setConnectionError('Authentication failed. Please log in again.');
              ws.close();
            } else {
              setConnectionError(data.message);
            }
            setIsLoading(false);
            setIsStreaming(false);
          } else if (data.type === 'pong') {
            console.log('[AssistantUI] Received pong response');
          }
        } catch (error) {
          console.error('[AssistantUI] Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[AssistantUI] WebSocket closed:', event.code, event.reason);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        // Handle different close codes
        switch (event.code) {
          case 1012: // Service Restart
            setConnectionError('Server is restarting. Please try again in a moment.');
            return;
          case 1000: // Normal Closure
            console.log('[AssistantUI] WebSocket closed normally');
            return;
          case 1006: // Abnormal Closure
            console.log('[AssistantUI] Abnormal closure, attempting to reconnect');
            setConnectionError('Connection lost. Attempting to reconnect...');
            handleReconnect();
            break;
          case 1011: // Internal Error
            console.log('[AssistantUI] Internal error, attempting to reconnect');
            setConnectionError('Server error occurred. Please try again later.');
            handleReconnect();
            break;
          default:
            if (event.code !== 1000) {
              console.log('[AssistantUI] Unexpected closure, attempting to reconnect');
              setConnectionError('Connection error occurred. Attempting to reconnect...');
              handleReconnect();
            }
        }
      };

      ws.onerror = (error) => {
        console.error('[AssistantUI] WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };
    } catch (error) {
      console.error('[AssistantUI] Error creating WebSocket:', error);
      setConnectionError('Failed to establish connection');
    }
  };

  const handleReconnect = () => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[AssistantUI] Max reconnection attempts reached');
      setConnectionError('Failed to connect after multiple attempts. Please refresh the page.');
      return;
    }

    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current), RECONNECT_DELAY);
    console.log(`[AssistantUI] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connectWebSocket();
    }, delay);
  };

  const handleSend = () => {
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    setMessages(prev => [...prev, { message: message.trim(), is_user_message: true }]);
    setIsLoading(true);
    
    try {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        message: message.trim(),
        conversation_id: conversationId
      }));
      setMessage('');
    } catch (error) {
      console.error('[AssistantUI] Error sending message:', error);
      setConnectionError('Failed to send message');
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // TODO: Implement actual recording logic
  };

  const stopRecording = () => {
    setIsRecording(false);
    // TODO: Implement actual recording stop logic
  };

  const handleStop = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && conversationId) {
      setShouldStop(true);
      wsRef.current.send(JSON.stringify({
        type: 'stop_stream',
        conversation_id: conversationId
      }));
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  const handleStreamingMessage = (content: string) => {
    setLastStreamedMessage(prev => {
      const updated = prev + content;
      setFullStreamedMessage(prevFull => prevFull + content);
      setMessages(prevMsgs => {
        const lastMsg = prevMsgs[prevMsgs.length - 1];
        if (lastMsg && !lastMsg.is_user_message) {
          const updatedMsgs = [...prevMsgs];
          updatedMsgs[prevMsgs.length - 1] = { ...lastMsg, message: updated };
          return updatedMsgs;
        } else {
          return [...prevMsgs, { message: updated, is_user_message: false }];
        }
      });
      return updated;
    });
  };

  const handleStreamComplete = () => {
    setIsLoading(false);
    setIsStreaming(false);
    setStreamingInProgress(false);
    setJustStreamed(true);
    setLastStreamedMessage(''); // Reset after stream is done
    // Do not reset fullStreamedMessage here, wait for chat_message
    getSuggestions();
  };

  const fetchConnections = async () => {
    if (!token) return;
    
    setIsLoadingConnections(true);
    setConnectionsError(null);
    
    try {
      const response = await connectionApi.getConnections();
      setConnections(response.data);
    } catch (error) {
      console.error('[AssistantUI] Error fetching connections:', error);
      setConnectionsError('Failed to load connections');
    } finally {
      setIsLoadingConnections(false);
    }
  };

  // Default quick suggestions
  const defaultSuggestions = [
    { label: 'What can you do?', color: getSuggestionColor(0) },
    { label: 'Tell me something interesting', color: getSuggestionColor(1) },
    { label: 'How can you help me?', color: getSuggestionColor(2) },
    { label: 'Give me a productivity tip', color: getSuggestionColor(3) },
  ];

  useEffect(() => {
    connectWebSocket();

    // Add a more open-ended hardcoded welcome message when the assistant opens
    setMessages([{ message: 'Welcome! Feel free to ask me anything or start a conversation. How can I assist you today?', is_user_message: false }]);
    setSuggestions(defaultSuggestions);

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchConnections();
    }
  }, [token]);

  return (
    <div className="w-[400px] max-w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col h-[560px] relative">
      {onClose && (
        <button
          className="absolute top-3 right-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow text-gray-500 hover:text-purple-600 transition-colors z-10"
          onClick={onClose}
          aria-label="Close Assistant"
        >
          ×
        </button>
      )}
      <div className="bg-gradient-to-r from-purple-600 to-cyan-400 p-5 pb-3 rounded-t-2xl flex items-center">
        <div className="flex items-center gap-2">
          <HiSparkles className="w-7 h-7 text-white drop-shadow" />
          <div className="text-white text-lg font-semibold mb-0.5">AI Assistant</div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl">
        <div className="h-full overflow-y-auto px-5 pt-5">
          {connectionError && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-2xl p-3 mb-4 text-sm">
              {connectionError}
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start mb-4 ${msg.is_user_message ? 'justify-end' : 'justify-start'}`}>
              {msg.is_user_message ? (
                <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 rounded-2xl px-4 py-3 text-base max-w-xs shadow border border-purple-200 dark:border-purple-800">
                  {msg.message}
                </div>
              ) : (
                <>
                  <div className="bg-white dark:bg-dark-card rounded-full w-9 h-9 flex items-center justify-center text-xl mr-3 shadow-sm">
                    <HiSparkles className="w-6 h-6" />
                  </div>
                  <div className="bg-white dark:bg-dark-card rounded-2xl px-4 py-3 text-gray-700 dark:text-gray-200 text-base max-w-xs shadow border border-gray-100 dark:border-gray-800">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.message}
                    </ReactMarkdown>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {isLoading && !isStreaming && (
            <div className="flex items-start mb-4">
              <div className="bg-white dark:bg-dark-card rounded-full w-9 h-9 flex items-center justify-center text-xl mr-3 shadow-sm">
                <HiSparkles className="w-6 h-6" />
              </div>
              <div className="bg-white dark:bg-dark-card rounded-2xl px-4 py-3 text-gray-700 dark:text-gray-200 text-base max-w-xs shadow border border-gray-100 dark:border-gray-800">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div className="text-gray-500 dark:text-gray-400 text-xs mb-2 mt-1">Quick suggestions:</div>
          <div className="flex flex-wrap gap-x-2 gap-y-2 mb-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className={`rounded-2xl px-3 py-1.5 text-xs font-medium shadow-sm focus:outline-none ${s.color} hover:brightness-95 transition`}
                onClick={() => {
                  setMessage(s.label);
                  handleSend();
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-card rounded-b-2xl rounded-2xl">
        <div className="flex-1">
          <div className="relative">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
              />
              {isStreaming ? (
                <button
                  onClick={handleStop}
                  className="p-2.5 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                  aria-label="Stop Response"
                >
                  <FaStop size={16} />
                </button>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2.5 ${isRecording 
                    ? 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'} bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors`}
                  aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  {isRecording ? <FaStop size={16} /> : <FaMicrophone size={16} />}
                </button>
              )}
              <button 
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                className={`p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors ${(isLoading || !message.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Send Message"
              >
                <FaRegPaperPlane size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantUI; 