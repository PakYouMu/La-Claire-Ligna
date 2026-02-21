import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";
import { ThemeBasedLoginForms } from "@/components/theme-based/theme-based-login-forms";

export default function LoginPage() {
  return (
    <MotionToggleWrapper>
      <div className="w-[100vw] h-[100vh] relative pointer-events-none overflow-hidden">
        <div
          className="hidden md:block fixed top-0 bottom-0 left-0 w-[100vw] backdrop-invert-[1] z-0 pointer-events-none"
          style={{
            maskImage: 'linear-gradient(90deg, black 0%, black 45%, transparent 65%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 45%, transparent 65%, transparent 100%)',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        />

        {/* Mobile-only Inverted Background Mask - Smoother full-screen fade */}
        <div
          className="md:hidden fixed top-0 bottom-0 left-0 w-[100vw] backdrop-invert-[1] z-0 pointer-events-none"
          style={{
            maskImage: 'linear-gradient(180deg, black 0%, black 60%, transparent 95%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 60%, transparent 95%, transparent 100%)',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        />

        <ThemeBasedLoginForms />
      </div>
    </MotionToggleWrapper>
  );
}