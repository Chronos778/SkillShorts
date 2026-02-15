import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { getVideosByCreator } from '@/services/videos';
import { getUserByClerkId, getUserById } from '@/services/users';
import { followUser, unfollowUser, isFollowing, getFollowCounts } from '@/services/social';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Users, MapPin, Calendar, Link as LinkIcon, UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

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
          if (!dbCurrentUser) return toast.error("Please sign in to follow");
          if (isFollowed) await unfollowUser(dbCurrentUser.id, id!);
          else await followUser(dbCurrentUser.id, id!);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['is-following', dbCurrentUser?.id, id] });
          queryClient.invalidateQueries({ queryKey: ['follow-counts', id] });
          toast.success(isFollowed ? "Unfollowed" : "Followed");
      }
  });

  if (userLoading || videosLoading) {
      return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!profileUser) {
      return <div className="flex h-full items-center justify-center">User not found</div>;
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header / Banner area */}
      <div className="h-48 bg-gradient-to-r from-swiss-blue to-purple-600 relative">
          <div className="absolute -bottom-16 left-8 md:left-12">
              <div className="w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-white">
                   <img 
                      src={profileUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.name}`} 
                      className="w-full h-full object-cover" 
                   />
              </div>
          </div>
      </div>

      {/* Info Section */}
      <div className="pt-20 px-8 md:px-12 pb-8 border-b-2 border-border">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter">{profileUser.name}</h1>
                  <p className="text-muted-foreground font-mono text-sm mt-1">@{profileUser.name.toLowerCase().replace(/\s+/g, '')}</p>
                  
                  <div className="flex gap-6 mt-4 text-sm font-bold font-mono">
                      <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{followCounts.followers} <span className="text-muted-foreground font-normal">Followers</span></span>
                      </div>
                      <div>
                          <span>{followCounts.following} <span className="text-muted-foreground font-normal">Following</span></span>
                      </div>
                      <div>
                          <span>{videos.length} <span className="text-muted-foreground font-normal">Videos</span></span>
                      </div>
                  </div>
              </div>

              {currentUser && dbCurrentUser?.id !== id && (
                  <Button 
                      className="w-full md:w-auto font-bold uppercase tracking-wide gap-2"
                      variant={isFollowed ? "outline" : "default"}
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                  >
                      {isFollowed ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {isFollowed ? "Following" : "Follow"}
                  </Button>
              )}
          </div>
      </div>

      {/* Videos Grid */}
      <div className="p-8 md:p-12">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
              <Play className="w-5 h-5 fill-current" /> Uploads
          </h2>
          
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  to={`/video/${video.id}`}
                  className="group relative aspect-[4/3] bg-black border-2 border-transparent hover:border-foreground transition-all overflow-hidden block"
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
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="text-white font-bold text-sm line-clamp-1">{video.title}</h3>
                      <p className="text-gray-300 text-xs font-mono">{Intl.NumberFormat('en-US', { notation: "compact" }).format(video.view_count)} views</p>
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
  );
};

export default PublicProfile;
