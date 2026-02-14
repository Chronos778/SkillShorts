-- Migration: Video Validation and Duration Enforcement
-- Purpose: Enforce 2-5 minute duration limit and secure video URLs

-- Add check constraint for duration (120-300 seconds = 2-5 minutes)
ALTER TABLE videos 
ADD CONSTRAINT duration_range 
CHECK (duration_seconds >= 120 AND duration_seconds <= 300);

-- Add validation for video_url format (must be HTTPS)
ALTER TABLE videos 
ADD CONSTRAINT video_url_format 
CHECK (video_url ~ '^https://');

-- Add validation for thumbnail URLs (if provided, must be HTTPS)
ALTER TABLE videos 
ADD CONSTRAINT thumbnail_url_format 
CHECK (thumbnail_url IS NULL OR thumbnail_url ~ '^https://');

-- Add index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_videos_status_category 
ON videos(status, category_id);

-- Add index for creator's videos
CREATE INDEX IF NOT EXISTS idx_videos_creator_status 
ON videos(creator_id, status);

-- Add index for approved videos ordering
CREATE INDEX IF NOT EXISTS idx_videos_approved_created 
ON videos(created_at DESC) WHERE status = 'approved';

-- Add comment for documentation
COMMENT ON CONSTRAINT duration_range ON videos IS 
'Enforces video duration between 2-5 minutes (120-300 seconds)';

COMMENT ON CONSTRAINT video_url_format ON videos IS 
'Ensures all video URLs use secure HTTPS protocol';
