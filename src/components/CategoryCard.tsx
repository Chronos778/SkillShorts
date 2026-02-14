import { Link } from "react-router-dom";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
  index?: number;
  onSelect?: (categoryId: string) => void;
  href?: string;
}

export function CategoryCard({ category, index = 0, onSelect, href }: CategoryCardProps) {
  const videoCount = category.video_count ?? (category as any).videoCount ?? 0;
  const gradient = cn("bg-gradient-to-br", category.color || "from-emerald-400 to-teal-500");

  const cardContent = (
    <div className="relative overflow-hidden rounded-2xl p-6 h-40 bg-card border border-border/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2">
      <div className={cn("absolute inset-0 opacity-20 group-hover:opacity-30", gradient)} />

      <div className="absolute -right-4 -bottom-4 text-8xl opacity-25 group-hover:opacity-35 group-hover:scale-110 transition-all duration-500">
        {category.emoji}
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="text-4xl mb-2 group-hover:animate-wiggle">{category.emoji}</div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-foreground border border-border/60">
            {videoCount} videos
          </span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">{category.name}</h3>
          {category.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(category.id)}
        className="group block w-full text-left animate-slide-up opacity-0 focus-visible:outline-none"
        style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <Link
      to={href || `/browse?category=${category.id}`}
      className="group block animate-slide-up opacity-0 focus-visible:outline-none"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
    >
      {cardContent}
    </Link>
  );
}
