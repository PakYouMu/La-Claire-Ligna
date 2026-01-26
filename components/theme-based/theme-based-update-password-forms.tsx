"use client";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeBasedUpdatePasswordForms() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <>
      {/* Left side (clipped to left 38%) */}
      <div 
        className="absolute inset-0 flex items-center justify-center md:justify-start px-6 md:px-0 md:pl-[8%] z-10 pointer-events-none"
        style={{
          clipPath: 'polygon(0 0, 38% 0, 38% 100%, 0 100%)',
        }}
      >
        <div className="w-full max-w-sm pointer-events-auto">
          <UpdatePasswordForm 
            className="bg-transparent border-none shadow-none" 
            textColor={isDark ? "black" : "white"} 
          />
        </div>
      </div>

      {/* Right side (clipped to right 62%) */}
      <div 
        className="absolute inset-0 flex items-center justify-center md:justify-start px-6 md:px-0 md:pl-[8%] z-10 pointer-events-none"
        style={{
          clipPath: 'polygon(38% 0, 100% 0, 100% 100%, 38% 100%)',
        }}
      >
        <div className="w-full max-w-sm pointer-events-auto">
          <UpdatePasswordForm 
            className="bg-transparent border-none shadow-none" 
            textColor={isDark ? "white" : "black"} 
          />
        </div>
      </div>
    </>
  );
}