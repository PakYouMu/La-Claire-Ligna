"use client";

import { useMotion } from "@/components/context/motion-context"; 
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AuthErrorContentProps {
  error?: string;
  errorDescription?: string;
}

export default function AuthErrorContent({ error, errorDescription }: AuthErrorContentProps) {
  const { reduceMotion } = useMotion();

  return (
    <div className="h-screen w-full flex items-center justify-center p-responsive">
      <div className="w-full max-w-[90rem] mx-auto">
        <MagicBento 
          disableAnimations={reduceMotion}
          enableSpotlight={true}
          spotlightRadius={300}
          enableStars={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          glowColor="239, 68, 68"
          className="grid grid-cols-4 grid-rows-4 gap-responsive"
        >
          {/* Empty cells for positioning */}
          <div className="col-span-1 row-span-1" />
          <div className="col-span-1 row-span-1" />
          <div className="col-span-1 row-span-1" />
          <div className="col-span-1 row-span-1" />

          <div className="col-span-1 row-span-1" />
          
          {/* Center 2x2 Card */}
          <BentoCard 
            className="col-span-2 row-span-2 col-start-2 row-start-2"
            title="Authentication Error" 
            icon={<AlertTriangle className="h-4 w-4"/>}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-responsive-2xl font-bold text-destructive font-serif">
                  Sorry, something went wrong.
                </h2>
                <p className="text-responsive-sm text-muted-foreground leading-relaxed">
                  {errorDescription || error || "An unspecified error occurred during authentication."}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-responsive-sm text-muted-foreground">
                  <span className="text-red-500 font-bold flex-shrink-0">•</span>
                  <span>The link may have expired or already been used</span>
                </div>
                <div className="flex items-start gap-3 text-responsive-sm text-muted-foreground">
                  <span className="text-red-500 font-bold flex-shrink-0">•</span>
                  <span>Try requesting a new confirmation or reset link</span>
                </div>
                <div className="flex items-start gap-3 text-responsive-sm text-muted-foreground">
                  <span className="text-red-500 font-bold flex-shrink-0">•</span>
                  <span>If the problem persists, contact support</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button asChild variant="default" className="flex-1">
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/auth/sign-up">Sign Up</Link>
                </Button>
              </div>
            </div>
          </BentoCard>
        </MagicBento>
      </div>
    </div>
  );
}