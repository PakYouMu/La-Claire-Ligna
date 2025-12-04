import { createClient } from "@/lib/supabase/server";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PaymentDialog } from "./payment-dialog";
import { CreateLoanModal } from "./create-loan-modal"; 
import { SignaturePreview } from "./signature-modal";
import { LoanSummary } from "@/lib/types/schema"; 
import { CalendarClock } from "lucide-react";

const COLUMN_WIDTHS = {
  borrower: "w-[5%]", 
  startDate: "w-[1%]",
  nextDue: "w-[1%]",  
  principal: "w-[1%]",
  paydayDue: "w-[1%]",
  balance: "w-[1%]",  
  signature: "w-[1%]",
  action: "w-[1%]",   
};

const CELL_PADDING = {
  vertical: "py-2",  
  horizontal: "px-2",
};

const ICON_GAP = "gap-1";

export async function ActiveLoansTable() {
  const supabase = await createClient();
  
  // 1. Fetch Loans
  const { data: loans, error } = await supabase
    .from("view_loan_summary")
    .select("*")
    .eq("status", "ACTIVE") 
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

  // Helper: Returns styling info AND a boolean 'isOverdue' flag
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
    <div className="rounded-md border bg-card shadow-sm h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b shrink-0">
        <div>
            <h3 className="font-semibold text-lg">Active Loans</h3>
            <p className="text-sm text-muted-foreground">Manage collections and balances.</p>
        </div>
        <CreateLoanModal />
      </div>
      
      <div className="flex-1 overflow-auto">
        <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
            <TableRow>
                <TableHead className={`${COLUMN_WIDTHS.borrower} ${CELL_PADDING.horizontal}`}>
                  Borrower
                </TableHead>
                <TableHead className={`${COLUMN_WIDTHS.startDate} ${CELL_PADDING.horizontal} text-center`}>
                  Start Date
                </TableHead>
                <TableHead className={`${COLUMN_WIDTHS.nextDue} ${CELL_PADDING.horizontal} text-center`}>
                  Next Due
                </TableHead>
                <TableHead className={`${COLUMN_WIDTHS.principal} ${CELL_PADDING.horizontal} text-center`}>
                  Principal
                </TableHead>
                <TableHead className={`${COLUMN_WIDTHS.paydayDue} ${CELL_PADDING.horizontal} text-center`}>
                  Payday Due
                </TableHead>
                <TableHead className={`${COLUMN_WIDTHS.balance} ${CELL_PADDING.horizontal} text-center`}>
                  Balance
                </TableHead>
                <TableHead className={`${COLUMN_WIDTHS.signature} ${CELL_PADDING.horizontal} text-center`}>
                  Sign
                </TableHead>
                <TableHead className={`${COLUMN_WIDTHS.action} ${CELL_PADDING.horizontal} text-center`}>
                  Action
                </TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {!loans || loans.length === 0 ? (
                <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No active loans. Click "New Loan" to scan a card.
                </TableCell>
                </TableRow>
            ) : (
                loans.map((loan: LoanSummary) => {
                    const percentPaid = Math.min(100, (loan.total_paid / loan.total_due) * 100);
                    const nextDue = nextDueDateMap.get(loan.id);
                    const dueStatus = getDueStatus(nextDue);
                    const signatureUrl = signatureMap.get(loan.borrower_id);

                    // =========================================================
                    // 🔧 FIX: Using Shadow instead of Border to prevent pixel shift
                    // =========================================================
                    let rowClass = "group transition-colors border-b";
                    if (dueStatus.isOverdue) {
                        // Inset shadow simulates border without adding width
                        rowClass += " bg-destructive/10 hover:bg-destructive/20 shadow-[inset_4px_0_0_0_theme(colors.destructive.DEFAULT)]";
                    } else if (dueStatus.isDueToday) {
                        rowClass += " bg-orange-500/10 hover:bg-orange-500/20 shadow-[inset_4px_0_0_0_orange]";
                    } else {
                        rowClass += " hover:bg-muted/50";
                    }

                    return (
                    <TableRow key={loan.id} className={rowClass}>
                        {/* Borrower */}
                        <TableCell className={`${COLUMN_WIDTHS.borrower} ${CELL_PADDING.horizontal} ${CELL_PADDING.vertical} font-medium`}>
                            <div className="flex flex-col">
                                <span className="text-base font-semibold">
                                  {loan.last_name}, {loan.first_name}
                                </span>
                                <span className={`text-xs flex items-center gap-1 ${dueStatus.isOverdue ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                                    {loan.duration_months} mo • {loan.interest_rate}%
                                </span>
                            </div>
                        </TableCell>
                        
                        {/* Start Date */}
                        <TableCell className={`${COLUMN_WIDTHS.startDate} ${CELL_PADDING.horizontal} ${CELL_PADDING.vertical} text-center text-sm ${dueStatus.isOverdue ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {new Date(loan.start_date).toLocaleDateString()}
                        </TableCell>

                        {/* Next Due */}
                        <TableCell className={`${COLUMN_WIDTHS.nextDue} ${CELL_PADDING.horizontal} ${CELL_PADDING.vertical}`}>
                            <div className={`flex flex-col items-center ${dueStatus.isOverdue ? "text-destructive font-bold" : (dueStatus.isDueToday ? "text-orange-600 font-bold" : "")}`}>
                                <div className={`flex items-center ${ICON_GAP}`}>
                                    <CalendarClock className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm truncate">{dueStatus.text}</span>
                                </div>
                                {dueStatus.sub && (
                                    <span className="text-[10px] uppercase tracking-wider font-bold">
                                        {dueStatus.sub}
                                    </span>
                                )}
                            </div>
                        </TableCell>

                        {/* Principal */}
                        <TableCell className={`${COLUMN_WIDTHS.principal} ${CELL_PADDING.horizontal} ${CELL_PADDING.vertical} text-center text-muted-foreground`}>
                            ₱{loan.principal.toLocaleString()}
                        </TableCell>
                        
                        {/* Payday Due */}
                        <TableCell className={`${COLUMN_WIDTHS.paydayDue} ${CELL_PADDING.horizontal} ${CELL_PADDING.vertical} text-center font-medium`}>
                            ₱{loan.amortization_per_payday.toLocaleString()}
                        </TableCell>

                        {/* Balance */}
                        <TableCell className={`${COLUMN_WIDTHS.balance} ${CELL_PADDING.horizontal} ${CELL_PADDING.vertical}`}>
                            <div className="flex flex-col items-center gap-1">
                                <span className={`font-bold ${dueStatus.isOverdue ? 'text-destructive' : 'text-red-600'}`}>
                                    ₱{loan.remaining_balance.toLocaleString()}
                                </span>
                                <div className="h-1 w-20 bg-muted/50 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ${dueStatus.isOverdue ? 'bg-destructive' : 'bg-green-500'}`}
                                        style={{ width: `${percentPaid}%` }} 
                                    />
                                </div>
                            </div>
                        </TableCell>

                        {/* Signature */}
                        <TableCell className={`${COLUMN_WIDTHS.signature} ${CELL_PADDING.horizontal} ${CELL_PADDING.vertical} text-center align-middle`}>
                            <div className="flex justify-center">
                                <SignaturePreview 
                                    url={signatureUrl} 
                                    borrowerName={`${loan.first_name} ${loan.last_name}`} 
                                />
                            </div>
                        </TableCell>

                        {/* Action */}
                        <TableCell className={`${COLUMN_WIDTHS.action} ${CELL_PADDING.horizontal} ${CELL_PADDING.vertical} text-center`}>
                            <PaymentDialog 
                                loanId={loan.id} 
                                borrowerName={`${loan.first_name} ${loan.last_name}`}
                                amortization={loan.amortization_per_payday}
                                balance={loan.remaining_balance}
                            />
                        </TableCell>
                    </TableRow>
                    )
                })
            )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}