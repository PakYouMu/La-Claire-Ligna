import { createClient } from "@/lib/supabase/server";
import { BorrowerDirectoryClient } from "../dashboard/borrower-card";

interface BorrowerListProps {
  fundId: string;
}

export async function BorrowerList({ fundId }: BorrowerListProps) {
  const supabase = await createClient();

  // 1. Fetch ALL Borrowers belonging to this Fund
  const { data: borrowers } = await supabase
    .from("borrowers")
    .select("id, first_name, last_name, signature_url, created_at")
    .eq("fund_id", fundId);

  if (!borrowers || borrowers.length === 0) {
    return <BorrowerDirectoryClient data={[]} />;
  }

  // 2. Fetch ACTIVE Loans for this Fund
  // We need this to determine who is "Active" and what their loan IDs are
  const { data: activeLoans } = await supabase
    .from("view_loan_summary")
    .select("id, borrower_id, status")
    .eq("fund_id", fundId)
    .eq("status", "ACTIVE");

  const activeLoanMap = new Map(); // Map<BorrowerID, LoanID>
  const activeLoanIds: string[] = [];

  activeLoans?.forEach((loan) => {
    activeLoanMap.set(loan.borrower_id, loan.id);
    activeLoanIds.push(loan.id);
  });

  // 3. Fetch Next Payment Schedule for ACTIVE loans only
  // We only care about due dates for loans that are currently running
  let nextDueDatesMap = new Map(); // Map<LoanID, DateString>
  
  if (activeLoanIds.length > 0) {
    const { data: schedules } = await supabase
      .from("payment_schedule")
      .select("loan_id, due_date")
      .in("loan_id", activeLoanIds)
      .eq("status", "PENDING")
      .order("due_date", { ascending: true }); // Get earliest pending date

    // Since we ordered by due_date ascending, the first entry for a loan_id is the next due date
    schedules?.forEach((schedule) => {
      if (!nextDueDatesMap.has(schedule.loan_id)) {
        nextDueDatesMap.set(schedule.loan_id, schedule.due_date);
      }
    });
  }

  // 4. Consolidate Data
  // We map over the Borrowers (not loans) to ensure everyone is included
  const preparedData = borrowers.map((b) => {
    const activeLoanId = activeLoanMap.get(b.id);
    const hasActiveLoan = !!activeLoanId;
    
    // If they have an active loan, look up the schedule. 
    // If they don't, next_due_date is null.
    const nextDueDate = hasActiveLoan 
      ? nextDueDatesMap.get(activeLoanId) || null 
      : null;

    return {
      id: b.id,
      first_name: b.first_name,
      last_name: b.last_name,
      created_at: b.created_at,
      signature_url: b.signature_url,
      has_active_loan: hasActiveLoan,
      next_due_date: nextDueDate,
    };
  });

  // 5. Pass to Client Component
  return <BorrowerDirectoryClient data={preparedData} />;
}