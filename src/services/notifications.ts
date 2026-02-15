import { supabase } from '@/lib/supabase';
import { Notification } from '@/types';

export async function getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select(`
            *,
            actor:users!actor_id(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data as Notification[];
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification read:', error);
        return false;
    }
    return true;
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all notifications read:', error);
        return false;
    }
    return true;
}

export async function createNotification(
    userId: string, // Recipient
    actorId: string, // Performer
    type: 'follow' | 'like' | 'comment',
    entityId?: string
): Promise<boolean> {
    if (userId === actorId) return false; // Don't notify self

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            actor_id: actorId,
            type,
            entity_id: entityId
        });

    if (error) {
        console.error('Error creating notification:', error);
        return false;
    }
    return true;
}
