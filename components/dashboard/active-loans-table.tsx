import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ActiveLoansClient, EnrichedLoan } from "../loans/active-loans-client";

interface ActiveLoansTableProps {
  fundId: string;
}

export async function ActiveLoansTable({ fundId }: ActiveLoansTableProps) {
  const supabase = await createClient();

  // 1. Check Fund Context
  const { data: currentFund } = await supabase.from('funds').select('slug').eq('id', fundId).single();
  const isGeneralView = currentFund?.slug === 'general-fund';

  // 2. Query Loans (scoped to exact columns needed by ActiveLoansClient)
  let query = supabase
    .from("view_loan_summary")
    .select("id, fund_id, borrower_id, first_name, last_name, principal, interest_rate, duration_months, start_date, total_interest, total_due, total_paid, remaining_balance, amortization_per_payday, status")
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

  // 3. Fetch Details (Schedule & Signatures) in parallel
  const loanIds = loans.map(l => l.id);
  const borrowerIds = [...new Set(loans.map(l => l.borrower_id))];

  const nextDueDateMap = new Map();
  const signatureMap = new Map();

  await Promise.all([
    // Fetch Schedules
    loanIds.length > 0
      ? supabase
        .from("payment_schedule")
        .select("loan_id, due_date")
        .in("loan_id", loanIds)
        .eq("status", "PENDING")
        .order("due_date", { ascending: true })
        .then(({ data: schedules }) => {
          schedules?.forEach((s) => {
            if (!nextDueDateMap.has(s.loan_id)) {
              nextDueDateMap.set(s.loan_id, s.due_date);
            }
          });
        })
      : Promise.resolve(),
    // Fetch Signatures
    borrowerIds.length > 0
      ? supabase
        .from("borrowers")
        .select("id, signature_url")
        .in("id", borrowerIds)
        .then(({ data: borrowerDetails }) => {
          borrowerDetails?.forEach((b) => {
            signatureMap.set(b.id, b.signature_url);
          });
        })
      : Promise.resolve(),
  ]);

  // 4. Combine data into Enriched format
  const enrichedData: EnrichedLoan[] = loans.map((loan) => ({
    ...loan,
    next_due_date: nextDueDateMap.get(loan.id) || null,
    signature_url: signatureMap.get(loan.borrower_id) || null,
  }));

  // 5. Pass to Client Component
  return <ActiveLoansClient data={enrichedData} fundId={fundId} />;
}