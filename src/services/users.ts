import { supabase } from '@/lib/supabase';
import type { User, UserRole, UserLevel } from '@/types';
import { getLevelFromPoints } from '@/types';

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) return null;
  return data as User;
}

/**
 * Create a new user in Supabase from Clerk data
 */
export async function createUser(
  clerkUserId: string,
  email: string,
  name: string,
  avatarUrl?: string
): Promise<User | null> {
  // Use upsert to handle both new and existing users
  const { data, error } = await supabase
    .from('users')
    .upsert({
      clerk_user_id: clerkUserId,
      email,
      name,
      avatar_url: avatarUrl,
      role: 'learner' as UserRole,
      points: 0,
      level: 'beginner' as UserLevel,
      streak_count: 0
    }, {
      onConflict: 'clerk_user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating/upserting user:', error);
    return null;
  }

  return data as User;
}

/**
 * Sync or create user from Clerk data
 */
export async function syncUserFromClerk(
  clerkUserId: string,
  email: string,
  name: string,
  avatarUrl?: string
): Promise<User | null> {
  console.log('[syncUser] Syncing Clerk user:', clerkUserId);

  // First try to find existing user
  let user = await getUserByClerkId(clerkUserId);

  if (user) {
    console.log('[syncUser] Found existing user:', user.id);
    return user;
  }

  // User doesn't exist — upsert to create
  console.log('[syncUser] User not found, creating...');
  const { data, error } = await supabase
    .from('users')
    .upsert({
      clerk_user_id: clerkUserId,
      email,
      name,
      avatar_url: avatarUrl,
      role: 'learner' as UserRole,
      points: 0,
      level: 'beginner' as UserLevel,
      streak_count: 0
    }, {
      onConflict: 'clerk_user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('[syncUser] Upsert failed:', error.message, error.details, error.hint);
    // Last resort: try fetching again (maybe another tab created it)
    user = await getUserByClerkId(clerkUserId);
    if (user) {
      console.log('[syncUser] Found user on retry:', user.id);
      return user;
    }
    console.error('[syncUser] All attempts failed');
    return null;
  }

  console.log('[syncUser] Created user:', data?.id);
  return data as User;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as User;
}

/**
 * Update user points and level
 */
export async function updateUserPoints(
  userId: string,
  pointsToAdd: number
): Promise<User | null> {
  // Get current user
  const { data: currentData } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .single();

  if (!currentData) return null;

  const newPoints = currentData.points + pointsToAdd;
  const newLevel = getLevelFromPoints(newPoints);

  const { data, error } = await supabase
    .from('users')
    .update({
      points: newPoints,
      level: newLevel,
      last_activity_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user points:', error);
    return null;
  }

  return data as User;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user:', error);
        return null;
    }
    return data as User;
}

/**
 * Update user streak
 */
export async function updateUserStreak(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const { data: currentData } = await supabase
    .from('users')
    .select('streak_count, last_activity_date')
    .eq('id', userId)
    .single();

  if (!currentData) return 0;

  let newStreak = 1;

  if (currentData.last_activity_date === yesterday) {
    // Continue streak
    newStreak = currentData.streak_count + 1;
  } else if (currentData.last_activity_date === today) {
    // Already logged in today
    newStreak = currentData.streak_count;
  }
  // Else reset to 1

  await supabase
    .from('users')
    .update({
      streak_count: newStreak,
      last_activity_date: today
    })
    .eq('id', userId);

  return newStreak;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Check if user can create content
 */
export function canCreateContent(user: User | null): boolean {
  return user?.role === 'creator' || user?.role === 'admin';
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}
