import { getUserRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";

export default async function DashboardPage() {
  const role = await getUserRole();
  if (!role) redirect("/auth/login");

  const supabase = await createClient();

  // 1. Fetch Core Views
  const [walletRes, loansRes, scheduleRes, ledgerRes] = await Promise.all([
    supabase.from("view_wallet_balance").select("cash_on_hand").single(),
    supabase.from("view_loan_summary").select("*"),
    supabase.from("payment_schedule").select("*"),
    supabase.from("ledger").select("*").order("created_at", { ascending: true })
  ]);

  const cashOnHand = walletRes.data?.cash_on_hand || 0;
  const loans = loansRes.data || [];
  const schedules = scheduleRes.data || [];
  const ledger = ledgerRes.data || [];

  // 2. Calculate Financial Stats
  const activeLoans = loans.filter(l => l.status === "ACTIVE");
  const totalReceivables = activeLoans.reduce((sum, l) => sum + l.remaining_balance, 0);
  const totalEquity = cashOnHand + totalReceivables;
  
  const netProfit = loans.reduce((sum, l) => {
    const interestRatio = l.total_due > 0 ? l.total_interest / l.total_due : 0;
    return sum + (l.total_paid * interestRatio);
  }, 0);

  // 3. Calculate Operational Stats (Timezone Agnostic Logic)
  
  // Get Today as simple YYYY-MM-DD string to match DB standard
  // We use the server's local date which is sufficient for this context
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTs = Date.now();
  const ONE_DAY_MS = 1000 * 60 * 60 * 24;

  const isUnpaid = (status: string) => status === 'PENDING' || status === 'OVERDUE';

  // Today's Due: Explicit String Compare
  const todaysDue = schedules
    .filter(s => {
      // s.due_date is YYYY-MM-DD from DB
      return s.due_date === todayStr && isUnpaid(s.status || '');
    })
    .reduce((sum, s) => sum + s.expected_amount, 0);

  // Calculate Days Late for each schedule to detect Bad Debt/PAR
  const overdueSchedules = schedules.filter(s => isUnpaid(s.status || '') && s.due_date < todayStr);
  
  const loanDaysLateMap = new Map<string, number>();

  overdueSchedules.forEach(s => {
    const dueTs = new Date(s.due_date).getTime();
    const daysLate = Math.ceil((nowTs - dueTs) / ONE_DAY_MS);
    
    // Track the max days late for each loan
    const currentMax = loanDaysLateMap.get(s.loan_id) || 0;
    if (daysLate > currentMax) {
      loanDaysLateMap.set(s.loan_id, daysLate);
    }
  });

  // Bad Debt (>90 days overdue)
  const badDebtLoans = loans.filter(l => (loanDaysLateMap.get(l.id) || 0) > 90);
  const totalBadDebt = badDebtLoans.reduce((sum, l) => sum + l.remaining_balance, 0);

  // Portfolio At Risk (PAR 30) (>30 days overdue)
  const par30Loans = loans.filter(l => (loanDaysLateMap.get(l.id) || 0) > 30);
  const par30Amount = par30Loans.reduce((sum, l) => sum + l.remaining_balance, 0);
  const parMetric = totalReceivables > 0 ? (par30Amount / totalReceivables) * 100 : 0;

  // Collection Rate (This Month)
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
  
  const dueThisMonth = schedules
    .filter(s => s.due_date.startsWith(currentMonthPrefix))
    .reduce((sum, s) => sum + s.expected_amount, 0);
    
  const paidThisMonth = schedules
    .filter(s => s.status === 'PAID' && s.paid_date && s.paid_date.startsWith(currentMonthPrefix))
    .reduce((sum, s) => sum + (s.paid_amount || 0), 0);

  const collectionRate = dueThisMonth > 0 ? (paidThisMonth / dueThisMonth) * 100 : 0;

  // 4. Prepare Chart Data
  
  // A. Cash Flow (Last 30 Days)
  const last30Days = [...Array(30)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const cashFlowData = last30Days.map(date => {
    // String match instead of Date objects
    const dayTransactions = ledger.filter(t => t.created_at.startsWith(date));
    return {
      date: new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
      in: dayTransactions
        .filter(t => t.category === 'LOAN_REPAYMENT' || t.category === 'CAPITAL_DEPOSIT')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      out: Math.abs(dayTransactions
        .filter(t => t.category === 'LOAN_DISBURSEMENT')
        .reduce((sum, t) => sum + Number(t.amount), 0))
    };
  });

  // B. Loan Aging (Risk Profile)
  const agingBuckets = { current: 0, '1-30': 0, '31-90': 0, '90+': 0 };
  
  activeLoans.forEach(l => {
    // If we already calculated max days late, use it
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

  // C. Payment Channels
  const channels = { Cash: 0, GCash: 0, Debit: 0, Credit: 0 };
  
  ledger
    .filter(t => t.category === 'LOAN_REPAYMENT')
    .forEach(t => {
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
    <DashboardGrid
      stats={{
        cashOnHand,
        totalReceivables,
        totalEquity,
        netProfit,
        activeBorrowers: activeLoans.length,
        todaysDue,
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
  );
}