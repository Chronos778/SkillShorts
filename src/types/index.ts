// User roles
export type UserRole = 'learner' | 'creator' | 'admin';

// User levels
export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Video status
export type VideoStatus = 'pending' | 'approved' | 'rejected';

// Badge types
export type BadgeType =
  | 'first_video'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'quiz_master'
  | 'skill_beginner'
  | 'skill_intermediate'
  | 'skill_advanced'
  | 'category_complete'
  | 'points_100'
  | 'points_500'
  | 'points_1000';

// Database types
export interface User {
  id: string;
  clerk_user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  points: number;
  level: UserLevel;
  streak_count: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  video_count?: number;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds: number;
  category_id: string;
  category?: Category;
  creator_id: string;
  creator?: User;
  status: VideoStatus;
  view_count: number;
  completion_count: number;
  created_at: string;
  updated_at: string;
}

export type VideoReaction = 'like' | 'dislike';

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Pick<User, 'id' | 'name' | 'avatar_url'>;
}

export interface QuizQuestion {
  id: string;
  video_id: string;
  question: string;
  options: string[];
  correct_answer: number; // Index of correct option
  order_index: number;
  created_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  video_id: string;
  video?: Video;
  watched: boolean;
  quiz_score: number;
  quiz_answers: number[];
  completed: boolean;
  points_earned: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  earned_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Dashboard types
export interface DashboardStats {
  totalPoints: number;
  level: UserLevel;
  videosCompleted: number;
  quizAccuracy: number;
  currentStreak: number;
  badges: Badge[];
  recentProgress: Progress[];
  skillProgress: SkillProgress[];
}

export interface SkillProgress {
  category: Category;
  videosCompleted: number;
  totalVideos: number;
  averageScore: number;
}

// Creator types
export interface CreatorStats {
  totalVideos: number;
  approvedVideos: number;
  pendingVideos: number;
  totalViews: number;
  totalCompletions: number;
}

export interface VideoSubmission {
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds: number;
  category_id: string;
  quiz_questions: Omit<QuizQuestion, 'id' | 'video_id' | 'created_at'>[];
}

// Quiz types
export interface QuizSubmission {
  video_id: string;
  answers: number[];
}

export interface QuizResult {
  score: number;
  total: number;
  correct: number[];
  incorrect: number[];
  pointsEarned: number;
  badgesEarned: Badge[];
}

// Badge display info
export const BADGE_INFO: Record<BadgeType, { name: string; emoji: string; description: string }> = {
  first_video: {
    name: 'First Steps',
    emoji: '🎬',
    description: 'Complete your first video'
  },
  streak_3: {
    name: 'On Fire',
    emoji: '🔥',
    description: '3-day learning streak'
  },
  streak_7: {
    name: 'Dedicated Learner',
    emoji: '⚡',
    description: '7-day learning streak'
  },
  streak_30: {
    name: 'Unstoppable',
    emoji: '🏆',
    description: '30-day learning streak'
  },
  quiz_master: {
    name: 'Quiz Master',
    emoji: '🧠',
    description: 'Score 100% on 10 quizzes'
  },
  skill_beginner: {
    name: 'Skill Starter',
    emoji: '🌱',
    description: 'Complete 5 videos in a skill'
  },
  skill_intermediate: {
    name: 'Skill Builder',
    emoji: '🌿',
    description: 'Complete 15 videos in a skill'
  },
  skill_advanced: {
    name: 'Skill Expert',
    emoji: '🌳',
    description: 'Complete 30 videos in a skill'
  },
  category_complete: {
    name: 'Category Champion',
    emoji: '👑',
    description: 'Complete all videos in a category'
  },
  points_100: {
    name: 'Century',
    emoji: '💯',
    description: 'Earn 100 points'
  },
  points_500: {
    name: 'Rising Star',
    emoji: '⭐',
    description: 'Earn 500 points'
  },
  points_1000: {
    name: 'Superstar',
    emoji: '🌟',
    description: 'Earn 1000 points'
  }
};

// Level thresholds
export const LEVEL_THRESHOLDS: Record<UserLevel, number> = {
  beginner: 0,
  intermediate: 200,
  advanced: 500,
  expert: 1000
};

// Points system
export const POINTS = {
  VIDEO_COMPLETION: 10,
  QUIZ_CORRECT_ANSWER: 5,
  PERFECT_QUIZ: 15,
  STREAK_BONUS: 5
};

// Utility function to get level from points
export function getLevelFromPoints(points: number): UserLevel {
  if (points >= LEVEL_THRESHOLDS.expert) return 'expert';
  if (points >= LEVEL_THRESHOLDS.advanced) return 'advanced';
  if (points >= LEVEL_THRESHOLDS.intermediate) return 'intermediate';
  return 'beginner';
}

// Utility function to calculate quiz score percentage
export function calculateQuizScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}
