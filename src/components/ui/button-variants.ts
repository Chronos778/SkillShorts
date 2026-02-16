import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-0.5 border-2 border-transparent",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-none",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-none",
                outline: "border-primary bg-background hover:bg-accent hover:text-accent-foreground text-primary rounded-none",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-none",
                ghost: "hover:bg-accent hover:text-accent-foreground rounded-none",
                link: "text-primary underline-offset-4 hover:underline rounded-none",
                // Keeping existing variants for backward compatibility but neutralizing them
                hero: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-none",
                accent: "bg-accent text-accent-foreground hover:bg-accent/90 rounded-none",
                success: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-none",
                glass: "border-primary bg-background text-primary rounded-none",
            },
            size: {
                default: "h-11 px-6 py-2 uppercase tracking-wider",
                sm: "h-9 px-4 text-xs uppercase tracking-wider",
                lg: "h-12 px-8 text-base uppercase tracking-wider",
                xl: "h-14 px-10 text-lg uppercase tracking-wider",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);
