import { createClient } from "@/lib/supabase/server";
import { BorrowerDirectoryClient } from "../dashboard/borrower-card";

interface BorrowerListProps {
  fundId: string;
}

export async function BorrowerList({ fundId }: BorrowerListProps) {
  const supabase = await createClient();

  // 1. Fetch borrowers, active loans, and all local loans in parallel for optimal speed
  const [borrowersRes, activeLoansRes, allLoansRes] = await Promise.all([
    supabase
      .from("borrowers")
      .select("id, first_name, last_name, signature_url, created_at")
      .eq("fund_id", fundId)
      .is("deleted_at", null),
    supabase
      .from("view_loan_summary")
      .select("id, borrower_id, status")
      .eq("fund_id", fundId)
      .eq("status", "ACTIVE"),
    supabase
      .from("loans")
      .select("id, borrower_id, is_void, status")
      .eq("fund_id", fundId)
  ]);

  const borrowers = borrowersRes.data || [];
  const activeLoansRaw = activeLoansRes.data || [];
  const allLoansRaw = allLoansRes.data || [];

  // 2. Handle empty state
  if (borrowers.length === 0) {
    return <BorrowerDirectoryClient data={[]} />;
  }

  const voidMaps = new Map(allLoansRaw.map(l => [l.id, l.is_void]));
  const activeLoans = activeLoansRaw.filter(l => !voidMaps.get(l.id));
  const voidedBorrowerIds = new Set(allLoansRaw.filter(l => l.is_void).map(l => l.borrower_id));

  const activeLoanMap = new Map(); // Map<BorrowerID, LoanID>
  const activeLoanIds: string[] = [];

  activeLoans.forEach((loan) => {
    activeLoanMap.set(loan.borrower_id, loan.id);
    activeLoanIds.push(loan.id);
  });

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
      if (!nextDueDatesMap.has(schedule.loan_id)) {
        nextDueDatesMap.set(schedule.loan_id, schedule.due_date);
      }
    });
  }

  // 5. Consolidate Data
  const preparedData: any[] = [];

  borrowers.forEach((b) => {
    const bLoans = allLoansRaw.filter((l) => l.borrower_id === b.id);
    const activeLoanId = activeLoanMap.get(b.id);
    const hasActiveLoan = !!activeLoanId;

    const voidedLoans = bLoans.filter((l) => l.is_void);
    const hasOtherLoans = bLoans.filter((l) => !l.is_void && l.status !== "ACTIVE").length > 0;

    // 1. If they have an active loan -> emit an active card
    if (hasActiveLoan) {
      preparedData.push({
        id: b.id + "-active", // unique ID
        first_name: b.first_name,
        last_name: b.last_name,
        created_at: b.created_at,
        signature_url: b.signature_url,
        has_active_loan: true,
        next_due_date: nextDueDatesMap.get(activeLoanId) || null,
        is_voided: false,
      });
    }

    // 2. Emit a card for EACH voided loan
    voidedLoans.forEach((vLoan) => {
      preparedData.push({
        id: b.id + "-void-" + vLoan.id,
        first_name: b.first_name,
        last_name: b.last_name,
        created_at: b.created_at,
        signature_url: b.signature_url,
        has_active_loan: false,
        next_due_date: null,
        is_voided: true,
      });
    });

    // 3. If NO active loans and NO voided loans, but they exist (they have paid off loans or just an empty borrower record) -> emit 1 Paid Off card
    // Or if they have paid off loans but also voided loans, do we emit a paid off card? Let's emit a paid off card if they have ANY paid off/inactive non-void loans AND no active loans. Or just emit a default card if they have no active and no voided.
    if (!hasActiveLoan && (hasOtherLoans || bLoans.length === 0)) {
      preparedData.push({
        id: b.id + "-inactive",
        first_name: b.first_name,
        last_name: b.last_name,
        created_at: b.created_at,
        signature_url: b.signature_url,
        has_active_loan: false,
        next_due_date: null,
        is_voided: false,
      });
    }
  });

  return <BorrowerDirectoryClient data={preparedData} />;
}
