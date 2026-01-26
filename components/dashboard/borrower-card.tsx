"use client";

import { useState, useMemo } from "react";
import { FileSignature, Calendar, User, Clock, ChevronLeft, ChevronRight } from "lucide-react";

type Borrower = {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string | null;
  signature_url: string | null;
  has_active_loan: boolean;
  next_due_date: string | null;
};

export function BorrowerDirectoryClient({ data }: { data: Borrower[] }) {
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // UPDATED: Set to 6 items per page
  const itemsPerPage = 6;

  // 1. Filter and Sort Data
  const processedBorrowers = useMemo(() => {
    let filtered = data;

    if (!showAll) {
      filtered = filtered.filter((b) => b.has_active_loan);
    }

    // Sort: Nearest due date first
    return filtered.sort((a, b) => {
      if (a.next_due_date && !b.next_due_date) return -1;
      if (!a.next_due_date && b.next_due_date) return 1;
      if (!a.next_due_date && !b.next_due_date) return 0;
      return new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime();
    });
  }, [data, showAll]);

  // 2. Pagination Logic
  const totalPages = Math.ceil(processedBorrowers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = processedBorrowers.slice(startIndex, startIndex + itemsPerPage);

  // 3. Ghost Rows Logic (To ensure list is always 6 items tall)
  const emptyRows = itemsPerPage - currentData.length;

  // Reset to page 1 if filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [showAll]);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const checkOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    return due < today; 
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full flex flex-col h-full bg-transparent">
      
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-border/50 shrink-0 h-[88px]">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Borrower Directory</h3>
          <p className="text-sm text-muted-foreground">Manage active and past borrowers</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg border border-border/50">
          <input
            type="checkbox"
            id="showAll"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring accent-primary"
          />
          <label htmlFor="showAll" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
            Show inactive
          </label>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 p-6 space-y-3">
        {currentData.length === 0 && totalPages === 0 ? (
           // Absolute empty state (no data at all)
           <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-xl">
            <User className="h-12 w-12 mb-4 opacity-20" />
            <p>No borrowers found.</p>
          </div>
        ) : (
          <>
            {/* Render Actual Data */}
            {currentData.map((borrower) => {
              const isOverdue = checkOverdue(borrower.next_due_date);
              const isCompleted = !borrower.next_due_date;

              let cardClass = "group w-full border rounded-xl p-4 transition-all duration-200 grid grid-cols-2 md:grid-cols-4 gap-4 items-center relative overflow-hidden h-[88px]"; // Fixed height
              let textClass = "text-foreground";
              let labelClass = "text-muted-foreground";
              let iconClass = "text-muted-foreground";

              if (isOverdue) {
                cardClass += " bg-red-500/5 border-red-500/30 hover:bg-red-500/10";
                textClass = "text-red-600 dark:text-red-400 font-medium"; 
                labelClass = "text-red-600/60 dark:text-red-400/60";
                iconClass = "text-red-500";
              } else if (isCompleted) {
                cardClass += " bg-muted/20 border-border/40 opacity-60 hover:opacity-100";
                textClass = "text-muted-foreground";
              } else {
                cardClass += " bg-card hover:bg-accent/50 border-border hover:shadow-sm";
              }

              return (
                <div key={borrower.id} className={cardClass}>
                  
                  {/* 1. Name */}
                  <div className="col-span-1 flex flex-col justify-center z-10">
                    <div className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold ${labelClass}`}>
                      <User className={`h-3 w-3 ${iconClass}`} />
                      Name
                    </div>
                    <div className={`text-sm font-semibold truncate ${textClass}`}>
                      {borrower.last_name}, {borrower.first_name}
                    </div>
                  </div>

                  {/* 2. Date Added */}
                  <div className="col-span-1 flex flex-col justify-center z-10">
                    <div className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold ${labelClass}`}>
                      <Clock className={`h-3 w-3 ${iconClass}`} />
                      Joined
                    </div>
                    <div className={`text-sm ${textClass}`}>
                      {formatDate(borrower.created_at)}
                    </div>
                  </div>

                  {/* 3. Next Due Date */}
                  <div className="col-span-1 flex flex-col justify-center z-10">
                    <div className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold ${labelClass}`}>
                      <Calendar className={`h-3 w-3 ${iconClass}`} />
                      Next Due
                    </div>
                    <div className={`text-sm font-bold ${textClass}`}>
                      {borrower.next_due_date ? (
                        formatDate(borrower.next_due_date)
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Paid Off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4. Signature */}
                  <div className="col-span-1 flex flex-col justify-center z-10">
                    <div className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold ${labelClass}`}>
                      <FileSignature className={`h-3 w-3 ${iconClass}`} />
                      Agreement
                    </div>
                    {borrower.signature_url ? (
                      <a
                        href={borrower.signature_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-sm hover:underline font-medium cursor-pointer flex items-center gap-1 w-fit px-2 py-1 rounded-md transition-colors ${isOverdue ? 'hover:bg-red-100 dark:hover:bg-red-900/20' : 'hover:bg-primary/10'}`}
                      >
                        View Signed
                      </a>
                    ) : (
                      <span className={`text-sm italic opacity-50 ${textClass}`}>N/A</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Render Ghost Rows to maintain height */}
            {emptyRows > 0 && Array.from({ length: emptyRows }).map((_, i) => (
              <div 
                key={`ghost-${i}`} 
                className="w-full h-[88px] border border-transparent rounded-xl" // Invisible placeholder
                aria-hidden="true" 
              />
            ))}
          </>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/5 mt-auto h-[72px]">
          <span className="text-xs text-muted-foreground">
             Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, processedBorrowers.length)} of {processedBorrowers.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium border border-border/60 rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 text-xs font-medium border border-border/60 rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
      </div>
    </div>
  );
}