# SkillShorts

## Inspiration

People spend hours scrolling through short-form video content on TikTok and Instagram Reels, but rarely learn anything meaningful from it. What if we could harness that same addictive, bite-sized format for **education**? SkillShorts was born from the idea that learning should feel as effortless and engaging as scrolling through your favorite social feed — complete with quizzes that reinforce retention and a gamification system that keeps learners coming back for more.

## What it does

SkillShorts is an educational short-video platform with a TikTok-style swipeable feed. Creators upload educational videos (or link YouTube content), attach quiz questions, and learners earn XP, maintain streaks, and unlock badges by watching and completing quizzes. Key features include:

- 📱 **Swipeable shorts feed** with autoplay, likes, comments, and social sharing
- 🎓 **Mandatory video completion** — users can't scrub forward, ensuring they actually watch the full content before unlocking the quiz
- 🧠 **Built-in quizzes** that test comprehension immediately after each video
- 🏆 **Gamification** — XP points, levels (Beginner → Master), daily streaks, and achievement badges
- 🎬 **Creator studio** for uploading videos with an intuitive quiz authoring tool
- 👤 **User profiles** with progress tracking, achievement displays, and follower system
- 🔒 **Row-Level Security** ensuring data privacy at the database level

## How we built it

The frontend is a **React + TypeScript** single-page app powered by **Vite** for blazing-fast development. We used **shadcn/ui** (built on Radix UI) for accessible component primitives, styled with **Tailwind CSS** in a bold Swiss/Brutalist design language — uppercase typography, sharp borders, and monospace accents.

Authentication is handled entirely by **Clerk**, with user records synced to **Supabase** (PostgreSQL) via an upsert-based sync mechanism. Supabase also handles file storage for video and thumbnail uploads, with RLS policies carefully adapted to work with Clerk's auth flow rather than Supabase's native auth.

State management uses **TanStack React Query** for server state with optimistic updates on likes and reactions. Routing is handled by **React Router v6**. Video playback supports both direct MP4 uploads and YouTube embeds, which are auto-detected and rendered as iframes. Animations are powered by **Framer Motion** for smooth, polished transitions throughout the feed.

## Challenges we ran into

- **Clerk + Supabase auth mismatch** — Since we use Clerk (not Supabase Auth), all RLS policies had to be rewritten to work with the `anon` key instead of `auth.uid()`. This required several iterations and careful debugging to get right.
- **Database migrations** — Getting 13 SQL migration files to run idempotently on a partially-migrated database was tricky; we had to wrap everything in `DO $$ ... EXCEPTION` blocks and add `DROP IF EXISTS` guards.
- **YouTube in a shorts feed** — HTML `<video>` elements can't play YouTube URLs. We had to detect YouTube links and dynamically swap in `<iframe>` embeds with the right autoplay/loop parameters.
- **Anti-scrubbing** — Preventing users from seeking forward in the video player required tracking the maximum watched position via a ref and intercepting the browser's `seeking` event to snap back.
- **Storage RLS** — File uploads to Supabase Storage buckets were blocked by RLS policies designed for Supabase Auth users. We had to create permissive storage policies to accommodate Clerk's authentication flow.

## Accomplishments that we're proud of

- Built a **production-quality TikTok-style feed** with Intersection Observer-based autoplay/autopause
- Designed a **seamless Clerk → Supabase user sync** that handles edge cases like duplicate accounts and race conditions
- Implemented **optimistic UI updates** for likes/reactions that feel instant, with proper rollback on failure
- Created an **anti-cheat video player** that prevents scrubbing forward, ensuring genuine engagement before quiz access
- Wrote **13 idempotent SQL migrations** covering the full schema, RLS policies, storage buckets, triggers, and functions
- Achieved a **fully responsive design** that works beautifully on both mobile and desktop

## What we learned

- How to bridge two auth systems (Clerk for frontend auth, Supabase as the data layer) with careful RLS policy design
- Building TikTok-style UX patterns with Intersection Observers for autoplay/autopause behavior
- Optimistic UI updates with TanStack React Query for instant-feeling interactions
- Designing gamification systems (XP, levels, streaks, badges) that motivate learners without overwhelming them
- The importance of idempotent database migrations when iterating rapidly

## What's next for SkillShorts

- 🤖 **AI-powered quiz generation** — Auto-generate quiz questions from video transcripts using an LLM
- 📊 **Creator analytics dashboard** — View counts, completion rates, quiz performance heatmaps
- 🏅 **Leaderboards** — Weekly and all-time leaderboards to foster friendly competition
- 🎯 **Personalized feed** — Recommend videos based on learning history, quiz performance, and interests
- 📱 **Mobile app** — Native iOS/Android app using React Native for push notifications and offline viewing
- 🌐 **Multi-language support** — Content localization and subtitle support for global reach
- 🤝 **Collaborative playlists** — Let educators curate learning paths from existing content

---

## Built With

```
React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase, Clerk, TanStack React Query, Framer Motion, React Router, Radix UI, PostgreSQL, Lucide
```
