import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";
import LoanTrackerClient from "@/components/loan-tracking/loan-tracker-client";

export default function LoanTrackingPage() {
  return (
    <MotionToggleWrapper>
       <div className="w-full min-h-screen relative overflow-y-auto overflow-x-hidden">
          <LoanTrackerClient />
       </div>
    </MotionToggleWrapper>
  );
}