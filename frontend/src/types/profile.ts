export interface Profile {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
  };
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  personal_story: string;
  location: string;
  birth_date: string | null;
  avatar: string;
  website: string;
  connection_strength: number;
  followers: number;
  following: number;
  posts_count: number;
  personal_posts_count: number;
  community_posts_count: number;
  rating: number;
  personality_tags: Array<{
    name: string;
    color: string;
  }>;
  skills: Array<{
    name: string;
    level: number;
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    year: string;
    description?: string;
  }>;
  work_experience: Array<{
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }>;
  achievements: Array<{
    title: string;
    date: string;
    description: string;
  }>;
  available_for_mentoring: boolean;
  available_for_collaboration: boolean;
  available_for_networking: boolean;
  interests: string[];
  purpose_of_connection: string[];
  preferred_communication: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  rating: number;
  reputation_points: number;
  connection_strength: number;
  is_verified: boolean;
  is_mentor: boolean;
  account_type: 'personal' | 'professional' | 'business';
  profile_visibility: 'public' | 'private' | 'connections';
  two_factor_enabled: boolean;
  email_verified: boolean;
  last_active: string;
  online_status: 'online' | 'away' | 'offline' | 'busy';
  language_preference: string;
  theme_preference: 'light' | 'dark' | 'system';
  timezone: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  contribution_points: number;
  profile_completion: number;
  endorsement_count: number;
} 