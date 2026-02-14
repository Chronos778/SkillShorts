-- RLS: Allow creators to delete their own videos and cleanup

-- Ensure RLS is enabled on involved tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Videos: creators can delete their own rows
CREATE POLICY "Creators can delete own videos"
ON videos FOR DELETE
USING (creator_id = auth.uid());

-- Optional: creators can delete related rows for their videos
-- Reactions
CREATE POLICY "Creators can delete reactions on own videos"
ON video_reactions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = video_reactions.video_id
      AND v.creator_id = auth.uid()
  )
);

-- Comments
CREATE POLICY "Creators can delete comments on own videos"
ON video_comments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = video_comments.video_id
      AND v.creator_id = auth.uid()
  )
);

-- Quiz questions
CREATE POLICY "Creators can delete quiz on own videos"
ON quiz_questions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.id = quiz_questions.video_id
      AND v.creator_id = auth.uid()
  )
);

-- Progress (creator does not need to delete user progress manually; CASCADE will handle on video delete)
-- No direct delete policy necessary for progress; cascade from videos table will remove dependent rows.
