"use client";

import { useMotion } from "@/components/context/motion-context"; 
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";
import { MotionToggleButton } from "@/components/ui/motion-toggle-button";
import { AddCapitalDialog } from "@/components/dashboard/add-capital-dialog";
import { Wallet, TrendingUp, Activity, Users } from "lucide-react";

interface DashboardGridProps {
  role: string | null;
  balance: number;
  stats: { activeCount: number; totalReceivables: number };
  loansTable: React.ReactNode;
}

export function DashboardGrid({ 
  role, 
  balance, 
  stats, 
  loansTable
}: DashboardGridProps) {
  
  const { reduceMotion } = useMotion(); 
  const formatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  return (
    // CHANGE 1: 'max-w-5xl' forces the table columns to shrink/compact naturally.
    // CHANGE 2: Reduced gap-4 to 'gap-3' for tighter spacing.
    <div className="h-full w-full max-w-5xl mx-auto p-4 relative flex flex-col gap-3">
      <MagicBento 
        disableAnimations={reduceMotion}
        enableSpotlight={true}
        enableStars={true}
        enableTilt={true}
        enableMagnetism={true}
        enableBorderGlow={true}
        spotlightRadius={300}
        glowColor="16, 185, 129"
        tiltIntensity={4}
        magnetStrength={0.02}
        // CHANGE 3: Tighter grid gap inside the bento
        className="gap-3" 
      >
        {/* 1. Cash */}
        <BentoCard className="col-span-1" title="Cash On-Hand" icon={<Wallet className="h-4 w-4"/>}>
           <div className="mt-2">
             <div className="text-2xl font-bold">{formatter.format(balance)}</div>
             <p className="text-xs text-muted-foreground mt-1">Available to lend</p>
             <div className="mt-3 relative z-20"> 
                <AddCapitalDialog />
             </div>
           </div>
        </BentoCard>

        {/* 2. Receivables */}
        <BentoCard className="col-span-1" title="Receivables" icon={<TrendingUp className="h-4 w-4"/>}>
           <div className="mt-2">
             <div className="text-2xl font-bold text-blue-500">
                {formatter.format(stats.totalReceivables)}
             </div>
             <p className="text-xs text-muted-foreground mt-1">Principal + Interest Due</p>
             <div className="mt-3 text-xs font-mono bg-blue-500/10 text-blue-600 px-2 py-1 rounded w-fit">
                Net: {formatter.format(balance + stats.totalReceivables)}
             </div>
           </div>
        </BentoCard>

        {/* 3. Active Count */}
        <BentoCard className="col-span-1" title="Active Borrowers" icon={<Activity className="h-4 w-4"/>}>
           <div className="mt-2">
             <div className="text-2xl font-bold text-orange-500">{stats.activeCount}</div>
             <p className="text-xs text-muted-foreground mt-1">Open loans</p>
           </div>
        </BentoCard>

        {/* Loan Management Table */}
        <BentoCard 
            className="col-span-1 md:col-span-3 row-span-2" 
            title="Loan Management" 
            icon={<Users className="h-4 w-4"/>}
            tiltIntensity={1}
            magnetStrength={0.01} 
        >
           {/* 
              h-full ensures it uses the card height.
              min-h adds stability.
           */}
           <div className="h-full min-h-[400px] overflow-auto pr-2 relative z-10">
              {loansTable}
           </div>
        </BentoCard>
      </MagicBento>

      <div className="fixed bottom-8 left-8 z-50">
        <MotionToggleButton />
      </div>
    </div>
  );
}