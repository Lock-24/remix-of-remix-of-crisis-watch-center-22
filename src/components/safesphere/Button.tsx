import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "icon";
  children: ReactNode;
};

export function Button({ variant = "secondary", size = "md", className, children, ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45",
        variant === "primary" && "bg-primary text-primary-foreground shadow-signal hover:bg-primary/90",
        variant === "secondary" && "border border-border bg-card text-foreground hover:bg-accent",
        variant === "danger" && "bg-emergency text-emergency-foreground shadow-emergency hover:bg-emergency/90",
        variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-foreground",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "size-10 p-0",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}