import { Badge } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface BadgeCardProps {
  badge: Badge;
  size?: "sm" | "md" | "lg";
}

export function BadgeCard({ badge, size = "md" }: BadgeCardProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  };

  const emojiSizes = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div
        className={cn(
          "relative rounded-2xl flex items-center justify-center transition-all duration-300",
          sizeClasses[size],
          badge.earned
            ? "bg-gradient-to-br from-primary to-primary-glow shadow-glow"
            : "bg-muted"
        )}
      >
        {badge.earned ? (
          <span className={cn(emojiSizes[size], "group-hover:animate-bounce-gentle")}>
            {badge.emoji}
          </span>
        ) : (
          <Lock className="w-6 h-6 text-muted-foreground" />
        )}

        {/* Earned glow effect */}
        {badge.earned && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent animate-pulse-soft" />
        )}
      </div>

      <div className="text-center">
        <p className={cn(
          "font-semibold text-sm",
          badge.earned ? "text-foreground" : "text-muted-foreground"
        )}>
          {badge.name}
        </p>
        {size !== "sm" && (
          <p className="text-xs text-muted-foreground mt-0.5 max-w-[100px]">
            {badge.description}
          </p>
        )}
      </div>
    </div>
  );
}
