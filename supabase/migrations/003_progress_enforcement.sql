-- Migration: Progress Tracking and Quiz Completion Enforcement
-- Purpose: Ensure videos cannot be marked complete without quiz submission

-- Function to validate quiz completion before marking video complete
CREATE OR REPLACE FUNCTION validate_progress_completion()
RETURNS TRIGGER AS $$
DECLARE
  question_count INTEGER;
  answer_count INTEGER;
BEGIN
  -- Only check when marking video as completed
  IF NEW.completed = true THEN
    -- Get the number of quiz questions for this video
    SELECT COUNT(*) INTO question_count
    FROM quiz_questions
    WHERE video_id = NEW.video_id;
    
    -- Check if quiz_answers is provided and has correct length
    IF NEW.quiz_answers IS NULL THEN
      RAISE EXCEPTION 'Cannot mark video complete without submitting quiz answers';
    END IF;
    
    answer_count := array_length(NEW.quiz_answers, 1);
    
    IF answer_count IS NULL OR answer_count = 0 THEN
      RAISE EXCEPTION 'Cannot mark video complete without submitting quiz answers';
    END IF;
    
    -- Verify answer count matches question count
    IF answer_count != question_count THEN
      RAISE EXCEPTION 'Number of quiz answers (%) does not match number of questions (%)', 
        answer_count, question_count;
    END IF;
    
    -- Ensure quiz_score is set (should be 0-100)
    IF NEW.quiz_score IS NULL OR NEW.quiz_score < 0 OR NEW.quiz_score > 100 THEN
      RAISE EXCEPTION 'Invalid quiz_score: must be between 0 and 100';
    END IF;
    
    -- Ensure points_earned is set
    IF NEW.points_earned IS NULL OR NEW.points_earned < 0 THEN
      RAISE EXCEPTION 'Invalid points_earned: must be non-negative';
    END IF;
    
    -- Set completed_at timestamp if not already set
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce quiz completion validation
CREATE TRIGGER enforce_quiz_completion
BEFORE INSERT OR UPDATE ON progress
FOR EACH ROW
EXECUTE FUNCTION validate_progress_completion();

-- Add check constraint for quiz_score range
ALTER TABLE progress
ADD CONSTRAINT progress_quiz_score_range
CHECK (quiz_score >= 0 AND quiz_score <= 100);

-- Add check constraint for points_earned (must be non-negative)
ALTER TABLE progress
ADD CONSTRAINT progress_points_positive
CHECK (points_earned >= 0);

-- Add index for user progress queries
CREATE INDEX IF NOT EXISTS idx_progress_user_completed
ON progress(user_id, completed, completed_at DESC);

-- Add index for video completion tracking
CREATE INDEX IF NOT EXISTS idx_progress_video_completed
ON progress(video_id) WHERE completed = true;

-- Add index for recent activity
CREATE INDEX IF NOT EXISTS idx_progress_user_updated
ON progress(user_id, updated_at DESC);

-- Add comments for documentation
COMMENT ON FUNCTION validate_progress_completion() IS 
'Ensures video cannot be marked complete without valid quiz submission';

COMMENT ON CONSTRAINT progress_quiz_score_range ON progress IS 
'Quiz score must be between 0-100 (percentage)';

COMMENT ON CONSTRAINT progress_points_positive ON progress IS 
'Points earned must be non-negative';
