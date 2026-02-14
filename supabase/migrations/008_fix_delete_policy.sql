-- Fix: Recreate delete policies with correct UUID comparison

-- Videos delete policy
DROP POLICY IF EXISTS "Creators can delete own videos" ON videos;
CREATE POLICY "Creators can delete own videos"
ON videos FOR DELETE
USING (creator_id = auth.uid());

-- Reactions delete policy
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

-- Comments delete policy
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

-- Quiz delete policy
DROP POLICY IF EXISTS "Creators can delete quiz on own videos" ON quiz_questions;
CREATE POLICY "Creators can delete quiz on own videos"
ON quiz_questions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = quiz_questions.video_id
      AND v.creator_id = auth.uid()
  )
);
