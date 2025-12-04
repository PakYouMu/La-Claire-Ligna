"use client";

import { useState, useEffect } from "react";
import { recordPayment } from "@/app/actions/payments";
import { createClient } from "@/lib/supabase/client";
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
import { Banknote, Loader2, Calendar, CheckCircle2 } from "lucide-react";

interface PaymentDialogProps {
  loanId: string;
  borrowerName: string;
  amortization: number;
  balance: number;
}

interface PaymentSchedule {
  id: string;
  due_date: string;
  expected_amount: number;
  status: string;
  paid_date: string | null;
  paid_amount: number | null;
}

export function PaymentDialog({ loanId, borrowerName, amortization, balance }: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nextDueDate, setNextDueDate] = useState<PaymentSchedule | null>(null);
  const [upcomingSchedule, setUpcomingSchedule] = useState<PaymentSchedule[]>([]);
  const [amount, setAmount] = useState(amortization.toString());
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const supabase = createClient();

  // Fetch payment schedule when dialog opens
  useEffect(() => {
    if (open) {
      fetchPaymentSchedule();
      setAmount(amortization.toString());
      setNotes("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [open, loanId, amortization]);

  async function fetchPaymentSchedule() {
    const { data: schedules } = await supabase
      .from("payment_schedule")
      .select("*")
      .eq("loan_id", loanId)
      .order("due_date", { ascending: true });

    if (schedules) {
      // Find next pending payment
      const next = schedules.find(s => s.status === "PENDING");
      setNextDueDate(next || null);
      
      // Get upcoming 3 pending payments for preview
      const upcoming = schedules.filter(s => s.status === "PENDING").slice(0, 3);
      setUpcomingSchedule(upcoming);
    }
  }

  async function handleSubmit() {
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append("loan_id", loanId);
    formData.append("amount", amount);
    formData.append("payment_date", paymentDate);
    if (notes) {
      formData.append("notes", notes);
    }
    
    try {
      await recordPayment(formData);
      setOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Helper to format date with status
  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    if (diffDays < 0) {
      return { text: formatted, status: 'OVERDUE', color: 'text-red-600 font-semibold' };
    } else if (diffDays === 0) {
      return { text: formatted, status: 'DUE TODAY', color: 'text-orange-600 font-semibold' };
    } else if (diffDays <= 3) {
      return { text: formatted, status: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'text-yellow-600' };
    } else {
      return { text: formatted, status: null, color: 'text-muted-foreground' };
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Banknote className="h-4 w-4" />
          Pay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Collecting from <strong>{borrowerName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Next Due Date Highlight */}
          {nextDueDate && (
            <div className="p-4 border-2 border-emerald-200 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-900">Next Payment Due</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-lg ${formatDueDate(nextDueDate.due_date).color}`}>
                  {formatDueDate(nextDueDate.due_date).text}
                </span>
                {formatDueDate(nextDueDate.due_date).status && (
                  <span className="text-sm font-medium text-emerald-700">
                    {formatDueDate(nextDueDate.due_date).status}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Payment Amount Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-md text-center">
              <span className="text-xs text-muted-foreground block">Due per Payday</span>
              <span className="font-bold text-lg">₱{amortization.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-muted rounded-md text-center">
              <span className="text-xs text-muted-foreground block">Remaining Balance</span>
              <span className="font-bold text-lg text-red-600">₱{balance.toLocaleString()}</span>
            </div>
          </div>

          {/* Upcoming Schedule Preview */}
          {upcomingSchedule.length > 1 && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Upcoming Schedule</div>
              <div className="space-y-1">
                {upcomingSchedule.slice(1, 3).map((schedule) => {
                  const dateInfo = formatDueDate(schedule.due_date);
                  return (
                    <div key={schedule.id} className="flex items-center justify-between text-sm">
                      <span className={dateInfo.color}>{dateInfo.text}</span>
                      <span className="text-xs text-muted-foreground">
                        ₱{schedule.expected_amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input
              id="payment_date"
              name="payment_date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount Collected (₱)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={balance}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input 
              id="notes" 
              name="notes" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. GCash, Cash, Payment #1" 
            />
          </div>

          <DialogFooter>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !amount || parseFloat(amount) <= 0} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}