"use client";

import { useRouter } from "next/navigation";
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";
import { useMotion } from "@/components/context/motion-context";
import { Wallet, Plus, ShieldCheck, User } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Fund {
  id: string;
  name: string;
  slug: string; // <--- ADDED THIS
  currency: string;
  role: { role: string } | { role: string }[] | null;
}

export function FundGrid({ funds }: { funds: Fund[] }) {
  const router = useRouter();
  const { reduceMotion } = useMotion();

  const handleEnterFund = (fundSlug: string) => {
    router.push(`/base/${fundSlug}/dashboard`);
  };

  const getRoleLabel = (fund: Fund) => {
    if (Array.isArray(fund.role)) return fund.role[0]?.role || 'viewer';
    return fund.role?.role || 'viewer';
  };

  return (
    <MagicBento
      disableAnimations={reduceMotion}
      enableSpotlight={true}
      spotlightRadius={200}
      className="max-w-5xl mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4"
    >
      {funds.map((fund) => (
        <BentoCard
          key={fund.id}
          className="col-span-1 min-h-[180px] cursor-pointer group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
          title={fund.name}
          icon={<Wallet className="h-5 w-5 text-emerald-500" />}
        >
          {/* Clickable Overlay using SLUG */}
          <div 
            className="absolute inset-0 z-20" 
            onClick={() => handleEnterFund(fund.slug)}
          />

          <div className="mt-2 flex flex-col justify-between h-full relative z-10 pointer-events-none">
            <div className="text-sm text-muted-foreground">
              {fund.currency} Workspace
            </div>
            
            <div className="mt-6 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                getRoleLabel(fund) === 'owner' 
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
                  : 'bg-muted text-muted-foreground border-border'
              }`}>
                {getRoleLabel(fund) === 'owner' ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {getRoleLabel(fund).toUpperCase()}
              </span>
            </div>
          </div>
        </BentoCard>
      ))}

      {/* CREATE NEW CARD */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="col-span-1 h-full min-h-[180px]"> 
            <BentoCard className="h-full border-dashed border-2 bg-transparent hover:bg-muted/50 cursor-pointer flex items-center justify-center transition-colors">
              <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-foreground">
                <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-background border flex items-center justify-center transition-all">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-medium">Create New Fund</span>
              </div>
            </BentoCard>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Fund</DialogTitle>
            <DialogDescription>
              Start a new isolated lending project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex justify-center">
             <Button onClick={() => alert("Hook this up to a createFund server action!")}>
                Create Fund
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MagicBento>
  );
}