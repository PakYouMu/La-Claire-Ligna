"use client";

import { useState } from "react";
import { createFullLoan } from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

interface ManualLoanFormProps {
  fundId: string; // <--- ADDED PROP
  onSuccess: () => void;
  onCancel: () => void;
  onSwitchToScan: () => void;
}

export function ManualLoanForm({ fundId, onSuccess, onCancel, onSwitchToScan }: ManualLoanFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    months: "",
    interest_rate: "7",
    start_date: new Date().toISOString().split('T')[0]
  });

  async function handleSubmit() {
    setIsProcessing(true);

    const payload = new FormData();
    // 1. Append Fund ID
    payload.append("fund_id", fundId);

    payload.append("name", formData.name);
    payload.append("amount", formData.amount);
    payload.append("months", formData.months);
    payload.append("interest_rate", formData.interest_rate);
    payload.append("start_date", formData.start_date);

    if (signatureBlob) {
      payload.append("signature", signatureBlob, "signature.png");
    }

    try {
      await createFullLoan(payload);
      toast.success("Loan and borrower successfully created!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create loan");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="grid gap-3 p-1">
      <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 1.5fr' }}>
        <div className="grid gap-1.5">
          <Label className="text-sm">Borrower Name</Label>
          <Input
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter borrower name"
            className="h-9"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-sm">Start Date</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
            className="h-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: '0.5fr 0.5fr 0.5fr' }}>
        <div className="grid gap-1.5">
          <Label className="text-sm">Principal (₱)</Label>
          <Input
            type="number"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            step="0.01"
            className="h-9"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-sm">Terms (Months)</Label>
          <Input
            type="number"
            value={formData.months}
            onChange={e => setFormData({ ...formData, months: e.target.value })}
            placeholder="12"
            className="h-9"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-sm">Interest (%)</Label>
          <Input
            type="number"
            value={formData.interest_rate}
            onChange={e => setFormData({ ...formData, interest_rate: e.target.value })}
            placeholder="7"
            step="0.1"
            className="h-9"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-sm">Signature Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setSignatureBlob(e.target.files[0]);
            }
          }}
          className="h-9"
        />
        {signatureBlob && (
          <div className="p-2 border rounded bg-muted/20">
            <img
              src={URL.createObjectURL(signatureBlob)}
              alt="Signature Preview"
              className="h-14 w-auto object-contain border bg-white rounded"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center py-3 border-t border-b">
        <Button
          type="button"
          variant="outline"
          onClick={onSwitchToScan}
          className="gap-2 h-9"
          size="sm"
        >
          <Camera className="h-4 w-4" />
          Or Scan Loan Card
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          size="sm"
          className="h-9"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || !formData.name || !formData.amount || !formData.months}
          size="sm"
          className="h-9"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            "Create Loan"
          )}
        </Button>
      </div>
    </div>
  );
}