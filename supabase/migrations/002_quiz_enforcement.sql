-- Migration: Quiz Question Enforcement
-- Purpose: Enforce 1-3 quiz questions per video and validate before approval

-- Function to enforce maximum 3 quiz questions per video
CREATE OR REPLACE FUNCTION check_quiz_question_count()
RETURNS TRIGGER AS $$
DECLARE
  question_count INTEGER;
BEGIN
  -- Count existing questions for this video
  SELECT COUNT(*) INTO question_count
  FROM quiz_questions
  WHERE video_id = NEW.video_id;
  
  -- Check if we're at the limit
  IF question_count >= 3 THEN
    RAISE EXCEPTION 'Videos can have a maximum of 3 quiz questions';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce quiz question limit on insert
CREATE TRIGGER enforce_quiz_question_limit
BEFORE INSERT ON quiz_questions
FOR EACH ROW
EXECUTE FUNCTION check_quiz_question_count();

-- Function to validate video has quiz before approval
CREATE OR REPLACE FUNCTION validate_video_quiz()
RETURNS TRIGGER AS $$
DECLARE
  question_count INTEGER;
BEGIN
  -- Only check when status is being changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Count quiz questions for this video
    SELECT COUNT(*) INTO question_count
    FROM quiz_questions
    WHERE video_id = NEW.id;
    
    -- Must have at least 1 question
    IF question_count < 1 THEN
      RAISE EXCEPTION 'Video must have at least 1 quiz question before approval';
    END IF;
    
    -- Must have at most 3 questions
    IF question_count > 3 THEN
      RAISE EXCEPTION 'Video cannot have more than 3 quiz questions';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check quiz before video approval
CREATE TRIGGER check_quiz_before_approval
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION validate_video_quiz();

-- Add check constraint for quiz question options (must have exactly 4 options)
ALTER TABLE quiz_questions
ADD CONSTRAINT quiz_options_count
CHECK (array_length(options, 1) = 4);

-- Add check constraint for correct answer index (must be 0-3)
ALTER TABLE quiz_questions
ADD CONSTRAINT quiz_correct_answer_range
CHECK (correct_answer >= 0 AND correct_answer <= 3);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_video
ON quiz_questions(video_id, "order");

-- Add comments for documentation
COMMENT ON FUNCTION check_quiz_question_count() IS 
'Ensures each video has maximum 3 quiz questions';

COMMENT ON FUNCTION validate_video_quiz() IS 
'Validates video has 1-3 quiz questions before approval';

COMMENT ON CONSTRAINT quiz_options_count ON quiz_questions IS 
'Ensures each quiz question has exactly 4 answer options';

COMMENT ON CONSTRAINT quiz_correct_answer_range ON quiz_questions IS 
'Ensures correct_answer index is between 0-3 (valid option index)';
