"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScanText } from "lucide-react";
import { ManualLoanForm } from "./manual-loan-form";
import { ScanLoanForm } from "./scan-loan-form";

// 1. Define the props interface
interface CreateLoanModalProps {
  fundId: string;
}

// 2. Accept the prop
export function CreateLoanModal({ fundId }: CreateLoanModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setMode('manual');
    }
  }

  function handleSuccess() {
    setOpen(false);
    setMode('manual');
  }

  function switchToScanMode() {
    setMode('scan');
  }

  function switchToManualMode() {
    setMode('manual');
  }

  function handleCancel() {
    setOpen(false);
    setMode('manual');
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <ScanText className="h-4 w-4" />
          New Loan
        </Button>
      </DialogTrigger>
    
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'manual' ? "Create New Loan" : "Scan Loan Card"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {mode === 'manual' ? (
            <ManualLoanForm 
              fundId={fundId} // <--- 3. PASS IT DOWN
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              onSwitchToScan={switchToScanMode}
            />
          ) : (
            <ScanLoanForm
              fundId={fundId} // <--- 3. PASS IT DOWN
              onSuccess={handleSuccess}
              onSwitchToManual={switchToManualMode}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}