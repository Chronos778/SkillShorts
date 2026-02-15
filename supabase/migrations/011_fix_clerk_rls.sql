-- Fix: Permissive RLS policies for Clerk auth (uses anon key, not Supabase Auth)
-- Users table needs INSERT/SELECT/UPDATE for user sync from Clerk

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Allow anyone to read users (needed for displaying creator info, avatar)
CREATE POLICY "users_select" ON users FOR SELECT USING (true);

-- Allow inserts for user sync from Clerk
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);

-- Allow updates for user profile updates
CREATE POLICY "users_update" ON users FOR UPDATE USING (true);


-- Fix: Videos table needs permissive INSERT/UPDATE for anon key
DROP POLICY IF EXISTS "Creators can create videos" ON videos;
DROP POLICY IF EXISTS "Admins can update videos" ON videos;

CREATE POLICY "videos_insert" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "videos_update" ON videos FOR UPDATE USING (true);


-- Fix: Quiz questions need permissive INSERT for anon key
DROP POLICY IF EXISTS "Creators can create quiz questions" ON quiz_questions;

CREATE POLICY "quiz_insert" ON quiz_questions FOR INSERT WITH CHECK (true);
