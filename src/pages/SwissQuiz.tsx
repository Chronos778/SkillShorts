import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SwissQuiz = () => {
    return (
        <div className="min-h-screen w-full bg-background text-foreground font-sans flex flex-col">
            {/* Header */}
            <header className="h-20 border-b-2 border-border flex items-center justify-between px-8 bg-background">
                <div className="flex flex-col">
                    <span className="font-black uppercase tracking-tighter text-xl">SkillUp / Quiz</span>
                    <span className="font-mono text-xs text-muted-foreground">01 / 05 QUESTIONS</span>
                </div>
                <Button variant="ghost" className="h-12 px-6 font-mono text-xs uppercase hover:bg-destructive hover:text-white border-2 border-transparent hover:border-destructive transition-colors">
                    Exit Quiz <X className="ml-2 h-4 w-4" />
                </Button>
            </header>

            {/* Main Content - Centered */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">

                <div className="w-full mb-12">
                    <h1 className="text-4xl md:text-5xl font-black uppercase leading-tight mb-8">
                        Which technique is most effective for maintaining deep work sessions?
                    </h1>

                    <div className="space-y-4">
                        {[
                            { id: 'a', text: "The Pomodoro Technique", active: true },
                            { id: 'b', text: "Multitasking with music", active: false },
                            { id: 'c', text: "Checking email every 10 minutes", active: false }
                        ].map((option) => (
                            <div
                                key={option.id}
                                className={cn(
                                    "p-6 border-2 cursor-pointer transition-all flex items-center gap-6 group",
                                    option.active
                                        ? "border-black bg-black text-white"
                                        : "border-border hover:border-accent hover:text-accent"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 flex items-center justify-center font-mono text-sm font-bold border-2",
                                    option.active ? "border-white bg-white text-black" : "border-muted-foreground bg-muted/20 text-muted-foreground group-hover:border-accent group-hover:text-accent"
                                )}>
                                    {option.id}
                                </div>
                                <span className="font-bold text-lg">{option.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Button size="lg" className="w-full h-16 text-lg font-black uppercase border-2 tracking-widest bg-black text-white hover:bg-accent hover:border-accent">
                    Submit Answer <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

            </main>
        </div>
    );
};

export default SwissQuiz;
