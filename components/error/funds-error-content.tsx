"use client";

import { useMotion } from "@/components/context/motion-context"; 
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FundsErrorContentProps {
  rawError: string; // The raw string from the URL "?message=..."
}

// --- ERROR DICTIONARY (Kept your logic) ---
const ERROR_CATALOG = [
  {
    triggers: ["permission", "access denied", "policy"],
    title: "Access Restricted",
    description: "You do not have the required permissions to view this workspace.",
    solutions: [
      "Contact the Fund Owner to request an invitation",
      "Ensure you are logged into the correct account",
      "Your membership status may have changed"
    ],
    primaryAction: { label: "Return to Selection", href: "/funds" }
  },
  {
    triggers: ["not found", "doesn't exist", "invalid"],
    title: "Workspace Not Found",
    description: "The fund you are looking for does not exist or has been deleted.",
    solutions: [
      "Check if the URL is correct",
      "The fund might have been renamed",
      "Select a different fund from your list"
    ],
    primaryAction: { label: "View All Funds", href: "/funds" }
  },
  {
    triggers: ["authenticated", "login", "session", "fetch user"],
    title: "Session Expired",
    description: "We couldn't verify your identity. Your session may have timed out.",
    solutions: [
      "Try refreshing the page",
      "Log out and log back in to refresh your session"
    ],
    primaryAction: { label: "Log In Again", href: "/auth/login" }
  },
  {
    triggers: ["network", "fetch", "connection", "load"],
    title: "Connection Error",
    description: "We couldn't connect to the server to retrieve your data.",
    solutions: [
      "Check your internet connection",
      "The server might be experiencing high traffic",
      "Try again in a few moments"
    ],
    primaryAction: { label: "Try Again", href: "/funds" } 
  }
];

const DEFAULT_ERROR = {
  title: "Unexpected Error",
  description: "An unspecified error occurred while loading the workspace.",
  solutions: [
    "Try refreshing the page",
    "Return to the dashboard home",
    "Contact support if this persists"
  ],
  primaryAction: { label: "Return Home", href: "/funds" }
};

export default function FundsErrorContent({ rawError }: FundsErrorContentProps) {
  const { reduceMotion } = useMotion();
  const lowerError = (rawError || "").toLowerCase();

  // Find the best matching error config
  const activeConfig = ERROR_CATALOG.find(config => 
    config.triggers.some(trigger => lowerError.includes(trigger))
  ) || DEFAULT_ERROR;

  return (
    <div className="h-screen w-full flex items-center justify-center p-responsive">
      <div className="w-full max-w-[90rem] mx-auto">
        <MagicBento 
          disableAnimations={reduceMotion}
          enableSpotlight={true}
          spotlightRadius={300}
          enableStars={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          glowColor="239, 68, 68" // Destructive Red Glow
          className="grid grid-cols-4 grid-rows-4 gap-responsive"
        >
          {/* Empty cells for positioning - Exact copy from AuthErrorContent */}
          <div className="col-span-1 row-span-1" />
          <div className="col-span-1 row-span-1" />
          <div className="col-span-1 row-span-1" />
          <div className="col-span-1 row-span-1" />

          <div className="col-span-1 row-span-1" />
          
          {/* Center 2x2 Card - Removed 'bg-card/80' overrides */}
          <BentoCard 
            className="col-span-2 row-span-2 col-start-2 row-start-2"
            title="Error" 
            icon={<AlertTriangle className="h-4 w-4"/>}
          >
            <div className="space-y-4">
              
              {/* Header Section */}
              <div className="space-y-2">
                <h2 className="text-responsive-2xl font-bold text-destructive font-serif">
                  {activeConfig.title}
                </h2>
                <p className="text-responsive-sm text-muted-foreground leading-relaxed">
                  {activeConfig.description}
                </p>
                {/* Optional: Show raw technical error for debugging */}
                {rawError && (
                  <p className="text-xs font-mono text-muted-foreground/50 mt-2 truncate">
                    Code: {rawError}
                  </p>
                )}
              </div>

              {/* Solutions List */}
              <div className="space-y-3 pt-2">
                {activeConfig.solutions.map((solution, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-responsive-sm text-muted-foreground">
                    <span className="text-destructive font-bold flex-shrink-0">•</span>
                    <span>{solution}</span>
                  </div>
                ))}
              </div>

              {/* Actions
              <div className="flex gap-3 pt-4">
                <Button asChild variant="default" className="flex-1">
                  <Link href={activeConfig.primaryAction.href}>
                    {activeConfig.primaryAction.label}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/">
                    Go to Landing
                  </Link>
                </Button>
              </div> */}
            </div>
          </BentoCard>
        </MagicBento>
      </div>
    </div>
  );
}