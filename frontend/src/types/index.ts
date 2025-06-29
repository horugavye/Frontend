export interface Profile {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  firstName: string;
  lastName: string;
  bio: string;
  location: string;
  profilePhoto: string;
  coverPhoto: string;
  connectionStrength: number;
  personalStory: string;
  careerPath: CareerExperience[];
  personalityTags: PersonalityTag[];
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CareerExperience {
  id: number;
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface PersonalityTag {
  id: number;
  name: string;
  color: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  name: string;
  avatarUrl: string;
  bio: string;
  personalStory: string;
  personalityTags: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  connectionStrength: number;
  followers: number;
  following: number;
  posts: number;
  personalPosts: number;
  communityPosts: number;
  rating: number;
  location: string;
  website: string;
  interests: string[];
  skills: Array<{
    name: string;
    level: number;
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
  availability: {
    mentoring: boolean;
    collaboration: boolean;
    networking: boolean;
  };
  education: Array<{
    school: string;
    degree: string;
    field: string;
    year: string;
  }>;
  workExperience: Array<{
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
  certifications: Array<{
    id: string;
    name: string;
    issuing_organization: string;
    issue_date: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
  }>;
} 