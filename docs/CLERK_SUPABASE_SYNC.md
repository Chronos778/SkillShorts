# 🔐 Clerk-Supabase Sync Setup Guide

## Overview
Your Clerk-Supabase sync is **already implemented**! The code automatically creates a Supabase user when someone logs in with Clerk.

## How It Works

When a user logs in via Clerk:
1. **Clerk authenticates** the user (Google, email, etc.)
2. **Frontend calls** `syncUserFromClerk()` automatically
3. **Supabase creates** a user record with:
   - `clerk_user_id`: Clerk's user ID
   - `email`: User's email
   - `name`: User's full name
   - `avatar_url`: Profile picture
   - `role`: Defaults to 'learner'
   - `points`: Starts at 0
   - `level`: Starts at 'beginner'

## Setup Steps

### Step 1: Add Clerk Key to .env

Open your `.env` file and add:

```env
# Clerk Configuration (Vite uses VITE_ prefix)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Supabase Configuration (you already have these)
VITE_SUPABASE_URL=https://oxyaqkxmqoyhqtmsmdhk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get your Clerk key from:**
- Go to https://dashboard.clerk.com
- Select your application
- Click **API Keys** in sidebar
- Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### Step 2: Deploy Database Migrations (If Not Done)

The sync requires the `users` table to exist in Supabase:

```bash
./deploy-backend.sh
```

Or manually via Supabase Dashboard → SQL Editor → Run the migration files.

### Step 3: Restart Dev Server

After updating .env:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

## That's It! 🎉

The sync happens automatically. Here's what occurs:

### First Time Login Flow:

1. User clicks "Sign In"
2. Clerk authentication popup appears
3. User logs in with Google (or email)
4. **Auto-sync happens** ✨
5. User record created in Supabase `users` table
6. User can now upload videos, complete quizzes, earn points

### Subsequent Logins:

1. User logs in via Clerk
2. **Sync checks** if user exists in Supabase
3. If exists: Returns existing user
4. If not: Creates new user

## Code That Does The Magic

The sync is already implemented in multiple places:

**Dashboard.tsx:**
```typescript
const { data: dbUser } = useQuery({
  queryKey: ['user', clerkUser?.id],
  queryFn: async () => {
    return syncUserFromClerk(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress,
      clerkUser.fullName || 'User',
      clerkUser.imageUrl
    );
  },
});
```

**Upload.tsx:**
```typescript
// Same sync happens here too
```

**VideoPlayer.tsx:**
```typescript
// And here!
```

## Verify It's Working

### Option 1: Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Table Editor** → **users**
4. Log in to your app with Clerk
5. Refresh the users table → You should see a new row!

### Option 2: Check Browser Console

1. Open your app
2. Open DevTools (F12)
3. Go to **Console** tab
4. Log in
5. You should see no errors related to user sync

### Option 3: Try Uploading

1. Log in
2. Go to Upload page (/upload)
3. If you see the form (not "Not authenticated"), sync worked!

## Troubleshooting

### Error: "Not authenticated"
- **Solution**: Wait 1-2 seconds after login for sync to complete
- The upload page now shows "Syncing account..." while this happens

### Error: "relation 'users' does not exist"
- **Solution**: Deploy migrations (`./deploy-backend.sh`)
- Or manually run migrations in Supabase SQL Editor

### User Not Appearing in Supabase
- **Check**: Is .env file saved?
- **Check**: Did you restart npm run dev?
- **Check**: Is VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY correct?

### Clerk Login Not Working
- **Check**: Is VITE_CLERK_PUBLISHABLE_KEY in .env?
- **Check**: Did you restart dev server after adding it?
- **Check**: Is the key the Publishable Key (not Secret Key)?

## Security Note

The sync uses:
- **Clerk** for authentication (secure, handled by Clerk)
- **Supabase Anon Key** for database writes (protected by RLS policies)
- **Row Level Security** ensures users can only modify their own data

## What Gets Synced

| Clerk Field | Supabase Column | Default Value |
|-------------|-----------------|---------------|
| `user.id` | `clerk_user_id` | (from Clerk) |
| `emailAddresses[0].emailAddress` | `email` | (from Clerk) |
| `fullName` or `firstName` | `name` | 'User' |
| `imageUrl` | `avatar_url` | (from Clerk) |
| - | `role` | 'learner' |
| - | `points` | 0 |
| - | `level` | 'beginner' |
| - | `streak_count` | 0 |

## Next Steps

1. Add your Clerk key to `.env`
2. Restart `npm run dev`
3. Try logging in
4. Check Supabase → users table to see your user!

The sync is automatic - you don't need to do anything else! 🚀
