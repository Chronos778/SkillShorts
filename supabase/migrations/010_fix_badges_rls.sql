-- Fix badges RLS to allow inserts from authenticated users
-- The app uses Clerk (not Supabase Auth), so we need permissive policies

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view own badges" ON badges;
DROP POLICY IF EXISTS "Admins can view all badges" ON badges;

-- Create permissive policies for badges
-- Allow anyone to read badges (for displaying in dashboard)
CREATE POLICY "badges_select" ON badges FOR SELECT USING (true);

-- Allow inserts (needed for awarding badges from client-side)
CREATE POLICY "badges_insert" ON badges FOR INSERT WITH CHECK (true);

-- Allow updates (in case badge needs updating)
CREATE POLICY "badges_update" ON badges FOR UPDATE USING (true);

-- Allow deletes (for admin cleanup if needed)
CREATE POLICY "badges_delete" ON badges FOR DELETE USING (true);

-- Also ensure progress table has proper policies (needed for badge checks)
DROP POLICY IF EXISTS "Users can view own progress" ON progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON progress;
DROP POLICY IF EXISTS "Users can update own progress" ON progress;

CREATE POLICY "progress_select" ON progress FOR SELECT USING (true);
CREATE POLICY "progress_insert" ON progress FOR INSERT WITH CHECK (true);
CREATE POLICY "progress_update" ON progress FOR UPDATE USING (true);
CREATE POLICY "progress_delete" ON progress FOR DELETE USING (true);
