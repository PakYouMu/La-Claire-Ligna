"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Keep existing getWalletBalance...
export async function getWalletBalance(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('view_wallet_balance')
    .select('cash_on_hand')
    .single();

  if (error) return 0;
  return data?.cash_on_hand || 0;
}

// Keep existing getLoanStats...
export async function getLoanStats() {
  const supabase = await createClient();

  // We can calculate everything from the view in one go
  const { data, error } = await supabase
    .from('view_loan_summary')
    .select('remaining_balance')
    .eq('status', 'ACTIVE');

  if (error || !data) {
    return {
      activeCount: 0,
      totalReceivables: 0
    };
  }

  // Client-side aggregation (fast enough for <1000 loans)
  const activeCount = data.length;
  const totalReceivables = data.reduce((sum, loan) => sum + (loan.remaining_balance || 0), 0);

  return {
    activeCount,
    totalReceivables
  };
}

export async function addCapital(formData: FormData) {
  const supabase = await createClient();
  const amount = parseFloat(formData.get("amount") as string);
  const notes = formData.get("notes") as string;
  // 1. Extract the date string from the form
  const dateStr = formData.get("date") as string; 

  if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

  // 2. Format the date for Supabase (Timestamptz)
  // If the user picked a date, convert it. If not (shouldn't happen due to required), default to now.
  const transactionDate = dateStr 
    ? new Date(dateStr).toISOString() 
    : new Date().toISOString();

  const { error } = await supabase.from("ledger").insert({
    amount: amount,
    category: "CAPITAL_DEPOSIT",
    notes: notes || "Manual Capital Deposit",
    // 3. Save the custom date
    transaction_date: transactionDate, 
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}