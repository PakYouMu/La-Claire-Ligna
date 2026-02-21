export default function FundsLoading() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6 pt-16 md:pt-[123px]">
            {/* Header skeleton */}
            <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="h-10 w-64 rounded-lg bg-muted/40 mx-auto animate-pulse" />
                <div className="h-4 w-80 rounded bg-muted/25 mx-auto animate-pulse" style={{ animationDelay: "100ms" }} />
            </div>

            {/* Fund cards grid */}
            <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-border/50 bg-card p-6 min-h-[180px] space-y-4 animate-pulse"
                        style={{ animationDelay: `${200 + i * 100}ms` }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded bg-muted/40" />
                            <div className="h-3 w-20 rounded bg-muted/50" />
                        </div>
                        <div className="h-4 w-28 rounded bg-muted/30" />
                        <div className="mt-auto pt-4">
                            <div className="h-5 w-16 rounded-full bg-muted/25" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer skeleton */}
            <div className="mt-12 h-3 w-40 rounded bg-muted/20 animate-pulse" style={{ animationDelay: "500ms" }} />
        </div>
    );
}
