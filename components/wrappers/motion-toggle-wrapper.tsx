'use client';

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import HelixCanvas from "../landing-page/interactive-wave-bg";
import { useMotion } from "@/components/context/motion-context"; // Import Context

export default function MotionToggleWrapper({ children }: { children: React.ReactNode }) {
  const { reduceMotion } = useMotion(); // Use Global State
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const forwardPointerEvent = (e: React.PointerEvent) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const event = new PointerEvent(e.type, {
      bubbles: true, cancelable: true, view: window,
      clientX: e.clientX, clientY: e.clientY,
      pointerId: e.pointerId, isPrimary: e.isPrimary,
    });
    canvas.dispatchEvent(event);
  };

  const forwardTouchEvent = (e: React.TouchEvent) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Default to the first touch point 
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;

    // Map TouchEvent to PointerEvent terminology for the canvas
    const eventType = e.type === 'touchstart' ? 'pointerdown' :
      e.type === 'touchmove' ? 'pointermove' : 'pointerup';

    const event = new PointerEvent(eventType, {
      bubbles: true, cancelable: true, view: window,
      clientX: touch.clientX, clientY: touch.clientY,
      pointerId: touch.identifier, isPrimary: true,
      pointerType: 'touch'
    });
    canvas.dispatchEvent(event);
  };

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div className="relative w-full h-screen bg-background transition-colors duration-500 overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <HelixCanvas
          speed={reduceMotion ? 0.02 : 1.0}
          mouseDamping={0.5}
          darkMode={isDark}
          heroColor={isDark ? "#ffffff" : "#000000"}
          backgroundColor={isDark ? "#cccccc" : "#444444"}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto"
          onPointerMove={forwardPointerEvent}
          onPointerEnter={forwardPointerEvent}
          onPointerLeave={forwardPointerEvent}
          onTouchStart={forwardTouchEvent}
          onTouchMove={forwardTouchEvent}
          onTouchEnd={forwardTouchEvent}
          onTouchCancel={forwardTouchEvent}
        >
          {children}
        </div>
      </div>
    </div>
  );
}