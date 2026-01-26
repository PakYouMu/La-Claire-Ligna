import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ActiveLoansClient, EnrichedLoan } from "../loans/active-loans-client";

interface ActiveLoansTableProps {
  fundId: string;
}

export async function ActiveLoansTable({fundId}: ActiveLoansTableProps) {
  const supabase = await createClient();
  
  // 1. Check Fund Context
  const { data: currentFund } = await supabase.from('funds').select('slug').eq('id', fundId).single();
  const isGeneralView = currentFund?.slug === 'general-fund';

  // 2. Query Loans
  let query = supabase
    .from("view_loan_summary")
    .select("*")
    .eq("status", "ACTIVE") 
    .order("start_date", { ascending: false });

  if (!isGeneralView) {
    query = query.eq("fund_id", fundId);
  }

  const { data: loans, error } = await query;

  if (error || !loans) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>Error loading loans. Please refresh.</span>
      </div>
    );
  }

  // 3. Fetch Details (Schedule & Signatures)
  const loanIds = loans.map(l => l.id);
  const borrowerIds = [...new Set(loans.map(l => l.borrower_id))];

  // Fetch Schedules 
  const nextDueDateMap = new Map();
  if (loanIds.length > 0) {
    const { data: schedules } = await supabase
      .from("payment_schedule")
      .select("loan_id, due_date")
      .in("loan_id", loanIds)
      .eq("status", "PENDING")
      .order("due_date", { ascending: true });

    schedules?.forEach((s) => {
      // only grab the earliest one
      if (!nextDueDateMap.has(s.loan_id)) {
        nextDueDateMap.set(s.loan_id, s.due_date);
      }
    });
  }

  // Fetch Signatures
  const signatureMap = new Map();
  if (borrowerIds.length > 0) {
    const { data: borrowerDetails } = await supabase
      .from("borrowers")
      .select("id, signature_url")
      .in("id", borrowerIds);

    borrowerDetails?.forEach((b) => {
      signatureMap.set(b.id, b.signature_url);
    });
  }

  // 4. Combine data into Enriched format
  const enrichedData: EnrichedLoan[] = loans.map((loan) => ({
    ...loan,
    next_due_date: nextDueDateMap.get(loan.id) || null,
    signature_url: signatureMap.get(loan.borrower_id) || null,
  }));

  // 5. Pass to Client Component
  return <ActiveLoansClient data={enrichedData} fundId={fundId} />;
}