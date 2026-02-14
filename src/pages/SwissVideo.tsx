import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, ChevronRight, MessageSquare, Play, Settings, Share2, Volume2 } from "lucide-react";

const SwissVideo = () => {
    return (
        <div className="flex h-screen w-full bg-black text-white font-sans selection:bg-accent selection:text-white">
            {/* Top Navigation - Minimal */}
            <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/20 bg-black z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white hover:text-black rounded-none">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Module 01 / Lesson 03</h1>
                        <h2 className="text-lg font-black uppercase tracking-tight">The Grid System layout</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black h-9 text-xs font-mono uppercase">
                        <Share2 className="mr-2 h-3 w-3" /> Share
                    </Button>
                    <Button className="bg-accent text-white hover:bg-accent/90 border-none h-9 text-xs font-mono uppercase">
                        Mark Complete
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex mt-16 h-[calc(100vh-64px)]">
                {/* Video Player Section - Dominant */}
                <div className="flex-1 bg-black relative flex items-center justify-center p-8">
                    {/* Video Placeholder */}
                    <div className="w-full h-full max-h-[80vh] border-2 border-white/20 relative group bg-neutral-900 flex items-center justify-center">
                        <div className="text-center">
                            <Play className="h-16 w-16 text-white/50 mb-4 mx-auto group-hover:text-accent transition-colors cursor-pointer" />
                            <p className="font-mono text-xs uppercase text-white/50">Click to Play</p>
                        </div>

                        {/* Custom Controls Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 border-t border-white/20 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="icon" className="text-white hover:text-accent rounded-none"><Play className="h-5 w-5 fill-current" /></Button>
                                    <span className="font-mono text-xs">02:14 / 15:00</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Volume2 className="h-5 w-5" />
                                    <Settings className="h-5 w-5" />
                                    <div className="w-24 h-1 bg-white/20"><div className="w-1/2 h-full bg-accent"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Lesson List */}
                <aside className="w-80 border-l border-white/20 bg-neutral-950 overflow-y-auto">
                    <div className="p-6 border-b border-white/20">
                        <h3 className="font-black uppercase text-lg">Course Content</h3>
                        <div className="h-1 w-12 bg-accent mt-2" />
                    </div>

                    <div className="divide-y divide-white/10">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={`p-4 hover:bg-white/5 cursor-pointer group ${i === 3 ? 'bg-white/5' : ''}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 h-4 w-4 border border-white/40 flex items-center justify-center ${i < 3 ? 'bg-accent border-accent' : ''}`}>
                                        {i < 3 && <CheckCircle className="h-3 w-3 text-white" />}
                                        {i === 3 && <div className="h-1.5 w-1.5 bg-white" />}
                                    </div>
                                    <div>
                                        <p className="font-mono text-[10px] text-white/50 mb-1">LESSON 0{i}</p>
                                        <h4 className={`font-bold text-sm uppercase leading-snug ${i === 3 ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                                            {i === 1 ? 'Introduction' : i === 2 ? 'Typography Basics' : 'The Grid System Layout'}
                                        </h4>
                                        <span className="font-mono text-[10px] text-white/30 mt-2 block">12 MIN</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default SwissVideo;
