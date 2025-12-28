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

export async function addCapital(formData: FormData) {
  const supabase = await createClient();
  
  const amount = parseFloat(formData.get("amount") as string);
  const notes = formData.get("notes") as string;
  const fundId = formData.get("fund_id") as string; 
  const dateStr = formData.get("date") as string; 

  if (!fundId) throw new Error("Missing Fund ID");
  if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

  // Format Date
  const transactionDate = dateStr 
    ? new Date(dateStr).toISOString() 
    : new Date().toISOString();

  const { error } = await supabase.from("ledger").insert({
    fund_id: fundId,
    amount: amount,
    category: "CAPITAL_DEPOSIT",
    notes: notes || "Manual Capital Deposit",
    transaction_date: transactionDate, 
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/base/${fundId}/dashboard`);
}