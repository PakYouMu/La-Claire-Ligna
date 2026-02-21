"use client";

import { LoginForm } from "@/components/auth/login-form";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeBasedLoginForms() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <>
      <style>{`
        .auth-clip-1 { clip-path: polygon(0 0, 100% 0, 100% 75%, 0 75%); }
        .auth-clip-2 { clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%); }
        @media (min-width: 768px) {
          .auth-clip-1 { clip-path: polygon(0 0, 55% 0, 55% 100%, 0 100%); }
          .auth-clip-2 { clip-path: polygon(55% 0, 100% 0, 100% 100%, 55% 100%); }
        }
      `}</style>

      {/* Primary side (Left on desktop, Top on mobile) */}
      <div
        className="auth-clip-1 absolute inset-0 flex items-center justify-center md:justify-start px-6 md:px-0 md:pl-[8%] z-10 pointer-events-none"
      >
        <div className="w-full max-w-sm pointer-events-auto">
          <LoginForm
            className="bg-transparent border-none shadow-none"
            textColor={isDark ? "black" : "white"}
          />
        </div>
      </div>

      {/* Secondary side (Right on desktop, Bottom on mobile) */}
      <div
        className="auth-clip-2 absolute inset-0 flex items-center justify-center md:justify-start px-6 md:px-0 md:pl-[8%] z-10 pointer-events-none"
      >
        <div className="w-full max-w-sm pointer-events-auto">
          <LoginForm
            className="bg-transparent border-none shadow-none"
            textColor={isDark ? "white" : "black"}
          />
        </div>
      </div>
    </>
  );
}