import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getUserByClerkId, syncUserFromClerk, isAdmin } from "@/services/users";
import { getVideosByStatus, approveVideo, rejectVideo } from "@/services/videos";
import {
  Check, X, Loader2, Video, Eye,
  Clock, User, Shield, Play, Filter,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Video as VideoType } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type TabType = 'pending' | 'approved' | 'rejected';

export default function Admin() {
  const { user: clerkUser, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

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

  const userIsAdmin = isAdmin(dbUser);

  // Fetch videos by status
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['adminVideos', activeTab],
    queryFn: () => getVideosByStatus(activeTab),
    enabled: userIsAdmin,
  });

  // Select first video on load if none selected
  if (videos.length > 0 && !selectedVideoId && !videosLoading) {
    // Optional: auto-select first item
    // setSelectedVideoId(videos[0].id);
  }

  const selectedVideo = videos.find((v: VideoType) => v.id === selectedVideoId);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (videoId: string) => approveVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVideos'] });
      toast.success("Video approved");
      setSelectedVideoId(null);
    },
    onError: () => toast.error("Failed to approve video")
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (videoId: string) => rejectVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVideos'] });
      toast.success("Video rejected");
      setSelectedVideoId(null);
    },
    onError: () => toast.error("Failed to reject video")
  });

  if (!isLoaded || userLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userIsAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <Shield className="w-16 h-16 mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h2>
        <p className="font-mono text-muted-foreground mt-2">Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden animate-in-fade">

      {/* -------------------------------------------------------------------------- */
      /*                                LEFT PANEL (List)                            */
      /* -------------------------------------------------------------------------- */}
      <div className="w-96 flex flex-col border-r-2 border-border bg-sidebar/50">

        {/* Header */}
        <div className="p-4 border-b-2 border-border">
          <h1 className="text-xl font-black uppercase tracking-tighter mb-4">Inbox</h1>

          <div className="flex bg-muted/50 p-1 gap-1 border border-border">
            {(['pending', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedVideoId(null); }}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          {videosLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
          ) : videos.length === 0 ? (
            <div className="p-8 text-center">
              <div className="font-mono text-xs text-muted-foreground uppercase">No items found</div>
            </div>
          ) : (
            <div className="flex flex-col">
              {videos.map((video: VideoType) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 border-b border-border transition-colors text-left hover:bg-muted/30 group relative",
                    selectedVideoId === video.id && "bg-muted/50"
                  )}
                >
                  {selectedVideoId === video.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}

                  <div className="w-16 h-12 bg-muted flex-shrink-0 overflow-hidden relative border border-border/50">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Video className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-bold text-sm truncate leading-tight mb-1 group-hover:text-accent transition-colors",
                      selectedVideoId === video.id ? "text-primary" : "text-foreground"
                    )}>
                      {video.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-muted-foreground">
                      <span>{video.creator?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* -------------------------------------------------------------------------- */
      /*                                RIGHT PANEL (Detail)                         */
      /* -------------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col bg-background relative">
        {selectedVideo ? (
          <>
            {/* Toolbar */}
            <div className="h-16 border-b-2 border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  activeTab === 'pending' ? "bg-yellow-500" : activeTab === 'approved' ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  ID: {selectedVideo.id.split('-')[0]}...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs uppercase" onClick={() => window.open(selectedVideo.video_url, '_blank')}>
                  <Maximize2 className="w-3 h-3 mr-2" /> Open Original
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto p-8 pb-32">
                {/* Video Player Area */}
                <div className="aspect-video bg-black w-full mb-8 relative group overflow-hidden border-2 border-border select-none">
                  {selectedVideo.video_url ? (
                    <video
                      src={selectedVideo.video_url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Video Unavailable
                    </div>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">Title</label>
                    <p className="font-bold text-lg leading-tight">{selectedVideo.title}</p>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">Category</label>
                    <p className="font-medium">{video.category?.name || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">Creator</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4" />
                      <span className="font-bold underline cursor-pointer">{selectedVideo.creator?.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">Stats</label>
                    <p className="font-mono">142 VIEWS</p>
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">Description</label>
                    <p className="text-muted-foreground leading-relaxed">{selectedVideo.description}</p>
                  </div>
                </div>

              </div>
            </ScrollArea>

            {/* Action Footer (Sticky) */}
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t-2 border-border bg-background flex items-center justify-end gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-32 uppercase font-bold tracking-widest border-2 hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
                  onClick={() => rejectMutation.mutate(selectedVideo.id)}
                  disabled={rejectMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button
                  size="lg"
                  className="w-48 bg-primary text-primary-foreground uppercase font-black tracking-widest hover:scale-105 transition-transform"
                  onClick={() => approveMutation.mutate(selectedVideo.id)}
                  disabled={approveMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" /> Approve
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 border-2 border-border border-dashed rounded-full flex items-center justify-center mb-4">
              <Video className="w-6 h-6 opacity-50" />
            </div>
            <p className="font-mono text-sm uppercase">Select an item to inspect</p>
          </div>
        )}
      </div>

    </div>
  );
}
