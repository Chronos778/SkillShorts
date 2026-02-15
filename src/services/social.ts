import { supabase } from '@/lib/supabase';

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<boolean> {
    console.log('[Social] followUser', { followerId, followingId });
    const { error } = await supabase
        .from('follows')
        .upsert({
            follower_id: followerId,
            following_id: followingId
        }, { onConflict: 'follower_id,following_id' });

    if (error) {
        console.error('[Social] followUser error:', error);
        return false;
    }
    console.log('[Social] followUser success');
    return true;
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    console.log('[Social] unfollowUser', { followerId, followingId });
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    if (error) {
        console.error('[Social] unfollowUser error:', error);
        return false;
    }
    console.log('[Social] unfollowUser success');
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
        .maybeSingle();

    if (error) {
        console.error('[Social] isFollowing error:', error);
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
        console.error('[Social] getFollowCounts error:', e1, e2);
    }

    console.log('[Social] getFollowCounts', { userId, followers, following });

    return {
        followers: followers || 0,
        following: following || 0
    };
}
