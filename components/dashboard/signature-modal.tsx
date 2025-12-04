"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileSignature } from "lucide-react";

interface SignaturePreviewProps {
  url: string | null;
  borrowerName: string;
}

export function SignaturePreview({ url, borrowerName }: SignaturePreviewProps) {
  const [open, setOpen] = useState(false);

  // Remove focus from close button when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const closeButton = document.querySelector('.signature-modal button[data-slot="dialog-close"]') as HTMLElement;
        if (closeButton) {
          closeButton.blur();
        }
      }, 0);
    }
  }, [open]);

  if (!url) {
    return (
      <div className="h-10 w-16 bg-muted/20 rounded flex items-center justify-center text-muted-foreground border border-transparent" title="No signature">
        <FileSignature className="h-4 w-4 opacity-50" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div 
          className="h-10 w-16 relative bg-transparent border border-border/50 rounded cursor-pointer hover:bg-muted/20 hover:border-primary/30 transition-all overflow-hidden group"
          title="Click to expand"
        >
          <img 
            src={url} 
            alt="Signature" 
            className="h-full w-full object-contain p-1 group-hover:scale-110 transition-transform opacity-80 group-hover:opacity-100" 
          />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md signature-modal">
        <DialogHeader>
          <DialogTitle>Signature: {borrowerName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center justify-center py-6">
          <div className="relative w-full h-48">
            <img 
              src={url} 
              alt={`${borrowerName} Signature`}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}