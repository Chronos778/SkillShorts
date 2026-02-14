import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { CategoryCard } from "@/components/CategoryCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { getCategories, getApprovedVideos, getVideosByCategory, searchVideos } from "@/services/videos";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Video, Category } from "@/types";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch categories from database
  const { data: dbCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Fetch videos from database
  const { data: dbVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['videos', selectedCategory, searchQuery],
    queryFn: () => {
      if (searchQuery) return searchVideos(searchQuery);
      if (selectedCategory) return getVideosByCategory(selectedCategory);
      return getApprovedVideos();
    },
  });

  // Use only real database data - no mock fallbacks
  const categories: Category[] = dbCategories;
  const allVideos: Video[] = dbVideos;

  // Filter videos
  const videos = searchQuery
    ? allVideos.filter((v) =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : selectedCategory
      ? allVideos.filter((v) => v.category_id === selectedCategory)
      : allVideos;

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Browse Skills 🎯
            </h1>
            <p className="text-muted-foreground">
              Discover new skills from our educational videos
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-card border-border/50"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
            <Button
              variant={selectedCategory === null ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full shrink-0 px-4"
              aria-pressed={selectedCategory === null}
            >
              ✨ All Skills
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-background/80 border border-border/60 text-foreground">
                {categories.length}
              </span>
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="rounded-full shrink-0 px-4"
                aria-pressed={selectedCategory === cat.id}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                  {typeof cat.video_count === "number" && (
                    <span className="ml-1 px-2 py-0.5 text-[11px] rounded-full bg-background/80 border border-border/60 text-foreground">
                      {cat.video_count}
                    </span>
                  )}
                </span>
              </Button>
            ))}
          </div>

          {/* Categories Section (only show when no category selected and no search) */}
          {selectedCategory === null && !searchQuery && categories.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Explore Categories 🗺️
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category, i) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onSelect={() => setSelectedCategory(category.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Videos Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {selectedCategoryData
                  ? `${selectedCategoryData.emoji} ${selectedCategoryData.name} Videos`
                  : "All Videos"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {videosLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `${videos.length} video${videos.length !== 1 ? 's' : ''}`
                )}
              </span>
            </div>

            {videosLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm"
                  >
                    <div className="aspect-video bg-muted/70" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted/90 rounded" />
                      <div className="h-3 bg-muted/70 rounded w-5/6" />
                      <div className="h-3 bg-muted/60 rounded w-4/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((v, i) => (
                  <VideoCard
                    key={v.id}
                    video={{
                      id: v.id,
                      title: v.title,
                      description: v.description,
                      thumbnail: v.thumbnail_url || "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop",
                      duration: `${Math.floor(v.duration_seconds / 60)}:${String(v.duration_seconds % 60).padStart(2, '0')}`,
                      category: v.category?.name || "General",
                      categoryEmoji: v.category?.emoji || '🎬',
                      creator: { name: v.creator?.name || 'Unknown', avatar: v.creator?.avatar_url || 'https://i.pravatar.cc/100' },
                      views: v.view_count,
                      completions: v.completion_count,
                      quiz: []
                    }}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-foreground mb-2">No videos found</h3>
                <p className="text-muted-foreground mb-4">
                  {dbVideos.length === 0
                    ? "No videos have been uploaded yet. Check back soon!"
                    : "Try adjusting your search or filters"}
                </p>
                {!isSupabaseConfigured && (
                  <p className="text-sm text-muted-foreground">
                    Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load real data.
                  </p>
                )}
                {selectedCategory && (
                  <Button
                    onClick={() => setSelectedCategory(null)}
                    variant="outline"
                    className="mt-2"
                  >
                    Clear category filter
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
