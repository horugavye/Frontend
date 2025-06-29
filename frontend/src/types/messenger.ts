export interface MessageStatus {
  sent: boolean;
  delivered: boolean;
  read: boolean;
  timestamp: string;
}

export interface ConversationParticipant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
  is_online: boolean;
  status: 'online' | 'offline' | 'away' | 'busy';
  last_active?: string;
  bio?: string;
  personality_tags?: Array<{
    name: string;
    color: string;
  }>;
}

export interface ConversationLastMessage {
  content: string;
  timestamp: string;
  is_read: boolean;
}

export interface ConversationResponse {
  id: string;
  type: 'direct' | 'group';
  name: string;
  participant?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
    is_online: boolean;
    status: 'online' | 'offline' | 'away' | 'busy';
    personality_tags?: Array<{
      name: string;
      color: string;
    }>;
  };
  last_message?: {
    content: string;
    timestamp: string;
    sender: {
      id: string;
      name: string;
    };
  };
  unread_count: number;
  members_count?: number;
  color?: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatarUrl: string;
    role?: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatarUrl: string;
    role?: string;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'sending' | 'error';
  isOwn: boolean;
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
  }>;
  thread?: MessageThread;
  hasThread?: boolean;
  isThreadReply?: boolean;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      avatarUrl: string;
      role?: string;
    };
  };
  conversation?: string;
  conversation_id?: string;
  message_type?: 'text' | 'file' | 'image' | 'voice' | 'video' | 'mixed';
  files?: Array<{
    id: string;
    file: string;
    file_name: string;
    file_type: string;
    file_size: number;
    category: 'document' | 'image' | 'video' | 'audio';
    thumbnail: string;
    created_at: string;
    uploaded_by: string;
    url: string;
  }>;
  deliveryStatus?: {
    sent: boolean;
    delivered: boolean;
    read: boolean;
    timestamp: string;
    readBy?: Array<{
      id: string;
      name: string;
      avatarUrl: string;
      readAt: string;
    }>;
  };
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
    isSelected?: boolean;
    user?: {
      id: string;
      name: string;
      avatarUrl: string;
    };
  }>;
  edited?: boolean;
  editHistory?: Array<{
    content: string;
    editedAt: string;
    editedBy: {
      id: string;
      name: string;
    };
  }>;
  isStory?: boolean;
  storyId?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  isSelected?: boolean;
}

export interface MessageEffect {
  type: 'confetti' | 'hearts' | 'fireworks';
  intensity: number;
}

export interface MessageThread {
  id: string;
  parentMessage: Message;
  replies: Message[];
  participantsCount: number;
  lastReplyAt: string;
  repliesCount: number;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
}

export interface VoiceMessage {
  duration: number;
  url: string;
  waveform: number[];
}

export interface MessageFormat {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  lastMessage: {
    content: string;
    timestamp: string;
    sender: {
      id: string;
      name: string;
    };
  } | null;
  unreadCount: number;
  user: {
    id: string;
    name: string;
    avatarUrl: string;
    isOnline: boolean;
    status: 'online' | 'offline' | 'away' | 'busy';
    bio?: string;
    personality_tags?: Array<{
      name: string;
      color: string;
    }>;
  } | null;
  group: {
    id: string;
    name: string;
    acronym: string;
    color: string;
    members: number;
    isActive: boolean;
    description?: string;
    avatarUrl: string;
  } | null;
  group_id?: string;
  members?: Array<{
    id: string;
    user: {
      id: string;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      avatar: string;
      online_status: string;
      is_online: boolean;
      bio: string;
      personality_tags: number[];
    };
    role: string;
    joined_at: string;
    last_read: string | null;
    is_muted: boolean;
    is_pinned: boolean;
    unread_count: number;
  }>;
}

export interface ConversationMessages {
  [key: string]: Message[];
}

export interface GroupMember {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  isOnline: boolean;
}

export interface GroupMembers {
  [key: string]: GroupMember[];
}

export interface GroupChat {
  id: string;
  name: string;
  acronym: string;
  color: string;
  lastMessage: string;
  timestamp: string;
  members: Array<{
    id: string;
    name: string;
    avatarUrl: string;
    role: string;
    isOnline: boolean;
  } | null>;
  unread: number;
  isActive: boolean;
}

export interface ReactionEmoji {
  emoji: string;
  label: string;
}

export interface MessageGroup {
  date: string;
  messages: Message[];
}

export interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error' | 'pending';
  error?: string;
  preview?: string;
  uploadedUrl?: string;
  uploadedThumbnail?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  is_online: boolean;
  last_seen?: string;
  role?: string;
  mutual_connections?: number;
  personality_tags?: { name: string; color: string }[];
  bio?: string;
  location?: string;
  interests?: string[];
}

export interface Connection {
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

export interface GroupMemberData {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  isOnline: boolean;
}

export interface MessageSuggestion {
  id: number;
  conversation: string;
  user: string;
  suggestion_type: 'quick_reply' | 'context_based' | 'smart_completion' | 'topic_suggestion' | 'emotion_based' | 'conversation_starter';
  content: string;
  context: {
    reasoning?: string;
    ai_generated?: boolean;
    [key: string]: any;
  };
  confidence_score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  feedback: {
    rejection_reason?: string;
    [key: string]: any;
  };
  usage_count: number;
  last_used?: string;
  used_in_message?: string;
}

export interface RealTimeSuggestion {
  id: string; // Temporary ID for frontend use
  conversation_id: string;
  user_id: string;
  suggestion_type: 'quick_reply' | 'context_based' | 'topic_suggestion' | 'conversation_starter';
  content: string;
  context: {
    reasoning?: string;
    ai_generated?: boolean;
    [key: string]: any;
  };
  confidence_score: number;
  created_at: string;
  is_real_time: boolean;
}

export interface ConversationAnalysis {
  conversation_analysis: string;
  message_count: number;
  participants: Array<{
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    is_current_user: boolean;
  }>;
  conversation_type: string;
} 