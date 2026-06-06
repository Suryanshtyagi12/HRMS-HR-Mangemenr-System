'use client';

import React, { useState } from 'react';
import { HeadcountChart } from '@/components/charts/HeadcountChart';
import { PayrollChart } from '@/components/charts/PayrollChart';
import { AttendanceDonut } from '@/components/charts/AttendanceDonut';
import { Users, DollarSign, Briefcase, TrendingDown, Sparkles, Loader2, TrendingUp, MoreHorizontal, UserMinus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAdminDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store/authStore';

export default function AdminDashboard() {
  const { data: dashboardData, isLoading: loading } = useAdminDashboard();
  const user = useAuthStore((s) => s.user);
  const data = dashboardData || null;
  
  const [report, setReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState('');

  const generateReport = async () => {
    setGenerating(true);
    setReportError('');
    try {
      const { api } = await import('@/lib/api');
      const res = await api.post('/ai/insights');
      setReport(res.data?.data);
    } catch (err) {
      setReportError('Failed to generate report. Try again.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen font-body animate-pulse">
        <div className="flex justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded-lg"></div>
            <div className="h-4 w-48 bg-muted rounded-md"></div>
          </div>
          <div className="h-10 w-40 bg-muted rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-[16px]"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="col-span-1 lg:col-span-2 h-[360px] bg-muted rounded-[16px]"></div>
          <div className="col-span-1 h-[360px] bg-muted rounded-[16px]"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[360px] bg-muted rounded-[16px]"></div>
          <div className="h-[360px] bg-muted rounded-[16px]"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-300 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-foreground font-headline mb-1 tracking-tight">Good morning, {user?.name || "Admin"} 👋</h2>
          <p className="text-[14px] text-muted-foreground">Here's what's happening today.</p>
        </div>
        <button 
          onClick={generateReport} 
          disabled={generating}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl px-5 py-2.5 font-semibold text-[14px] hover:opacity-90 hover:shadow-glow transition-all duration-200 shadow-sm flex items-center gap-2"
        >
          {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          Generate AI Report
        </button>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { title: "Total Employees", icon: Users, val: data.totalEmployees, trend: `+${data.newHiresThisMonth > 0 ? 2.4 : 0}% vs last month`, trendIcon: TrendingUp, positive: true },
          { title: "Monthly Payroll", icon: DollarSign, val: `₹${(data.totalPayrollThisMonth || 0).toLocaleString()}`, trend: "+1.2% vs last month", trendIcon: TrendingUp, positive: true },
          { title: "Open Positions", icon: Briefcase, val: data.openPositions, trend: "-2% vs last month", trendIcon: TrendingDown, positive: false },
          { title: "Attrition Rate", icon: UserMinus, val: `${data.attritionRate.toFixed(1)}%`, trend: "+1.2% vs last month", trendIcon: TrendingUp, positive: false },
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

      {/* Row 2: Charts (Headcount & Dept) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="col-span-1 lg:col-span-2 bg-card rounded-[16px] shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold font-headline text-card-foreground">Headcount Trend</h3>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="h-[280px] w-full">
             <HeadcountChart data={data.headcountTrend} />
          </div>
        </div>

        <div className="col-span-1 bg-card rounded-[16px] shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold font-headline text-card-foreground">Department Distribution</h3>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.departmentBreakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="count" nameKey="dept">
                  {data.departmentBreakdown.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Charts (Payroll & Attendance) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="bg-card rounded-[16px] shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold font-headline text-card-foreground">Payroll Expense Trend</h3>
            <select className="text-[13px] bg-muted border border-border rounded-lg px-3 py-1.5 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>This Year</option>
            </select>
          </div>
          <div className="h-[280px] w-full">
             <PayrollChart data={data.payrollTrend} />
          </div>
        </div>

        <div className="bg-card rounded-[16px] shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold font-headline text-card-foreground">Today's Attendance</h3>
            <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full px-3 py-1 text-[11px] font-semibold">Live</span>
          </div>
          <div className="h-[280px] w-full">
             <AttendanceDonut data={data.attendanceToday} />
          </div>
        </div>
      </div>

      {/* Row 4: Lists (Top Performers & Pending) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="col-span-1 lg:col-span-2 bg-card rounded-[16px] shadow-sm border border-border p-0 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h3 className="text-[16px] font-bold font-headline text-card-foreground">Top Performers</h3>
            <button className="text-indigo-600 dark:text-indigo-400 text-[13px] font-medium hover:text-indigo-700 dark:hover:text-indigo-300">View All</button>
          </div>
          <div className="flex-1">
            {data.topPerformers.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 dark:from-indigo-900 to-violet-100 dark:to-violet-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[14px]">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-card-foreground text-[14px]">{p.name}</span>
                    <span className="block text-[13px] text-muted-foreground">General Department</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full px-2.5 py-1 text-[12px] font-bold">{p.score}</span>
                </div>
              </div>
            ))}
            {data.topPerformers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-[14px]">No top performers data available</div>
            )}
          </div>
        </div>

        <div className="col-span-1 bg-card rounded-[16px] shadow-sm border border-border p-0 flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h3 className="text-[16px] font-bold font-headline text-card-foreground">Recent Activity</h3>
            <span className="bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold">{data.pendingActions?.length || 0}</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[320px]">
            {data.pendingActions && data.pendingActions.map((action: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${action.color || 'bg-slate-500'}`}></div>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-card-foreground">{action.type}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{action.detail}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
            {(!data.pendingActions || data.pendingActions.length === 0) && (
                <div className="p-8 text-center text-[14px] text-muted-foreground">No recent activity right now!</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 5: AI Insights Panel */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm p-6 mb-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 relative z-10 gap-4">
            <div>
                <h2 className="text-[20px] font-bold text-card-foreground font-headline">
                    AI Company Report
                </h2>
                <p className="text-[14px] text-muted-foreground mt-1">
                    Powered by Gemini AI — analyzes real company data
                </p>
            </div>
            <button
                onClick={generateReport}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-[14px] bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                {generating ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                    </>
                ) : (
                    <>✨ Generate Report</>
                )}
            </button>
        </div>

        {/* Error */}
        {reportError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-[14px] mb-6 relative z-10">
                {reportError}
            </div>
        )}

        {/* Report Results */}
        {report && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                
                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {Object.entries(report.key_metrics || {}).map(([key, value]: any) => (
                        <div key={key} className="bg-background rounded-[12px] p-4 text-center border border-border shadow-sm">
                            <div className="text-[20px] font-bold text-card-foreground font-headline">
                                {value}
                            </div>
                            <div className="text-[12px] font-medium text-muted-foreground mt-1 capitalize">
                                {key.replace(/_/g, ' ')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Executive Summary */}
                <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-indigo-500 rounded-r-[16px]">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 font-headline text-[16px]">
                        Executive Summary
                    </h3>
                    <p className="text-[14px] text-indigo-900/80 dark:text-indigo-100/80 leading-relaxed whitespace-pre-line">
                        {report.executive_summary}
                    </p>
                </div>

                {/* 3 column grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Highlights */}
                    <div>
                        <h3 className="font-bold text-[15px] text-card-foreground mb-4 flex items-center gap-2 font-headline">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[12px]">✓</span> 
                            Highlights
                        </h3>
                        <div className="space-y-3">
                        {(report.highlights || []).map((h: any, i: number) => (
                            <div key={i} className="p-4 bg-background border border-border shadow-sm rounded-[12px]">
                                <div className="font-semibold text-card-foreground text-[14px]">
                                    {h.title}
                                </div>
                                <div className="text-[13px] text-muted-foreground mt-1.5">
                                    {h.detail}
                                </div>
                                {h.metric && (
                                    <div className="mt-3 inline-block px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md text-[11px] font-bold">
                                        {h.metric}
                                    </div>
                                )}
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Concerns */}
                    <div>
                        <h3 className="font-bold text-[15px] text-card-foreground mb-4 flex items-center gap-2 font-headline">
                            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[12px]">!</span> 
                            Concerns
                        </h3>
                        <div className="space-y-3">
                        {(report.concerns || []).map((c: any, i: number) => (
                            <div key={i} className="p-4 bg-background border border-border shadow-sm rounded-[12px]">
                                <div className="font-semibold text-card-foreground text-[14px]">
                                    {c.title}
                                </div>
                                <div className="text-[13px] text-muted-foreground mt-1.5">
                                    {c.detail}
                                </div>
                                {c.severity && (
                                    <div className={`mt-3 inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${c.severity === "HIGH" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>
                                        {c.severity} SEVERITY
                                    </div>
                                )}
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                        <h3 className="font-bold text-[15px] text-card-foreground mb-4 flex items-center gap-2 font-headline">
                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[12px]">💡</span> 
                            Recommendations
                        </h3>
                        <div className="space-y-3">
                        {(report.recommendations || []).map((r: any, i: number) => (
                            <div key={i} className="p-4 bg-background border border-border shadow-sm rounded-[12px]">
                                <div className="font-semibold text-card-foreground text-[14px]">
                                    {r.title}
                                </div>
                                <div className="text-[13px] text-muted-foreground mt-1.5">
                                    {r.detail}
                                </div>
                                {r.priority && (
                                    <div className="mt-3 inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md text-[11px] font-bold uppercase">
                                        {r.priority} PRIORITY
                                    </div>
                                )}
                            </div>
                        ))}
                        </div>
                    </div>
                </div>

                {/* Department Health */}
                {report.department_health && report.department_health.length > 0 && (
                    <div className="pt-4 border-t border-border">
                        <h3 className="font-bold text-[16px] text-card-foreground mb-4 font-headline">
                            Department Health
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {report.department_health.map((d: any, i: number) => (
                            <div key={i} className="p-5 rounded-[12px] border bg-background shadow-sm"
                                style={{
                                    borderColor: d.status === "HEALTHY" ? "#10b98144" : d.status === "AT_RISK" ? "#f59e0b44" : "#f43f5e44"
                                }}>
                                <div className="text-[28px] font-bold font-headline mb-1"
                                    style={{
                                        color: d.status === "HEALTHY" ? "#059669" : d.status === "AT_RISK" ? "#D97706" : "#E11D48"
                                    }}>
                                    {d.health_score}
                                </div>
                                <div className="text-[14px] font-bold text-card-foreground">
                                    {d.department}
                                </div>
                                <div className="text-[11px] mt-1 font-semibold uppercase" style={{ color: d.status === "HEALTHY" ? "#10b981" : d.status === "AT_RISK" ? "#f59e0b" : "#f43f5e" }}>
                                    {d.status}
                                </div>
                                {d.key_issue && (
                                    <div className="text-[12px] mt-3 text-muted-foreground pt-3 border-t border-border">
                                        {d.key_issue}
                                    </div>
                                )}
                            </div>
                        ))}
                        </div>
                    </div>
                )}

                {/* Generated timestamp */}
                <p className="text-[12px] text-slate-400 text-right pt-4">
                    Report generated: {report.generated_at}
                </p>

            </div>
        )}
      </div>
    </div>
  );
}
