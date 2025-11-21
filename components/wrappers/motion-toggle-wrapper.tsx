'use client';

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import HelixCanvas from "../landing-page/interactive-wave-bg";
import { useMotion } from "@/components/context/motion-context"; // Import Context
import { MotionToggleButton } from "@/components/ui/motion-toggle-button"; // Import Button

export default function MotionToggleWrapper({ children }: { children: React.ReactNode }) {
  const { reduceMotion } = useMotion(); // Use Global State
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // ... Keep your forwardPointerEvent logic exactly as is ...
  const forwardPointerEvent = (e: React.PointerEvent) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const event = new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, view: window,
      clientX: e.clientX, clientY: e.clientY,
      pointerId: e.pointerId, isPrimary: e.isPrimary,
    });
    canvas.dispatchEvent(event);
  };

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div className="relative w-full h-screen bg-background transition-colors duration-500 overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <HelixCanvas 
          speed={reduceMotion ? 0.0 : 1.0} // Use global state
          mouseDamping={0.5}
          darkMode={isDark}
          heroColor={isDark ? "#ffffff" : "#000000"} 
          backgroundColor={isDark ? "#cccccc" : "#444444"} 
        />
      </div>

      {/* USE REUSABLE BUTTON (Positioned Bottom Left for Landing Page) */}
      <MotionToggleButton className="absolute bottom-8 left-8" />

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
        <div 
          className="pointer-events-auto"
          onPointerMove={forwardPointerEvent}
          onPointerEnter={forwardPointerEvent}
          onPointerLeave={forwardPointerEvent}
        >
          {children}
        </div>
      </div>
    </div>
  );
}