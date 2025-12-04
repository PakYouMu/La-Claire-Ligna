"use client";

import { useState, useMemo } from "react";
import { FileSignature, Calendar, User, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have shadcn button, otherwise use standard <button>

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
  const itemsPerPage = 5;

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

  // Helper: Check Overdue
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
    <div className="rounded-md border bg-card w-full flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b shrink-0">
        <h3 className="font-semibold text-foreground">Borrower Directory</h3>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showAll"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
          />
          <label htmlFor="showAll" className="text-xs text-muted-foreground cursor-pointer select-none">
            Show all history
          </label>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 p-4 space-y-3">
        {currentData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No borrowers found.
          </div>
        ) : (
          currentData.map((borrower) => {
            const isOverdue = checkOverdue(borrower.next_due_date);
            const isCompleted = !borrower.next_due_date;

            // --- STYLING LOGIC ---
            // We use a horizontal grid layout (grid-cols-4 on desktop)
            let cardClass = "w-full border rounded-lg p-4 transition-all hover:shadow-md grid grid-cols-2 md:grid-cols-4 gap-4 items-center";
            let textClass = "text-foreground";
            let labelClass = "text-muted-foreground";
            let iconClass = "text-muted-foreground";

            if (isOverdue) {
              // OVERDUE: Red theme
              cardClass += " bg-destructive/10 border-destructive/50 shadow-sm";
              textClass = "text-destructive font-medium"; 
              labelClass = "text-destructive/80";
              iconClass = "text-destructive";
            } else if (isCompleted) {
              // COMPLETED: Muted
              cardClass += " bg-muted/30 border-border opacity-70";
              textClass = "text-muted-foreground";
            } else {
              // ACTIVE: Default
              cardClass += " bg-card border-border";
            }

            return (
              <div key={borrower.id} className={cardClass}>
                
                {/* 1. Name */}
                <div className="col-span-1 flex flex-col justify-center">
                  <div className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 ${labelClass}`}>
                    <User className={`h-3 w-3 ${iconClass}`} />
                    Name
                  </div>
                  <div className={`text-sm font-semibold truncate ${textClass}`}>
                    {borrower.last_name}, {borrower.first_name}
                  </div>
                </div>

                {/* 2. Date Added */}
                <div className="col-span-1 flex flex-col justify-center">
                  <div className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 ${labelClass}`}>
                    <Clock className={`h-3 w-3 ${iconClass}`} />
                    Added
                  </div>
                  <div className={`text-sm ${textClass}`}>
                    {formatDate(borrower.created_at)}
                  </div>
                </div>

                {/* 3. Next Due Date */}
                <div className="col-span-1 flex flex-col justify-center">
                  <div className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 ${labelClass}`}>
                    <Calendar className={`h-3 w-3 ${iconClass}`} />
                    Next Due
                  </div>
                  <div className={`text-sm font-bold ${textClass}`}>
                    {borrower.next_due_date ? (
                      formatDate(borrower.next_due_date)
                    ) : (
                      <span className="italic font-normal opacity-70">Done</span>
                    )}
                  </div>
                </div>

                {/* 4. Signature */}
                <div className="col-span-1 flex flex-col justify-center">
                  <div className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 ${labelClass}`}>
                    <FileSignature className={`h-3 w-3 ${iconClass}`} />
                    Signature
                  </div>
                  {borrower.signature_url ? (
                    <a
                      href={borrower.signature_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-sm hover:underline font-medium cursor-pointer flex items-center ${isOverdue ? 'text-destructive' : 'text-blue-500 hover:text-blue-600'}`}
                    >
                      View File
                    </a>
                  ) : (
                    <span className={`text-sm italic opacity-70 ${textClass}`}>Missing</span>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {processedBorrowers.length > 0 && (
        <div className="p-4 border-t flex items-center justify-between bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="h-3 w-3" /> Prev
              </button>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight className="h-3 w-3" />
              </button>
            </div>
        </div>
      )}
    </div>
  );
}