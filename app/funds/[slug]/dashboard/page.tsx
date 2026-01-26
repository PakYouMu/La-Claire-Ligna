import { getFundBySlug } from "@/app/actions/funds";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 2. Resolve Slug -> Fund (With Error Handling)
   const fundResult = await getFundBySlug(slug);

  // 2. Check for failure
  if (!fundResult.success || !fundResult.data) {
    // Now we can read the exact error message without crashing
    const errorMessage = fundResult.error || "Fund not found or access denied.";
    redirect(`/error?message=${encodeURIComponent(errorMessage)}`);
  }

  const fund = fundResult.data; // Safe to use now

  // 4. Manual Superuser Check for 'General Fund'
  // (This acts as a second layer of security)
  if (slug === 'general-fund') {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'superuser') {
      redirect("/error?message=Access Denied. Only superusers can view the General Fund.");
    }
  }

  // --- DATA FETCHING (Scoped to Fund) ---
  const fundId = fund.id;
  const isGeneralView = slug === 'general-fund';

  // Helper to attach error handling to queries
  const safeFetch = async (query: any) => {
    const { data, error } = await query;
    if (error) {
      console.error("Data Fetch Error:", error.message);
      return []; // Return empty array on error to prevent crash
    }
    return data || [];
  };

  // A. Wallet Balance
  let walletQuery = supabase.from("view_wallet_balance").select("cash_on_hand");
  if (!isGeneralView) walletQuery = walletQuery.eq("fund_id", fundId);
  const walletRes = await walletQuery; 
  const cashOnHand = isGeneralView 
    ? (walletRes.data || []).reduce((sum, row) => sum + (row.cash_on_hand || 0), 0)
    : (walletRes.data?.[0]?.cash_on_hand || 0);

  // B. Loans
  let loanQuery = supabase.from("view_loan_summary").select("*");
  if (!isGeneralView) loanQuery = loanQuery.eq("fund_id", fundId);
  const loans = await safeFetch(loanQuery);

  // C. Schedule
  let scheduleQuery = supabase.from("payment_schedule").select("*, loans!inner(fund_id)");
  if (!isGeneralView) scheduleQuery = scheduleQuery.eq("loans.fund_id", fundId);
  const schedules = await safeFetch(scheduleQuery);

  // D. Ledger
  let ledgerQuery = supabase.from("ledger").select("*").order("transaction_date", { ascending: true });
  if (!isGeneralView) ledgerQuery = ledgerQuery.eq("fund_id", fundId);
  const ledger = await safeFetch(ledgerQuery);


  // --- CALCULATIONS ---
  // (Your existing calculation logic remains exactly the same below)
  
  const activeLoans = loans.filter((l: any) => l.status === "ACTIVE");
  const totalReceivables = activeLoans.reduce((sum: number, l: any) => sum + l.remaining_balance, 0);
  const totalEquity = cashOnHand + totalReceivables;
  
  const netProfit = loans.reduce((sum: number, l: any) => {
    const interestRatio = l.total_due > 0 ? l.total_interest / l.total_due : 0;
    return sum + (l.total_paid * interestRatio);
  }, 0);

  // Operational Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTs = Date.now();
  const ONE_DAY_MS = 1000 * 60 * 60 * 24;
  const isUnpaid = (status: string) => status === 'PENDING' || status === 'OVERDUE';

  const collectibles = activeLoans.reduce((sum: number, loan: any) => sum + loan.amortization_per_payday, 0);

  const loanDaysLateMap = new Map<string, number>();
  schedules.filter((s: any) => isUnpaid(s.status || '') && s.due_date < todayStr).forEach((s: any) => {
    const dueTs = new Date(s.due_date).getTime();
    const daysLate = Math.ceil((nowTs - dueTs) / ONE_DAY_MS);
    const currentMax = loanDaysLateMap.get(s.loan_id) || 0;
    if (daysLate > currentMax) loanDaysLateMap.set(s.loan_id, daysLate);
  });

  const totalBadDebt = loans.filter((l: any) => (loanDaysLateMap.get(l.id) || 0) > 90)
                            .reduce((sum: number, l: any) => sum + l.remaining_balance, 0);

  const par30Amount = loans.filter((l: any) => (loanDaysLateMap.get(l.id) || 0) > 30)
                           .reduce((sum: number, l: any) => sum + l.remaining_balance, 0);
  const parMetric = totalReceivables > 0 ? (par30Amount / totalReceivables) * 100 : 0;

  const currentMonthPrefix = todayStr.substring(0, 7);
  const dueThisMonth = schedules.filter((s: any) => s.due_date.startsWith(currentMonthPrefix))
                                .reduce((sum: number, s: any) => sum + s.expected_amount, 0);
  const paidThisMonth = schedules.filter((s: any) => s.status === 'PAID' && s.paid_date?.startsWith(currentMonthPrefix))
                                 .reduce((sum: number, s: any) => sum + (s.paid_amount || 0), 0);
  const collectionRate = dueThisMonth > 0 ? (paidThisMonth / dueThisMonth) * 100 : 0;

  // Charts
  const chartDays = 30; 
  const last30Days = [...Array(chartDays)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - ((chartDays - 1) - i));
    return d.toISOString().split('T')[0];
  });

  const cashFlowData = last30Days.map(date => {
    const dayTransactions = ledger.filter((t: any) => {
      const targetDate = t.transaction_date || t.created_at; 
      return targetDate && targetDate.startsWith(date);
    });
    return {
      date: new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
      in: dayTransactions.filter((t: any) => t.category === 'LOAN_REPAYMENT' || t.category === 'CAPITAL_DEPOSIT').reduce((sum: number, t: any) => sum + Number(t.amount), 0),
      out: Math.abs(dayTransactions.filter((t: any) => t.category === 'LOAN_DISBURSEMENT').reduce((sum: number, t: any) => sum + Number(t.amount), 0))
    };
  });

  const agingBuckets = { current: 0, '1-30': 0, '31-90': 0, '90+': 0 };
  activeLoans.forEach((l: any) => {
    const daysLate = loanDaysLateMap.get(l.id) || 0;
    if (daysLate <= 0) agingBuckets['current'] += l.remaining_balance;
    else if (daysLate <= 30) agingBuckets['1-30'] += l.remaining_balance;
    else if (daysLate <= 90) agingBuckets['31-90'] += l.remaining_balance;
    else agingBuckets['90+'] += l.remaining_balance;
  });

  const agingData = [
    { name: 'Current', value: agingBuckets['current'], color: '#10b981' }, 
    { name: '1-30 Days', value: agingBuckets['1-30'], color: '#f59e0b' },
    { name: '31-90 Days', value: agingBuckets['31-90'], color: '#f97316' },
    { name: '90+ Days', value: agingBuckets['90+'], color: '#ef4444' },
  ];

  const channels = { Cash: 0, GCash: 0, Debit: 0, Credit: 0 };
  ledger.filter((t: any) => t.category === 'LOAN_REPAYMENT').forEach((t: any) => {
      const note = (t.notes || '').toLowerCase();
      if (note.includes('gcash')) channels.GCash += Number(t.amount);
      else if (note.includes('debit')) channels.Debit += Number(t.amount);
      else if (note.includes('credit')) channels.Credit += Number(t.amount);
      else channels.Cash += Number(t.amount);
  });

  const channelData = [
    { name: 'Cash', value: channels.Cash, color: '#10b981' }, 
    { name: 'GCash', value: channels.GCash, color: '#007DFE' }, 
    { name: 'Debit', value: channels.Debit, color: '#F59E0B' }, 
    { name: 'Credit', value: channels.Credit, color: '#8B5CF6' } 
  ].filter(c => c.value > 0);

  return (
    <div className="w-full pt-16 md:pt-[123px]">
      <DashboardGrid
        fundId={fundId}
        stats={{
          cashOnHand,
          totalReceivables,
          totalEquity,
          netProfit,
          activeBorrowers: activeLoans.length,
          collectibles,
          collectionRate,
          parMetric,
          totalBadDebt
        }}
        charts={{
          cashFlow: cashFlowData,
          aging: agingData,
          channels: channelData
        }}
      />
    </div>
  );
}