import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";
import SignUpSuccessContent from "@/components/auth/sign-up-success-content";

export default function Page() {
  return (
    <MotionToggleWrapper>
      <SignUpSuccessContent />
    </MotionToggleWrapper>
  );
}