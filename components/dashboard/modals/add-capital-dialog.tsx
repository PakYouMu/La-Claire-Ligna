"use client";

import { useState } from "react";
import { addCapital } from "@/app/actions/wallet";
import { Button } from "@/components/ui/button"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";

export function AddCapitalDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Helper: Get current local date-time in format "YYYY-MM-DDTHH:MM" for the input default
  const getCurrentDateTime = () => {
    const now = new Date();
    // Adjust for timezone offset to ensure the input shows local time correctly
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    
    try {
      await addCapital(formData);
      setOpen(false);
    } catch (error) {
      // In a real app, use toast() here
      alert("Failed to add capital");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Capital
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Capital</DialogTitle>
          <DialogDescription>
            Inject money into your system wallet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          
          {/* Amount Field */}
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          {/* NEW: Date & Time Field */}
          <div className="grid gap-2">
            <Label htmlFor="date">Date & Time</Label>
            <Input
              id="date"
              name="date"
              type="datetime-local" 
              defaultValue={getCurrentDateTime()} // Defaults to Right Now
              required
              className="block" 
            />
          </div>

          {/* Notes Field */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="e.g. Initial Investment"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Depositing..." : "Confirm Deposit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}