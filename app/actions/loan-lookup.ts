"use server";

import { createClient } from "@supabase/supabase-js";

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
    status: "ACTIVE" | "PAID";
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Sanity Check for Env Vars
  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Server configuration error. Please contact admin." };
  }

  // 2. Initialize Admin Client (Inside the function scope)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // 3. Parse Name
  const cleanName = fullName.trim();
  const nameParts = cleanName.split(/\s+/);

  if (nameParts.length < 2) {
    return { error: "Please enter your full name (First and Last)." };
  }

  const searchFirst = nameParts[0];
  const searchLast = nameParts.slice(1).join(" ");

  // 4. Find Borrower
  const { data: borrowers, error: bError } = await supabase
    .from("borrowers")
    .select("id, first_name, last_name, created_at")
    .ilike("first_name", searchFirst)
    .ilike("last_name", searchLast);

  if (bError) {
    console.error("Lookup Error:", bError);
    return { error: "System error occurred while searching." };
  }

  if (!borrowers || borrowers.length === 0) {
    return { error: "No records found. Check spelling or try your registered name." };
  }

  if (borrowers.length > 1) {
    return { error: "Multiple records found. Please contact support to verify your ID." };
  }

  const borrower = borrowers[0];

  // 5. Fetch Loans
  const { data: loans, error: lError } = await supabase
    .from("view_loan_summary")
    .select("*")
    .eq("borrower_id", borrower.id)
    .order("start_date", { ascending: false });

  if (lError) {
    console.error("Loan Fetch Error:", lError);
    return { error: "Could not retrieve loan history." };
  }

  // 6. Fetch Payments
  const loanIds = loans.map((l) => l.id);
  let payments: any[] = [];

  if (loanIds.length > 0) {
    const { data: pData, error: pError } = await supabase
      .from("payments")
      .select("id, amount, payment_date, notes")
      .in("loan_id", loanIds)
      .order("payment_date", { ascending: false });

    if (pError) {
      console.error("Payment Fetch Error:", pError);
      return { error: "Could not retrieve payment history." };
    }
    payments = pData;
  }

  return {
    success: true,
    data: {
      borrower,
      loans,
      payments,
    } as LoanLookupResult,
  };
}