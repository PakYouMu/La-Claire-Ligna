'use client';

import { Zap, ZapOff } from "lucide-react";
import { useState, useEffect } from "react";
import InteractiveWaveBackground from "@/components/interactive-wave-bg";

export default function MotionToggleWrapper({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  // This function manually passes mouse data to the canvas
  // We ONLY need this when the mouse is blocked by UI elements (like text)
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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <>
      <button
        onClick={() => setReducedMotion(!reducedMotion)}
        className="absolute bottom-8 left-8 z-20 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full transition-all duration-300 pointer-events-auto flex items-center justify-center group"
        aria-label={reducedMotion ? 'Enable full animation' : 'Enable gentle mode'}
        title={reducedMotion ? 'Full Animation' : 'Gentle Mode'}
      >
        {reducedMotion ? (
          <ZapOff className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
      </button>

      <InteractiveWaveBackground reducedMotion={reducedMotion}>
        {/* 
           CHANGE 1: pointer-events-none
           The container now lets mouse events pass THROUGH to the canvas directly.
           This restores the high-performance native wave generation for the background.
        */}
        <div 
          className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none"
        >
          {/* 
             CHANGE 2: pointer-events-auto + Forwarding
             We create an 'island' for the text. 
             - pointer-events-auto: Makes text selectable.
             - onMouseMove: Manually tells the waves to move since the canvas is blocked here.
          */}
          <div 
            className="pointer-events-auto"
            onMouseMove={forwardMouseEvent}
            onMouseEnter={forwardMouseEvent}
            onMouseLeave={forwardMouseEvent}
          >
            {children}
          </div>
        </div>
      </InteractiveWaveBackground>
    </>
  );
}