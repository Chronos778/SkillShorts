import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight, BookOpen, List, Play,
  Target,
  Flame, Hexagon, Medal, Trophy, Star, UserPlus, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { syncUserFromClerk, getUserById } from "@/services/users";
import { getUserBadges } from "@/services/badges";
import { getSkillProgress, getCompletedVideosCount, getAverageQuizAccuracy, getLastActiveProgress } from "@/services/progress";
import { getVideosByCreator } from "@/services/videos";
import { followUser, unfollowUser, isFollowing, getFollowCounts } from "@/services/social";
import { BADGE_INFO, UserLevel, LEVEL_THRESHOLDS } from "@/types";

export default function Dashboard() {
  const { user: clerkUser, isLoaded } = useUser();
  const { id: paramUserId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Resolve Current User (Me)
  const { data: currentUser } = useQuery({
    queryKey: ['current-user', clerkUser?.id],
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

  // 2. Determine View Target (Me or Other)
  const targetUserId = paramUserId || currentUser?.id;
  const isOwnProfile = currentUser?.id === targetUserId;

  // 3. Fetch Target User Profile
  const { data: profileUser } = useQuery({
    queryKey: ['user-profile', targetUserId],
    queryFn: () => targetUserId ? getUserById(targetUserId) : null,
    enabled: !!targetUserId,
  });

  // 4. Follow Status & Counts
  const { data: isFollowed } = useQuery({
    queryKey: ['is-following', currentUser?.id, targetUserId],
    queryFn: () => isFollowing(currentUser!.id, targetUserId!),
    enabled: !!currentUser?.id && !!targetUserId && !isOwnProfile,
  });

  const { data: followCounts } = useQuery({
    queryKey: ['follow-counts', targetUserId],
    queryFn: () => targetUserId ? getFollowCounts(targetUserId) : { followers: 0, following: 0 },
    enabled: !!targetUserId
  });


  // 5. Follow Mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !targetUserId) return;
      if (isFollowed) {
        await unfollowUser(currentUser.id, targetUserId);
      } else {
        await followUser(currentUser.id, targetUserId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following', currentUser?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts', targetUserId] });
      toast({ title: isFollowed ? "Unsubscribed" : "Subscribed" });
    },
    onError: () => {
      toast({ title: "Action failed", variant: "destructive" });
    }
  });


  // --- Existing Stats Queries (using targetUserId) ---

  const { data: skillProgress = [] } = useQuery({
    queryKey: ['skillProgress', targetUserId],
    queryFn: () => getSkillProgress(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: lastActive } = useQuery({
    queryKey: ['lastActive', targetUserId],
    queryFn: () => getLastActiveProgress(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: videosCompleted = 0 } = useQuery({
    queryKey: ['videosCompleted', targetUserId],
    queryFn: () => getCompletedVideosCount(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: quizAccuracy = 0 } = useQuery({
    queryKey: ['quizAccuracy', targetUserId],
    queryFn: () => getAverageQuizAccuracy(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['badges', targetUserId],
    queryFn: () => getUserBadges(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: myUploads = [] } = useQuery({
    queryKey: ['myUploads', targetUserId],
    queryFn: () => getVideosByCreator(targetUserId!),
    enabled: !!targetUserId,
  });

  // Determine active course based on last watched video, fallback to first skill
  const activeCategoryId = lastActive?.video?.category?.id;
  const activeCourse = activeCategoryId
    ? skillProgress.find(s => s.category.id === activeCategoryId)
    : (skillProgress.length > 0 ? skillProgress[0] : null);

  // Calculate Level Progress
  const getNextLevelThreshold = (level: UserLevel) => {
    if (level === 'beginner') return LEVEL_THRESHOLDS.intermediate;
    if (level === 'intermediate') return LEVEL_THRESHOLDS.advanced;
    if (level === 'advanced') return LEVEL_THRESHOLDS.expert;
    return LEVEL_THRESHOLDS.expert * 2;
  };

  const currentPoints = profileUser?.points || 0;
  const nextThreshold = getNextLevelThreshold(profileUser?.level || 'beginner');
  const progressPercent = Math.min(100, Math.round((currentPoints / nextThreshold) * 100));

  if (!profileUser && isLoaded) return <div className="p-10 font-mono text-center">INITIALIZING LINK...</div>;

  return (
    <div className="flex-1 p-6 md:p-8 animate-in-fade pb-24">

      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tight mb-2">
            {isOwnProfile ? 'COCKPIT' : `${profileUser?.name}'S PROFILE`}
          </h2>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 font-mono text-muted-foreground uppercase tracking-widest text-xs">
            <span className="text-foreground font-bold">OPERATOR: {profileUser?.name || 'UNKNOWN'}</span>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <span className="text-swiss-red font-black">RANK: {profileUser?.level || 'N/A'}</span>
            <span className="hidden md:inline text-muted-foreground/50">|</span>
            <span className="text-foreground font-bold">XP: {profileUser?.points || 0}</span>
          </div>
          {/* Follow Counts */}
          <div className="flex gap-4 mt-2 font-mono text-xs">
            <span className="text-foreground"><strong>{followCounts?.followers || 0}</strong> FOLLOWERS</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-foreground"><strong>{followCounts?.following || 0}</strong> FOLLOWING</span>
          </div>
        </div>

        <div className="flex gap-4 items-center w-full md:w-auto">
          {!isOwnProfile && currentUser && (
            <Button
              size="lg"
              className={`h-12 border-2 uppercase font-bold min-w-[140px] ${isFollowed ? 'bg-white text-black hover:bg-gray-200' : 'bg-swiss-red text-white hover:bg-red-600'}`}
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
            >
              {isFollowed ? (
                <>
                  <UserCheck className="mr-2 h-4 w-4" /> SUBSCRIBED
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> SUBSCRIBE
                </>
              )}
            </Button>
          )}

          <Button size="lg" className="h-12 border-2 uppercase font-bold" asChild>
            <Link to="/browse">
              <BookOpen className="mr-2 h-4 w-4" />
              Library
            </Link>
          </Button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">

        {/* ------------------- ROW 1 ------------------- */}

        {/* Main Hero Card - Current Focus */}
        <Card className="col-span-1 md:col-span-8 border-2 shadow-none p-0 overflow-hidden relative group min-h-[240px]">
          <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors" />
          <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
            <div className="flex justify-between items-start">
              <span className="inline-block px-3 py-1 bg-accent text-white text-xs font-mono uppercase font-bold tracking-wider">
                Active Module
              </span>
              <ArrowRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
            </div>

            <div>
              <h3 className="text-2xl md:text-4xl font-black uppercase mb-4 max-w-xl leading-none tracking-tight">
                {activeCourse ? activeCourse.category?.name : "Selecting Course..."}
              </h3>
              <div className="flex gap-8 font-mono text-xs md:text-sm text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <Play className="h-3 w-3" />
                  {activeCourse ? `${activeCourse.videosCompleted}/${activeCourse.totalVideos} COMPLETED` : "0/0 COMPLETED"}
                </span>
                <span className="flex items-center gap-2">
                  <Target className="h-3 w-3" />
                  STATUS: {activeCourse ? 'IN_PROGRESS' : 'IDLE'}
                </span>
                {activeCourse && (
                  <span className="flex items-center gap-2">
                    <Star className="h-3 w-3" />
                    AVG SCORE: {activeCourse.averageScore}%
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card 1 - Completed Count */}
        <Card className="col-span-1 md:col-span-4 border-2 shadow-none bg-black text-white dark:bg-white dark:text-black relative overflow-hidden group min-h-[240px]">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}
          />
          <CardContent className="p-8 h-full flex flex-col justify-center relative z-10">
            <div className="text-6xl md:text-8xl font-black mb-0 leading-none tracking-tighter group-hover:scale-110 transition-transform duration-500">
              {videosCompleted}
            </div>
            <div className="font-mono text-xs uppercase tracking-widest opacity-80 mt-2">
              Mission Comp.
            </div>
          </CardContent>
        </Card>

        {/* ------------------- ROW 2 ------------------- */}

        {/* Skill System Modules */}
        <Card className="col-span-1 md:col-span-8 border-2 shadow-none flex flex-col min-h-[240px]">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Hexagon className="h-5 w-5 text-accent" />
              <h3 className="text-xl font-black uppercase tracking-tight">System Modules</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {skillProgress.length > 0 ? skillProgress.map((skill) => (
                <div key={skill.category.id} className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <span className="font-bold uppercase text-sm tracking-wide group-hover:text-accent transition-colors">{skill.category.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{skill.videosCompleted}/{skill.totalVideos} // {Math.round((skill.videosCompleted / Math.max(skill.totalVideos, 1)) * 100)}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted border border-border">
                    <div
                      className="h-full bg-foreground"
                      style={{ width: `${Math.min(100, (skill.videosCompleted / Math.max(skill.totalVideos, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="col-span-2 font-mono text-sm text-muted-foreground uppercase">No modules active.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Targeting Accuracy */}
        <Card className="col-span-1 md:col-span-4 border-2 shadow-none flex flex-col justify-center relative overflow-hidden group min-h-[240px]">
          <div className="absolute inset-0 bg-accent/5" />
          <div className="absolute -right-12 -bottom-12">
            <Target className="w-48 h-48 text-muted/10 transform rotate-12" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-6xl font-black tracking-tighter">{quizAccuracy}%</span>
            </div>
            <h3 className="font-bold uppercase text-sm tracking-widest mb-1">Marksmanship</h3>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Average Quiz Accuracy</p>
          </CardContent>
        </Card>

        {/* ------------------- ROW 3 ------------------- */}

        {/* Service Medals (Badges) */}
        <Card className="col-span-1 md:col-span-8 border-2 shadow-none min-h-[240px]">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Medal className="h-5 w-5 text-accent" />
              <h3 className="text-xl font-black uppercase tracking-tight">Service Medals</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {badges.length > 0 ? badges.map((badge) => {
                const info = BADGE_INFO[badge.badge_type];
                return (
                  <div key={badge.id} className="group relative border-2 border-border p-3 w-20 h-20 flex flex-col items-center justify-center hover:bg-accent/10 transition-colors cursor-help">
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{info.emoji}</div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-mono whitespace-nowrap px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {info.name}
                    </div>
                  </div>
                );
              }) : (
                <div className="w-full py-8 text-center border-2 border-dashed border-muted">
                  <p className="font-mono text-xs text-muted-foreground uppercase">No medals awarded yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Streak / Daily Goal */}
        <Card className="col-span-1 md:col-span-4 border-2 shadow-none flex flex-col justify-center items-center bg-accent text-accent-foreground relative overflow-hidden min-h-[240px]">
          <div className="absolute inset-0 bg-black/10" />
          <CardContent className="relative z-10 text-center p-8">
            <div className="mb-2 font-black text-6xl tracking-tighter flex items-center justify-center gap-2">
              {profileUser?.streak_count || 0} <Flame className="h-8 w-8 fill-current" />
            </div>
            <h3 className="font-bold uppercase text-sm tracking-widest mb-1">Day Streak</h3>
            <p className="font-mono text-[10px] opacity-75">CONSISTENCY IS KEY</p>
          </CardContent>
        </Card>


        {/* ------------------- ROW 4 ------------------- */}

        {/* Queue List / Recent Uploads */}
        <Card className="col-span-1 md:col-span-4 border-2 shadow-none flex flex-col justify-between min-h-[240px]">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <List className="h-4 w-4" />
              <h4 className="uppercase text-lg font-black tracking-tight">{isOwnProfile ? 'Queue' : 'Uploads'}</h4>
            </div>

            <div className="space-y-4">
              {myUploads.slice(0, 3).map((video, i) => (
                <div key={video.id} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground">UPLOAD_0{i + 1}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <h4 className="font-bold uppercase text-sm leading-tight truncate group-hover:text-accent transition-colors">
                    {video.title}
                  </h4>
                </div>
              ))}
              {myUploads.length === 0 && (
                <p className="font-mono text-xs text-muted-foreground">QUEUE EMPTY</p>
              )}
            </div>
          </CardContent>
          <div className="p-4 border-t-2 border-border">
            {isOwnProfile ? (
              <Button variant="ghost" className="w-full text-xs font-mono h-8 uppercase" asChild>
                <Link to="/upload">Upload New</Link>
              </Button>
            ) : (
              <Button variant="ghost" className="w-full text-xs font-mono h-8 uppercase" disabled>
                View All Uploads
              </Button>
            )}
          </div>
        </Card>

        {/* Total Points / XP */}
        <Card className="col-span-1 md:col-span-8 border-2 shadow-none hover:bg-muted/10 transition-colors flex flex-col justify-center min-h-[240px]">
          <CardContent className="p-8 flex flex-row justify-between items-center h-full">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 border-2 border-foreground rounded-full">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <span className="font-mono text-5xl md:text-6xl font-bold tracking-tighter">
                    {profileUser?.points?.toLocaleString() || 0}
                  </span>
                  <div className="font-mono text-xs uppercase text-muted-foreground tracking-widest">
                    Total System XP
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-1/3">
              <div className="flex justify-between text-[10px] font-mono uppercase mb-2">
                <span>Progress to {getNextLevelThreshold(profileUser?.level || 'beginner')} XP</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-4 w-full border-2 border-foreground p-0.5">
                <div className="h-full bg-accent" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
