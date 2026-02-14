import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Play } from "lucide-react";
import { getCategories, getApprovedVideos, getVideosByCategory, searchVideos } from "@/services/videos";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Video, Category } from "@/types";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: dbVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['videos', selectedCategory, searchQuery],
    queryFn: () => {
      if (searchQuery) return searchVideos(searchQuery);
      if (selectedCategory) return getVideosByCategory(selectedCategory);
      return getApprovedVideos();
    },
  });

  const videos: Video[] = dbVideos;

  return (
    <div className="flex flex-col h-full bg-background animate-in-fade">

      {/* -------------------------------------------------------------------------- */
      /*                                TOOLBAR                                      */
      /* -------------------------------------------------------------------------- */}
      <div className="bg-background border-b-2 border-border p-4 sticky top-0 z-20 flex flex-col md:flex-row gap-4 md:items-center justify-between">

        <div className="flex items-center gap-4 flex-1">
          <h1 className="font-black text-xl uppercase tracking-tighter shrink-0 flex items-center gap-2">
            Archive <span className="text-[10px] font-mono font-normal text-muted-foreground bg-muted px-1 py-0.5 rounded-none">{videos.length}</span>
          </h1>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="SEARCH ARCHIVE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-muted/30 border border-border pl-10 pr-4 font-mono text-sm uppercase focus:bg-background focus:border-foreground outline-none transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 max-w-full md:max-w-xl scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-border whitespace-nowrap transition-colors",
              selectedCategory === null
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground hover:text-foreground hover:border-foreground/50"
            )}
          >
            ALL
          </button>
          {dbCategories.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-border whitespace-nowrap transition-colors flex items-center gap-2",
                selectedCategory === cat.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground hover:border-foreground/50"
              )}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */
      /*                                GRID                                         */
      /* -------------------------------------------------------------------------- */}
      <div className="flex-1 overflow-auto bg-muted/10 p-4">
        {videosLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((video) => (
              <Link
                key={video.id}
                to={`/video/${video.id}`}
                className="group relative aspect-[4/3] bg-black border-2 border-transparent hover:border-foreground transition-all overflow-hidden block"
              >
                {/* Thumbnail */}
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500 will-change-transform grayscale group-hover:grayscale-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <span className="font-mono text-xs">NO_IMAGE</span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-black/80 backdrop-blur-sm p-3 border border-white/20 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-accent uppercase">{video.category?.name || 'GEN'}</span>
                      <span className="text-[9px] font-mono text-gray-400">
                        {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 uppercase mb-1">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[9px] font-mono text-gray-400 uppercase">
                      <span>BY {video.creator?.name}</span>
                    </div>
                  </div>
                </div>

                {/* Play Icon (Center) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 pointer-events-none">
                  <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-full transform scale-50 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="text-4xl mb-4 grayscale opacity-50">📂</div>
            <p className="font-mono text-sm uppercase">Archive Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
