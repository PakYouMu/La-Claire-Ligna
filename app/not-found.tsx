// app/not-found.tsx
import Link from "next/link";
import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";
import MetallicSheen from "@/components/wrappers/metallic-sheen-wrapper";

export default function NotFound() {
  return (
    // We replicate the exact container structure from your Home component
    <div className="h-screen relative isolate overflow-hidden">
      <MotionToggleWrapper>
        <div className="w-full h-full px-5 flex flex-col items-center justify-center text-center space-y-8">
          
          {/* Large 404 Text with Sheen */}
          <MetallicSheen>
            <h1 className="font-serif text-[clamp(6rem,20vw,12rem)] leading-none font-bold tracking-tighter select-none">
              404
            </h1>
          </MetallicSheen>

          <div className="space-y-4 max-w-lg">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight">
              Page Not Found
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              It seems you've ventured into uncharted financial territory. 
              The page you are looking for has been moved or does not exist.
            </p>
          </div>

          {/* Return Button */}
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md border border-input bg-background px-8 font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-300">
                ←
              </span>
              <span>Return Home</span>
            </Link>
          </div>
          
        </div>
      </MotionToggleWrapper>
    </div>
  );
}