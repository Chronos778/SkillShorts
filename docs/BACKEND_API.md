# SkillUp Backend API Documentation

## Overview

The SkillUp backend is implemented using **Supabase** (Backend-as-a-Service) with:
- PostgreSQL database with constraints and triggers
- Row Level Security (RLS) for access control
- TypeScript service layer for business logic
- Client-side validation for user experience

## Core Features

### 1. Video Management (2-5 min duration enforcement)

**Duration Validation**: All videos must be between 2-5 minutes (120-300 seconds)

**Create Video**
```typescript
import { createVideo } from '@/services/videos';

const submission = {
  title: 'Introduction to TypeScript',
  description: 'Learn the basics of TypeScript in 4 minutes',
  video_url: 'https://youtube.com/watch?v=xyz',
  thumbnail_url: 'https://img.youtube.com/vi/xyz/maxresdefault.jpg',
  duration_seconds: 240, // 4 minutes
  category_id: 'category-uuid',
  quiz_questions: [
    {
      question: 'What is TypeScript?',
      options: ['A superset of JavaScript', 'A database', 'A framework', 'An OS'],
      correct_answer: 0,
      order: 0
    }
  ]
};

try {
  const video = await createVideo(submission, creatorId);
  console.log('Video created:', video.id);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

**Validation Rules**:
- ✅ Duration: 120-300 seconds (2-5 min)
- ✅ Video URL: Must be HTTPS
- ✅ Title: 5-200 characters
- ✅ Description: 20-2000 characters
- ✅ Quiz Questions: 1-3 questions required
- ✅ Each question: 4 options, correct answer 0-3

**Video Workflow**:
1. Creator submits video → Status: `pending`
2. Backend validates duration, URL, quiz questions
3. Admin reviews → Status: `approved` or `rejected`
4. Only approved videos are visible to learners

---

### 2. Quiz System (Mandatory for completion)

**Quiz Structure**:
- Every video MUST have 1-3 quiz questions
- Each question has exactly 4 options
- Correct answer is an index (0-3)

**Submit Quiz**
```typescript
import { submitQuiz } from '@/services/progress';

const submission = {
  video_id: 'video-uuid',
  answers: [0, 2, 1] // Indices of selected answers
};

try {
  const result = await submitQuiz(userId, submission);
  
  console.log('Score:', result.score); // 0-100
  console.log('Points earned:', result.pointsEarned);
  console.log('Badges earned:', result.badgesEarned);
} catch (error) {
  console.error('Quiz validation failed:', error.message);
}
```

**Points Calculation**:
```typescript
// Base points
VIDEO_COMPLETION: 10 points

// Per correct answer
QUIZ_CORRECT_ANSWER: 5 points each

// Perfect quiz bonus
PERFECT_QUIZ: +15 points (if 100% correct)

// Streak bonus
STREAK_BONUS: +5 points (if streak > 1 day)

// Example: 3 questions, 2 correct, streak = 3
// Points = 10 + (2 × 5) + 5 = 25 points
```

**Quiz Validation**:
- ❌ Cannot mark video complete without quiz submission
- ❌ Cannot submit quiz with wrong number of answers
- ❌ Cannot submit quiz with invalid answer indices
- ✅ Only `submitQuiz()` can mark video as completed

---

### 3. Gamification System

**Points & Levels**
```typescript
import { getLevelFromPoints } from '@/types';

const LEVEL_THRESHOLDS = {
  beginner: 0,
  intermediate: 200,
  advanced: 500,
  expert: 1000
};

// User with 350 points
const level = getLevelFromPoints(350); // 'advanced'
```

**Badge Types**
```typescript
// First video
first_video: Complete 1st video

// Streaks
streak_3: 3-day learning streak
streak_7: 7-day learning streak
streak_30: 30-day learning streak

// Quiz mastery
quiz_master: Score 100% on 10 quizzes

// Skill progress
skill_beginner: Complete 5 videos in a skill
skill_intermediate: Complete 15 videos in a skill
skill_advanced: Complete 30 videos in a skill

// Category completion
category_complete: Complete all videos in a category

// Point milestones
points_100: Earn 100 points
points_500: Earn 500 points
points_1000: Earn 1000 points
```

**Streak Tracking**
```typescript
import { updateUserStreak } from '@/services/users';

// Called automatically on quiz completion
const newStreak = await updateUserStreak(userId);

// Streak rules:
// - Complete 1+ video per day to maintain streak
// - Miss a day → streak resets to 0
// - Streak bonus: +5 points if streak > 1
```

---

### 4. Progress Tracking

**Get User Progress**
```typescript
import { 
  getUserProgress, 
  getSkillProgress, 
  getAverageQuizAccuracy,
  getCompletedVideosCount 
} from '@/services/progress';

// All completed videos
const progress = await getUserProgress(userId);

// Skill-wise breakdown
const skillProgress = await getSkillProgress(userId);
// Returns: { category, videosCompleted, totalVideos, averageScore }[]

// Overall accuracy
const accuracy = await getAverageQuizAccuracy(userId); // 0-100

// Total completed
const count = await getCompletedVideosCount(userId);
```

**Dashboard Statistics**
```typescript
import type { DashboardStats } from '@/types';

const stats: DashboardStats = {
  totalPoints: 450,
  level: 'advanced',
  videosCompleted: 23,
  quizAccuracy: 87,
  currentStreak: 5,
  badges: [...],
  recentProgress: [...],
  skillProgress: [...]
};
```

---

### 5. Zero Distractions

**Disabled Features**:
- ❌ Likes
- ❌ Comments
- ❌ Shares
- ❌ Follows
- ❌ Notifications

**Implementation**:
```sql
-- Feature flags (all set to false)
SELECT * FROM feature_flags WHERE enabled = true;
-- Returns: 0 rows (all social features disabled)
```

**Row Level Security** prevents any social queries even if frontend tries:
- No RLS policies exist for social features
- Database will reject any attempts to create social data

---

## Security

### Row Level Security (RLS)

**Videos**:
- Anyone can view approved videos
- Creators can view their own videos (any status)
- Only admins can approve/reject videos

**Progress**:
- Users can only access their own progress
- Admins can view all progress

**Badges**:
- Users can view their own badges
- System awards badges (service role)
- Admins can view all badges

### Authentication

Using **Clerk** for authentication:
```typescript
import { useUser } from '@clerk/clerk-react';

const { user } = useUser();
// user.id is passed as userId to all service functions
```

---

## Error Handling

All service functions throw errors with descriptive messages:

```typescript
try {
  const video = await createVideo(submission, creatorId);
} catch (error) {
  if (error instanceof Error) {
    // Validation errors are formatted like:
    // "Video validation failed:
    // duration_seconds: Video duration must be at least 2 minutes (120 seconds)
    // quiz_questions: At least 1 quiz question is required"
    
    console.error(error.message);
    // Show error to user
  }
}
```

---

## Database Schema

### Videos
```typescript
interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string; // HTTPS only
  thumbnail_url?: string; // HTTPS only
  duration_seconds: number; // 120-300
  category_id: string;
  creator_id: string;
  status: 'pending' | 'approved' | 'rejected';
  view_count: number;
  completion_count: number;
  created_at: string;
  updated_at: string;
}
```

### Quiz Questions
```typescript
interface QuizQuestion {
  id: string;
  video_id: string;
  question: string;
  options: string[]; // Exactly 4 options
  correct_answer: number; // 0-3
  order: number;
  created_at: string;
}
```

### Progress
```typescript
interface Progress {
  id: string;
  user_id: string;
  video_id: string;
  watched: boolean;
  quiz_score: number; // 0-100
  quiz_answers: number[]; // Array of answer indices
  completed: boolean; // Only true after quiz submission
  points_earned: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

---

## Common Workflows

### Creator Upload Flow
1. Creator fills upload form
2. Frontend validates duration (2-5 min)
3. Frontend validates quiz (1-3 questions)
4. Call `createVideo(submission, creatorId)`
5. Backend validates and creates video
6. Video status = 'pending'
7. Admin reviews and approves

### Learner Watch Flow
1. User selects approved video
2. Call `markVideoWatched(userId, videoId)`
3. User watches video
4. User completes quiz
5. Call `submitQuiz(userId, { video_id, answers })`
6. Backend calculates score and points
7. Backend awards badges if eligible
8. Progress marked as completed

### Admin Approval Flow
1. Admin views pending videos
2. Admin checks duration, content, quiz
3. Call `approveVideo(videoId)` or `rejectVideo(videoId)`
4. Database validates quiz exists (1-3 questions)
5. Status updated to approved/rejected

---

## Migration Deployment

See [supabase/migrations/README.md](../supabase/migrations/README.md) for:
- SQL migration files
- Deployment instructions
- Verification queries
- Rollback procedures

---

## Development Tips

**Local Testing**:
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your Supabase credentials

# Run dev server
npm run dev
```

**Supabase Configuration**:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Common Issues**:

1. **"Video must have at least 1 quiz question"**
   - Add quiz questions before calling `createVideo()`
   - Or add questions before admin approves

2. **"Cannot mark video complete without quiz answers"**
   - Don't call `markVideoWatched()` with completed=true
   - Use `submitQuiz()` instead

3. **"Videos can have maximum 3 quiz questions"**
   - Database enforces this limit
   - Remove questions or split into multiple videos

---

## Support

For questions or issues:
1. Check the [implementation_plan.md](../.gemini/antigravity/brain/0a4437f8-4585-416e-8356-52594418df87/implementation_plan.md)
2. Review migration files in `/supabase/migrations/`
3. Check validation service: `/src/services/validation.ts`
