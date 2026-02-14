import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getUserByClerkId, syncUserFromClerk, isAdmin } from "@/services/users";
import { getVideosByStatus, approveVideo, rejectVideo } from "@/services/videos";
import { 
  CheckCircle, XCircle, Loader2, Video, Eye, 
  Clock, Users, Shield, Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Video as VideoType } from "@/types";

type TabType = 'pending' | 'approved' | 'rejected';

export default function Admin() {
  const { user: clerkUser, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('pending');

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

  // Check if user is admin
  const userIsAdmin = isAdmin(dbUser);

  // Fetch videos by status
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['adminVideos', activeTab],
    queryFn: () => getVideosByStatus(activeTab),
    enabled: userIsAdmin,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (videoId: string) => approveVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVideos'] });
      toast.success("Video approved! ✅");
    },
    onError: () => {
      toast.error("Failed to approve video");
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (videoId: string) => rejectVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVideos'] });
      toast.success("Video rejected");
    },
    onError: () => {
      toast.error("Failed to reject video");
    }
  });

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

  // Access denied
  if (!userIsAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24 pb-24 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Admin Access Required
            </h2>
            <p className="text-muted-foreground">
              You need admin permissions to access this page.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: 'pending' as TabType, label: 'Pending', icon: Clock, count: videos.length },
    { id: 'approved' as TabType, label: 'Approved', icon: CheckCircle },
    { id: 'rejected' as TabType, label: 'Rejected', icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Admin Panel
              </h1>
            </div>
            <p className="text-muted-foreground">
              Review and manage video submissions
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "secondary"}
                onClick={() => setActiveTab(tab.id)}
                className="rounded-full"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'pending' && activeTab === 'pending' && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-xs">
                    {videos.length}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Video List */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/50">
            <div className="p-6">
              {videosLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : videos.length > 0 ? (
                <div className="space-y-4">
                  {videos.map((video: VideoType) => (
                    <div
                      key={video.id}
                      className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-muted/50 rounded-xl"
                    >
                      {/* Thumbnail */}
                      <div className="w-full md:w-32 h-24 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Video className="w-10 h-10 text-primary" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate">
                          {video.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {video.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{video.category?.emoji} {video.category?.name}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {video.creator?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        {video.video_url && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.open(video.video_url, '_blank')}
                          >
                            <Play className="w-4 h-4" />
                            Preview
                          </Button>
                        )}
                        {activeTab === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => approveMutation.mutate(video.id)}
                              disabled={approveMutation.isPending}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => rejectMutation.mutate(video.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No {activeTab} videos
                  </h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending' 
                      ? "No videos waiting for review" 
                      : `No ${activeTab} videos to display`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
