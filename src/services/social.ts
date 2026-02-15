import { supabase } from '@/lib/supabase';

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<boolean> {
    const { error } = await supabase
        .from('follows')
        .insert({
            follower_id: followerId,
            following_id: followingId
        });

    if (error) {
        console.error('Error following user:', error);
        return false;
    }
    return true;
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    if (error) {
        console.error('Error unfollowing user:', error);
        return false;
    }
    return true;
}

/**
 * Check if following
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error checking follow status:', error);
    }

    return !!data;
}

/**
 * Get follower counts
 */
export async function getFollowCounts(userId: string): Promise<{ followers: number, following: number }> {
    // Count followers
    const { count: followers, error: e1 } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    // Count following
    const { count: following, error: e2 } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    if (e1 || e2) {
        console.error('Error getting follow counts:', e1, e2);
    }

    return {
        followers: followers || 0,
        following: following || 0
    };
}
