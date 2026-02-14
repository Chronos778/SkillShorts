-- RLS policies for reactions and comments to allow app traffic (anon key) while validating ownership

-- Ensure RLS enabled
ALTER TABLE video_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone can read reactions/comments for approved videos
DROP POLICY IF EXISTS "Anyone can read reactions for approved videos" ON video_reactions;
CREATE POLICY "Anyone can read reactions for approved videos"
ON video_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = video_reactions.video_id
      AND v.status = 'approved'
  )
);

DROP POLICY IF EXISTS "Anyone can read comments for approved videos" ON video_comments;
CREATE POLICY "Anyone can read comments for approved videos"
ON video_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = video_comments.video_id
      AND v.status = 'approved'
  )
);

-- INSERT: allow if user_id exists and video is approved (no auth.uid dependency since client uses anon)
DROP POLICY IF EXISTS "Users can react on approved videos" ON video_reactions;
CREATE POLICY "Users can react on approved videos"
ON video_reactions FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users u WHERE u.id = user_id)
  AND EXISTS (SELECT 1 FROM videos v WHERE v.id = video_id AND v.status = 'approved')
);

DROP POLICY IF EXISTS "Users can comment on approved videos" ON video_comments;
CREATE POLICY "Users can comment on approved videos"
ON video_comments FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users u WHERE u.id = user_id)
  AND EXISTS (SELECT 1 FROM videos v WHERE v.id = video_id AND v.status = 'approved')
);

-- UPDATE/DELETE: allow owners (creator) to manage their video feedback
DROP POLICY IF EXISTS "Creators can delete reactions on own videos" ON video_reactions;
CREATE POLICY "Creators can delete reactions on own videos"
ON video_reactions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = video_reactions.video_id
      AND v.creator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Creators can delete comments on own videos" ON video_comments;
CREATE POLICY "Creators can delete comments on own videos"
ON video_comments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = video_comments.video_id
      AND v.creator_id = auth.uid()
  )
);

-- Optional: allow users to delete their own reactions/comments (if authenticated)
DROP POLICY IF EXISTS "Users can delete own reaction" ON video_reactions;
CREATE POLICY "Users can delete own reaction"
ON video_reactions FOR DELETE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comment" ON video_comments;
CREATE POLICY "Users can delete own comment"
ON video_comments FOR DELETE
USING (user_id = auth.uid());
