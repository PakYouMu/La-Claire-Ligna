"use client";

import { useState } from "react"; // Add useState
import { useRouter } from "next/navigation";
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";
import { useMotion } from "@/components/context/motion-context";
import { Wallet, Plus, ShieldCheck, User, Loader2 } from "lucide-react"; // Add Loader2
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Add DialogFooter
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Add Input
import { Label } from "@/components/ui/label"; // Add Label
import { createFund } from "@/app/actions/funds"; // Import the action
import { toast } from "sonner";

interface Fund {
  id: string;
  name: string;
  slug: string;
  currency: string;
  role: { role: string } | { role: string }[] | null;
}

export function FundGrid({ funds }: { funds: Fund[] }) {
  const router = useRouter();
  const { reduceMotion } = useMotion();
  const [isCreating, setIsCreating] = useState(false); // Loading state

  const handleEnterFund = (fundSlug: string) => {
    router.push(`/funds/${fundSlug}/dashboard`);
  };

  const getRoleLabel = (fund: Fund) => {
    if (Array.isArray(fund.role)) return fund.role[0]?.role || 'viewer';
    return fund.role?.role || 'viewer';
  };

  // Form Submission Handler
  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);

    const formData = new FormData(event.currentTarget);

    try {
      // The server action will handle the redirect on success
      await createFund(formData);
      toast.success("Fund successfully created!");
    } catch (error: any) {
      if (error.message === "NEXT_REDIRECT") {
        toast.success("Fund successfully created!");
        throw error;
      }
      toast.error(error.message);
      setIsCreating(false);
    }
  }

  return (
    <MagicBento
      disableAnimations={reduceMotion}
      enableSpotlight={true}
      spotlightRadius={200}
      enableStars={true}
      className="max-w-5xl mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4"
    >
      {funds.map((fund) => (
        <BentoCard
          key={fund.id}
          className="col-span-1 min-h-[180px] cursor-pointer group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          role="button"
          tabIndex={0}
          onClick={() => handleEnterFund(fund.slug)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleEnterFund(fund.slug);
            }
          }}
          title={fund.name}
          icon={<Wallet className="h-5 w-5 text-emerald-500" />}
        >
          <div className="absolute inset-0 z-20 pointer-events-none" />

          <div className="mt-2 flex flex-col justify-between h-full relative z-10 pointer-events-none">
            <div className="text-sm text-muted-foreground">
              {fund.currency} Workspace
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleLabel(fund) === 'owner'
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
          <div
            role="button"
            tabIndex={0}
            className="col-span-1 h-full min-h-[180px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                (e.currentTarget as HTMLElement).click();
              }
            }}
          >
            <BentoCard className="h-full border-dashed border-2 bg-transparent hover:bg-muted/50 cursor-pointer flex flex-col items-center justify-center transition-colors">
              <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground group-hover:text-foreground h-full w-full">
                <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-background border flex items-center justify-center transition-all">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-medium">Create New Fund</span>
              </div>
            </BentoCard>
          </div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a New Fund</DialogTitle>
            <DialogDescription>
              Start a new isolated lending project. You will be the owner.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Fund Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. My Startup Capital"
                required
                minLength={3}
                autoComplete="off"
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Fund"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MagicBento>
  );
}