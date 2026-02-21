"use client";

import { useState } from "react";
import { manageCapital } from "@/app/actions/wallet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Settings2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ManageCapitalDialogProps {
  fundId: string;
}

export function ManageCapitalDialog({ fundId }: ManageCapitalDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"DEPOSIT" | "WITHDRAW" | "SET">("DEPOSIT");

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.append("type", activeTab);

    try {
      await manageCapital(formData);
      setOpen(false);
      toast.success("Capital updated successfully!");
    } catch (error) {
      toast.error("Failed to manage capital. Please check the amount and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Wallet className="h-4 w-4" />
          Manage Capital
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Fund Capital</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as any)}
          className="w-full mt-2"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="DEPOSIT" className="gap-1.5 text-xs">
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="WITHDRAW" className="gap-1.5 text-xs">
              <ArrowUpFromLine className="h-3.5 w-3.5" />
              Withdraw
            </TabsTrigger>
            <TabsTrigger value="SET" className="gap-1.5 text-xs">
              <Settings2 className="h-3.5 w-3.5" />
              Set Exact
            </TabsTrigger>
          </TabsList>

          <form onSubmit={onSubmit} className="grid gap-4 py-4 mt-2">

            <input type="hidden" name="fund_id" value={fundId} />

            <div className="grid gap-2">
              <Label htmlFor="amount">
                {activeTab === "DEPOSIT" && "Deposit Amount (₱)"}
                {activeTab === "WITHDRAW" && "Withdrawal Amount (₱)"}
                {activeTab === "SET" && "Target Cash on Hand (₱)"}
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              />
              {activeTab === "SET" && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  This will generate an automated adjustment ledger to exactly match this balance.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input id="date" name="date" type="datetime-local" defaultValue={getCurrentDateTime()} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder={
                  activeTab === "DEPOSIT" ? "e.g. Initial injection" :
                    activeTab === "WITHDRAW" ? "e.g. Taking out profit" :
                      "e.g. Manual sync with physical wallet"
                }
                className="resize-none"
              />
            </div>

            <DialogFooter className="mt-2 text-primary-foreground">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {activeTab === "DEPOSIT" && "Confirm Deposit"}
                    {activeTab === "WITHDRAW" && "Confirm Withdrawal"}
                    {activeTab === "SET" && "Sync Balance"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}