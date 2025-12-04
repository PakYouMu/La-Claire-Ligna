import NavOverlay from "@/components/landing-page/nav-overlay";
import { AuthButton } from "@/components/auth/auth-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. Lock height to screen, disable scroll, relative positioning
    <div className="h-screen w-full relative bg-background">
      
      {/* 2. Navigation (Absolute Top) */}
      <NavOverlay>
        <AuthButton />
      </NavOverlay>

      {/* 3. Content Area 
          - pt-32 pushes content below the NavOverlay
          - h-full ensures it takes remaining space
          - overflow-hidden ensures no scroll bars appear on the page body
      */}
      <div className="relative w-full h-full pt-32 md:pt-40">
        {children}
      </div>
      
    </div>
  );
}