"use client";

import { Zap, ZapOff } from "lucide-react";
import { useMotion } from "@/components/context/motion-context";

export function MotionToggleButton({ className }: { className?: string }) {
  const { reduceMotion, toggleMotion } = useMotion();

  return (
    <button
      onClick={toggleMotion}
      className={`nav-action-btn ${className || ''}`}
      title={reduceMotion ? "Enable Animations" : "Reduce Motion"}
    >
      {reduceMotion ? (
        <ZapOff className="nav-action-icon" />
      ) : (
        <Zap className="nav-action-icon" />
      )}
    </button>
  );
}