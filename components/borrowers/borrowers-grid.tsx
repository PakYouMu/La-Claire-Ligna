"use client";

import { useMotion } from "@/components/context/motion-context";
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";

export function BorrowersBentoWrapper({ children }: { children: React.ReactNode }) {
  const { reduceMotion } = useMotion();

  return (
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
            col-span-full: Spans full width 
            min-h-[600px]: Sets the height of the card
            noPadding: We handle padding inside the child component so headers/footers touch edges
        */}
        <BentoCard 
          className="col-span-full min-h-[780px] h-full" 
          noPadding={true}
        >
          {children}
        </BentoCard>
      </MagicBento>

    </div>
  );
}