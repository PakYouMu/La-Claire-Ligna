import { createClient } from "@/lib/supabase/server";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PaymentDialog } from "./modals/payment-dialog";
import { CreateLoanModal } from "./modals/create-loan-modal";
import { SignaturePreview } from "./modals/signature-modal";
import { LoanSummary } from "@/lib/types/schema"; 
import { CalendarClock } from "lucide-react";

interface ActiveLoansTableProps {
  fundId: string;
}

export async function ActiveLoansTable({fundId}: ActiveLoansTableProps) {
  const supabase = await createClient();
  
  // 1. Fetch Loans
  const { data: loans, error } = await supabase
    .from("view_loan_summary")
    .select("*")
    .eq("status", "ACTIVE")
    .eq("fund_id", fundId)
    .order("start_date", { ascending: false });

  if (error || !loans) {
    console.error("Error fetching loans:", error);
    return <div>Error loading loans.</div>;
  }

  // 2. Fetch Details (Schedule & Signatures)
  const loanIds = loans.map(l => l.id);
  const borrowerIds = [...new Set(loans.map(l => l.borrower_id))];

  const { data: schedules } = await supabase
    .from("payment_schedule")
    .select("loan_id, due_date")
    .in("loan_id", loanIds)
    .eq("status", "PENDING")
    .order("due_date", { ascending: true });

  const nextDueDateMap = new Map();
  schedules?.forEach((s) => {
    if (!nextDueDateMap.has(s.loan_id)) {
      nextDueDateMap.set(s.loan_id, s.due_date);
    }
  });

  const { data: borrowerDetails } = await supabase
    .from("borrowers")
    .select("id, signature_url")
    .in("id", borrowerIds);

  const signatureMap = new Map();
  borrowerDetails?.forEach((b) => {
    signatureMap.set(b.id, b.signature_url);
  });

  const getDueStatus = (dateStr: string | undefined) => {
    if (!dateStr) return { text: "Completed", sub: null, isOverdue: false, isDueToday: false };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dateStr);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (diffDays < 0) return { text: `${formatted}`, sub: "Overdue", isOverdue: true, isDueToday: false };
    if (diffDays === 0) return { text: "Today", sub: null, isOverdue: false, isDueToday: true };
    if (diffDays <= 3) return { text: formatted, sub: `in ${diffDays}d`, isOverdue: false, isDueToday: false };
    return { text: formatted, sub: null, isOverdue: false, isDueToday: false };
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header Section */}
      <div className="p-responsive flex items-center justify-between border-b border-border shrink-0 flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-responsive-xl">Active Loans</h3>
          <p className="text-responsive-sm text-muted-foreground">Manage collections and balances.</p>
        </div>
        <CreateLoanModal />
      </div>
      
      {/* Table Section */}
      <div className="flex-1 overflow-auto responsive-table-container">
        <Table className="responsive-table">
          <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
            <TableRow>
              <TableHead className="col-borrower responsive-table-header">
                Borrower
              </TableHead>
              <TableHead className="col-start-date responsive-table-header text-center hidden md:table-cell">
                Start Date
              </TableHead>
              <TableHead className="col-next-due responsive-table-header text-center">
                Next Due
              </TableHead>
              <TableHead className="col-principal responsive-table-header text-center hidden md:table-cell">
                Principal
              </TableHead>
              <TableHead className="col-payday-due responsive-table-header text-center">
                Payday Due
              </TableHead>
              <TableHead className="col-balance responsive-table-header text-center">
                Balance
              </TableHead>
              <TableHead className="col-signature responsive-table-header text-center">
                Sign
              </TableHead>
              <TableHead className="col-action responsive-table-header text-center">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loans || loans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-responsive-sm">
                  No active loans. Click "New Loan" to scan a card.
                </TableCell>
              </TableRow>
            ) : (
              loans.map((loan: LoanSummary) => {
                const percentPaid = Math.min(100, (loan.total_paid / loan.total_due) * 100);
                const nextDue = nextDueDateMap.get(loan.id);
                const dueStatus = getDueStatus(nextDue);
                const signatureUrl = signatureMap.get(loan.borrower_id);

                let rowClass = "group transition-colors border-b";
                if (dueStatus.isOverdue) {
                  rowClass += " bg-destructive/10 hover:bg-destructive/20 shadow-[inset_4px_0_0_0_theme(colors.destructive.DEFAULT)]";
                } else if (dueStatus.isDueToday) {
                  rowClass += " bg-orange-500/10 hover:bg-orange-500/20 shadow-[inset_4px_0_0_0_orange]";
                } else {
                  rowClass += " hover:bg-muted/50";
                }

                return (
                  <TableRow key={loan.id} className={rowClass}>
                    {/* Borrower */}
                    <TableCell className="col-borrower responsive-table-cell font-medium">
                      <div className="flex flex-col">
                        <span className="text-responsive-base font-semibold">
                          {loan.last_name}, {loan.first_name}
                        </span>
                        <span className={`text-responsive-xs flex items-center gap-1 ${dueStatus.isOverdue ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                          {loan.duration_months} mo • {loan.interest_rate}%
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Start Date - Hidden on mobile */}
                    <TableCell className="col-start-date responsive-table-cell text-center text-responsive-sm hidden md:table-cell">
                      <span className={dueStatus.isOverdue ? 'text-foreground' : 'text-muted-foreground'}>
                        {new Date(loan.start_date).toLocaleDateString()}
                      </span>
                    </TableCell>

                    {/* Next Due */}
                    <TableCell className="col-next-due responsive-table-cell">
                      <div className={`flex flex-col items-center ${dueStatus.isOverdue ? "text-destructive font-bold" : (dueStatus.isDueToday ? "text-orange-600 font-bold" : "")}`}>
                        <div className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="text-responsive-sm truncate">{dueStatus.text}</span>
                        </div>
                        {dueStatus.sub && (
                          <span className="text-[0.625rem] uppercase tracking-wider font-bold">
                            {dueStatus.sub}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Principal - Hidden on mobile */}
                    <TableCell className="col-principal responsive-table-cell text-center text-muted-foreground hidden md:table-cell">
                      ₱{loan.principal.toLocaleString()}
                    </TableCell>
                    
                    {/* Payday Due */}
                    <TableCell className="col-payday-due responsive-table-cell text-center font-medium">
                      <span className="text-responsive-sm">₱{loan.amortization_per_payday.toLocaleString()}</span>
                    </TableCell>

                    {/* Balance */}
                    <TableCell className="col-balance responsive-table-cell">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`font-bold text-responsive-sm ${dueStatus.isOverdue ? 'text-destructive' : 'text-red-600'}`}>
                          ₱{loan.remaining_balance.toLocaleString()}
                        </span>
                        <div className="h-1 w-12 md:w-20 bg-muted/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${dueStatus.isOverdue ? 'bg-destructive' : 'bg-green-500'}`}
                            style={{ width: `${percentPaid}%` }} 
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Signature */}
                    <TableCell className="col-signature responsive-table-cell text-center align-middle">
                      <div className="flex justify-center">
                        <SignaturePreview 
                          url={signatureUrl} 
                          borrowerName={`${loan.first_name} ${loan.last_name}`} 
                        />
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="col-action responsive-table-cell text-center">
                      <PaymentDialog 
                        loanId={loan.id} 
                        borrowerName={`${loan.first_name} ${loan.last_name}`}
                        amortization={loan.amortization_per_payday}
                        balance={loan.remaining_balance}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}