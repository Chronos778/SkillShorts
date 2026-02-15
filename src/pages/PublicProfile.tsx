import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { getVideosByCreator } from '@/services/videos';
import { getUserByClerkId, getUserById } from '@/services/users';
import { followUser, unfollowUser, isFollowing, getFollowCounts } from '@/services/social';
import { Button } from '@/components/ui/button';
import { Loader2, Play, UserPlus, UserCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();

  // Fetch Profile User
  const { data: profileUser, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id!),
    enabled: !!id,
  });

  // Get current DB user for follow actions
  const { data: dbCurrentUser } = useQuery({
      queryKey: ['db-user-current', currentUser?.id],
      queryFn: () => currentUser ? getUserByClerkId(currentUser.id) : null,
      enabled: !!currentUser,
  });

  // Fetch Videos
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['creatorVideos', id],
    queryFn: () => getVideosByCreator(id!),
    enabled: !!id,
  });

  // Follow Status
  const { data: isFollowed } = useQuery({
      queryKey: ['is-following', dbCurrentUser?.id, id],
      queryFn: () => dbCurrentUser ? isFollowing(dbCurrentUser.id, id!) : false,
      enabled: !!dbCurrentUser && !!id,
  });

  const { data: followCounts = { followers: 0, following: 0 } } = useQuery({
      queryKey: ['follow-counts', id],
      queryFn: () => getFollowCounts(id!),
      enabled: !!id,
  });

  // Follow Mutation
  const followMutation = useMutation({
      mutationFn: async () => {
          if (!dbCurrentUser) {
              toast({ title: "Please sign in to follow" });
              return;
          }
          if (isFollowed) await unfollowUser(dbCurrentUser.id, id!);
          else await followUser(dbCurrentUser.id, id!);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['is-following', dbCurrentUser?.id, id] });
          queryClient.invalidateQueries({ queryKey: ['follow-counts', id] });
          toast({ title: isFollowed ? "Unfollowed" : "Followed" });
      }
  });

  if (userLoading || videosLoading) {
      return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!profileUser) {
      return <div className="flex h-full items-center justify-center">User not found</div>;
  }

  // Derived state
  const isOwnProfile = currentUser && dbCurrentUser?.id === id;
  const avatarUrl = profileUser?.custom_avatar_url || profileUser?.avatar_url;

  return (
    <div className="flex-1 animate-in-fade pb-24 relative">
         {/* Banner */}
         <div className="h-48 md:h-64 w-full bg-gradient-to-r from-blue-900 to-purple-900 relative overflow-hidden">
            {profileUser?.banner_url && (
                <img 
                    src={profileUser.banner_url} 
                    alt="Profile Banner" 
                    className="w-full h-full object-cover"
                />
            )}
            <div className="absolute inset-0 bg-black/20" />
         </div>

         <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-6 relative -mt-16 md:-mt-20 mb-8 items-start">
                {/* Avatar */}
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-4xl font-black bg-swiss-red text-white">
                        {profileUser?.name?.[0]}
                    </AvatarFallback>
                </Avatar>

                {/* Profile Info */}
                <div className="flex-1 mt-2 md:mt-20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                                {profileUser?.name}
                            </h1>
                            <p className="font-mono text-muted-foreground text-sm">@{profileUser?.clerk_user_id?.slice(0, 8) || 'user'}</p>
                        </div>
                        
                        {!isOwnProfile && currentUser && (
                            <Button 
                                size="lg" 
                                className={cn(
                                    "uppercase font-bold min-w-[140px] shadow-hard-sm transition-all",
                                    isFollowed 
                                        ? "bg-background text-foreground hover:bg-muted border-2 border-border" 
                                        : "bg-foreground text-background hover:bg-foreground/90"
                                )}
                                onClick={() => followMutation.mutate()}
                                disabled={followMutation.isPending}
                            >
                                {isFollowed ? (
                                    <><UserCheck className="mr-2 h-4 w-4" /> FOLLOWING</>
                                ) : (
                                    <><UserPlus className="mr-2 h-4 w-4" /> FOLLOW</>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Bio */}
                    {profileUser?.bio && (
                        <p className="mt-4 text-sm md:text-base max-w-2xl text-foreground/90 whitespace-pre-wrap">
                            {profileUser.bio}
                        </p>
                    )}
                    
                    {/* Stats Row */}
                    <div className="flex gap-6 mt-6 font-mono text-sm uppercase tracking-wide">
                          <div>
                              <span className="font-bold text-foreground">{followCounts.followers}</span> <span className="text-muted-foreground">Followers</span>
                          </div>
                          <div>
                              <span className="font-bold text-foreground">{followCounts.following}</span> <span className="text-muted-foreground">Following</span>
                          </div>
                          <div>
                              <span className="font-bold text-foreground">{videos.length}</span> <span className="text-muted-foreground">Videos</span>
                          </div>
                    </div>
                </div>
            </div>

            {/* Videos Grid */}
            <div className="mt-12">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Play className="w-5 h-5 fill-current" /> Uploads
                </h2>
                
                {videos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {videos.map((video) => (
                      <Link
                        key={video.id}
                        to={`/video/${video.id}`}
                        className="group relative aspect-[9/16] bg-black border-2 border-transparent hover:border-foreground transition-all overflow-hidden block rounded-lg"
                      >
                        <img
                          src={video.thumbnail_url}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-full">
                                <Play className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                            <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight">{video.title}</h3>
                            <p className="text-gray-300 text-xs font-mono mt-1">{Intl.NumberFormat('en-US', { notation: "compact" }).format(video.view_count)} views</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                    <div className="text-center py-20 text-muted-foreground font-mono">
                        No public uploads yet.
                    </div>
                )}
            </div>
         </div>
    </div>
  );
};

export default PublicProfile;
