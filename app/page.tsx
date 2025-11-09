import { AuthButton } from "@/components/auth-button";
import InteractiveWaveBackground from "@/components/interactive-wave-bg";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen grid grid-rows-[auto_1fr]">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 py-8">
        {/*
          THE FIX IS HERE: Increased the max-width to allow more separation.
        */}
        <div className="w-full max-w-screen-xl flex justify-between items-center px-8">
          <Link 
            href={"/"} 
            className="font-display text-6xl antialiased tracking-tight [text-shadow:0_0_1px_currentColor]"
          >
            La Clair Ligña
          </Link>
          
          <AuthButton />
        </div>
      </nav>
      
      <div className="relative min-h-0">
        <InteractiveWaveBackground>
          <div className="w-full max-w-5xl px-5">
            <h1 className="font-serif text-[clamp(2rem,8vw,4rem)] leading-tight text-center">
              <span>WHERE YOU KEEP</span><br />
              <span>YOUR FINANCES</span><br />
              <span>STRAIGHT</span>
            </h1>
          </div>
        </InteractiveWaveBackground>
      </div>
    </div>
  );
}