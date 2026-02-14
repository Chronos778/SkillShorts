# Supabase Migrations - Deployment Guide

This directory contains SQL migration files to implement backend validation and enforcement for the SkillUp learning platform.

## Migration Files

1. **001_video_validation.sql** - Video duration and URL security constraints
2. **002_quiz_enforcement.sql** - Quiz question count validation (1-3 per video)
3. **003_progress_enforcement.sql** - Quiz completion requirements
4. **004_feature_flags_rls.sql** - Feature flags and Row Level Security policies

## Deployment Options

### Option 1: Supabase Dashboard (Recommended for Quick Setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query for each migration file
4. Copy the contents of each migration file (in order: 001 → 002 → 003 → 004)
5. Run each query

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (replace with your project ref)
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Or run individual migration files
supabase db execute --file supabase/migrations/001_video_validation.sql
supabase db execute --file supabase/migrations/002_quiz_enforcement.sql
supabase db execute --file supabase/migrations/003_progress_enforcement.sql
supabase db execute --file supabase/migrations/004_feature_flags_rls.sql
```

### Option 3: Direct SQL Connection

If you have direct database access:

```bash
# Connect to Supabase Postgres
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations in order
\i supabase/migrations/001_video_validation.sql
\i supabase/migrations/002_quiz_enforcement.sql
\i supabase/migrations/003_progress_enforcement.sql
\i supabase/migrations/004_feature_flags_rls.sql
```

## What These Migrations Do

### 001_video_validation.sql
- ✅ Enforces 2-5 minute duration (120-300 seconds)
- ✅ Requires HTTPS URLs for videos and thumbnails
- ✅ Adds performance indexes

### 002_quiz_enforcement.sql
- ✅ Limits videos to 1-3 quiz questions
- ✅ Prevents video approval without at least 1 quiz question
- ✅ Validates quiz structure (4 options, correct answer 0-3)

### 003_progress_enforcement.sql
- ✅ Prevents marking videos complete without quiz submission
- ✅ Validates quiz score and points
- ✅ Ensures answer count matches question count

### 004_feature_flags_rls.sql
- ✅ Creates feature flags table (disables social features)
- ✅ Implements Row Level Security on all tables
- ✅ Adds performance indexes for users, badges, progress

## Verification

After running migrations, verify with these queries:

```sql
-- Check video constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'videos';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('videos', 'quiz_questions', 'progress');

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('videos', 'progress', 'badges');

-- Check feature flags
SELECT * FROM feature_flags;
```

## Rollback

If you need to rollback migrations:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS enforce_quiz_question_limit ON quiz_questions;
DROP TRIGGER IF EXISTS check_quiz_before_approval ON videos;
DROP TRIGGER IF EXISTS enforce_quiz_completion ON progress;

-- Drop functions
DROP FUNCTION IF EXISTS check_quiz_question_count();
DROP FUNCTION IF EXISTS validate_video_quiz();
DROP FUNCTION IF EXISTS validate_progress_completion();

-- Drop constraints
ALTER TABLE videos DROP CONSTRAINT IF EXISTS duration_range;
ALTER TABLE videos DROP CONSTRAINT IF EXISTS video_url_format;
ALTER TABLE videos DROP CONSTRAINT IF EXISTS thumbnail_url_format;
ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_options_count;
ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_correct_answer_range;
ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_quiz_score_range;
ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_points_positive;

-- Note: Only drop feature_flags table if you're sure
-- DROP TABLE IF EXISTS feature_flags;
```

## Testing After Deployment

### Test Duration Validation
```sql
-- Should FAIL (duration too short)
INSERT INTO videos (title, description, video_url, duration_seconds, category_id, creator_id, status)
VALUES ('Test', 'Test description', 'https://youtube.com/test', 90, 'some-category-id', 'some-user-id', 'pending');

-- Should SUCCEED
INSERT INTO videos (title, description, video_url, duration_seconds, category_id, creator_id, status)
VALUES ('Test', 'Test description', 'https://youtube.com/test', 180, 'some-category-id', 'some-user-id', 'pending');
```

### Test Quiz Enforcement
```sql
-- Should FAIL (no quiz questions)
UPDATE videos SET status = 'approved' WHERE id = 'video-id-without-quiz';

-- Add quiz question, then should SUCCEED
INSERT INTO quiz_questions (video_id, question, options, correct_answer, "order")
VALUES ('video-id', 'Test question?', ARRAY['A', 'B', 'C', 'D'], 0, 0);

UPDATE videos SET status = 'approved' WHERE id = 'video-id';
```

## Troubleshooting

### Error: "Videos can have maximum 3 quiz questions"
- Check how many questions already exist for the video
- Delete excess questions before adding new ones

### Error: "Video must have at least 1 quiz question before approval"
- Add quiz questions before setting status to 'approved'
- Or keep status as 'pending' until quiz questions are added

### Error: "Cannot mark video complete without quiz answers"
- This is expected! Videos can only be completed via quiz submission
- Use the `submitQuiz()` service function, not direct database updates

## Need Help?

Check the main [implementation_plan.md](../../.gemini/antigravity/brain/0a4437f8-4585-416e-8356-52594418df87/implementation_plan.md) for detailed architecture information.
