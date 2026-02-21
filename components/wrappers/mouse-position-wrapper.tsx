'use client';

import { useRef, useCallback, useEffect } from 'react';
import { MousePositionContext } from '../context/mouse-position-context';

export default function MousePositionProvider({ children }: { children: React.ReactNode }) {
  const positionRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const listenersRef = useRef<Set<() => void>>(new Set());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => { listenersRef.current.delete(listener); };
  }, []);

  const getSnapshot = useCallback(() => positionRef.current, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Mutate the existing object instead of creating a new one
      positionRef.current = { x: event.clientX, y: event.clientY };
      // Notify subscribers (the 3D wave component)
      listenersRef.current.forEach(listener => listener());
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => { window.removeEventListener('mousemove', handleMouseMove); };
  }, []);

  return (
    <MousePositionContext.Provider value={{ subscribe, getSnapshot }}>
      {children}
    </MousePositionContext.Provider>
  );
}