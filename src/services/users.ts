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
  const { data, error } = await supabase
    .from('users')
    .insert({
      clerk_user_id: clerkUserId,
      email,
      name,
      avatar_url: avatarUrl,
      role: 'learner' as UserRole,
      points: 0,
      level: 'beginner' as UserLevel,
      streak_count: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
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
  // Check if user exists
  let user = await getUserByClerkId(clerkUserId);
  
  if (!user) {
    // Create new user
    user = await createUser(clerkUserId, email, name, avatarUrl);
  }

  return user;
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
