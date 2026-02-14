import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import {
    LayoutGrid,
    Search,
    Plus,
    Compass,
    Shield,
    LogOut,
    Menu,
    X,
    CreditCard,
    Zap
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { syncUserFromClerk } from "@/services/users";
import { type User as DbUser } from "@/types";

export function SwissShell() {
    const location = useLocation();
    const { user: clerkUser, isLoaded } = useUser();
    const [dbUser, setDbUser] = useState<DbUser | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Sync user effect
    useEffect(() => {
        if (isLoaded && clerkUser) {
            syncUserFromClerk(
                clerkUser.id,
                clerkUser.emailAddresses[0]?.emailAddress || '',
                clerkUser.fullName || clerkUser.firstName || 'User',
                clerkUser.imageUrl
            ).then(setDbUser);
        }
    }, [isLoaded, clerkUser]);

    const navItems = [
        { label: "Feed", icon: Zap, path: "/feed" },
        { label: "Archive", icon: Compass, path: "/browse" },
        { label: "Studio", icon: Plus, path: "/upload" },
        { label: "Cockpit", icon: LayoutGrid, path: "/dashboard" },
        { label: "Admin", icon: Shield, path: "/admin", adminOnly: true },
    ];

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-accent selection:text-accent-foreground">
            {/* -------------------------------------------------------------------------- */
      /*                                DESKTOP SIDEBAR                              */
      /* -------------------------------------------------------------------------- */}
            <aside className="hidden md:flex w-64 flex-col border-r-2 border-border bg-sidebar h-full flex-shrink-0 z-50">
                <div className="h-16 flex items-center px-6 border-b-2 border-border">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black tracking-tighter text-lg dark:bg-white dark:text-black transition-transform group-hover:scale-110">
                            SC
                        </div>
                        <span className="font-black tracking-tighter text-xl uppercase">SkillClip</span>
                    </Link>
                </div>

                <ScrollArea className="flex-1 px-4 py-6">
                    <nav className="flex flex-col gap-2">
                        <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2 px-2 tracking-widest">
                            Platform
                        </div>
                        {navItems.map((item) => {
                            if (item.adminOnly && dbUser?.role !== 'admin') return null;

                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-200 border border-transparent hover:border-border",
                                        isActive
                                            ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-x-1 active-shine"
                                            : "text-muted-foreground hover:bg-sidebar-accent"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                <div className="p-4 border-t-2 border-border bg-sidebar-accent/50">
                    <SignedIn>
                        <div className="flex items-center gap-3 mb-4">
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-8 h-8 rounded-none border border-border"
                                    }
                                }}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold truncate max-w-[120px]">
                                    {dbUser?.name || 'User'}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {dbUser?.points || 0} PTS
                                </span>
                            </div>
                        </div>
                    </SignedIn>
                    <SignedOut>
                        <Link to="/sign-in">
                            <Button className="w-full rounded-none font-bold uppercase tracking-wider border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] transition-transform">
                                Enter System
                            </Button>
                        </Link>
                    </SignedOut>
                </div>
            </aside>

            {/* -------------------------------------------------------------------------- */
      /*                                MOBILE HEADER                                */
      /* -------------------------------------------------------------------------- */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b-2 border-border z-50 flex items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-black text-xs">SC</div>
                    <span className="font-black tracking-tighter uppercase">SkillClip</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-background pt-20 px-6 pb-6 flex flex-col gap-4 animate-in slide-in-from-top-10">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                "text-2xl font-black uppercase tracking-tighter py-4 border-b-2 border-border/50",
                                location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <div className="mt-auto">
                        <SignedOut>
                            <Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                                <Button size="lg" className="w-full rounded-none uppercase font-black">Sign In</Button>
                            </Link>
                        </SignedOut>
                    </div>
                </div>
            )}

            {/* -------------------------------------------------------------------------- */
      /*                                MAIN CONTENT                                 */
      /* -------------------------------------------------------------------------- */}
            <main className="flex-1 flex flex-col relative overflow-hidden md:ml-0 mt-16 md:mt-0">

                <header className="hidden md:flex h-16 border-b-2 border-border items-center justify-between px-8 bg-background/80 backdrop-blur-sm z-40 sticky top-0">
                    <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                        <span className="text-foreground font-bold">SYSTEM</span>
                        <span>/</span>
                        <span className="uppercase">{location.pathname === '/' ? 'FEED' : location.pathname.substring(1)}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <input
                                ref={searchInputRef}
                                placeholder="SEARCH DATABASE..."
                                className="h-9 w-64 bg-muted/50 border border-transparent focus:border-foreground pl-9 pr-12 text-xs font-mono placeholder:text-muted-foreground outline-none transition-all uppercase"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono text-muted-foreground pointer-events-none group-focus-within:border-foreground group-focus-within:text-foreground">
                                <span className="text-[8px]">⌘</span>K
                            </div>
                        </div>

                    </div>
                </header>

                {/* Content Scroll Area with Snap Support */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/10 snap-y snap-mandatory scroll-smooth">
                    <Outlet />
                </div>

            </main>
        </div>
    );
}
