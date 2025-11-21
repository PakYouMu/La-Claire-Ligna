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
  borrowerList: React.ReactNode;
}

export function DashboardGrid({ 
  role, 
  balance, 
  stats, 
  loansTable, 
  borrowerList 
}: DashboardGridProps) {
  
  const { reduceMotion } = useMotion(); 
  const formatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  return (
    <div className="h-full w-full p-4 md:p-8 relative">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 ml-2">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Loan Dashboard</h1>
          <p className="text-muted-foreground">
             Welcome back, {role === 'superuser' ? 'Boss' : 'Admin'}.
          </p>
        </header>
      </div>

      <MagicBento 
        disableAnimations={reduceMotion}
        enableSpotlight={true}
        enableStars={true}
        enableTilt={true}
        enableMagnetism={true}
        enableBorderGlow={true}
        spotlightRadius={300}
        glowColor="16, 185, 129"
        // GLOBAL DEFAULTS: Subtle movement
        tiltIntensity={4}
        magnetStrength={0.02}
      >
        
        {/* 1. Cash - Small card, standard fun movement */}
        <BentoCard className="col-span-1" title="Cash On-Hand" icon={<Wallet className="h-4 w-4"/>}>
           <div className="mt-2">
             <div className="text-3xl font-bold">{formatter.format(balance)}</div>
             <p className="text-xs text-muted-foreground mt-1">Available to lend</p>
             <div className="mt-4 relative z-20"> 
                <AddCapitalDialog />
             </div>
           </div>
        </BentoCard>

        {/* 2. Receivables */}
        <BentoCard className="col-span-1" title="Receivables" icon={<TrendingUp className="h-4 w-4"/>}>
           <div className="mt-2">
             <div className="text-3xl font-bold text-blue-500">
                {formatter.format(stats.totalReceivables)}
             </div>
             <p className="text-xs text-muted-foreground mt-1">Principal + Interest Due</p>
             <div className="mt-4 text-xs font-mono bg-blue-500/10 text-blue-600 px-2 py-1 rounded w-fit">
                Net: {formatter.format(balance + stats.totalReceivables)}
             </div>
           </div>
        </BentoCard>

        {/* 3. Active Count */}
        <BentoCard className="col-span-1" title="Active Borrowers" icon={<Activity className="h-4 w-4"/>}>
           <div className="mt-2">
             <div className="text-3xl font-bold text-orange-500">{stats.activeCount}</div>
             <p className="text-xs text-muted-foreground mt-1">Open loans</p>
           </div>
        </BentoCard>

        {/* 4. Active Loans Table (Wide) 
            Use custom props to reduce movement significantly 
        */}
        <BentoCard 
            className="col-span-1 md:col-span-2 row-span-2" 
            title="Loan Management" 
            icon={<Users className="h-4 w-4"/>}
            tiltIntensity={2} // Very low tilt
            magnetStrength={0.01} // Almost no movement
        >
           <div className="h-[400px] lg:h-[500px] overflow-auto pr-2 relative z-10">
              {loansTable}
           </div>
        </BentoCard>

        {/* 5. Borrower Directory (Tall) */}
        <BentoCard 
            className="col-span-1 row-span-2" 
            title="Directory" 
            icon={<Users className="h-4 w-4"/>}
            tiltIntensity={3}
        >
           <div className="h-[400px] lg:h-[500px] overflow-auto pr-2 relative z-10">
              {borrowerList}
           </div>
        </BentoCard>

      </MagicBento>

      <div className="fixed bottom-8 left-8 z-50">
        <MotionToggleButton />
      </div>
    </div>
  );
}