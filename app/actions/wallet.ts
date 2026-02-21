"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getWalletBalance(fundId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('view_wallet_balance')
    .select('cash_on_hand')
    .eq('fund_id', fundId)
    .single();

  if (error) return 0;
  return data?.cash_on_hand || 0;
}

// --- UPDATED: Accepts fundId to fetch stats for specific fund ---
export async function getLoanStats(fundId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('view_loan_summary')
    .select('remaining_balance')
    .eq('status', 'ACTIVE')
    .eq('fund_id', fundId);

  if (error || !data) {
    return {
      activeCount: 0,
      totalReceivables: 0
    };
  }

  // Client-side aggregation
  const activeCount = data.length;
  const totalReceivables = data.reduce((sum, loan) => sum + (loan.remaining_balance || 0), 0);

  return {
    activeCount,
    totalReceivables
  };
}

export async function manageCapital(formData: FormData) {
  const supabase = await createClient();

  const amountStr = formData.get("amount") as string;
  const notes = formData.get("notes") as string;
  const fundId = formData.get("fund_id") as string;
  const dateStr = formData.get("date") as string;
  const type = formData.get("type") as "DEPOSIT" | "WITHDRAW" | "SET"; // Added action type

  if (!fundId) throw new Error("Missing Fund ID");
  if (!type) throw new Error("Missing transaction type");

  const parsedAmount = parseFloat(amountStr);
  if (isNaN(parsedAmount) || parsedAmount < 0) throw new Error("Invalid amount");

  // Format Date
  const transactionDate = dateStr
    ? new Date(dateStr).toISOString()
    : new Date().toISOString();

  let ledgerAmount = 0;
  let ledgerCategory = "";
  let ledgerNotes = notes;

  if (type === "DEPOSIT") {
    ledgerAmount = parsedAmount;
    ledgerCategory = "CAPITAL_DEPOSIT";
    ledgerNotes = ledgerNotes || "Manual Capital Deposit";
  } else if (type === "WITHDRAW") {
    ledgerAmount = -parsedAmount;
    ledgerCategory = "CAPITAL_WITHDRAWAL";
    ledgerNotes = ledgerNotes || "Manual Capital Withdrawal";
  } else if (type === "SET") {
    // 1. Fetch current literal cash balance
    const currentBalance = await getWalletBalance(fundId);

    // 2. Calculate precisely what difference is needed to force the ledger summing to equate the new target
    ledgerAmount = parsedAmount - currentBalance;
    ledgerCategory = "CAPITAL_ADJUSTMENT";
    ledgerNotes = ledgerNotes || `Absolute Balance Adjustment (Target: ₱${parsedAmount})`;

    // 3. Fallback to prevent 0.00 zero-action math from polluting the DB
    if (Math.abs(ledgerAmount) < 0.01) {
      return;
    }
  }

  const { error } = await supabase.from("ledger").insert({
    fund_id: fundId,
    amount: ledgerAmount,
    category: ledgerCategory,
    notes: ledgerNotes,
    transaction_date: transactionDate,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/funds/${fundId}/dashboard`);
}