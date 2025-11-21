"use client";

import { Zap, ZapOff } from "lucide-react";
import { useMotion } from "@/components/context/motion-context";
import { cn } from "@/lib/utils"; // Assuming you have the standard shadcn utils

export function MotionToggleButton({ className }: { className?: string }) {
  const { reduceMotion, toggleMotion } = useMotion();

  return (
    <button
      onClick={toggleMotion}
      className={cn(
        "z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group",
        "bg-background/10 hover:bg-foreground/5 backdrop-blur-sm border border-foreground/20",
        "shadow-lg hover:scale-105", // Added shadow for dashboard visibility
        className
      )}
      title={reduceMotion ? "Enable Animations" : "Reduce Motion"}
    >
      {reduceMotion ? (
        <ZapOff className="w-6 h-6 text-foreground/70 group-hover:text-foreground transition-colors" />
      ) : (
        <Zap className="w-6 h-6 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
      )}
    </button>
  );
}