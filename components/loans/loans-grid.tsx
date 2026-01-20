"use client";

import { useMotion } from "@/components/context/motion-context";
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";

export function LoansBentoWrapper({ children }: { children: React.ReactNode }) {
  const { reduceMotion } = useMotion();

  return (
    // This container matches DashboardGrid exactly:
    // It has p-responsive (padding) AND gap-responsive
    <div className="h-full w-full max-w-[90rem] mx-auto p-responsive relative flex flex-col gap-responsive pb-20">
      
      <MagicBento
        disableAnimations={reduceMotion}
        enableSpotlight={true}
        enableStars={true}
        spotlightRadius={300}
        tiltIntensity={0.5}
        magnetStrength={0.02}
        className="gap-responsive"
      >
        {/* 
            col-span-full: Spans entire width (requires the CSS update above)
            min-h-[600px]: Ensures height even if table is empty
            noPadding: Lets the table headers touch the edges
        */}
        <BentoCard 
          className="col-span-full min-h-[600px]" 
          noPadding={true}
        >
          {children}
        </BentoCard>
      </MagicBento>

    </div>
  );
}