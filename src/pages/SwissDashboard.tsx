import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, BookOpen, Grid3X3, List, Play, Search, Settings, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApprovedVideos } from "@/services/videos";

const SwissDashboard = () => {
    const navigate = useNavigate();
    const { data: videos = [], isLoading } = useQuery({
        queryKey: ['dashboard-videos'],
        queryFn: getApprovedVideos
    });

    const heroVideo = videos[0];
    const upNextVideos = videos.slice(1, 3);

    return (
        <div className="flex h-screen w-full bg-background text-foreground font-sans selection:bg-accent selection:text-white">
            {/* Sidebar - Fixed, Boxy, High Contrast */}
            <aside className="w-72 border-r-2 border-border flex flex-col justify-between p-6 bg-sidebar">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-8 h-8 bg-primary rounded-none" />
                        <h1 className="text-2xl font-black tracking-tighter uppercase">SkillUp</h1>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { icon: Grid3X3, label: "Dashboard", active: true },
                            { icon: Play, label: "Learning", active: false },
                            { icon: Trophy, label: "Quizzes", active: false },
                            { icon: Star, label: "Achievements", active: false },
                        ].map((item) => (
                            <Button
                                key={item.label}
                                variant={item.active ? "default" : "ghost"}
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
                    <div className="border-2 border-border p-4 bg-muted/20">
                        <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Daily Goal</p>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-black">85%</span>
                            <span className="font-mono text-xs mb-1">COMPLETED</span>
                        </div>
                        {/* Custom Progress Bar */}
                        <div className="h-2 w-full bg-border mt-2">
                            <div className="h-full bg-accent w-[85%]" />
                        </div>
                    </div>

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
                        <p className="font-mono text-muted-foreground">WELCOME BACK, MAITHIL</p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="SEARCH COURSES..." className="pl-10 h-12 border-2 text-sm uppercase placeholder:uppercase" />
                        </div>
                        <Button size="lg" className="h-12 border-2">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Resume Learning
                        </Button>
                    </div>
                </header>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-12 gap-6 grid-rows-[240px_240px]">
                    {/* Main Hero Card - Spans 8 cols */}
                    <Card
                        className="col-span-8 border-2 shadow-none p-0 overflow-hidden relative group cursor-pointer"
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
                                        <span className="inline-block px-3 py-1 bg-accent text-white text-xs font-mono uppercase font-bold">In Progress</span>
                                        <ArrowRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                                    </div>

                                    <div>
                                        <h3 className="text-3xl font-black uppercase mb-4 max-w-lg line-clamp-2 leading-none">{heroVideo.title}</h3>
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

                    {/* Stats Card 1 - Spans 4 cols */}
                    <Card className="col-span-4 border-2 shadow-none bg-primary text-primary-foreground relative overflow-hidden">
                        {/* Decorative Grid Pattern */}
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                        />
                        <CardContent className="p-8 h-full flex flex-col justify-center relative z-10">
                            <div className="text-6xl font-black mb-2">{videos.length}</div>
                            <div className="font-mono text-sm uppercase tracking-widest opacity-80">Courses Completed</div>
                        </CardContent>
                    </Card>

                    {/* Continue Learning List - Spans 4 cols */}
                    <Card className="col-span-4 row-span-1 border-2 shadow-none flex flex-col justify-between">
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
                        <div className="p-4 border-t-2 border-border">
                            <Button variant="ghost" className="w-full text-xs font-mono h-8" onClick={() => navigate('/browse')}>VIEW ALL</Button>
                        </div>
                    </Card>

                    {/* Stats Card 2 - Spans 4 cols */}
                    <Card className="col-span-4 border-2 shadow-none">
                        <CardContent className="p-8 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <Trophy className="h-8 w-8 text-accent" />
                                <span className="font-mono text-3xl font-bold">2,450</span>
                            </div>
                            <div className="font-mono text-xs uppercase text-muted-foreground mt-4">Total XP Earned</div>
                        </CardContent>
                    </Card>

                    {/* Stats Card 3 - Spans 4 cols */}
                    <Card className="col-span-4 border-2 shadow-none flex flex-col justify-center items-center bg-muted/10">
                        <div className="text-center p-8">
                            <div className="w-16 h-16 border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-bold uppercase text-sm text-muted-foreground">Weekly Challenge</h3>
                            <p className="font-mono text-xs mt-2">COMING SOON</p>
                        </div>
                    </Card>

                </div>
            </main>
        </div>
    );
};

export default SwissDashboard;
