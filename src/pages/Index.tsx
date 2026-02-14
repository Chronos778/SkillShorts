import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getApprovedVideos } from "@/services/videos";
import { Play, Heart, MessageCircle, Share2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["home-approved"],
    queryFn: () => getApprovedVideos(),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="text-4xl mb-4">📹</div>
        <h2 className="text-2xl font-black uppercase">No Content</h2>
        <p className="font-mono text-muted-foreground mb-4">SYSTEM EMPTY</p>
        <Button asChild>
          <Link to="/upload">Initialize First Upload</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-full">
      {videos.map((video, index) => (
        <section
          key={video.id}
          className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] snap-start flex-shrink-0 flex items-center justify-center bg-black overflow-hidden group"
        >
          {/* Video Background */}
          <div className="absolute inset-0 z-0">
            {video.video_url ? (
              <video
                src={video.video_url}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div className="w-full h-full bg-neutral-900" />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          </div>

          {/* Center Play Button (Optional - could link to detail) */}
          <Link
            to={`/video/${video.id}`}
            className="z-10 w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-110 hover:bg-white/20"
          >
            <Play className="w-8 h-8 fill-white text-white ml-1" />
          </Link>

          {/* Overlay Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 flex flex-col md:flex-row items-end justify-between gap-6">

            {/* Left Info */}
            <div className="flex-1 max-w-2xl animate-slide-up">
              <div className="flex items-center gap-3 mb-3">
                <div className="px-2 py-1 bg-accent text-white text-[10px] font-mono font-bold uppercase tracking-widest">
                  {video.category?.name || 'FEATURE'}
                </div>
                <span className="text-xs font-mono text-gray-300 uppercase tracking-widest">
                  {video.creator?.name}
                </span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase leading-none tracking-tight mb-4 text-shadow-sm">
                {video.title}
              </h2>
              <p className="text-gray-300 font-mono text-sm max-w-lg line-clamp-2 md:line-clamp-none">
                {video.description}
              </p>
            </div>

            {/* Right Actions */}
            <div className="flex flex-row md:flex-col gap-4 text-white">
              <Button size="icon" variant="ghost" className="rounded-full h-12 w-12 hover:bg-white/10 hover:text-white">
                <Heart className="w-6 h-6" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full h-12 w-12 hover:bg-white/10 hover:text-white">
                <MessageCircle className="w-6 h-6" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full h-12 w-12 hover:bg-white/10 hover:text-white">
                <Share2 className="w-6 h-6" />
              </Button>
              <Link to={`/video/${video.id}`}>
                <Button size="icon" variant="outline" className="rounded-full h-12 w-12 border-2 border-white/50 hover:bg-white hover:text-black transition-colors">
                  <Info className="w-6 h-6" />
                </Button>
              </Link>
            </div>

          </div>
        </section>
      ))}
    </div>
  );
};

export default Index;
