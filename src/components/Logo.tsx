import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string; // For the container
  iconClassName?: string; // For the SVG specifically
  showText?: boolean;
}

export function Logo({ className, iconClassName, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn( 
          "relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden bg-foreground text-background shadow-md", 
          iconClassName 
        )} 
      > 
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full p-1.5" 
        > 
          {/* Dynamic S shape formed by two arrows */}
          <path 
            d="M 20 30 L 50 30 L 40 50 L 10 50 Z" 
            fill="currentColor" 
          />
          <path 
            d="M 60 50 L 90 50 L 80 70 L 50 70 Z" 
            fill="currentColor" 
          />
          {/* Connector / Lightning bolt feel */}
          <path 
            d="M 40 50 L 60 50 L 50 70 L 30 70 Z" 
            fill="currentColor" 
            opacity="0.5"
          />
          {/* Accent Play Button Triangle */}
          <path 
            d="M 65 25 L 90 37.5 L 65 50 Z" 
            className="text-primary fill-primary" 
            stroke="none" 
          />
        </svg> 
      </div> 
 
      {/* Text Part */}
      {showText && ( 
        <span className={cn("font-black tracking-tighter text-xl uppercase", showText === true ? "" : "hidden md:inline")}> 
          <span className="text-primary">Skill</span>Shorts
        </span> 
      )}
    </div>
  );
}
