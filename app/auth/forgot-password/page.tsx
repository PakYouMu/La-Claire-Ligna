import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";
import { ThemeBasedForgotPasswordForms } from "@/components/theme-based/theme-based-forgot-password-forms";

export default function Page() {
  return (
    <MotionToggleWrapper>
      <div className="w-[100vw] h-[100vh] relative pointer-events-none overflow-hidden">
        <div 
          className="fixed top-0 bottom-0 left-0 w-[100vw] backdrop-invert z-0 pointer-events-none"
          style={{
            maskImage: 'linear-gradient(90deg, white 38%, transparent 0%)',
            WebkitMaskImage: 'linear-gradient(90deg, white 38%, transparent 0%)',
          }}
        />

        <ThemeBasedForgotPasswordForms />
      </div>
    </MotionToggleWrapper>
  );
}