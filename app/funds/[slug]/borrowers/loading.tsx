export default function BorrowersLoading() {
    return (
        <div className="w-full min-h-[100dvh] flex flex-col pt-16 md:pt-[123px]">
            <div className="w-full flex-1 flex flex-col">
                {/* Adjust translate-y-[-20px] below to move the grid up or down */}
                <div className="w-full my-auto translate-y-[-40px]">
                    <div className="h-full w-full max-w-[90rem] mx-auto p-responsive relative flex flex-col gap-responsive pb-20">
                        <div className="rounded-xl border border-border/50 bg-card min-h-[780px] flex flex-col animate-in fade-in duration-300">
                            <div className="w-full flex flex-col h-full bg-transparent flex-1">

                                {/* Header */}
                                <div className="p-6 flex items-center justify-between border-b border-border/50 shrink-0 h-[88px]">
                                    <div className="space-y-2">
                                        <div className="h-6 w-48 rounded bg-muted/50 animate-pulse" />
                                        <div className="h-4 w-56 rounded bg-muted/30 animate-pulse" style={{ animationDelay: "100ms" }} />
                                    </div>
                                    <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg border border-border/50 h-10 w-32 animate-pulse" style={{ animationDelay: "200ms" }}>
                                    </div>
                                </div>

                                {/* List Content */}
                                <div className="flex-1 p-6 space-y-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="group w-full border rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center relative overflow-hidden h-[88px] bg-card border-border/40 animate-pulse"
                                            style={{ animationDelay: `${i * 100}ms` }}
                                        >

                                            {/* 1. Name */}
                                            <div className="col-span-1 flex flex-col justify-center z-10">
                                                <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1 font-semibold text-muted-foreground/50">
                                                    <div className="h-3 w-3 rounded bg-muted/30" />
                                                    <div className="h-2 w-8 rounded bg-muted/30" />
                                                </div>
                                                <div className="h-4 w-32 rounded bg-muted/40" />
                                            </div>

                                            {/* 2. Date Added */}
                                            <div className="col-span-1 flex flex-col justify-center z-10">
                                                <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1 font-semibold text-muted-foreground/50">
                                                    <div className="h-3 w-3 rounded bg-muted/30" />
                                                    <div className="h-2 w-10 rounded bg-muted/30" />
                                                </div>
                                                <div className="h-4 w-24 rounded bg-muted/30" />
                                            </div>

                                            {/* 3. Next Due Date */}
                                            <div className="col-span-1 flex flex-col justify-center z-10">
                                                <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1 font-semibold text-muted-foreground/50">
                                                    <div className="h-3 w-3 rounded bg-muted/30" />
                                                    <div className="h-2 w-12 rounded bg-muted/30" />
                                                </div>
                                                <div className="h-4 w-28 rounded bg-muted/40" />
                                            </div>

                                            {/* 4. Signature */}
                                            <div className="col-span-1 flex flex-col justify-center z-10">
                                                <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1 font-semibold text-muted-foreground/50">
                                                    <div className="h-3 w-3 rounded bg-muted/30" />
                                                    <div className="h-2 w-16 rounded bg-muted/30" />
                                                </div>
                                                <div className="h-4 w-12 rounded bg-muted/30" />
                                            </div>

                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/5 mt-auto h-[72px]">
                                    <div className="h-3 w-24 rounded bg-muted/30 animate-pulse" />
                                    <div className="flex gap-2">
                                        <div className="h-8 w-24 rounded bg-muted/30 animate-pulse" />
                                        <div className="h-8 w-20 rounded bg-muted/30 animate-pulse" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
