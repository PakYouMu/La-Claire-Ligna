"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MetallicSheenProps {
  children: React.ReactNode;
  className?: string;
}

export default function MetallicSheen({ children, className }: MetallicSheenProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Direct DOM manipulation - No React State, No Re-renders
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      
      // Only calculate if the mouse is somewhat near or on the screen to save resources
      // (Optional optimization, but keeping it simple ensures smoothness)
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      containerRef.current.style.setProperty("--mouse-x", `${localX}px`);
      containerRef.current.style.setProperty("--mouse-y", `${localY}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={cn("metallic-text-effect w-fit relative inline-block py-2 px-4", className)}
    >
      {children}
    </div>
  );
}