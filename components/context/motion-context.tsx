"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface MotionContextType {
  reduceMotion: boolean;
  toggleMotion: () => void;
}

const MotionContext = createContext<MotionContextType | undefined>(undefined);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  // We don't need 'mounted' state to block rendering anymore
  // because the default state (false) is safe for both Server and Client.

  useEffect(() => {
    // 1. Check Local Storage
    const saved = localStorage.getItem("reduce-motion");
    if (saved) {
      setReduceMotion(JSON.parse(saved));
    } else {
      // 2. Check System Preference
      const systemPrefers = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setReduceMotion(systemPrefers);
    }
  }, []);

  const toggleMotion = () => {
    const newValue = !reduceMotion;
    setReduceMotion(newValue);
    localStorage.setItem("reduce-motion", JSON.stringify(newValue));
  };

  // ALWAYS render the Provider. Do not return just <>{children}</>
  return (
    <MotionContext.Provider value={{ reduceMotion, toggleMotion }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (!context) throw new Error("useMotion must be used within MotionProvider");
  return context;
}