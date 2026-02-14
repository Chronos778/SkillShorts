-- Video Reactions and Comments

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
