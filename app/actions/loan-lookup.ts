"use server";

import { createClient } from "@/lib/supabase/server";

export type LoanLookupResult = {
  borrower: {
    id: string;
    first_name: string;
    last_name: string;
    created_at: string;
  };
  loans: {
    id: string;
    principal: number;
    total_due: number;
    total_paid: number;
    remaining_balance: number;
    status: "ACTIVE" | "PAID"; // From view_loan_summary
    start_date: string;
    duration_months: number;
  }[];
  payments: {
    id: string;
    amount: number;
    payment_date: string;
    notes: string | null;
  }[];
};

export async function lookupBorrowerData(fullName: string) {
  const supabase = await createClient();

  // 1. Parse Name
  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length < 2) {
    return { error: "Please enter your full name (First and Last)." };
  }

  const searchFirst = nameParts[0];
  const searchLast = nameParts.slice(1).join(" ");

  // 2. Find Borrower
  // We use ilike for case-insensitive matching
  const { data: borrower, error: bError } = await supabase
    .from("borrowers")
    .select("id, first_name, last_name, created_at")
    .ilike("first_name", searchFirst)
    .ilike("last_name", searchLast)
    .maybeSingle();

  if (bError) return { error: "Database error occurred." };
  if (!borrower) return { error: "Borrower not found. Please check spelling." };

  // 3. Fetch Loans using the VIEW (Calculates status/balance automatically)
  const { data: loans, error: lError } = await supabase
    .from("view_loan_summary")
    .select("*")
    .eq("borrower_id", borrower.id)
    .order("start_date", { ascending: false });

  if (lError) return { error: "Could not retrieve loan history." };

  // 4. Fetch Payments for these loans
  const loanIds = loans.map((l) => l.id);
  const { data: payments, error: pError } = await supabase
    .from("payments")
    .select("*")
    .in("loan_id", loanIds)
    .order("payment_date", { ascending: false });

  if (pError) return { error: "Could not retrieve payment history." };

  return {
    success: true,
    data: {
      borrower,
      loans,
      payments,
    } as LoanLookupResult,
  };
}