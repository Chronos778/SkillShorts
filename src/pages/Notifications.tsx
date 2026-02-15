import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { getNotifications, markAllNotificationsRead } from '@/services/notifications';
import { getUserByClerkId } from '@/services/users';
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
    const { user } = useUser();
    const queryClient = useQueryClient();

    const { data: dbUser } = useQuery({
        queryKey: ['db-user', user?.id],
        queryFn: () => user ? getUserByClerkId(user.id) : null,
        enabled: !!user,
    });

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', dbUser?.id],
        queryFn: () => dbUser ? getNotifications(dbUser.id) : [],
        enabled: !!dbUser,
        refetchInterval: 10000, // Poll every 10s
    });

    const markReadMutation = useMutation({
        mutationFn: () => {
             if (!dbUser) return Promise.reject("No user");
             return markAllNotificationsRead(dbUser.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', dbUser?.id] });
        }
    });

    if (!user) return <div className="p-8 text-center">Please sign in to view notifications.</div>;

    return (
        <div className="flex-1 p-6 md:p-8 animate-in-fade max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Notifications</h1>
                    <p className="font-mono text-sm text-muted-foreground uppercase">Recent Activity</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => markReadMutation.mutate()}
                        disabled={markReadMutation.isPending}
                        className="gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark all read
                    </Button>
                )}
            </div>

            <div className="bg-card border-2 border-border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-4 text-muted-foreground">
                        <Bell className="w-12 h-12 opacity-50" />
                        <p className="font-mono uppercase">All caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {notifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className={cn(
                                    "p-4 flex gap-4 items-start transition-colors",
                                    !notification.is_read ? "bg-accent/5" : "hover:bg-muted/30"
                                )}
                            >
                                <div className="mt-1">
                                    {notification.type === 'like' && <Heart className="w-5 h-5 text-red-500 fill-current" />}
                                    {notification.type === 'comment' && <MessageCircle className="w-5 h-5 text-blue-500" />}
                                    {notification.type === 'follow' && <UserPlus className="w-5 h-5 text-green-500" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-sm">
                                            <Link to={`/profile/${notification.actor_id}`} className="font-bold hover:underline">
                                                {notification.actor?.name || 'Someone'}
                                            </Link>
                                            {' '}
                                            {notification.type === 'like' && `liked your video.`}
                                            {notification.type === 'comment' && `commented on your video.`}
                                            {notification.type === 'follow' && `followed you.`}
                                        </p>
                                        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    {/* Optional context link */}
                                    {notification.entity_id && notification.type !== 'follow' && (
                                        <Link 
                                            to={`/video/${notification.entity_id}`} 
                                            className="text-xs text-muted-foreground hover:text-foreground mt-1 block font-mono"
                                        >
                                            View Video &rarr;
                                        </Link>
                                    )}
                                </div>
                                {!notification.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
