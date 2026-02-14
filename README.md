<div align="center">

<img src="public/logo.png" alt="SkillUp Logo" width="200"/>

# 🎯 SkillUp - Learn Skills, Not Scroll

> Short-form educational videos with mandatory quizzes. Earn points, unlock badges, and actually learn something.

</div>

## 🌟 Features

- **📹 Short Learning Videos** - 2-5 minute skill-based content created by students
- **🧠 Mandatory Quizzes** - Every video ends with a quiz to lock in learning
- **🏆 Gamification** - Earn points, unlock badges, and level up your skills
- **🎬 Creator Mode** - Upload MP4 videos or YouTube links with auto-thumbnail generation
- **📊 Progress Tracking** - Monitor your learning journey and skill development
- **💬 Engagement** - Like/dislike videos and comment on content
- **🔐 Secure Authentication** - Powered by Clerk with Supabase sync
- **🎨 Beautiful UI** - Built with shadcn/ui and Tailwind CSS

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom design tokens

## 📋 Prerequisites

- Node.js 18+ and npm
- Clerk account ([Get started](https://clerk.com))
- Supabase account ([Get started](https://supabase.com))

## ⚙️ Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd SkillUp
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Get your keys:**
- **Clerk**: Dashboard → API Keys → Publishable Key
- **Supabase**: Project Settings → API → Project URL & anon/public key

### 3. Database Setup

Run migrations in your Supabase SQL Editor (or via CLI):

```bash
# Apply all migrations in order
supabase db execute -f supabase/migrations/000_initial_schema.sql
supabase db execute -f supabase/migrations/001_video_validation.sql
supabase db execute -f supabase/migrations/002_quiz_enforcement.sql
supabase db execute -f supabase/migrations/003_progress_enforcement.sql
supabase db execute -f supabase/migrations/004_feature_flags_rls.sql
supabase db execute -f supabase/migrations/005_video_feedback.sql
supabase db execute -f supabase/migrations/006_creator_delete_policies.sql
supabase db execute -f supabase/migrations/007_delete_video_function.sql
supabase db execute -f supabase/migrations/008_fix_delete_policy.sql
supabase db execute -f supabase/migrations/009_feedback_policies.sql
```

**Or** paste each `.sql` file manually into Supabase Dashboard → SQL Editor.

### 4. Storage Buckets

Create two public storage buckets in Supabase Dashboard → Storage:

1. **videos** - for MP4 uploads
2. **thumbnails** - for thumbnail images

Enable public access for both buckets.

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## 🎮 Usage

### For Learners

1. **Sign up/Login** with Clerk (Google, email, etc.)
2. **Browse videos** by category or search
3. **Watch** a short skill video (2-5 minutes)
4. **Complete the quiz** to earn points
5. **Track progress** on your Dashboard
6. **Unlock badges** as you level up

### For Creators

1. Go to **/upload**
2. Choose **MP4 upload** or **YouTube link**
3. Add **title, description, category**
4. Upload a **thumbnail** or let auto-generation handle it
5. Create **1-3 quiz questions**
6. Hit **Publish** - videos go live instantly
7. Manage your uploads in **/progress**

## 📁 Project Structure

```
SkillUp/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route pages (Home, Browse, Upload, etc.)
│   ├── services/        # API calls (videos, users, badges, progress)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities (Supabase client, utils)
│   └── types/           # TypeScript type definitions
├── supabase/
│   └── migrations/      # Database schema and RLS policies
├── public/              # Static assets (logo, favicon)
└── docs/                # Additional documentation
```

## 🔒 Authentication Flow

1. User signs in via **Clerk** (OAuth or email)
2. Frontend calls `syncUserFromClerk()` automatically
3. User record created/synced in **Supabase users table**
4. User can now upload videos, take quizzes, earn points

See [docs/CLERK_SUPABASE_SYNC.md](docs/CLERK_SUPABASE_SYNC.md) for details.

## 🎨 Key Features Deep Dive

### Auto-Thumbnail Generation
- **MP4 uploads**: Captures a frame at 10% mark, uploads to Supabase Storage
- **YouTube links**: Fetches default YouTube thumbnail
- **Fallback**: Uses stock placeholder image

### Video Deletion
- Creators can delete their own videos from Dashboard
- RPC function with `SECURITY DEFINER` bypasses RLS safely
- Cleans up quiz questions, reactions, comments, and storage files

### Reactions & Comments
- Like/dislike with counts
- Comment section with user avatars
- RLS policies allow anon key usage while validating ownership

## 🏗️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Adding a Migration

1. Create `supabase/migrations/XXX_description.sql`
2. Apply: `supabase db execute -f supabase/migrations/XXX_description.sql`
3. Commit the migration file

## 🐛 Troubleshooting

### "Failed to delete" video
- **Solution**: Apply migrations 006, 007, 008 for RLS delete policies and RPC function

### Likes/comments not working
- **Solution**: Apply migration 009 for feedback RLS policies

### Videos not showing
- **Check**: `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Check**: Migrations applied and storage buckets created

### User not syncing
- **Check**: `VITE_CLERK_PUBLISHABLE_KEY` in `.env`
- **Check**: Restart dev server after updating `.env`

## 📚 Documentation

- [Clerk-Supabase Sync Guide](docs/CLERK_SUPABASE_SYNC.md)
- [Backend API Reference](docs/BACKEND_API.md)
- [Upload Auth Fix](docs/UPLOAD_AUTH_FIX.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Quick Start Guide](QUICK_START.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful components
- **Clerk** for seamless authentication
- **Supabase** for powerful backend infrastructure
- **TanStack Query** for data fetching excellence

---

Built with ❤️ for learners who want to actually learn something instead of endlessly scrolling.
