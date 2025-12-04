import { createClient } from "@/lib/supabase/server";
import { BorrowerDirectoryClient } from "../dashboard/borrower-card"

export async function BorrowerList() {
  const supabase = await createClient();
  
  // 1. Fetch ALL loan summaries
  const { data: loanSummaries } = await supabase
    .from("view_loan_summary")
    .select("*")
    .order("start_date", { ascending: false });

  if (!loanSummaries || loanSummaries.length === 0) {
    return <BorrowerDirectoryClient data={[]} />;
  }

  // 2. Active Loan IDs
  const activeLoanIds = loanSummaries
    .filter(l => l.status === 'ACTIVE')
    .map(loan => loan.id);

  // 3. Pending Payments
  const { data: paymentSchedules } = await supabase
    .from("payment_schedule")
    .select("loan_id, due_date, status")
    .in("loan_id", activeLoanIds)
    .eq("status", "PENDING")
    .order("due_date", { ascending: true });

  // 4. Map Due Dates
  const nextDueDateMap = new Map();
  paymentSchedules?.forEach(schedule => {
    if (!nextDueDateMap.has(schedule.loan_id)) {
      nextDueDateMap.set(schedule.loan_id, schedule.due_date);
    }
  });

  // 5. Fetch Borrower Details
  const borrowerIds = [...new Set(loanSummaries.map(l => l.borrower_id))];
  const { data: borrowerDetails } = await supabase
    .from("borrowers")
    .select("id, signature_url, created_at")
    .in("id", borrowerIds);

  const borrowerDetailsMap = new Map(
    borrowerDetails?.map(b => [b.id, b]) || []
  );

  // 6. Consolidate Data
  const borrowerMap = new Map();

  loanSummaries.forEach((loan) => {
    const bId = loan.borrower_id;
    const details = borrowerDetailsMap.get(bId);
    const thisLoanDueDate = nextDueDateMap.get(loan.id);
    const isActive = loan.status === 'ACTIVE';

    if (!borrowerMap.has(bId)) {
      borrowerMap.set(bId, {
        id: bId,
        first_name: loan.first_name,
        last_name: loan.last_name,
        created_at: details?.created_at || null,
        signature_url: details?.signature_url || null,
        has_active_loan: isActive,
        next_due_date: thisLoanDueDate || null
      });
    } else {
      const existing = borrowerMap.get(bId);
      if (isActive) {
        existing.has_active_loan = true;
        if (thisLoanDueDate) {
          if (!existing.next_due_date || new Date(thisLoanDueDate) < new Date(existing.next_due_date)) {
            existing.next_due_date = thisLoanDueDate;
          }
        }
      }
    }
  });

  const preparedData = Array.from(borrowerMap.values());

  return <BorrowerDirectoryClient data={preparedData} />;
}