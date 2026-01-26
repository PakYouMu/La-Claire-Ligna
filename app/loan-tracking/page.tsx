import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";
import LoanTrackerClient from "@/components/loan-tracking/loan-tracker-client";
import { ThemeSwitcher } from "@/components/wrappers/theme-switcher-wrapper";

export default function LoanTrackingPage() {
  return (
    <MotionToggleWrapper>
       {/* 
         Full screen container with Helix Background
         Pointer events need to be managed carefully for the canvas interaction 
       */}
       <div className="w-full min-h-screen relative overflow-y-auto overflow-x-hidden">
          {/* Main Content Area */}
          <div className="relative z-10 pt-20 pb-10">
            <LoanTrackerClient />
          </div>
       </div>
    </MotionToggleWrapper>
  );
}