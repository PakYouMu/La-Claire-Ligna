import { createClient } from "@/lib/supabase/server";
import { BorrowerDirectoryClient } from "../dashboard/borrower-card";

interface BorrowerListProps {
  fundId: string;
}

export async function BorrowerList({ fundId }: BorrowerListProps) {
  const supabase = await createClient();

  // 1. Fetch Borrowers
  const { data: borrowers } = await supabase
    .from("borrowers")
    .select("id, first_name, last_name, signature_url, created_at")
    .eq("fund_id", fundId);

  // 2. Handle Empty State
  // If null or empty, return empty array immediately so the UI shows "No borrowers"
  if (!borrowers || borrowers.length === 0) {
    return <BorrowerDirectoryClient data={[]} />;
  }

  // 3. Fetch ACTIVE Loans for this Fund
  const { data: activeLoans } = await supabase
    .from("view_loan_summary")
    .select("id, borrower_id, status")
    .eq("fund_id", fundId)
    .eq("status", "ACTIVE");

  const activeLoanMap = new Map(); // Map<BorrowerID, LoanID>
  const activeLoanIds: string[] = [];

  if (activeLoans) {
    activeLoans.forEach((loan) => {
      activeLoanMap.set(loan.borrower_id, loan.id);
      activeLoanIds.push(loan.id);
    });
  }

  // 4. Fetch Next Payment Schedule for ACTIVE loans only
  let nextDueDatesMap = new Map(); // Map<LoanID, DateString>
  
  if (activeLoanIds.length > 0) {
    const { data: schedules } = await supabase
      .from("payment_schedule")
      .select("loan_id, due_date")
      .in("loan_id", activeLoanIds)
      .eq("status", "PENDING")
      .order("due_date", { ascending: true }); 

    schedules?.forEach((schedule) => {
      // Only set the first one found (earliest date due to sorting)
      if (!nextDueDatesMap.has(schedule.loan_id)) {
        nextDueDatesMap.set(schedule.loan_id, schedule.due_date);
      }
    });
  }

  // 5. Consolidate Data
  const preparedData = borrowers.map((b) => {
    const activeLoanId = activeLoanMap.get(b.id);
    const hasActiveLoan = !!activeLoanId;
    
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

  return <BorrowerDirectoryClient data={preparedData} />;
}