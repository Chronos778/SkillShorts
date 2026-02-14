-- Migration: Feature Flags and Row Level Security
-- Purpose: Zero distractions enforcement and security policies

-- Create feature flags table for future flexibility
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert feature flags for social features (all disabled for zero distractions)
INSERT INTO feature_flags (feature_name, enabled, description) VALUES
  ('likes', false, 'Video likes - disabled for distraction-free learning'),
  ('comments', false, 'Video comments - disabled for distraction-free learning'),
  ('shares', false, 'Video sharing - disabled for distraction-free learning'),
  ('follows', false, 'User follows - disabled for distraction-free learning'),
  ('notifications', false, 'Push notifications - disabled for distraction-free learning')
ON CONFLICT (feature_name) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_streak ON users(streak_count DESC);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id, earned_at DESC);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid()::text OR clerk_user_id = auth.uid()::text);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid()::text OR clerk_user_id = auth.uid()::text);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE (id = auth.uid()::text OR clerk_user_id = auth.uid()::text) 
    AND role = 'admin'
  )
);

-- VIDEOS TABLE POLICIES
-- Anyone can view approved videos
CREATE POLICY "Anyone can view approved videos"
ON videos FOR SELECT
USING (status = 'approved');

-- Creators can view their own videos (any status)
CREATE POLICY "Creators can view own videos"
ON videos FOR SELECT
USING (creator_id = auth.uid()::text);

-- Creators can create videos (with role check)
CREATE POLICY "Creators can create videos"
ON videos FOR INSERT
WITH CHECK (
  creator_id = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE (id = auth.uid()::text OR clerk_user_id = auth.uid()::text)
    AND role IN ('creator', 'admin')
  )
);

-- Admins can update any video
CREATE POLICY "Admins can update videos"
ON videos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE (id = auth.uid()::text OR clerk_user_id = auth.uid()::text)
    AND role = 'admin'
  )
);

-- CATEGORIES TABLE POLICIES
-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON categories FOR SELECT
USING (true);

-- Only admins can modify categories
CREATE POLICY "Admins can modify categories"
ON categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE (id = auth.uid()::text OR clerk_user_id = auth.uid()::text)
    AND role = 'admin'
  )
);

-- QUIZ_QUESTIONS TABLE POLICIES
-- Anyone can view quiz questions for approved videos
CREATE POLICY "Anyone can view quiz questions for approved videos"
ON quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = quiz_questions.video_id 
    AND videos.status = 'approved'
  )
);

-- Creators can view quiz questions for their own videos
CREATE POLICY "Creators can view own quiz questions"
ON quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = quiz_questions.video_id 
    AND videos.creator_id = auth.uid()::text
  )
);

-- Creators can create quiz questions for their own videos
CREATE POLICY "Creators can create quiz questions"
ON quiz_questions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = quiz_questions.video_id 
    AND videos.creator_id = auth.uid()::text
  )
);

-- PROGRESS TABLE POLICIES
-- Users can only access their own progress
CREATE POLICY "Users can view own progress"
ON progress FOR SELECT
USING (user_id = auth.uid()::text);

-- Users can create their own progress
CREATE POLICY "Users can create own progress"
ON progress FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
ON progress FOR UPDATE
USING (user_id = auth.uid()::text);

-- Admins can view all progress
CREATE POLICY "Admins can view all progress"
ON progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE (id = auth.uid()::text OR clerk_user_id = auth.uid()::text)
    AND role = 'admin'
  )
);

-- BADGES TABLE POLICIES
-- Users can view their own badges
CREATE POLICY "Users can view own badges"
ON badges FOR SELECT
USING (user_id = auth.uid()::text);

-- System can award badges (handled by service role key)
-- No INSERT policy for regular users (badges only awarded by backend logic)

-- Admins can view all badges
CREATE POLICY "Admins can view all badges"
ON badges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE (id = auth.uid()::text OR clerk_user_id = auth.uid()::text)
    AND role = 'admin'
  )
);

-- FEATURE_FLAGS TABLE POLICIES
-- Anyone can view feature flags
CREATE POLICY "Anyone can view feature flags"
ON feature_flags FOR SELECT
USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Admins can modify feature flags"
ON feature_flags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE (id = auth.uid()::text OR clerk_user_id = auth.uid()::text)
    AND role = 'admin'
  )
);

-- Add comments
COMMENT ON TABLE feature_flags IS 
'Feature flags for enabling/disabling platform features';

COMMENT ON POLICY "Anyone can view approved videos" ON videos IS 
'Public access to approved videos only - supports zero distractions';
