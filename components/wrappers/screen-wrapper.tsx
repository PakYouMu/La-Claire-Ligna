import MotionToggleWrapper from "@/components/wrappers/motion-toggle-wrapper";
import MetallicSheen from "@/components/wrappers/metallic-sheen-wrapper";

export function ScreenGuard() {
  return (
    <div className="screen-size-guard">
        <div className="w-full h-full px-6 flex flex-col items-center justify-center text-center z-50 pointer-events-auto">
          
          <MetallicSheen>
            <h1 
              className="font-serif font-bold tracking-tight select-none mb-6"
              style={{ 
                fontSize: "clamp(1.5rem, 8vw, 3rem)",
                lineHeight: "1.2"
              }}
            >
              Oh?
            </h1>
          </MetallicSheen>

          <div 
            className="text-muted-foreground font-medium max-w-[80%]"
            style={{ 
              fontSize: "clamp(0.875rem, 4vw, 1.125rem)" 
            }}
          >
            <p className="mb-4">
              Your screen is actually smaller than we would like you to utilize the app in.
            </p>
            <br/>
            <p>
              Please transfer to a larger screen size for the optimal usage of the app.
            </p>
          </div>

        </div>
    </div>
  );
}