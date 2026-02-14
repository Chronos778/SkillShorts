import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { BadgeCard } from "@/components/BadgeCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Flame, Trophy, Target, TrendingUp,
  ChevronRight, Play, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserByClerkId, syncUserFromClerk } from "@/services/users";
import { getUserBadges } from "@/services/badges";
import { getSkillProgress, getCompletedVideosCount, getAverageQuizAccuracy } from "@/services/progress";
import { getVideosByCreator, deleteVideo } from "@/services/videos";
import { toast } from "@/hooks/use-toast";
import { VideoCard } from "@/components/VideoCard";
import { LEVEL_THRESHOLDS, BADGE_INFO } from "@/types";
import type { Badge as DbBadge } from "@/types";

export default function Dashboard() {
  const { user: clerkUser, isLoaded } = useUser();

  // Sync and get user from database
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

  // Fetch user badges
  const { data: dbBadges = [] } = useQuery({
    queryKey: ['badges', dbUser?.id],
    queryFn: () => getUserBadges(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  // Fetch skill progress
  const { data: skillProgress = [] } = useQuery({
    queryKey: ['skillProgress', dbUser?.id],
    queryFn: () => getSkillProgress(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  // Fetch stats
  const { data: videosCompleted = 0 } = useQuery({
    queryKey: ['videosCompleted', dbUser?.id],
    queryFn: () => getCompletedVideosCount(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  const { data: quizAccuracy = 0 } = useQuery({
    queryKey: ['quizAccuracy', dbUser?.id],
    queryFn: () => getAverageQuizAccuracy(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  // Fetch user's uploaded videos
  const { data: myUploads = [], refetch, isRefetching } = useQuery({
    queryKey: ['myUploads', dbUser?.id],
    queryFn: () => getVideosByCreator(dbUser!.id),
    enabled: !!dbUser?.id,
  });

  async function handleDelete(videoId: string) {
    if (!dbUser?.id) return;
    const ok = window.confirm('Delete this video? This cannot be undone.');
    if (!ok) return;
    const success = await deleteVideo(videoId, dbUser.id);
    if (success) {
      toast({ title: 'Video deleted', description: 'Your video was removed.' });
      await refetch();
    } else {
      toast({ title: 'Failed to delete', description: 'Please try again.' });
    }
  }

  // Transform database badges to display format (real data only)
  const badges = Object.entries(BADGE_INFO).map(([type, info]) => {
    const earned = dbBadges.find(b => b.badge_type === type);
    return {
      id: type,
      name: info.name,
      emoji: info.emoji,
      description: info.description,
      earned: !!earned,
      earnedDate: earned?.earned_at
    };
  });

  // Calculate level info (real data only)
  const userPoints = dbUser?.points || 0;
  const userLevel = dbUser?.level || 'beginner';
  const userStreakCount = dbUser?.streak_count || 0;

  // Get level display info
  const getLevelInfo = (level: string) => {
    const levels = [
      { level: 'beginner', name: 'Beginner', emoji: '🌱', minPoints: 0 },
      { level: 'intermediate', name: 'Intermediate', emoji: '📖', minPoints: 200 },
      { level: 'advanced', name: 'Advanced', emoji: '⭐', minPoints: 500 },
      { level: 'expert', name: 'Expert', emoji: '🏆', minPoints: 1000 },
    ];
    return levels.find(l => l.level === level) || levels[0];
  };

  const currentLevelInfo = getLevelInfo(userLevel);
  const nextLevelInfo = (() => {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(userLevel);
    if (currentIndex < levels.length - 1) {
      return getLevelInfo(levels[currentIndex + 1]);
    }
    return null;
  })();

  const progressToNext = nextLevelInfo
    ? Math.min(100, ((userPoints - currentLevelInfo.minPoints) / (nextLevelInfo.minPoints - currentLevelInfo.minPoints)) * 100)
    : 100;

  // Loading state
  if (!isLoaded || userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24 pb-24 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Loading your progress...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Your Progress 🚀
            </h1>
            <p className="text-muted-foreground">
              Keep learning, keep growing!
            </p>
          </div>

          {/* Level Card */}
          <div className="bg-gradient-to-br from-primary to-primary-glow rounded-2xl p-6 md:p-8 shadow-glow text-primary-foreground mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ProgressRing progress={progressToNext} size={140} strokeWidth={10}>
                <div className="text-center">
                  <div className="text-4xl mb-1">{currentLevelInfo.emoji}</div>
                  <div className="text-sm opacity-80">{currentLevelInfo.name}</div>
                </div>
              </ProgressRing>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {currentLevelInfo.name}
                </h2>
                <p className="opacity-80 mb-4">
                  {userPoints.toLocaleString()} total points
                </p>
                {nextLevelInfo && (
                  <div className="bg-background/20 rounded-lg p-3 inline-block">
                    <p className="text-sm">
                      <span className="font-bold">{(nextLevelInfo.minPoints - userPoints).toLocaleString()}</span> points to {nextLevelInfo.emoji} {nextLevelInfo.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <Flame className="w-5 h-5" />, value: userStreakCount, label: "Day Streak", emoji: "🔥", highlight: true },
              { icon: <Play className="w-5 h-5" />, value: videosCompleted, label: "Videos Done", emoji: "🎬" },
              { icon: <Target className="w-5 h-5" />, value: `${quizAccuracy}%`, label: "Quiz Accuracy", emoji: "🎯" },
              { icon: <Trophy className="w-5 h-5" />, value: badges.filter(b => b.earned).length, label: "Badges", emoji: "🏆" },
            ].map((stat, i) => (
              <div
                key={i}
                className={cn(
                  "bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-center animate-slide-up opacity-0",
                  stat.highlight && "border-accent shadow-accent"
                )}
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className="text-2xl mb-1">{stat.emoji}</div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Skill Progress */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 mb-8 animate-fade-in animation-delay-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Skill Progress</h3>
              <Link to="/browse" className="text-sm text-primary flex items-center gap-1 hover:underline">
                Browse all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {skillProgress.length > 0 ? skillProgress.slice(0, 4).map((skill, i) => {
                const progress = skill.totalVideos > 0
                  ? Math.round((skill.videosCompleted / skill.totalVideos) * 100)
                  : 0;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {skill.category?.emoji} {skill.category?.name}
                      </span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No skill progress yet. Start learning to track your progress!</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link to="/browse">Browse Videos</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 animate-fade-in animation-delay-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Your Badges 🏅</h3>
              <span className="text-sm text-muted-foreground">
                {badges.filter(b => b.earned).length}/{badges.length} earned
              </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} size="sm" />
              ))}
            </div>
          </div>

          {/* My Uploads */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 animate-fade-in animation-delay-300 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">My Uploaded Videos</h3>
              <Link to="/creator" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {myUploads.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myUploads.map((v, i) => (
                  <div key={v.id} className="group relative">
                    <VideoCard
                      video={{
                        id: v.id,
                        title: v.title,
                        description: v.description,
                        thumbnail: v.thumbnail_url || "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop",
                        duration: `${Math.floor(v.duration_seconds / 60)}:${String(v.duration_seconds % 60).padStart(2, '0')}`,
                        category: v.category?.id || v.category_id,
                        categoryEmoji: v.category?.emoji || '🎬',
                        creator: { name: dbUser?.name || 'You', avatar: dbUser?.avatar_url || 'https://i.pravatar.cc/100' },
                        views: v.view_count,
                        completions: v.completion_count,
                        quiz: []
                      }}
                      index={i}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                        aria-label="Delete video"
                        disabled={isRefetching}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>You haven’t uploaded any videos yet.</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/upload">Upload your first video</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Continue Learning CTA */}
          <div className="mt-8 text-center">
            <Button asChild variant="hero" size="xl">
              <Link to="/browse">
                <Play className="w-5 h-5" />
                Continue Learning
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
