import { SignUpForm } from "@/components/auth/sign-up-form";
import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";

export default function SignUpPage() {
  return (
    <MotionToggleWrapper>
      <div className="w-[100vw] h-[100vh] relative pointer-events-none overflow-hidden">
        
        {/* 
          1. THE INVERSION STRIP 
          - Matches Login Page exactly
        */}
        <div 
          className="fixed top-0 bottom-0 left-0 w-[100vw] backdrop-invert-[1] z-0"
          style={{
            // The exact smooth gradient we finalized
            maskImage: 'linear-gradient(to right, black 0%, black 25%, transparent 95%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 0%, black 25%, transparent 95%, transparent 100%)'
          }}
        />

        {/* 2. THE FORM CONTAINER */}
        <div className="absolute inset-y-0 left-[5%] md:left-[8%] flex items-center z-10 pointer-events-auto">
          <div className="w-full max-w-sm">
             {/* Pass transparent props to blend with the strip */}
             <SignUpForm className="bg-transparent border-none shadow-none" />
          </div>
        </div>
        
      </div>
    </MotionToggleWrapper>
  );
}