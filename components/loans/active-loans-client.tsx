"use client";

import {
  useState,
  useMemo
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PaymentDialog } from "../dashboard/modals/payment-dialog";
import { CreateLoanModal } from "../dashboard/modals/create-loan-modal";
import { SignaturePreview } from "../dashboard/modals/signature-modal";
import { LoanSummary } from "@/lib/types/schema";
import {
  CalendarClock,
  Banknote,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ActionMenu } from "./action-menu";

export type EnrichedLoan = LoanSummary & {
  next_due_date: string | null;
  signature_url: string | null;
};

interface ActiveLoansClientProps {
  data: EnrichedLoan[];
  fundId: string;
}

export function ActiveLoansClient({ data, fundId }: ActiveLoansClientProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // UPDATED: 8 Items per page
  const itemsPerPage = 8;

  // 1. SORTING LOGIC
  const sortedData = useMemo(() => {
    // Create a shallow copy to avoid mutating props
    return [...data].sort((a, b) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Normalize today

      const aDate = a.next_due_date ? new Date(a.next_due_date) : null;
      const bDate = b.next_due_date ? new Date(b.next_due_date) : null;

      // --- Priority 1 & 2: Overdue First, then Earliest Due Date ---
      // (Since overdue dates are in the past, sorting by date ASC handles both)

      // Handle nulls (Completed loans go to the bottom)
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;

      if (aDate && bDate) {
        const timeDiff = aDate.getTime() - bDate.getTime();
        if (timeDiff !== 0) return timeDiff;
      }

      // --- Priority 3: Largest Principal Amount (Descending) ---
      const principalDiff = b.principal - a.principal;
      if (principalDiff !== 0) return principalDiff;

      // --- Priority 4: Start Date (Assuming Newest/Later start date first) ---
      // You can swap a and b here if you want Oldest first
      const aStart = new Date(a.start_date).getTime();
      const bStart = new Date(b.start_date).getTime();
      const startDiff = bStart - aStart;
      if (startDiff !== 0) return startDiff;

      // --- Priority 5: Borrower Last Name (Alphabetical) ---
      return a.last_name.localeCompare(b.last_name);
    });
  }, [data]);

  // 2. PAGINATION LOGIC (Applied to sortedData)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  const emptyRows = itemsPerPage - currentData.length;

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const getDueStatus = (dateStr: string | null) => {
    if (!dateStr) return { text: "Completed", sub: null, isOverdue: false, isDueToday: false };

    // 1. Get Real Midnight (Start of today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Parse Due Date (Ensure it treats YYYY-MM-DD as Local Midnight, not UTC)
    const due = new Date(dateStr + "T00:00:00");

    // 3. Calculate Difference
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Use round, not ceil

    // 4. Format for display
    const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (diffDays < 0) return { text: `${formatted}`, sub: "Overdue", isOverdue: true, isDueToday: false };

    // STRICT check for Today
    if (diffDays === 0) return { text: "Today", sub: null, isOverdue: false, isDueToday: true };

    if (diffDays <= 3) return { text: formatted, sub: `in ${diffDays}d`, isOverdue: false, isDueToday: false };

    return { text: formatted, sub: null, isOverdue: false, isDueToday: false };
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">

      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-border/50 shrink-0 h-[88px]">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Active Loans</h3>
          <p className="text-sm text-muted-foreground">Manage ongoing collections and balances</p>
        </div>
        <CreateLoanModal fundId={fundId} />
      </div>

      {/* Table Body */}
      <div className="flex-1 w-full">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/50 h-[50px]">
              <TableHead className="w-[200px] font-semibold pl-6">Borrower</TableHead>
              <TableHead className="text-center hidden md:table-cell font-semibold">Start Date</TableHead>
              <TableHead className="text-center font-semibold">Next Due</TableHead>
              <TableHead className="text-center hidden md:table-cell font-semibold">Principal</TableHead>
              <TableHead className="text-center font-semibold">Payday Due</TableHead>
              <TableHead className="text-center w-[150px] font-semibold">Balance</TableHead>
              <TableHead className="text-center font-semibold">Sign</TableHead>
              <TableHead className="text-center font-semibold pr-6 w-[10px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              // Empty State
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-[400px] text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <Banknote className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">No active loans</p>
                    <p className="text-sm">Create a new loan to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {currentData.map((loan) => {
                  const percentPaid = Math.min(100, (loan.total_paid / loan.total_due) * 100);
                  const dueStatus = getDueStatus(loan.next_due_date);

                  let rowClass = "group transition-all duration-200 border-b border-border/40 h-[72px]";
                  if (dueStatus.isOverdue) {
                    rowClass += " bg-red-500/5 hover:bg-red-500/10 border-l-4 border-l-red-500";
                  } else if (dueStatus.isDueToday) {
                    rowClass += " bg-orange-500/5 hover:bg-orange-500/10 border-l-4 border-l-orange-500";
                  } else {
                    rowClass += " hover:bg-muted/30 border-l-4 border-l-transparent pl-4";
                  }

                  return (
                    <TableRow key={loan.id} className={rowClass}>
                      {/* Borrower */}
                      <TableCell className="font-medium pl-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {loan.last_name}, {loan.first_name}
                          </span>
                          <span className={`text-xs flex items-center gap-1 ${dueStatus.isOverdue ? 'text-red-600/80' : 'text-muted-foreground'}`}>
                            {loan.duration_months}mo • {loan.interest_rate}% rate
                          </span>
                        </div>
                      </TableCell>

                      {/* Start Date */}
                      <TableCell className="text-center text-sm text-muted-foreground hidden md:table-cell">
                        {new Date(loan.start_date).toLocaleDateString()}
                      </TableCell>

                      {/* Next Due */}
                      <TableCell>
                        <div className={`flex flex-col items-center justify-center ${dueStatus.isOverdue ? "text-red-600 font-bold" : (dueStatus.isDueToday ? "text-orange-600 font-bold" : "text-foreground")}`}>
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="h-4 w-4 opacity-70" />
                            <span className="text-sm">{dueStatus.text}</span>
                          </div>
                          {dueStatus.sub && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold mt-0.5">
                              {dueStatus.sub}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Principal */}
                      <TableCell className="text-center text-muted-foreground hidden md:table-cell">
                        ₱{loan.principal.toLocaleString()}
                      </TableCell>

                      {/* Payday Due */}
                      <TableCell className="text-center font-medium">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted/50 border border-border/50 text-sm">
                          ₱{loan.amortization_per_payday.toLocaleString()}
                        </div>
                      </TableCell>

                      {/* Balance */}
                      <TableCell>
                        <div className="flex flex-col items-center gap-1.5 w-full">
                          <span className={`font-bold text-sm ${dueStatus.isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                            ₱{loan.remaining_balance.toLocaleString()}
                          </span>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${dueStatus.isOverdue ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Signature */}
                      <TableCell className="text-center align-middle">
                        <div className="flex justify-center opacity-80 hover:opacity-100 transition-opacity">
                          <SignaturePreview
                            url={loan.signature_url}
                            borrowerName={`${loan.first_name} ${loan.last_name}`}
                          />
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-center pr-6">
                        <ActionMenu loan={loan} />
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Ghost Rows to maintain height */}
                {emptyRows > 0 && Array.from({ length: emptyRows }).map((_, i) => (
                  <TableRow key={`ghost-${i}`} className="h-[72px] border-b border-transparent hover:bg-transparent">
                    <TableCell colSpan={8} />
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination / Footer */}
      <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/5 mt-auto h-[72px]">
        <div className="flex gap-4 text-xs text-muted-foreground hidden md:flex">
          <div className="flex items-center gap-1.5">
            <span className="block w-2 h-2 rounded-full bg-green-500"></span> On Time
          </div>
          <div className="flex items-center gap-1.5">
            <span className="block w-2 h-2 rounded-full bg-orange-500"></span> Due Today
          </div>
          <div className="flex items-center gap-1.5">
            <span className="block w-2 h-2 rounded-full bg-red-500"></span> Overdue
          </div>
        </div>

        {sortedData.length > 0 && (
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-xs text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium border border-border/60 rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ChevronLeft className="h-3 w-3" /> Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-border/60 rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Next <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}