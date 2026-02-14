import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getUserByClerkId, syncUserFromClerk } from "@/services/users";
import { getVideosByCreator } from "@/services/videos";
import { 
  Plus, Video, Eye, CheckCircle, Clock, XCircle, 
  Loader2, TrendingUp, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Creator() {
  const { user: clerkUser, isLoaded } = useUser();

  // Get user from database
  const { data: dbUser, isLoading: userLoading } = useQuery({
    queryKey: ['user', clerkUser?.id],
    queryFn: async () => {
      if (!clerkUser) return null;
      return syncUserFromClerk(
        clerkUser.id,
        clerkUser.emailAddresses[0]?.emailAddress || '',
        clerkUser.fullName || clerkUser.firstName || 'User',
        clerkUser.imageUrl
      );
    },
    enabled: isLoaded && !!clerkUser?.id,
  });

  // Fetch creator's videos
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['creatorVideos', dbUser?.id],
    queryFn: () => getVideosByCreator(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  };

  const statusIcons = {
    pending: <Clock className="w-3 h-3" />,
    approved: <CheckCircle className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
  };

  // Loading state
  if (!isLoaded || userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24 pb-24 px-4 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  // Calculate stats
  const totalVideos = videos.length;
  const approvedVideos = videos.filter(v => v.status === 'approved').length;
  const pendingVideos = videos.filter(v => v.status === 'pending').length;
  const totalViews = videos.reduce((sum, v) => sum + v.view_count, 0);
  const totalCompletions = videos.reduce((sum, v) => sum + v.completion_count, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                Creator Dashboard 🎬
              </h1>
              <p className="text-muted-foreground">
                Manage your educational videos
              </p>
            </div>
            <Button asChild variant="hero">
              <Link to="/upload">
                <Plus className="w-4 h-4" />
                New Video
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-center">
              <div className="text-3xl font-bold text-foreground">{totalVideos}</div>
              <div className="text-sm text-muted-foreground">Total Videos</div>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-center">
              <div className="text-3xl font-bold text-green-500">{approvedVideos}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-center">
              <div className="text-3xl font-bold text-amber-500">{pendingVideos}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-center">
              <div className="text-3xl font-bold text-primary">{totalViews}</div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
          </div>

          {/* Video List */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/50">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">My Videos</h2>
            </div>
            <div className="p-6">
              {videosLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : videos.length > 0 ? (
                <div className="space-y-4">
                  {videos.map(video => (
                    <div
                      key={video.id}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Video className="w-8 h-8 text-primary" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {video.category?.emoji} {video.category?.name || 'General'}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          {video.view_count}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {video.completion_count}
                        </span>
                        <span className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          statusColors[video.status as keyof typeof statusColors]
                        )}>
                          {statusIcons[video.status as keyof typeof statusIcons]}
                          {video.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No videos yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start sharing your knowledge by uploading your first video
                  </p>
                  <Button asChild variant="hero">
                    <Link to="/upload">
                      <Plus className="w-4 h-4" />
                      Upload Video
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
