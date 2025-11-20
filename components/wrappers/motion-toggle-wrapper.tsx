'use client';

import { Zap, ZapOff } from "lucide-react";
import { useState, useEffect, useRef, useContext } from "react";
import { MousePositionContext } from '../context/mouse-position-context';
// import InteractiveWaveBackground from "@/components/interactive-wave-bg";
import InteractiveWaveBackground from "../3d/interactive-wave-3d";

export default function MotionToggleWrapper({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { x, y } = useContext(MousePositionContext);

  useEffect(() => {
    if (containerRef.current && x !== null && y !== null) {
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate mouse position relative to the container div
      const relativeX = x - rect.left;
      const relativeY = y - rect.top;
      containerRef.current.style.setProperty("--mouse-x", `${relativeX}px`);
      containerRef.current.style.setProperty("--mouse-y", `${relativeY}px`);
    }
  }, [x, y]);

  const forwardMouseEvent = (e: React.MouseEvent) => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const newEvent = new MouseEvent(e.type, {
        bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY,
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
        {/* We no longer need onMouseMove here for the sheen effect */}
        <div 
          ref={containerRef}
          className="relative z-10 pointer-events-auto sheen-container"
          onMouseEnter={forwardMouseEvent}
          onMouseLeave={forwardMouseEvent}
          onMouseMove={forwardMouseEvent} // Keep forwarding mouse move for the wave background
        >
          {children}
        </div>
      </InteractiveWaveBackground>
    </>
  );
}