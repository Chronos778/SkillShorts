import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { CategoryCard } from "@/components/CategoryCard";
import { ArrowRight, Play, BookOpen, Trophy, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getApprovedVideos, getCategories } from "@/services/videos";
import { isSupabaseConfigured } from "@/lib/supabase";

const Index = () => {
  const { data: approved = [], isLoading: loadingApproved } = useQuery({
    queryKey: ["home-approved"],
    queryFn: () => getApprovedVideos(),
  });

  // Fetch real categories from database
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["home-categories"],
    queryFn: () => getCategories(),
  });

  const displayedCategories = categories.slice(0, 6);

  const featuredVideos = approved.slice(0, 3).map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    thumbnail: v.thumbnail_url || "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop",
    duration: `${Math.floor((v as any).duration_seconds / 60)}:${String((v as any).duration_seconds % 60).padStart(2, "0")}`,
    category: v.category?.name || "General",
    categoryEmoji: v.category?.emoji || "🎬",
    creator: { name: v.creator?.name || "Unknown", avatar: v.creator?.avatar_url || "https://i.pravatar.cc/100" },
    views: (v as any).view_count || 0,
    completions: (v as any).completion_count || 0,
    quiz: [],
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-24 md:pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Learn real skills in minutes
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight mb-6 animate-fade-in">
              Learn Skills.{" "}
              <span className="gradient-text">Not Scroll.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in animation-delay-200">
              Short 2-5 minute videos with mandatory quizzes. 
              <br className="hidden md:block" />
              Earn points, unlock badges, and actually <span className="text-foreground font-semibold">learn something</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in animation-delay-300">
              <Button asChild variant="hero" size="xl">
                <Link to="/browse">
                  <Play className="w-5 h-5" />
                  Start Learning
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/upload">
                  Share Your Skills
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 animate-fade-in animation-delay-400">
              {[
                { icon: "🎬", value: "1,200+", label: "Videos" },
                { icon: "🧠", value: "5,000+", label: "Quizzes Completed" },
                { icon: "⭐", value: "50K+", label: "Points Earned" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className="text-left">
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Learning, Reimagined ✨
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No infinite scroll. No distractions. Just focused learning with real results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Play className="w-6 h-6" />,
                emoji: "🎬",
                title: "Watch Short Videos",
                description: "2-5 minute skill-based videos created by students like you",
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                emoji: "🧠",
                title: "Take the Quiz",
                description: "Every video ends with a quick quiz to lock in your learning",
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                emoji: "🏆",
                title: "Earn & Level Up",
                description: "Collect points, unlock badges, and track your progress",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-slide-up opacity-0"
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'forwards' }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-3xl">{step.emoji}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Explore Skills 🗺️
              </h2>
              <p className="text-muted-foreground mt-1">Find your next skill to master</p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/browse">
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {loadingCategories ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
              ))
            ) : displayedCategories.length > 0 ? (
              displayedCategories.map((category, i) => (
                <CategoryCard key={category.id} category={category} index={i} />
              ))
            ) : (
              <div className="col-span-3 text-muted-foreground text-center py-10">
                {isSupabaseConfigured
                  ? "No categories yet. Upload a video to get started."
                  : "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load categories."}
              </div>
            )}
          </div>
          {!loadingCategories && categories.length > displayedCategories.length && (
            <p className="text-sm text-muted-foreground mt-3">
              Showing top categories. Tap “View All” to see everything.
            </p>
          )}
        </div>
      </section>

      {/* Featured Videos */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Popular This Week 🔥
              </h2>
              <p className="text-muted-foreground mt-1">Top-rated skill videos</p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/browse">
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {loadingApproved ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[300px] rounded-2xl bg-muted animate-pulse" />
              ))
            ) : featuredVideos.length > 0 ? (
              featuredVideos.map((video, i) => (
                <VideoCard key={video.id} video={video} index={i} />
              ))
            ) : (
              <div className="col-span-3 text-center text-muted-foreground">
                No videos yet. Upload your first skill!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary to-primary-glow rounded-3xl p-10 md:p-16 shadow-glow">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Learn Something New? 🚀
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
              Join thousands of students learning real skills through short, focused videos.
            </p>
            <Button asChild variant="glass" size="xl" className="bg-background/20 hover:bg-background/30 text-primary-foreground border-primary-foreground/20">
              <Link to="/browse">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Spacer for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default Index;
