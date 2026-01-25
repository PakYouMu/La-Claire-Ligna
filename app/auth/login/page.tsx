import { LoginForm } from "@/components/auth/login-form";
import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";

export default function LoginPage() {
  return (
    <MotionToggleWrapper>
      <div className="w-[100vw] h-[100vh] relative pointer-events-none overflow-hidden">
        <div 
        className="fixed top-0 bottom-0 left-0 w-[100vw] backdrop-invert z-0"
        style={{
          maskImage: 'linear-gradient(90deg, black 0%, black 20%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 75%, transparent 90%)',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%,  transparent 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 20%, rgba(0,0,0,0.8) 40%,  rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 75%, transparent 90%)',
          }}
        />

        <div className="absolute inset-y-0 left-[5%] md:left-[8%] flex items-center z-10 pointer-events-auto">
          <div className="w-full max-w-sm">
             <LoginForm className="bg-transparent border-none shadow-none" />
          </div>
        </div>
        
      </div>
    </MotionToggleWrapper>
  );
}