"use client";

import { useMotion } from "@/components/context/motion-context"; 
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";
import { Mail } from "lucide-react";

export default function SignUpSuccessContent() {
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
          glowColor="16, 185, 129"
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
            title="Registration" 
            icon={<Mail className="h-4 w-4"/>}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-responsive-2xl font-bold text-foreground font-serif">
                  Thank you for signing up!
                </h2>
                <p className="text-responsive-sm text-muted-foreground leading-relaxed">
                  You&apos;ve successfully signed up. Please check your email to
                  confirm your account before signing in.
                  <br />
                  You can close this page now!
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-responsive-sm text-muted-foreground">
                  <span className="text-emerald-500 font-bold flex-shrink-0">1.</span>
                  <span>Check your email inbox (and spam folder)</span>
                </div>
                <div className="flex items-start gap-3 text-responsive-sm text-muted-foreground">
                  <span className="text-emerald-500 font-bold flex-shrink-0">2.</span>
                  <span>Click the confirmation link in the email</span>
                </div>
                <div className="flex items-start gap-3 text-responsive-sm text-muted-foreground">
                  <span className="text-emerald-500 font-bold flex-shrink-0">3.</span>
                  <span>You&apos;ll be redirected to the login page</span>
                </div>
              </div>
            </div>
          </BentoCard>
        </MagicBento>
      </div>
    </div>
  );
}