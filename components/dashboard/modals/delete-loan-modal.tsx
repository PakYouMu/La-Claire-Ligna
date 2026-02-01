"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteLoan } from "@/app/actions/loans";
import { EnrichedLoan } from "@/components/loans/active-loans-client";

interface DeleteLoanModalProps {
  loan: EnrichedLoan;
}

export function DeleteLoanModal({ loan }: DeleteLoanModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deleteLoan(loan.id);
    
    if (result.success) {
      setOpen(false);
    } else {
      alert(result.error || "Failed to delete loan");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-muted hover:bg-red-600 text-foreground hover:text-white h-9 px-4 text-sm font-medium transition-colors flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Delete Loan?</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete the active loan for <strong>{loan.first_name} {loan.last_name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground my-2">
          <p>This will remove the loan from the active list and stop all future payment schedules. Past payment records will be archived.</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}