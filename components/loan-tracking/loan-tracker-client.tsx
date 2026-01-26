"use client";

import { useState } from "react";
import { lookupBorrowerData, LoanLookupResult } from "@/app/actions/loan-lookup";
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, Search, Activity, FileText, 
  History, ArrowLeft, CheckCircle2, AlertTriangle, Wallet 
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip as RechartsTooltip, Legend 
} from "recharts";
import { cn } from "@/lib/utils";

// --- HEALTH SCORE LOGIC ---
function calculateHealth(loans: LoanLookupResult['loans']) {
  if (!loans.length) return { score: 100, status: "No History", color: "text-muted-foreground", hex: "#94a3b8" };

  let score = 100;
  const activeLoans = loans.filter(l => l.status === "ACTIVE");
  const paidLoans = loans.filter(l => l.status === "PAID");

  // 1. Deduction for multiple active loans (Over-leveraged)
  if (activeLoans.length > 1) score -= (activeLoans.length - 1) * 10;

  // 2. Deduction for high remaining balance ratio
  activeLoans.forEach(loan => {
    const paidRatio = loan.total_paid / loan.total_due;
    if (paidRatio < 0.2) score -= 5; // New loan or barely paid
  });

  // 3. Boost for paid off loans
  score += (paidLoans.length * 5);

  // Clamp Score
  score = Math.max(0, Math.min(100, score));

  // Determine Status
  let status = "Moderate";
  let color = "text-yellow-500";
  let hex = "#eab308";

  if (score >= 85) { status = "Excellent"; color = "text-emerald-500"; hex = "#10b981"; }
  else if (score >= 70) { status = "Good"; color = "text-green-500"; hex = "#22c55e"; }
  else if (score < 50) { status = "At Risk"; color = "text-destructive"; hex = "#ef4444"; }

  return { score, status, color, hex };
}

export default function LoanTrackerClient() {
  const [state, setState] = useState<'INPUT' | 'RESULTS'>('INPUT');
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LoanLookupResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await lookupBorrowerData(fullName);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setData(result.data);
        setState('RESULTS');
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFullName("");
    setData(null);
    setState('INPUT');
  };

  // --- RENDER INPUT STATE ---
  if (state === 'INPUT') {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <MagicBento className="grid-cols-1 md:grid-cols-4 w-full max-w-4xl aspect-square md:aspect-video">
           {/* Center Card (2x2) */}
           <BentoCard 
             title="Loan Tracking" 
             icon={<Search className="h-4 w-4" />}
             className="md:col-start-2 md:col-span-2 md:row-span-2 flex flex-col justify-center min-h-[350px]"
           >
             <div className="flex flex-col h-full justify-center space-y-6 mt-4">
               <div className="text-center space-y-2">
                 <h2 className="text-responsive-xl font-serif font-bold">Borrower Portal</h2>
                 <p className="text-responsive-sm text-muted-foreground">
                   Enter your full name to view your health score and active loans.
                 </p>
               </div>

               <form onSubmit={handleSearch} className="space-y-4 w-full max-w-xs mx-auto">
                 <div className="space-y-2">
                   <Label htmlFor="fullname">Full Name</Label>
                   <Input 
                     id="fullname" 
                     placeholder="e.g. Maria Santos" 
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     className="h-11 bg-background/40 backdrop-blur-sm"
                     required
                   />
                 </div>

                 {error && (
                   <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">
                     {error}
                   </div>
                 )}

                 <Button type="submit" className="w-full h-11" disabled={isLoading}>
                   {isLoading ? (
                     <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</>
                   ) : (
                     "Retrieve Data"
                   )}
                 </Button>
               </form>
             </div>
           </BentoCard>
        </MagicBento>
      </div>
    );
  }

  // --- RENDER RESULTS STATE ---
  if (!data) return null;

  const { borrower, loans, payments } = data;
  const health = calculateHealth(loans);
  const activeLoans = loans.filter(l => l.status === "ACTIVE");
  const paidLoans = loans.filter(l => l.status === "PAID");

  // Chart Data: Active Balance vs Paid
  const totalDue = loans.reduce((acc, curr) => acc + curr.total_due, 0);
  const totalPaid = loans.reduce((acc, curr) => acc + curr.total_paid, 0);
  
  const chartData = [
    { name: 'Paid', value: totalPaid, color: '#10b981' },
    { name: 'Balance', value: totalDue - totalPaid, color: '#f59e0b' },
  ];

  return (
    <div className="w-full max-w-[90rem] mx-auto p-responsive pb-20 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Welcome, {borrower.first_name}</h1>
          <p className="text-muted-foreground">Loan Portfolio & Health Summary</p>
        </div>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Search Again
        </Button>
      </div>

      {/* Results Grid */}
      <MagicBento className="grid-cols-1 md:grid-cols-4 grid-rows-auto gap-responsive">
        
        {/* 1. HEALTH SCORE */}
        <BentoCard 
          title="Health Score" 
          icon={<Activity className="h-4 w-4" />}
          className="col-span-1 md:col-span-1 md:row-span-2"
        >
          <div className="flex flex-col items-center justify-center h-full py-8 space-y-4">
            <div className="relative flex items-center justify-center">
              {/* Radial Progress */}
              <svg className="h-32 w-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
                <circle 
                  cx="64" cy="64" r="56" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={351} 
                  strokeDashoffset={351 - (351 * health.score) / 100}
                  className={health.color}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${health.color}`}>{health.score}</span>
                <span className="text-xs text-muted-foreground uppercase">/ 100</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-xl font-bold ${health.color}`}>{health.status}</div>
              <p className="text-xs text-muted-foreground mt-2 px-2">
                Calculated based on repayment history and active leverage.
              </p>
            </div>
          </div>
        </BentoCard>

        {/* 2. ACTIVE LOANS LIST */}
        <BentoCard 
          title={`Active Loans (${activeLoans.length})`} 
          icon={<FileText className="h-4 w-4" />}
          className="col-span-1 md:col-span-3 min-h-[250px]"
        >
          <div className="mt-4 space-y-3">
             {activeLoans.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-32 border border-dashed rounded-lg bg-muted/10 text-muted-foreground">
                 <CheckCircle2 className="h-6 w-6 mb-2 text-green-500" />
                 <p>No active loans. You are debt-free!</p>
               </div>
             ) : (
               activeLoans.map(loan => (
                 <div key={loan.id} className="flex flex-col md:flex-row justify-between items-center p-4 rounded-lg bg-background/40 border border-border/50">
                   <div className="flex items-center gap-4 mb-2 md:mb-0">
                     <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                       <Wallet className="h-5 w-5" />
                     </div>
                     <div>
                       <div className="font-bold text-lg">
                         {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(loan.remaining_balance)}
                       </div>
                       <div className="text-xs text-muted-foreground">
                         Remaining Balance
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex gap-6 text-right">
                     <div>
                       <div className="text-xs text-muted-foreground">Original Principal</div>
                       <div className="font-medium">
                         {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(loan.principal)}
                       </div>
                     </div>
                     <div>
                        <div className="text-xs text-muted-foreground">Start Date</div>
                        <div className="font-medium">{new Date(loan.start_date).toLocaleDateString()}</div>
                     </div>
                   </div>
                 </div>
               ))
             )}
          </div>
        </BentoCard>

        {/* 3. PAYMENT BREAKDOWN CHART */}
        <BentoCard 
          title="Payment Status" 
          icon={<AlertTriangle className="h-4 w-4" />}
          className="col-span-1 md:col-span-2"
        >
          <div className="h-[200px] w-full mt-2">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                 />
                 <Legend verticalAlign="middle" align="right" layout="vertical" />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* 4. HISTORY SUMMARY */}
        <BentoCard 
          title="History" 
          icon={<History className="h-4 w-4" />}
          className="col-span-1 md:col-span-1"
        >
          <div className="mt-4 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Loans</span>
              <span className="text-2xl font-bold">{loans.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fully Paid</span>
              <span className="text-2xl font-bold text-emerald-500">{paidLoans.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payments</span>
              <span className="text-2xl font-bold text-blue-500">{payments.length}</span>
            </div>
          </div>
        </BentoCard>

      </MagicBento>
    </div>
  );
}