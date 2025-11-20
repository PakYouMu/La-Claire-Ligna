"use client";

import Link from "next/link";
import { ThemeSwitcher } from "@/components/wrappers/theme-switcher-wrapper";
import MetallicSheen from "@/components/wrappers/metallic-sheen";

export default function NavOverlay({ children }: { children: React.ReactNode }) {
  const forwardMouseEvent = (e: React.MouseEvent) => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const newEvent = new MouseEvent(e.type, {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
      });
      canvas.dispatchEvent(newEvent);
    }
  };

  return (
    <div 
      /* 
         UPDATES:
         1. z-50: Ensures nav sits WAY above the wave background (z-10/z-0).
         2. pointer-events-none: Allows clicks to pass through the empty space of the nav bar to the canvas.
      */
      className="absolute top-0 left-0 right-0 z-50 w-full flex justify-between items-center py-8 px-8 pointer-events-none"
      onMouseMove={forwardMouseEvent}
      onMouseEnter={forwardMouseEvent}
      onMouseLeave={forwardMouseEvent}
    >
      <Link 
        href={"/"} 
        /* pointer-events-auto: Re-enables clicking specifically for the logo */
        className="font-display text-6xl antialiased tracking-tight pointer-events-auto block"
        onMouseMove={forwardMouseEvent}
      >
        <MetallicSheen>
          La Clair Ligña
        </MetallicSheen>
      </Link>
      
      {/* pointer-events-auto: Re-enables clicking for the buttons/theme switcher */}
      <div 
        className="flex items-center gap-4 pointer-events-auto"
        onMouseMove={forwardMouseEvent}
        onMouseEnter={forwardMouseEvent}
        onMouseLeave={forwardMouseEvent}
      >
        <div>
          <ThemeSwitcher />
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}