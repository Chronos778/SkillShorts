import { Link } from "react-router-dom";
import { Play, Clock, CheckCircle, Eye, Target } from "lucide-react";
import { Video } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  index?: number;
  completed?: boolean;
}

export function VideoCard({ video, index = 0, completed = false }: VideoCardProps) {
  const views = (video as any).views ?? 0;
  const completions = (video as any).completions ?? 0;

  return (
    <Link 
      to={`/video/${video.id}`}
      className={cn(
        "group block animate-slide-up opacity-0",
        `animation-delay-${(index % 5) * 100}`
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/20 to-transparent" />
          
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/90 text-foreground text-xs font-semibold backdrop-blur-sm border border-border/70 shadow-sm">
            <Clock className="w-3 h-3" />
            {video.duration}
          </div>

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-glow">
              <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-sm text-xs font-semibold shadow-sm border border-border/70 text-foreground">
            {video.categoryEmoji} {video.category.charAt(0).toUpperCase() + video.category.slice(1)}
          </div>

          {/* Completed Badge */}
          {completed && (
            <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-success flex items-center justify-center shadow-md">
              <CheckCircle className="w-5 h-5 text-success-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2">
          <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>

          {/* Creator & Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={video.creator.avatar}
                alt={video.creator.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-muted-foreground truncate">{video.creator.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{views.toLocaleString()}</span>
              <span className="inline-flex items-center gap-1"><Target className="w-3 h-3" />{completions.toLocaleString()}</span>
              <span className="inline-flex items-center gap-1">🧠 {video.quiz.length}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
