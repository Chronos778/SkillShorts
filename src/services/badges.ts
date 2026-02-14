import { supabase } from '@/lib/supabase';
import type { Badge, BadgeType } from '@/types';

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: string): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error || !data) return [];
  return data as Badge[];
}

/**
 * Award a badge to user
 */
export async function awardBadge(userId: string, badgeType: BadgeType): Promise<Badge | null> {
  // Check if badge already exists
  const { data: existing } = await supabase
    .from('badges')
    .select('*')
    .eq('user_id', userId)
    .eq('badge_type', badgeType)
    .single();

  if (existing) return null; // Already has badge

  const { data, error } = await supabase
    .from('badges')
    .insert({
      user_id: userId,
      badge_type: badgeType
    })
    .select()
    .single();

  if (error) return null;
  return data as Badge;
}

/**
 * Check and award badges based on user's current stats
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const earnedBadges: Badge[] = [];

  // Get user data
  const { data: user } = await supabase
    .from('users')
    .select('points, streak_count')
    .eq('id', userId)
    .single();

  if (!user) return [];

  // Get existing badges
  const { data: existingBadges } = await supabase
    .from('badges')
    .select('badge_type')
    .eq('user_id', userId);

  const hasBadge = (type: BadgeType) => 
    existingBadges?.some(b => b.badge_type === type) || false;

  // Get completed videos count
  const { count: completedCount } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completed', true);

  // Get perfect quiz count
  const { count: perfectQuizCount } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('quiz_score', 100);

  // First video badge
  if ((completedCount || 0) >= 1 && !hasBadge('first_video')) {
    const badge = await awardBadge(userId, 'first_video');
    if (badge) earnedBadges.push(badge);
  }

  // Streak badges
  if (user.streak_count >= 3 && !hasBadge('streak_3')) {
    const badge = await awardBadge(userId, 'streak_3');
    if (badge) earnedBadges.push(badge);
  }
  if (user.streak_count >= 7 && !hasBadge('streak_7')) {
    const badge = await awardBadge(userId, 'streak_7');
    if (badge) earnedBadges.push(badge);
  }
  if (user.streak_count >= 30 && !hasBadge('streak_30')) {
    const badge = await awardBadge(userId, 'streak_30');
    if (badge) earnedBadges.push(badge);
  }

  // Quiz master (10 perfect quizzes)
  if ((perfectQuizCount || 0) >= 10 && !hasBadge('quiz_master')) {
    const badge = await awardBadge(userId, 'quiz_master');
    if (badge) earnedBadges.push(badge);
  }

  // Points badges
  if (user.points >= 100 && !hasBadge('points_100')) {
    const badge = await awardBadge(userId, 'points_100');
    if (badge) earnedBadges.push(badge);
  }
  if (user.points >= 500 && !hasBadge('points_500')) {
    const badge = await awardBadge(userId, 'points_500');
    if (badge) earnedBadges.push(badge);
  }
  if (user.points >= 1000 && !hasBadge('points_1000')) {
    const badge = await awardBadge(userId, 'points_1000');
    if (badge) earnedBadges.push(badge);
  }

  // Check skill progress badges per category
  const { data: categories } = await supabase
    .from('categories')
    .select('id');

  // Get total approved videos per category
  const { data: allApprovedVideos } = await supabase
    .from('videos')
    .select('category_id')
    .eq('status', 'approved');

  if (categories) {
    for (const category of categories) {
      // Get user's completed count in category
      const { data: completedInCategoryData } = await supabase
        .from('progress')
        .select(`
          video:videos!inner(category_id)
        `)
        .eq('user_id', userId)
        .eq('completed', true);

      const completedInCategory = completedInCategoryData?.filter(p => {
        const video = p.video as unknown as { category_id: string };
        return video?.category_id === category.id;
      }).length || 0;

      // Get total videos in this category
      const totalInCategory = allApprovedVideos?.filter(v => v.category_id === category.id).length || 0;

      // Skill level badges
      if (completedInCategory >= 5 && !hasBadge('skill_beginner')) {
        const badge = await awardBadge(userId, 'skill_beginner');
        if (badge) earnedBadges.push(badge);
      }
      if (completedInCategory >= 15 && !hasBadge('skill_intermediate')) {
        const badge = await awardBadge(userId, 'skill_intermediate');
        if (badge) earnedBadges.push(badge);
      }
      if (completedInCategory >= 30 && !hasBadge('skill_advanced')) {
        const badge = await awardBadge(userId, 'skill_advanced');
        if (badge) earnedBadges.push(badge);
      }

      // Category Complete badge - awarded when ALL videos in a category are completed
      if (totalInCategory > 0 && completedInCategory >= totalInCategory && !hasBadge('category_complete')) {
        const badge = await awardBadge(userId, 'category_complete');
        if (badge) earnedBadges.push(badge);
      }
    }
  }

  return earnedBadges;
}

/**
 * Get badge count for user
 */
export async function getBadgeCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('badges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return 0;
  return count || 0;
}
