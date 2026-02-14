# 🚀 Running the Full Stack Project

## Quick Start (3 Commands)

```bash
# 1. Deploy backend migrations
./deploy-backend.sh

# 2. Install frontend dependencies (if not done)
npm install

# 3. Start the development server
npm run dev
```

---

## Detailed Instructions

### 📋 Prerequisites

Make sure you have:
- ✅ Node.js installed (v16 or higher)
- ✅ npm or bun installed
- ✅ Supabase account with a project created
- ✅ `.env` file configured (see below)

### 🔧 Environment Setup

Your `.env` file should have:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from:
- **Clerk**: https://dashboard.clerk.com → Your App → API Keys
- **Supabase**: https://supabase.com/dashboard → Your Project → Settings → API

---

## Step-by-Step Deployment

### Step 1: Deploy Backend (Database Migrations)

**Option A - Using the deployment script (Recommended):**

```bash
./deploy-backend.sh
```

This will:
1. Install Supabase CLI if needed
2. Link to your Supabase project
3. Deploy all 4 migration files
4. Verify the deployment

**Option B - Manual deployment via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Copy and run each file in order:
   - `supabase/migrations/001_video_validation.sql`
   - `supabase/migrations/002_quiz_enforcement.sql`
   - `supabase/migrations/003_progress_enforcement.sql`
   - `supabase/migrations/004_feature_flags_rls.sql`

**Option C - Supabase CLI manually:**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project (replace with your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all migrations
supabase db push

# Or deploy individually
supabase db execute --file supabase/migrations/001_video_validation.sql
supabase db execute --file supabase/migrations/002_quiz_enforcement.sql
supabase db execute --file supabase/migrations/003_progress_enforcement.sql
supabase db execute --file supabase/migrations/004_feature_flags_rls.sql
```

### Step 2: Verify Backend Deployment

Run these SQL queries in Supabase SQL Editor:

```sql
-- Check video constraints (should show 3 rows)
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'videos'
  AND constraint_name IN ('duration_range', 'video_url_format', 'thumbnail_url_format');

-- Check triggers (should show 3 triggers)
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name IN ('enforce_quiz_question_limit', 'check_quiz_before_approval', 'enforce_quiz_completion');

-- Check feature flags (should show 5 rows, all disabled)
SELECT feature_name, enabled FROM feature_flags;

-- Check RLS is enabled (should show multiple tables)
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

Expected output:
- ✅ 3 video constraints
- ✅ 3 triggers
- ✅ 5 feature flags (all `enabled = false`)
- ✅ RLS enabled on users, videos, progress, badges, etc.

### Step 3: Run Frontend

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The app will open at: **http://localhost:5173**

---

## 🧪 Testing the Full Stack

### Test 1: Authentication
1. Go to http://localhost:5173
2. Click "Sign Up" or "Sign In"
3. Create an account via Clerk
4. Check Supabase → Table Editor → users (you should see your user)

### Test 2: Video Upload (Creator Role)
1. Switch to creator role in Supabase (update users table, set `role = 'creator'`)
2. Go to Upload page
3. Try uploading a video:
   - **Duration < 2 min** → Should fail validation ❌
   - **Duration > 5 min** → Should fail validation ❌
   - **Duration 2-5 min** → Should succeed ✅
4. Add 1-3 quiz questions (required)

### Test 3: Video Approval (Admin Role)
1. Set your role to `admin` in Supabase
2. Go to Admin dashboard
3. See pending videos
4. Approve a video
5. Video now appears in Browse page

### Test 4: Quiz Submission (Learner)
1. As a learner, watch an approved video
2. Complete the quiz
3. Check your dashboard:
   - Points should increase ✅
   - Progress should update ✅
   - Badges may unlock ✅
   - Streak may increase ✅

### Test 5: Progress Tracking
1. Complete several videos
2. Dashboard should show:
   - Total points
   - Current level (beginner/intermediate/advanced/expert)
   - Videos completed count
   - Quiz accuracy %
   - Current streak
   - Badges earned
   - Skill-wise progress

---

## 📊 Verify Features Are Working

### Video Duration Enforcement
```typescript
// In browser console on Upload page:
const testDuration = async () => {
  try {
    // This should FAIL
    await createVideo({ 
      duration_seconds: 90, // Too short!
      // ... other fields
    }, userId);
  } catch (error) {
    console.log('✅ Validation working:', error.message);
    // Should show: "Video duration must be at least 2 minutes"
  }
};
```

### Quiz Enforcement
```sql
-- In Supabase SQL Editor:
-- Try to mark video complete without quiz (should FAIL)
UPDATE progress 
SET completed = true, quiz_answers = NULL 
WHERE id = 'some-progress-id';

-- Error: "Cannot mark video complete without quiz answers" ✅
```

### Feature Flags (Zero Distractions)
```sql
-- Check all social features are disabled
SELECT * FROM feature_flags WHERE enabled = true;
-- Should return 0 rows ✅
```

---

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Linting
npm run lint            # Check code quality

# Database
supabase db push        # Deploy migrations
supabase db pull        # Pull schema from remote
supabase db reset       # Reset local database

# Supabase CLI
supabase status         # Check connection
supabase link           # Link to project
supabase login          # Authenticate
```

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Environment variables not working
```bash
# Make sure .env exists and has correct format
cat .env

# Restart dev server after changing .env
# Press Ctrl+C then run: npm run dev
```

### Migrations not applying
```bash
# Check Supabase connection
supabase status

# Re-link if needed
supabase link --project-ref YOUR_PROJECT_REF

# Try deploying again
supabase db push
```

### "Cannot mark video complete without quiz"
This is **expected behavior**! Videos can only be completed via quiz submission.

Use `submitQuiz()` function, not `markVideoWatched()`.

---

## 📁 Project Structure

```
SkillUp/
├── src/
│   ├── services/
│   │   ├── validation.ts      # NEW: All validation logic
│   │   ├── videos.ts          # ENHANCED: With validation
│   │   ├── progress.ts        # ENHANCED: Quiz enforcement
│   │   ├── users.ts           # Points & streaks
│   │   └── badges.ts          # Badge awarding
│   ├── pages/               # React pages
│   └── components/          # React components
├── supabase/
│   └── migrations/          # Database migrations
├── docs/
│   └── BACKEND_API.md       # API documentation
├── .env                     # Environment variables
├── deploy-backend.sh        # Deployment script
└── QUICK_START.md          # Quick start guide
```

---

## ✅ Checklist

Before going to production:

- [ ] All migrations deployed to Supabase
- [ ] Environment variables configured
- [ ] Clerk authentication working
- [ ] Video upload with validation working
- [ ] Quiz submission working
- [ ] Points and badges working
- [ ] Progress tracking accurate
- [ ] Admin approval workflow tested
- [ ] RLS policies protecting data

---

## 🎉 You're Ready!

Everything is implemented and ready to use. The full stack should work seamlessly:

1. **Backend**: Supabase with constraints, triggers, and RLS
2. **Services**: TypeScript services with validation
3. **Frontend**: React + Vite with all features
4. **Auth**: Clerk handling authentication

Run `npm run dev` and start learning! 🚀
