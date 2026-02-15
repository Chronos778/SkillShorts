import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Upload, LayoutDashboard, LogIn } from "lucide-react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getUserByClerkId, syncUserFromClerk } from "@/services/users";
import { Logo } from "@/components/Logo";
import type { User } from "@/types";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/browse", icon: Compass, label: "Browse" },
  { path: "/dashboard", icon: LayoutDashboard, label: "Progress" },
  { path: "/upload", icon: Upload, label: "Create" },
];

export function Navbar() {
  const location = useLocation();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);

  // Sync user with database when Clerk user loads
  useEffect(() => {
    async function syncUser() {
      if (clerkLoaded && clerkUser) {
        const user = await syncUserFromClerk(
          clerkUser.id,
          clerkUser.emailAddresses[0]?.emailAddress || '',
          clerkUser.fullName || clerkUser.firstName || 'User',
          clerkUser.imageUrl
        );
        setDbUser(user);
      }
    }
    syncUser();
  }, [clerkLoaded, clerkUser]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto">
      <div className="bg-card/95 backdrop-blur-lg border-t md:border-b md:border-t-0 border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo - Hidden on mobile */}
            {/* Logo - Hidden on mobile */}
            <Link 
              to="/" 
              className="hidden md:flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
            >
              <Logo 
                showText={true} 
                className="gap-3" 
                iconClassName="w-11 h-11 rounded-xl shadow-md group-hover:shadow-glow transition-shadow duration-300 bg-card" 
              />
            </Link>

            {/* Nav Items */}
            <div className="flex items-center justify-around w-full md:w-auto md:gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 md:px-4 md:py-2.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive && "animate-pop")} />
                    <span className="text-xs md:text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth Section - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              <SignedIn>
                {/* User points */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-accent-foreground">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-bold">{dbUser?.points?.toLocaleString() || 0}</span>
                </div>
                {/* Clerk UserButton */}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 rounded-full shadow-md hover:shadow-glow transition-shadow",
                    }
                  }}
                />
              </SignedIn>
              <SignedOut>
                <Link 
                  to="/sign-in"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign In</span>
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
