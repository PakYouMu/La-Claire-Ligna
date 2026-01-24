"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordPayment(formData: FormData) {
  const supabase = await createClient();

  const loanId = formData.get("loan_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const notes = formData.get("notes") as string; 
  const paymentDateStr = formData.get("payment_date") as string;

  if (!loanId || !amount || amount <= 0) {
    throw new Error("Invalid payment details");
  }

  // 1. FORMAT THE DATE
  const finalPaymentDate = paymentDateStr 
    ? new Date(paymentDateStr).toISOString() 
    : new Date().toISOString();

  // 2. CRITICAL: Fetch the fund_id from the Loan
  // A payment MUST belong to the same fund as the loan.
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("fund_id")
    .eq("id", loanId)
    .single();

  if (loanError || !loan) {
    throw new Error("Loan not found. Cannot process payment.");
  }

  // 3. INSERT PAYMENT (Including fund_id)
  const { error } = await supabase.from("payments").insert({
    loan_id: loanId,
    fund_id: loan.fund_id, // <--- This fixes the "null value" error
    amount: amount,
    payment_date: finalPaymentDate,
    notes: notes || null,
  });

  if (error) {
    throw new Error("Payment failed: " + error.message);
  }

  // 4. REVALIDATE
  // Note: Since you use dynamic slugs, you might want to update these paths
  // to match your actual structure, e.g., `/[slug]/dashboard`
  revalidatePath("/dashboard"); 
  revalidatePath("/loans");
}