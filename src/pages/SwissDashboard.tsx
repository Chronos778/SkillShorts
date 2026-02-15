import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, BookOpen, Grid3X3, List, Play, Search, Settings, Star, Trophy, Zap, Target, Award, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { getApprovedVideos } from "@/services/videos";
import { syncUserFromClerk } from "@/services/users";
import { getCompletedVideosCount, getAverageQuizAccuracy, getSkillProgress } from "@/services/progress";
import { getUserBadges } from "@/services/badges";
import { LEVEL_THRESHOLDS, BADGE_INFO, UserLevel } from "@/types";

const SwissDashboard = () => {
    const navigate = useNavigate();
    const { user: clerkUser, isLoaded } = useUser();
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch Videos
    const { data: videos = [], isLoading: videosLoading } = useQuery({
        queryKey: ['dashboard-videos'],
        queryFn: getApprovedVideos
    });

    // Fetch User Data
    const { data: appUser } = useQuery({
        queryKey: ['app-user', clerkUser?.id],
        queryFn: async () => {
            if (!clerkUser) return null;
            return syncUserFromClerk(
                clerkUser.id,
                clerkUser.primaryEmailAddress?.emailAddress!,
                clerkUser.fullName!,
                clerkUser.imageUrl
            );
        },
        enabled: !!clerkUser
    });

    // Fetch User Stats
    const { data: stats } = useQuery({
        queryKey: ['user-stats', appUser?.id],
        queryFn: async () => {
            if (!appUser) return null;
            const [completedCount, accuracy, badges, skills] = await Promise.all([
                getCompletedVideosCount(appUser.id),
                getAverageQuizAccuracy(appUser.id),
                getUserBadges(appUser.id),
                getSkillProgress(appUser.id)
            ]);
            return { completedCount, accuracy, badges, skills };
        },
        enabled: !!appUser
    });

    const heroVideo = videos[0];
    const upNextVideos = videos.slice(1, 4);

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    // Calculate Level Progress
    const getNextLevelThreshold = (level: UserLevel) => {
        if (level === 'beginner') return LEVEL_THRESHOLDS.intermediate;
        if (level === 'intermediate') return LEVEL_THRESHOLDS.advanced;
        if (level === 'advanced') return LEVEL_THRESHOLDS.expert;
        return LEVEL_THRESHOLDS.expert * 2; // Cap for expert
    };

    const currentPoints = appUser?.points || 0;
    const nextThreshold = getNextLevelThreshold(appUser?.level || 'beginner');
    const progressPercent = Math.min(100, Math.round((currentPoints / nextThreshold) * 100));

    // Stats Display Helper
    const StatCard = ({ icon: Icon, value, label, loading }: any) => (
        <Card className="border-2 shadow-none flex flex-col justify-center items-center p-4 bg-background">
            <Icon className="h-6 w-6 mb-2 text-primary" />
            <div className="text-2xl font-black">{loading ? "-" : value}</div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider text-center">{label}</div>
        </Card>
    );

    return (
        <div className="flex h-screen w-full bg-background text-foreground font-sans selection:bg-accent selection:text-white">
            {/* Sidebar - Fixed, Boxy, High Contrast */}
            <aside className="w-72 border-r-2 border-border flex flex-col justify-between p-6 bg-sidebar">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-8 h-8 bg-primary rounded-none" />
                        <h1 className="text-2xl font-black tracking-tighter uppercase">SkillShorts</h1>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { icon: Grid3X3, label: "Dashboard", active: true, path: "/" },
                            { icon: Play, label: "Browse", active: false, path: "/browse" },
                            { icon: Trophy, label: "Upload", active: false, path: "/upload" },
                        ].map((item) => (
                            <Button
                                key={item.label}
                                variant={item.active ? "default" : "ghost"}
                                onClick={() => item.path && navigate(item.path)}
                                className={cn(
                                    "w-full justify-start text-base font-bold uppercase tracking-wider h-14",
                                    item.active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                </div>

                <div className="space-y-4">
                    {/* User Mini Profile */}
                    {appUser && (
                        <div className="border-2 border-border p-4 bg-muted/20">
                            <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Level: {appUser.level}</p>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black">{appUser.points}</span>
                                <span className="font-mono text-xs mb-1">XP POINTS</span>
                            </div>
                            <div className="h-2 w-full bg-border mt-2">
                                <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>
                    )}

                    <Button variant="outline" className="w-full justify-start border-2">
                        <Settings className="mr-3 h-4 w-4" />
                        SETTINGS
                    </Button>
                </div>
            </aside>

            {/* Main Content - Grid System */}
            <main className="flex-1 overflow-auto p-8">
                {/* Header Section */}
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Dashboard</h2>
                        <p className="font-mono text-muted-foreground">WELCOME BACK, {clerkUser?.firstName?.toUpperCase() || 'LEARNER'}</p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="SEARCH COURSES..."
                                className="pl-10 h-12 border-2 text-sm uppercase placeholder:uppercase"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                        <Button
                            size="lg"
                            className="h-12 border-2"
                            onClick={() => heroVideo && navigate(`/video/${heroVideo.id}`)}
                        >
                            <BookOpen className="mr-2 h-4 w-4" />
                            Resume Learning
                        </Button>
                    </div>
                </header>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-12 gap-6 auto-rows-min">

                    {/* ROW 1: Hero & Quick Stats */}
                    {/* Main Hero Card - Spans 8 cols */}
                    <Card
                        className="col-span-8 border-2 shadow-none p-0 overflow-hidden relative group cursor-pointer min-h-[300px]"
                        onClick={() => heroVideo && navigate(`/video/${heroVideo.id}`)}
                    >
                        {heroVideo ? (
                            <>
                                <div className="absolute inset-0">
                                    {heroVideo.thumbnail_url && (
                                        <img src={heroVideo.thumbnail_url} className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    )}
                                    <div className="absolute inset-0 bg-accent/10 group-hover:bg-accent/5 transition-colors mix-blend-multiply" />
                                </div>
                                <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
                                    <div className="flex justify-between items-start">
                                        <span className="inline-block px-3 py-1 bg-accent text-white text-xs font-mono uppercase font-bold">Latest Release</span>
                                        <ArrowRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                                    </div>

                                    <div>
                                        <h3 className="text-4xl font-black uppercase mb-4 max-w-lg line-clamp-2 leading-none">{heroVideo.title}</h3>
                                        <div className="flex gap-8 font-mono text-sm text-muted-foreground">
                                            <span className="flex items-center gap-2"><Play className="h-3 w-3" /> VIDEO</span>
                                            <span className="flex items-center gap-2"><BookOpen className="h-3 w-3" /> {Math.ceil(heroVideo.duration_seconds / 60)} MIN</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </>
                        ) : (
                            <CardContent className="p-8 h-full flex items-center justify-center">
                                <p className="font-mono text-muted-foreground uppercase">No featured content available</p>
                            </CardContent>
                        )}
                    </Card>

                    {/* Stats Grid - Spans 4 cols, 2x2 */}
                    <div className="col-span-4 grid grid-cols-2 gap-4">
                        <StatCard icon={Zap} value={appUser?.streak_count || 0} label="Day Streak" loading={!appUser} />
                        <StatCard icon={Target} value={`${stats?.accuracy || 0}%`} label="Quiz Accuracy" loading={!stats} />
                        <StatCard icon={Play} value={stats?.completedCount || 0} label="Videos Done" loading={!stats} />
                        <StatCard icon={Award} value={stats?.badges?.length || 0} label="Badges Earned" loading={!stats} />
                    </div>

                    {/* ROW 2: Skill Progress & Up Next */}
                    {/* Skill Progress - Spans 8 cols */}
                    <Card className="col-span-8 border-2 shadow-none p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Crown className="h-5 w-5 text-accent" />
                            <h3 className="text-xl font-black uppercase tracking-tight">Skill Progress</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {stats?.skills?.length ? stats.skills.map((skill) => (
                                <div key={skill.category.id} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="font-bold uppercase text-sm">{skill.category.name}</span>
                                        <span className="font-mono text-xs text-muted-foreground">{skill.videosCompleted}/{skill.totalVideos} Videos</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${skill.totalVideos > 0 ? (skill.videosCompleted / skill.totalVideos) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <p className="col-span-2 text-center py-8 font-mono text-muted-foreground text-sm uppercase">No skill progress yet.</p>
                            )}
                        </div>
                    </Card>

                    {/* Up Next List - Spans 4 cols */}
                    <Card className="col-span-4 border-2 shadow-none flex flex-col">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <List className="h-4 w-4" />
                                <h4 className="uppercase text-lg font-black">Up Next</h4>
                            </div>

                            {upNextVideos.length > 0 ? upNextVideos.map((video, i) => (
                                <div
                                    key={video.id}
                                    className="py-3 border-b-2 border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group"
                                    onClick={() => navigate(`/video/${video.id}`)}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-mono text-xs text-accent">VIDEO 0{i + 1}</span>
                                        <Play className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h4 className="font-bold uppercase text-sm leading-tight truncate">{video.title}</h4>
                                </div>
                            )) : (
                                <p className="text-xs font-mono text-muted-foreground uppercase py-4">No more videos in queue.</p>
                            )}
                        </CardContent>
                        <div className="mt-auto p-4 border-t-2 border-border">
                            <Button variant="ghost" className="w-full text-xs font-mono h-8" onClick={() => navigate('/browse')}>VIEW ALL</Button>
                        </div>
                    </Card>

                    {/* ROW 3: Badges */}
                    <Card className="col-span-12 border-2 shadow-none p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Star className="h-5 w-5 text-accent" />
                            <h3 className="text-xl font-black uppercase tracking-tight">Recent Badges</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {stats?.badges && stats.badges.length > 0 ? stats.badges.slice(0, 6).map((badge) => {
                                const info = BADGE_INFO[badge.badge_type];
                                return (
                                    <div key={badge.id} className="border-2 border-border p-4 flex flex-col items-center justify-center text-center aspect-square hover:bg-accent/5 transition-colors">
                                        <div className="text-4xl mb-2">{info.emoji}</div>
                                        <div className="font-bold uppercase text-xs">{info.name}</div>
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full text-center py-8">
                                    <p className="font-mono text-muted-foreground uppercase text-sm">Start learning to earn badges!</p>
                                </div>
                            )}
                        </div>
                    </Card>

                </div>
            </main>
        </div>
    );
};

export default SwissDashboard;
