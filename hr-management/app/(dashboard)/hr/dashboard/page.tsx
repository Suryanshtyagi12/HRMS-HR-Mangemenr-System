'use client';

import React from 'react';
import { Briefcase, Users, Handshake, Smile, TrendingUp, TrendingDown, MoreHorizontal, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useHRDashboard } from '@/hooks/useDashboard';
import { JobRequisitionWidget } from '@/components/recruitment/JobRequisitionWidget';
import { useAuthStore } from '@/store/authStore';

export default function HRDashboard() {
  const { data: dashboardData } = useHRDashboard();
  const user = useAuthStore((s) => s.user);
  const data = dashboardData || null;

  if (!data) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen font-body animate-pulse">
        <div className="flex justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded-lg"></div>
            <div className="h-4 w-48 bg-muted rounded-md"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-[16px]"></div>
          ))}
        </div>
        <div className="h-24 bg-muted rounded-[16px] mb-8 w-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-7 h-[400px] bg-muted rounded-[16px]"></div>
          <div className="lg:col-span-5 h-[400px] bg-muted rounded-[16px]"></div>
        </div>
      </div>
    );
  }

  // Calculate funnel percentages based on applied = 100%
  const applied = data.hiringFunnel.applied || 1;
  const pScreened = Math.round((data.hiringFunnel.screened / applied) * 100) || 0;
  const pInterviewed = Math.round((data.hiringFunnel.interviewed / applied) * 100) || 0;
  const pOffered = Math.round((data.hiringFunnel.offered / applied) * 100) || 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-300 font-body">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-foreground font-headline mb-1 tracking-tight">Good morning, {user?.name || "HR Team"} 👋</h2>
          <p className="text-[14px] text-muted-foreground">Here's what's happening today.</p>
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { title: "Total Headcount", icon: Users, val: "842", trend: "+5% vs last month", trendIcon: TrendingUp, positive: true },
          { title: "Open Reqs", icon: Briefcase, val: data.openPositions, trend: "-2% vs last month", trendIcon: TrendingDown, positive: true },
          { title: "Offer Acceptance", icon: Handshake, val: "92%", trend: "+4% vs last month", trendIcon: TrendingUp, positive: true },
          { title: "Employee NPS", icon: Smile, val: "48", trend: "+12 vs last month", trendIcon: TrendingUp, positive: true },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-[16px] shadow-sm hover:shadow-hover border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[13px] text-muted-foreground font-medium">{stat.title}</p>
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <stat.icon size={18} />
              </div>
            </div>
            <div>
              <h3 className="text-[24px] font-bold text-card-foreground font-headline mb-2">{stat.val}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${stat.positive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                <stat.trendIcon size={12} /> {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <JobRequisitionWidget />

      {/* Row 2: 60/40 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-8">
        {/* Left: Recruitment Funnel (60%) */}
        <div className="lg:col-span-7 bg-card rounded-[16px] shadow-sm border border-border p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold font-headline text-card-foreground">Recruitment Funnel</h3>
            <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal size={20} /></button>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {[
              { label: "Applied", val: data.hiringFunnel.applied, percent: 100, color: "bg-slate-300" },
              { label: "Screened", val: data.hiringFunnel.screened, percent: pScreened, color: "bg-indigo-300" },
              { label: "Interviewed", val: data.hiringFunnel.interviewed, percent: pInterviewed, color: "bg-indigo-500" },
              { label: "Offered", val: data.hiringFunnel.offered, percent: pOffered, color: "bg-purple-600" },
            ].map((step, i) => (
              <div key={i}>
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-muted-foreground font-medium">{step.label}</span>
                  <span className="text-card-foreground font-bold">{step.val}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className={`${step.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${step.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Upcoming Interviews (40%) */}
        <div className="lg:col-span-5 bg-card rounded-[16px] shadow-sm border border-border p-0 flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h3 className="text-[16px] font-bold font-headline text-card-foreground">Upcoming Interviews</h3>
            <Link href="/hr/recruitment/pipeline" className="text-indigo-600 dark:text-indigo-400 text-[13px] font-medium hover:text-indigo-700 dark:hover:text-indigo-300">View all</Link>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[320px]">
            {data.recentApplications.slice(0, 4).map((app: any, i: number) => (
               <div key={i} className="flex items-center space-x-4 p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0 cursor-pointer">
                 <div className="relative shrink-0">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 dark:from-indigo-900 to-violet-100 dark:to-violet-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-[14px]">
                      {app.name.charAt(0)}
                   </div>
                   <span className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 border-2 border-background rounded-full"></span>
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-[14px] font-semibold text-card-foreground truncate">{app.name}</p>
                   <p className="text-[13px] text-muted-foreground truncate">{app.role}</p>
                 </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[13px] font-medium text-card-foreground">
                      {app.time ? new Date(app.time).toLocaleTimeString([], { timeStyle: 'short' }) : 'Pending'}
                    </p>
                    {app.link ? (
                      <a href={app.link} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-400">Google Meet</a>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/70">Offline</p>
                    )}
                  </div>
               </div>
            ))}
            {data.recentApplications.length === 0 && (
               <div className="text-[14px] text-muted-foreground text-center py-8">No upcoming interviews.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
