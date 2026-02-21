import {
    Wallet, TrendingUp, Users, AlertTriangle,
    Target, Activity, PiggyBank, PieChart
} from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="w-full min-h-[100dvh] flex flex-col pt-16 md:pt-[123px]">
            <div className="w-full flex-1 flex flex-col">
                <div className="w-full my-auto translate-y-[-30px]">
                    <div className="h-full w-full max-w-[90rem] mx-auto p-responsive relative flex flex-col gap-responsive pb-20">
                        {/* Unified grid identical to MagicBento/DashboardGrid */}
                        <div className="card-grid gap-responsive grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">

                            {/* ROW 1: 4 stat cards */}
                            {[
                                { icon: <Wallet className="h-4 w-4" />, title: "Cash On-Hand" },
                                { icon: <PiggyBank className="h-4 w-4" />, title: "Total Equity" },
                                { icon: <TrendingUp className="h-4 w-4" />, title: "Interest Income" },
                                { icon: <AlertTriangle className="h-4 w-4" />, title: "Bad Debt" }
                            ].map((card, i) => (
                                <div
                                    key={`row1-${i}`}
                                    className="col-span-1 magic-bento-card magic-bento-card--border-glow flex flex-col h-full bg-card rounded-xl border border-border/50 p-6 animate-pulse"
                                    style={{ animationDelay: `${i * 80}ms` }}
                                >
                                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                        {card.icon}
                                        <span className="text-xs font-bold uppercase tracking-wider">{card.title}</span>
                                    </div>
                                    <div className="flex-1 space-y-3 mt-2">
                                        <div className="h-8 w-32 rounded bg-muted/40" />
                                        <div className="h-3 w-28 rounded bg-muted/30" />
                                    </div>
                                </div>
                            ))}

                            {/* ROW 2: 4 operation cards */}
                            {[
                                { icon: <Users className="h-4 w-4" />, title: "Active Borrowers" },
                                { icon: <Target className="h-4 w-4" />, title: "Collectibles" },
                                { icon: <Activity className="h-4 w-4" />, title: "Collection Rate" },
                                { icon: <AlertTriangle className="h-4 w-4" />, title: "Portfolio Risk (PAR30)" }
                            ].map((card, i) => (
                                <div
                                    key={`row2-${i}`}
                                    className="col-span-1 magic-bento-card flex flex-col h-full bg-card rounded-xl border border-border/50 p-6 animate-pulse"
                                    style={{ animationDelay: `${(i + 4) * 80}ms` }}
                                >
                                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                        {card.icon}
                                        <span className="text-xs font-bold uppercase tracking-wider">{card.title}</span>
                                    </div>
                                    <div className="flex-1 space-y-3 mt-2">
                                        <div className="h-8 w-24 rounded bg-muted/40" />
                                        <div className="h-3 w-24 rounded bg-muted/30" />
                                    </div>
                                </div>
                            ))}

                            {/* ROW 3: Charts */}
                            {/* Cash Flow chart (wide & tall) */}
                            <div
                                className="col-span-1 md:col-span-2 xl:col-span-2 row-span-2 magic-bento-card flex flex-col h-full bg-card rounded-xl border border-border/50 p-6 animate-pulse"
                                style={{ animationDelay: "640ms" }}
                            >
                                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Cash Flow (30 Days)</span>
                                </div>
                                <div className="mt-4 w-full h-[300px] flex-1 rounded-lg bg-muted/5 flex items-end gap-1 p-4">
                                    {Array.from({ length: 30 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-t bg-muted/20"
                                            style={{ height: `${20 + Math.random() * 60}%` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Portfolio Health */}
                            <div
                                className="col-span-1 md:col-span-2 xl:col-span-2 magic-bento-card flex flex-col h-full bg-card rounded-xl border border-border/50 p-6 animate-pulse"
                                style={{ animationDelay: "720ms" }}
                            >
                                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                    <PieChart className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Portfolio Health</span>
                                </div>
                                <div className="mt-4 w-full h-[200px] flex-1 rounded-lg bg-muted/5 p-4 flex flex-col gap-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex gap-4 items-center h-full">
                                            <div className="w-16 h-3 rounded bg-muted/30" />
                                            <div className="flex-1 h-4 rounded bg-muted/20" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Channels */}
                            <div
                                className="col-span-1 md:col-span-2 xl:col-span-2 magic-bento-card flex flex-col h-full bg-card rounded-xl border border-border/50 p-6 animate-pulse"
                                style={{ animationDelay: "800ms" }}
                            >
                                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                    <Wallet className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Payment Channels</span>
                                </div>
                                <div className="mt-4 w-full h-[200px] flex-1 rounded-lg bg-muted/5 flex items-center justify-center">
                                    <div className="h-[140px] w-[140px] rounded-full border-[20px] border-muted/20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
