"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { voidLoan } from "@/app/actions/loans";
import { Ban, Loader2, CheckCircle2 } from "lucide-react";
import { LoanSummary } from "@/lib/types/schema";
import { toast } from "sonner";

export function VoidLoanModal({ loan }: { loan: LoanSummary }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState("");
    const [success, setSuccess] = useState(false);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setSuccess(false);
            setReason("");
        }
    };

    const handleVoid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error("Please provide a reason for voiding this loan.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await voidLoan(loan.id, reason.trim());
            if (res.success) {
                setSuccess(true);
                toast.success(`Loan for ${loan.first_name} has been marked as void.`);
                setTimeout(() => {
                    setOpen(false);
                    setReason("");
                    setSuccess(false);
                }, 1500);
            } else {
                toast.error("Failed to void loan: " + res.error);
            }
        } catch (err: any) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button className="css-anchor-menu-item text-red-600 hover:text-red-700 hover:bg-red-500/10" role="menuitem">
                    <Ban className="h-4 w-4" />
                    <span>Void Loan</span>
                </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-red-500 flex items-center gap-2">
                        <Ban className="h-5 w-5" />
                        Void Loan
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. Unlike "Delete" (which removes mistaken entries), "Void" permanently marks this loan as inactive and unpayable, keeping a record.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-foreground">Loan Voided</h3>
                            <p className="text-sm text-muted-foreground">The loan has been marked as void.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleVoid} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="voidReason">Reason for Voiding</Label>
                            <Textarea
                                id="voidReason"
                                placeholder="e.g. Borrower defaulted, bankrupt, untraceable..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="min-h-[100px]"
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isSubmitting || !reason.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Voiding...
                                    </>
                                ) : (
                                    "Confirm Void"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
