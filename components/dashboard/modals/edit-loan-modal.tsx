"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pencil,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Banknote
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLoan } from "@/app/actions/loans";
import { EnrichedLoan } from "@/components/loans/active-loans-client";
import { toast } from "sonner";

interface EditLoanModalProps {
  loan: EnrichedLoan;
}

export function EditLoanModal({ loan }: EditLoanModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Format date for HTML input (YYYY-MM-DD)
  const formattedDate = new Date(loan.start_date).toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    // Call server action
    const result = await updateLoan(loan.id, formData);

    if (result.success) {
      setSuccess(true);
      toast.success("Loan updated successfully!");
      // Close modal automatically after a brief success message
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } else {
      const errorMsg = result.error || "Failed to update loan";
      setError(errorMsg);
      toast.error(errorMsg);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setError(null);
        setSuccess(false);
      }
    }}>
      <DialogTrigger asChild>
        <button className="css-anchor-menu-item">
          <Pencil className="h-4 w-4 text-blue-500" />
          <span>Edit Loan</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Loan Details</DialogTitle>
          <DialogDescription>
            Modifying terms for <strong>{loan.first_name} {loan.last_name}</strong>
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Update Successful</h3>
              <p className="text-sm text-muted-foreground">The loan terms and schedule have been updated.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">

              {/* Warning / Info Box (Styled like the Payment Modal Highlight) */}
              <div className="p-4 border-2 border-amber-200 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-900">Important Note</span>
                </div>
                <p className="text-sm text-amber-800/90 leading-relaxed">
                  Changing the Principal, Interest, or Date will <strong>regenerate the payment schedule</strong> for all future dates. Past payments will be preserved.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Principal Input */}
              <div className="grid gap-2">
                <Label htmlFor="principal" className="flex items-center gap-2">
                  <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                  Principal Amount
                </Label>
                <Input
                  id="principal"
                  name="principal"
                  type="number"
                  step="0.01"
                  defaultValue={loan.principal}
                  className="font-medium"
                  required
                />
              </div>

              {/* Interest & Duration Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                  <div className="relative">
                    <Input
                      id="interest_rate"
                      name="interest_rate"
                      type="number"
                      step="0.01"
                      defaultValue={loan.interest_rate}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration_months">Duration (Months)</Label>
                  <Input
                    id="duration_months"
                    name="duration_months"
                    type="number"
                    defaultValue={loan.duration_months}
                    required
                  />
                </div>
              </div>

              {/* Start Date Input */}
              <div className="grid gap-2">
                <Label htmlFor="start_date" className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Start Date
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={formattedDate}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}