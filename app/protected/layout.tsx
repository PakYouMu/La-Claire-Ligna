import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import InteractiveWaveBackground from "@/components/interactive-wave-bg";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="h-screen grid grid-rows-[auto_1fr] relative">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Next.js Supabase Starter</Link>
            </div>
            <AuthButton />
          </div>
        </nav>

      <div className="relative min-h-0">
        <InteractiveWaveBackground>
          {children}
        </InteractiveWaveBackground>
      </div>
      {/* 
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs py-1">
          <p>
            Don't like the dark? Change the theme!
          </p>
          <ThemeSwitcher />
        </footer> */}
      </div>
  );
}