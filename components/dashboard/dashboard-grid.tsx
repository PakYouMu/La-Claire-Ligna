"use client";

import { useMotion } from "@/components/context/motion-context"; 
import MagicBento, { BentoCard } from "@/components/ui/magic-bento";
import { MotionToggleButton } from "@/components/ui/motion-toggle-button";
import { AddCapitalDialog } from "@/components/dashboard/modals/add-capital-dialog";
import { 
  Wallet, TrendingUp, Users, AlertTriangle, 
  Target, Activity, PiggyBank, PieChart 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Pie, PieChart as RePieChart, Legend
} from 'recharts';

interface DashboardGridProps {
  stats: {
    cashOnHand: number;
    totalReceivables: number;
    totalEquity: number;
    netProfit: number;
    activeBorrowers: number;
    todaysDue: number;
    collectionRate: number;
    parMetric: number;
    totalBadDebt: number;
  };
  charts: {
    cashFlow: any[];
    aging: any[];
    channels: any[];
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-2 rounded shadow-lg text-xs z-50">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardGrid({ stats, charts }: DashboardGridProps) {
  const { reduceMotion } = useMotion(); 
  const formatPHP = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
  const formatPct = new Intl.NumberFormat("en-PH", { style: "percent", maximumFractionDigits: 1 });

  return (
    <div className="h-full w-full max-w-[90rem] mx-auto p-responsive relative flex flex-col gap-responsive pb-20">
      <MagicBento 
        disableAnimations={reduceMotion}
        enableSpotlight={true}
        enableStars={false}
        spotlightRadius={300}
        className="gap-responsive" 
      >
        {/* ROW 1: Financials */}
        <BentoCard className="col-span-1" title="Cash On-Hand" icon={<Wallet className="h-4 w-4"/>}>
          <div className="mt-2">
            <div className="text-responsive-xl font-bold">{formatPHP.format(stats.cashOnHand)}</div>
            <div className="mt-3 relative z-20"> 
              <AddCapitalDialog />
            </div>
          </div>
        </BentoCard>

        <BentoCard className="col-span-1" title="Total Equity" icon={<PiggyBank className="h-4 w-4"/>}>
          <div className="mt-2">
            <div className="text-responsive-xl font-bold text-blue-500">{formatPHP.format(stats.totalEquity)}</div>
            <p className="text-responsive-xs text-muted-foreground mt-1">Cash + Receivables</p>
          </div>
        </BentoCard>

        <BentoCard className="col-span-1" title="Interest Income" icon={<TrendingUp className="h-4 w-4"/>}>
          <div className="mt-2">
            <div className="text-responsive-xl font-bold text-green-500">{formatPHP.format(stats.netProfit)}</div>
            <p className="text-responsive-xs text-muted-foreground mt-1">Total Earned</p>
          </div>
        </BentoCard>

        <BentoCard className="col-span-1" title="Bad Debt" icon={<AlertTriangle className="h-4 w-4"/>}>
          <div className="mt-2">
            <div className="text-responsive-xl font-bold text-destructive">{formatPHP.format(stats.totalBadDebt)}</div>
            <p className="text-responsive-xs text-muted-foreground mt-1">Written Off / 90+ Days</p>
          </div>
        </BentoCard>

        {/* ROW 2: Operations */}
        <BentoCard className="col-span-1" title="Active Borrowers" icon={<Users className="h-4 w-4"/>}>
          <div className="mt-2">
            <div className="text-responsive-2xl font-bold text-foreground">{stats.activeBorrowers}</div>
            <p className="text-responsive-xs text-muted-foreground mt-1">Open loans</p>
          </div>
        </BentoCard>

        <BentoCard className="col-span-1" title="Due Today" icon={<Target className="h-4 w-4"/>}>
          <div className="mt-2">
            <div className="text-responsive-2xl font-bold text-orange-500">{formatPHP.format(stats.todaysDue)}</div>
            <p className="text-responsive-xs text-muted-foreground mt-1">Daily Target</p>
          </div>
        </BentoCard>

        <BentoCard className="col-span-1" title="Collection Rate" icon={<Activity className="h-4 w-4"/>}>
          <div className="mt-2">
            <div className={`text-responsive-2xl font-bold ${stats.collectionRate >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
              {formatPct.format(stats.collectionRate / 100)}
            </div>
            <p className="text-responsive-xs text-muted-foreground mt-1">This Month</p>
          </div>
        </BentoCard>

        <BentoCard className="col-span-1" title="Portfolio Risk (PAR30)" icon={<AlertTriangle className="h-4 w-4"/>}>
          <div className="mt-2">
            <div className={`text-responsive-2xl font-bold ${stats.parMetric > 10 ? 'text-destructive' : 'text-green-500'}`}>
              {formatPct.format(stats.parMetric / 100)}
            </div>
            <p className="text-responsive-xs text-muted-foreground mt-1">% Overdue {'>'} 30 Days</p>
          </div>
        </BentoCard>

        {/* ROW 3: Charts */}
        {/* UPDATED: col-span-2 ensures full width until 1280px */}
        <BentoCard className="col-span-2 row-span-2" title="Cash Flow (30 Days)" icon={<TrendingUp className="h-4 w-4"/>}>
          <div className="mt-4 w-full h-[300px]" style={{ position: 'relative', width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.cashFlow}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} minTickGap={30}/>
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="in" name="Collections" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="out" name="Disbursements" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* UPDATED: col-span-2 ensures full width until 1280px */}
        <BentoCard className="col-span-2" title="Portfolio Health" icon={<PieChart className="h-4 w-4"/>}>
          <div className="w-full h-[200px]" style={{ position: 'relative', width: '100%', height: '200px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart layout="vertical" data={charts.aging} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                 <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                   {charts.aging.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* UPDATED: col-span-2 ensures full width until 1280px */}
        <BentoCard className="col-span-2" title="Payment Channels" icon={<Wallet className="h-4 w-4"/>}>
          <div className="w-full h-[200px]" style={{ position: 'relative', width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={charts.channels}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.channels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

      </MagicBento>

      <div className="fixed bottom-8 left-8 z-50">
        <MotionToggleButton />
      </div>
    </div>
  );
}