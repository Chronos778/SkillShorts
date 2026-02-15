-- ============================================================
-- SkillShorts: ALL MIGRATIONS COMBINED (IDEMPOTENT + TYPE-SAFE)
-- Safe to run even if some migrations were already applied.
-- Paste into Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ============================================================
-- 000: Core tables + default categories
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL,
  description TEXT,
  color TEXT,
  video_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'creator', 'admin')),
  points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  streak_count INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  view_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  watched BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  quiz_score INTEGER DEFAULT 0,
  quiz_answers INTEGER[],
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

INSERT INTO categories (name, emoji, description, color) VALUES
  ('Coding', '💻', 'Programming and software development', 'blue'),
  ('Cooking', '🍳', 'Recipes and cooking techniques', 'orange'),
  ('Photography', '📷', 'Photography tips and tricks', 'purple'),
  ('Academic', '📚', 'Educational and academic content', 'green'),
  ('Design', '🎨', 'Graphic design and UI/UX', 'pink'),
  ('Business', '💼', 'Business and entrepreneurship', 'gray')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_clerk ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_creator ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_quiz_video ON quiz_questions(video_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_video ON progress(video_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);


-- ============================================================
-- 001: Video validation constraints
-- ============================================================

DO $$ BEGIN
  ALTER TABLE videos ADD CONSTRAINT duration_range
    CHECK (duration_seconds >= 120 AND duration_seconds <= 300);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE videos ADD CONSTRAINT video_url_format
    CHECK (video_url ~ '^https://');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE videos ADD CONSTRAINT thumbnail_url_format
    CHECK (thumbnail_url IS NULL OR thumbnail_url ~ '^https://');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_videos_status_category ON videos(status, category_id);
CREATE INDEX IF NOT EXISTS idx_videos_creator_status ON videos(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_videos_approved_created ON videos(created_at DESC) WHERE status = 'approved';


-- ============================================================
-- 002: Quiz enforcement triggers + constraints
-- ============================================================

CREATE OR REPLACE FUNCTION check_quiz_question_count()
RETURNS TRIGGER AS $$
DECLARE question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count FROM quiz_questions WHERE video_id = NEW.video_id;
  IF question_count >= 3 THEN
    RAISE EXCEPTION 'Videos can have a maximum of 3 quiz questions';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_quiz_question_limit ON quiz_questions;
CREATE TRIGGER enforce_quiz_question_limit
BEFORE INSERT ON quiz_questions FOR EACH ROW EXECUTE FUNCTION check_quiz_question_count();

CREATE OR REPLACE FUNCTION validate_video_quiz()
RETURNS TRIGGER AS $$
DECLARE question_count INTEGER;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    SELECT COUNT(*) INTO question_count FROM quiz_questions WHERE video_id = NEW.id;
    IF question_count < 1 THEN RAISE EXCEPTION 'Video must have at least 1 quiz question before approval'; END IF;
    IF question_count > 3 THEN RAISE EXCEPTION 'Video cannot have more than 3 quiz questions'; END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_quiz_before_approval ON videos;
CREATE TRIGGER check_quiz_before_approval
BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION validate_video_quiz();

DO $$ BEGIN
  ALTER TABLE quiz_questions ADD CONSTRAINT quiz_options_count CHECK (array_length(options, 1) = 4);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE quiz_questions ADD CONSTRAINT quiz_correct_answer_range CHECK (correct_answer >= 0 AND correct_answer <= 3);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_quiz_questions_video ON quiz_questions(video_id, order_index);


-- ============================================================
-- 003: Progress enforcement
-- ============================================================

CREATE OR REPLACE FUNCTION validate_progress_completion()
RETURNS TRIGGER AS $$
DECLARE question_count INTEGER; answer_count INTEGER;
BEGIN
  IF NEW.completed = true THEN
    SELECT COUNT(*) INTO question_count FROM quiz_questions WHERE video_id = NEW.video_id;
    IF NEW.quiz_answers IS NULL THEN RAISE EXCEPTION 'Cannot mark video complete without submitting quiz answers'; END IF;
    answer_count := array_length(NEW.quiz_answers, 1);
    IF answer_count IS NULL OR answer_count = 0 THEN RAISE EXCEPTION 'Cannot mark video complete without submitting quiz answers'; END IF;
    IF answer_count != question_count THEN RAISE EXCEPTION 'Number of quiz answers (%) does not match number of questions (%)', answer_count, question_count; END IF;
    IF NEW.quiz_score IS NULL OR NEW.quiz_score < 0 OR NEW.quiz_score > 100 THEN RAISE EXCEPTION 'Invalid quiz_score: must be between 0 and 100'; END IF;
    IF NEW.points_earned IS NULL OR NEW.points_earned < 0 THEN RAISE EXCEPTION 'Invalid points_earned: must be non-negative'; END IF;
    IF NEW.completed_at IS NULL THEN NEW.completed_at := NOW(); END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_quiz_completion ON progress;
CREATE TRIGGER enforce_quiz_completion
BEFORE INSERT OR UPDATE ON progress FOR EACH ROW EXECUTE FUNCTION validate_progress_completion();

DO $$ BEGIN
  ALTER TABLE progress ADD CONSTRAINT progress_quiz_score_range CHECK (quiz_score >= 0 AND quiz_score <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE progress ADD CONSTRAINT progress_points_positive CHECK (points_earned >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_progress_user_completed ON progress(user_id, completed, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_video_completed ON progress(video_id) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_progress_user_updated ON progress(user_id, updated_at DESC);


-- ============================================================
-- 004: Feature flags + enable RLS on all tables
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO feature_flags (feature_name, enabled, description) VALUES
  ('likes', false, 'Video likes'),
  ('comments', false, 'Video comments'),
  ('shares', false, 'Video sharing'),
  ('follows', false, 'User follows'),
  ('notifications', false, 'Push notifications')
ON CONFLICT (feature_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_streak ON users(streak_count DESC);
CREATE INDEX IF NOT EXISTS idx_badges_user_earned ON badges(user_id, earned_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Categories: anyone can view
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

-- Videos: anyone can view approved
DROP POLICY IF EXISTS "Anyone can view approved videos" ON videos;
CREATE POLICY "Anyone can view approved videos" ON videos FOR SELECT USING (status = 'approved');

-- Quiz: anyone can view for approved videos
DROP POLICY IF EXISTS "Anyone can view quiz questions for approved videos" ON quiz_questions;
CREATE POLICY "Anyone can view quiz questions for approved videos" ON quiz_questions FOR SELECT
USING (EXISTS (SELECT 1 FROM videos WHERE videos.id = quiz_questions.video_id AND videos.status = 'approved'));

-- Feature flags: anyone can view
DROP POLICY IF EXISTS "Anyone can view feature flags" ON feature_flags;
CREATE POLICY "Anyone can view feature flags" ON feature_flags FOR SELECT USING (true);


-- ============================================================
-- 005: Feedback tables (reactions + comments)
-- ============================================================

CREATE TABLE IF NOT EXISTS video_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('like','dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_video ON video_reactions(video_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON video_reactions(user_id);

CREATE TABLE IF NOT EXISTS video_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_video ON video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON video_comments(user_id);


-- ============================================================
-- 006a: Storage buckets + policies
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public video access" ON storage.objects;
CREATE POLICY "Public video access" ON storage.objects FOR SELECT USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own videos storage" ON storage.objects;
CREATE POLICY "Users can update own videos storage" ON storage.objects FOR UPDATE
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own videos storage" ON storage.objects;
CREATE POLICY "Users can delete own videos storage" ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Public thumbnail access" ON storage.objects;
CREATE POLICY "Public thumbnail access" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own thumbnails storage" ON storage.objects;
CREATE POLICY "Users can update own thumbnails storage" ON storage.objects FOR UPDATE
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own thumbnails storage" ON storage.objects;
CREATE POLICY "Users can delete own thumbnails storage" ON storage.objects FOR DELETE
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Also drop old-named policies if they exist from prior runs
DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own thumbnails" ON storage.objects;


-- ============================================================
-- 006b: Enable RLS on feedback tables
-- ============================================================

ALTER TABLE video_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 007: delete_video_cascade RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_video_cascade(p_video_id uuid, p_requester_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_creator uuid;
BEGIN
  SELECT creator_id INTO v_creator FROM videos WHERE id = p_video_id;
  IF v_creator IS NULL THEN RETURN FALSE; END IF;
  IF v_creator <> p_requester_id THEN RETURN FALSE; END IF;
  DELETE FROM quiz_questions WHERE video_id = p_video_id;
  DELETE FROM video_reactions WHERE video_id = p_video_id;
  DELETE FROM video_comments WHERE video_id = p_video_id;
  DELETE FROM progress WHERE video_id = p_video_id;
  DELETE FROM videos WHERE id = p_video_id AND creator_id = p_requester_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_video_cascade(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_video_cascade(uuid, uuid) TO authenticated;


-- ============================================================
-- 009: Feedback read/write policies
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read reactions for approved videos" ON video_reactions;
CREATE POLICY "Anyone can read reactions for approved videos" ON video_reactions FOR SELECT
USING (EXISTS (SELECT 1 FROM videos v WHERE v.id = video_reactions.video_id AND v.status = 'approved'));

DROP POLICY IF EXISTS "Anyone can read comments for approved videos" ON video_comments;
CREATE POLICY "Anyone can read comments for approved videos" ON video_comments FOR SELECT
USING (EXISTS (SELECT 1 FROM videos v WHERE v.id = video_comments.video_id AND v.status = 'approved'));

DROP POLICY IF EXISTS "Users can react on approved videos" ON video_reactions;
CREATE POLICY "Users can react on approved videos" ON video_reactions FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users u WHERE u.id = user_id)
  AND EXISTS (SELECT 1 FROM videos v WHERE v.id = video_id AND v.status = 'approved')
);

DROP POLICY IF EXISTS "Users can comment on approved videos" ON video_comments;
CREATE POLICY "Users can comment on approved videos" ON video_comments FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users u WHERE u.id = user_id)
  AND EXISTS (SELECT 1 FROM videos v WHERE v.id = video_id AND v.status = 'approved')
);

DROP POLICY IF EXISTS "Users can delete own reaction" ON video_reactions;
CREATE POLICY "Users can delete own reaction" ON video_reactions FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comment" ON video_comments;
CREATE POLICY "Users can delete own comment" ON video_comments FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Creators can delete reactions on own videos" ON video_reactions;
CREATE POLICY "Creators can delete reactions on own videos" ON video_reactions FOR DELETE
USING (EXISTS (SELECT 1 FROM videos v WHERE v.id = video_reactions.video_id AND v.creator_id = auth.uid()));

DROP POLICY IF EXISTS "Creators can delete comments on own videos" ON video_comments;
CREATE POLICY "Creators can delete comments on own videos" ON video_comments FOR DELETE
USING (EXISTS (SELECT 1 FROM videos v WHERE v.id = video_comments.video_id AND v.creator_id = auth.uid()));

DROP POLICY IF EXISTS "Creators can delete quiz on own videos" ON quiz_questions;
CREATE POLICY "Creators can delete quiz on own videos" ON quiz_questions FOR DELETE
USING (EXISTS (SELECT 1 FROM videos v WHERE v.id = quiz_questions.video_id AND v.creator_id = auth.uid()));

DROP POLICY IF EXISTS "Creators can delete own videos" ON videos;
CREATE POLICY "Creators can delete own videos" ON videos FOR DELETE USING (creator_id = auth.uid());


-- ============================================================
-- 010+011: Permissive RLS for ALL data tables
-- (App uses Clerk auth with Supabase anon key, NOT Supabase Auth,
--  so all data access goes through anon role — needs open policies)
-- ============================================================

-- Users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;

CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (true);

-- Videos (insert + update)
DROP POLICY IF EXISTS "Creators can create videos" ON videos;
DROP POLICY IF EXISTS "Admins can update videos" ON videos;
DROP POLICY IF EXISTS "Creators can view own videos" ON videos;
DROP POLICY IF EXISTS "videos_insert" ON videos;
DROP POLICY IF EXISTS "videos_update" ON videos;

CREATE POLICY "videos_insert" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "videos_update" ON videos FOR UPDATE USING (true);

-- Quiz questions (insert)
DROP POLICY IF EXISTS "Creators can create quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Creators can view own quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_insert" ON quiz_questions;

CREATE POLICY "quiz_insert" ON quiz_questions FOR INSERT WITH CHECK (true);

-- Badges
DROP POLICY IF EXISTS "Users can view own badges" ON badges;
DROP POLICY IF EXISTS "Admins can view all badges" ON badges;
DROP POLICY IF EXISTS "badges_select" ON badges;
DROP POLICY IF EXISTS "badges_insert" ON badges;
DROP POLICY IF EXISTS "badges_update" ON badges;
DROP POLICY IF EXISTS "badges_delete" ON badges;

CREATE POLICY "badges_select" ON badges FOR SELECT USING (true);
CREATE POLICY "badges_insert" ON badges FOR INSERT WITH CHECK (true);
CREATE POLICY "badges_update" ON badges FOR UPDATE USING (true);
CREATE POLICY "badges_delete" ON badges FOR DELETE USING (true);

-- Progress
DROP POLICY IF EXISTS "Users can view own progress" ON progress;
DROP POLICY IF EXISTS "Users can create own progress" ON progress;
DROP POLICY IF EXISTS "Users can update own progress" ON progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON progress;
DROP POLICY IF EXISTS "progress_select" ON progress;
DROP POLICY IF EXISTS "progress_insert" ON progress;
DROP POLICY IF EXISTS "progress_update" ON progress;
DROP POLICY IF EXISTS "progress_delete" ON progress;

CREATE POLICY "progress_select" ON progress FOR SELECT USING (true);
CREATE POLICY "progress_insert" ON progress FOR INSERT WITH CHECK (true);
CREATE POLICY "progress_update" ON progress FOR UPDATE USING (true);
CREATE POLICY "progress_delete" ON progress FOR DELETE USING (true);


-- ============================================================
-- 012: Notifications table
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (true);


-- ============================================================
-- ✅ DONE — All migrations applied!
-- ============================================================
