"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordPayment(formData: FormData) {
  const supabase = await createClient();

  const loanId = formData.get("loan_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  // Note: Since your 'payments' table doesn't have a 'notes' column, 
  // these notes won't be saved unless you update the table schema.
  const notes = formData.get("notes") as string; 
  
  // 1. EXTRACT THE DATE
  const paymentDateStr = formData.get("payment_date") as string;

  if (!loanId || !amount || amount <= 0) {
    throw new Error("Invalid payment details");
  }

  // 2. FORMAT THE DATE
  // Use the provided date, or default to current time if missing
  const finalPaymentDate = paymentDateStr 
    ? new Date(paymentDateStr).toISOString() 
    : new Date().toISOString();

  // 3. INSERT WITH DATE
  const { error } = await supabase.from("payments").insert({
    loan_id: loanId,
    amount: amount,
    payment_date: finalPaymentDate,
    notes: notes || null, // <--- Add this line
  });

  if (error) {
    throw new Error("Payment failed: " + error.message);
  }

  // Revalidate both dashboard (for cash flow) and loans (for balances)
  revalidatePath("/dashboard");
  revalidatePath("/loans");
}