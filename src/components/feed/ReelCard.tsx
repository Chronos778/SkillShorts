import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoComment } from '@/types';
import {
    Play, Pause, Heart, MessageCircle, Share2, MoreHorizontal,
    Volume2, VolumeX, Send, Copy, Twitter, Facebook, ExternalLink, Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";

import {
    getVideoReactionInfo, setUserVideoReaction, getVideoComments, addVideoComment
} from '@/services/videos';
import { getUserByClerkId } from '@/services/users';
import { followUser, unfollowUser, isFollowing } from '@/services/social';
import EditVideoDialog from './EditVideoDialog';

// --- Sub-component for Subscribe Button ---
const SubscribeButton = ({ creatorId, currentUserId }: { creatorId: string, currentUserId?: string }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: isFollowed } = useQuery({
        queryKey: ['is-following', currentUserId, creatorId],
        queryFn: () => currentUserId ? isFollowing(currentUserId, creatorId) : false,
        enabled: !!currentUserId && !!creatorId && currentUserId !== creatorId,
    });

    const mutation = useMutation({
        mutationFn: async () => {
            if (!currentUserId) throw new Error("Not logged in");
            if (isFollowed) await unfollowUser(currentUserId, creatorId);
            else await followUser(currentUserId, creatorId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['is-following', currentUserId, creatorId] });
            toast({ title: isFollowed ? "Unsubscribed" : "Subscribed" });
        },
        onError: () => toast({ title: "Failed to update subscription", variant: "destructive" })
    });

    if (!currentUserId || currentUserId === creatorId) return null;

    return (
        <Button
            size="sm"
            variant="secondary"
            className={`h-7 text-xs font-bold px-3 ${isFollowed ? 'bg-white/50 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
        >
            {isFollowed ? 'Subscribed' : 'Subscribe'}
        </Button>
    );
};

interface ReelCardProps {
    video: Video;
}

const ReelCard: React.FC<ReelCardProps> = ({ video }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay policies
    const { user } = useUser();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [commentText, setCommentText] = useState("");
    const [isEditOpen, setIsEditOpen] = useState(false);

    // --- YouTube Detection ---
    const getYouTubeId = (url: string): string | null => {
        if (!url) return null;
        try {
            const u = new URL(url);
            if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
                if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
                return u.searchParams.get('v') || u.pathname.split('/').pop() || null;
            }
        } catch { }
        return null;
    };
    const youtubeId = getYouTubeId(video.video_url);
    const isYouTube = !!youtubeId;

    // --- Resolve Supabase User ---
    const { data: dbUser } = useQuery({
        queryKey: ['db-user', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const dbUser = await getUserByClerkId(user.id);
            return dbUser;
        },
        enabled: !!user?.id,
    });

    // --- Video Playback ---
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    // Intersection Observer for Auto-Play/Pause
    useEffect(() => {
        const videoElement = videoRef.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoElement?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                } else {
                    videoElement?.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.6 } // Play when 60% visible
        );

        if (videoElement) {
            observer.observe(videoElement);
        }

        return () => {
            if (videoElement) observer.unobserve(videoElement);
        };
    }, []);


    // --- Likes / Reactions ---
    // Use dbUser.id if available, otherwise undefined (to fetch counts but not user reaction)
    const { data: reactionInfo } = useQuery({
        queryKey: ['video-reactions', video.id, dbUser?.id],
        queryFn: () => getVideoReactionInfo(video.id, dbUser?.id),
        enabled: !!video.id,
    });

    const reactionMutation = useMutation({
        mutationFn: async ({ reaction, userId }: { reaction: 'like' | 'dislike' | null, userId: string }) => {
            console.log('[Mutation] executing', { videoId: video.id, userId, reaction });
            const success = await setUserVideoReaction(video.id, userId, reaction);
            if (!success) throw new Error('Failed to update reaction');
            return success;
        },
        onMutate: async ({ reaction, userId }) => {
            console.log('[Mutation] onMutate', { reaction, userId });

            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['video-reactions', video.id] });

            // Snapshot previous value using the exact key we're about to update
            const previousReaction = queryClient.getQueryData(['video-reactions', video.id, userId]);

            // Optimistically update
            queryClient.setQueryData(['video-reactions', video.id, userId], (old: { likes: number, userReaction?: string } | undefined) => {
                const isAddingLike = reaction === 'like';
                const wasLiked = old?.userReaction === 'like';

                let newLikes = old?.likes || 0;
                if (isAddingLike && !wasLiked) newLikes++;
                if (!isAddingLike && wasLiked) newLikes--;

                console.log('[Mutation] Optimistic update calculation', { isAddingLike, wasLiked, oldLikes: old?.likes, newLikes });

                return {
                    ...old,
                    userReaction: reaction,
                    likes: newLikes
                };
            });

            return { previousReaction };
        },
        onError: (err, newTodo, context: { previousReaction: unknown } | undefined) => {
            console.error("Like mutation error:", err);
            toast({ title: "Failed to like video", variant: "destructive" });
            if (context?.previousReaction) {
                // Rollback using the context
                if (dbUser?.id) {
                    queryClient.setQueryData(['video-reactions', video.id, dbUser.id], context.previousReaction);
                }
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['video-reactions', video.id] });
        }
    });

    const handleLike = () => {
        if (!user) return toast({ title: "Sign in to like videos" });
        if (!dbUser) return toast({ title: "Connecting to profile..." });

        const isLiked = reactionInfo?.userReaction === 'like';
        const newReaction = isLiked ? null : 'like';

        console.log('[ReelCard] handleLike', {
            videoId: video.id,
            userId: dbUser.id,
            currentReaction: reactionInfo?.userReaction,
            isLiked,
            newReaction
        });

        reactionMutation.mutate({ reaction: newReaction, userId: dbUser.id });
    };


    // --- Comments ---
    const { data: comments = [] } = useQuery({
        queryKey: ['video-comments', video.id],
        queryFn: () => getVideoComments(video.id),
        enabled: !!video.id,
    });

    const commentMutation = useMutation({
        mutationFn: (text: string) => {
            if (!dbUser) throw new Error("User not found");
            return addVideoComment(video.id, dbUser.id, text);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['video-comments', video.id] });
            setCommentText("");
            toast({ title: "Comment added" });
        },
        onError: () => {
            toast({ title: "Failed to post comment", variant: "destructive" });
        }
    });

    const handlePostComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return toast({ title: "Sign in to comment" });
        if (!dbUser) return toast({ title: "Connecting..." });
        if (!commentText.trim()) return;
        commentMutation.mutate(commentText);
    };


    // --- Sharing ---
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    const shareText = `Check out this video: ${video.title}`;

    const handleShare = (platform: 'twitter' | 'reddit' | 'facebook' | 'copy') => {
        let url = '';
        switch (platform) {
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                break;
            case 'reddit':
                url = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(shareUrl);
                toast({ title: "Link copied to clipboard" });
                return;
        }
        if (url) window.open(url, '_blank');
    };

    return (
        <div className="relative w-full max-w-[400px] h-full max-h-[800px] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 group">

            {/* Video Player */}
            <div className="absolute inset-0 cursor-pointer" onClick={!isYouTube ? togglePlay : undefined}>
                {isYouTube ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1`}
                        className="w-full h-full"
                        style={{ border: 'none', pointerEvents: 'auto' }}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                ) : video.video_url ? (
                    <video
                        ref={videoRef}
                        src={video.video_url}
                        className="w-full h-full object-cover"
                        loop
                        muted={isMuted}
                        playsInline
                    />
                ) : (
                    <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover opacity-90"
                    />
                )}

                {/* Play/Pause Overlay Icon (only for native video) */}
                {!isYouTube && !isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                        <Play className="w-16 h-16 fill-white text-white opacity-80" />
                    </div>
                )}
            </div>

            {/* Mute Toggle */}
            <button
                onClick={toggleMute}
                className="absolute top-4 right-4 z-30 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
                type="button"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none z-10" />

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center z-20">
                {/* Like Button */}
                <div className="flex flex-col items-center gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className={`rounded-full w-12 h-12 backdrop-blur-sm transition-all duration-200 ${reactionInfo?.userReaction === 'like' ? 'bg-red-500/20 text-red-500 scale-110' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        onClick={handleLike}
                    >
                        <Heart className={`w-6 h-6 ${reactionInfo?.userReaction === 'like' ? 'fill-current' : ''}`} />
                    </Button>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">
                        {Intl.NumberFormat('en-US', { notation: "compact" }).format(reactionInfo?.likes || 0)}
                    </span>
                </div>

                {/* Comments Button (Sheet) */}
                <Sheet>
                    <SheetTrigger asChild>
                        <div className="flex flex-col items-center gap-1">
                            <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                                <MessageCircle className="w-6 h-6" />
                            </Button>
                            <span className="text-xs font-bold text-white shadow-black drop-shadow-md">
                                {Intl.NumberFormat('en-US', { notation: "compact" }).format(comments.length || 0)}
                            </span>
                        </div>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[100vw] sm:w-[400px] bg-black/95 border-l border-white/10 text-white">
                        <SheetHeader className="mb-4">
                            <SheetTitle className="text-white">Comments ({comments.length})</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col h-full pb-6">
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {comments.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="w-8 h-8 border border-white/20">
                                                <AvatarImage src={comment.user?.avatar_url} />
                                                <AvatarFallback>{comment.user?.name?.[0] || '?'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold">{comment.user?.name || 'Anonymous'}</span>
                                                    <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-300">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <form onSubmit={handlePostComment} className="mt-4 flex gap-2 pt-4 border-t border-white/10">
                                <Input
                                    placeholder="Add a comment..."
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <Button type="submit" size="icon" className="shrink-0" disabled={commentMutation.isPending}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Share Button (Dialog) */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                            <Share2 className="w-6 h-6" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>Share to</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-4 gap-4 py-4">
                            <Button variant="outline" className="flex flex-col h-20 gap-2 border-white/10 hover:bg-white/10 hover:text-white" onClick={() => handleShare('copy')}>
                                <Copy className="w-6 h-6" />
                                <span className="text-xs">Copy Link</span>
                            </Button>
                            <Button variant="outline" className="flex flex-col h-20 gap-2 border-white/10 hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] hover:border-[#1DA1F2]" onClick={() => handleShare('twitter')}>
                                <Twitter className="w-6 h-6" />
                                <span className="text-xs">Twitter</span>
                            </Button>
                            <Button variant="outline" className="flex flex-col h-20 gap-2 border-white/10 hover:bg-[#FF4500]/20 hover:text-[#FF4500] hover:border-[#FF4500]" onClick={() => handleShare('reddit')}>
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
                                <span className="text-xs">Reddit</span>
                            </Button>
                            <Button variant="outline" className="flex flex-col h-20 gap-2 border-white/10 hover:bg-[#1877F2]/20 hover:text-[#1877F2] hover:border-[#1877F2]" onClick={() => handleShare('facebook')}>
                                <Facebook className="w-6 h-6" />
                                <span className="text-xs">Facebook</span>
                            </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <label htmlFor="link" className="sr-only">Link</label>
                                <Input id="link" defaultValue={shareUrl} readOnly className="bg-black/50 border-white/10 text-muted-foreground h-8 text-xs" />
                            </div>
                            <Button type="submit" size="sm" className="px-3" onClick={() => handleShare('copy')}>
                                <span className="sr-only">Copy</span>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* More Options (Dropdown) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                            <MoreHorizontal className="w-6 h-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                        <DropdownMenuLabel>Options</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-red-400 focus:text-red-400">
                            Report Issue
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/10 cursor-pointer">
                            Not Interested
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={(e) => toggleMute(e)}>
                            {isMuted ? "Unmute Video" : "Mute Video"}
                        </DropdownMenuItem>
                        {user?.id === video.creator_id && (
                            <>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    className="focus:bg-white/10 cursor-pointer text-blue-400 focus:text-blue-400"
                                    onClick={() => setIsEditOpen(true)}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Video
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <EditVideoDialog
                    video={video}
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                />

                <div className="w-10 h-10 rounded-lg border-2 border-white/80 overflow-hidden mt-4">
                    {video.thumbnail_url && <img src={video.thumbnail_url} className="w-full h-full object-cover" />}
                </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-16 p-6 z-20 pb-8 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <Link to={`/profile/${video.creator?.id}`}>
                        <div className="w-10 h-10 rounded-full border border-white/50 overflow-hidden bg-neutral-800 cursor-pointer">
                            {/* Fallback pattern for creator avatar if missing */}
                            {video.creator?.avatar_url ? (
                                <img src={video.creator.avatar_url} alt={video.creator?.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-swiss-red flex items-center justify-center font-bold text-xs">{video.creator?.name?.[0] || 'C'}</div>
                            )}
                        </div>
                    </Link>
                    <Link to={`/profile/${video.creator?.id}`} className="hover:underline">
                        <span className="font-bold text-sm">{video.creator?.name || 'Unknown Creator'}</span>
                    </Link>

                    {/* Subscribe Button */}
                    <SubscribeButton creatorId={video.creator_id} currentUserId={dbUser?.id} />

                </div>

                <Link to={`/video/${video.id}`} className="hover:underline block">
                    <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2 pr-4">{video.title}</h3>
                </Link>
                <p className="text-sm text-gray-200 line-clamp-1 mb-2 font-mono">
                    {video.description}
                </p>

                <div className="flex items-center gap-2 text-xs font-mono text-white/80 bg-white/10 w-fit px-2 py-1 rounded backdrop-blur-sm">
                    <Play className="w-3 h-3" />
                    {video.category?.name || 'General'}
                </div>
            </div>

            {/* Progress Bar (Attached to video time) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 z-30">
                {/* Note: In a real app, bind this to currentTime/duration */}
                <motion.div
                    className="h-full bg-swiss-red"
                    initial={{ width: "0%" }}
                    animate={{ width: isPlaying ? "100%" : "0%" }}
                    transition={{ duration: video.duration_seconds || 60, ease: "linear", repeat: isPlaying ? Infinity : 0 }}
                />
            </div>

        </div>
    );
};

export default ReelCard;
