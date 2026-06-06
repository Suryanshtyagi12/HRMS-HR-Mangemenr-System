'use client';
import { useAuthStore } from '@/store/authStore';

import { CalendarDays, Wallet, Target, Activity, CheckCircle2, AlertCircle, FileText, Briefcase, ChevronRight, HelpCircle, Brain } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useEmployeeDashboard } from '@/hooks/useDashboard';

export default function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user);
  const employeeId = user?.employeeId || '';
  const { data: dashboardData } = useEmployeeDashboard(employeeId);
  const data = dashboardData || null;

  if (!data) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen font-body animate-pulse">
        <div className="h-32 bg-muted rounded-[16px] mb-8 w-full"></div>
        <div className="h-20 bg-muted rounded-[16px] mb-8 w-full max-w-sm mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-[16px]"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-8 h-[300px] bg-muted rounded-[16px]"></div>
          <div className="lg:col-span-4 h-[300px] bg-muted rounded-[16px]"></div>
        </div>
      </div>
    );
  }

  const userName = user?.name || 'Alex Rivera';
  const userInitials = userName.split(' ').map(n => n[0]).join('');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-300 font-body">
      
      {/* Top Section: Greeting Card */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1 bg-card rounded-[16px] shadow-sm border border-border p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="w-20 h-20 rounded-full border-4 border-background shadow-md flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[28px] font-bold shrink-0 z-10 font-headline">
            {userInitials}
          </div>
          
          <div className="flex-1 text-center sm:text-left z-10">
            <h2 className="text-[28px] font-bold font-headline text-card-foreground tracking-tight">Good morning, {userName} 👋</h2>
            <p className="text-[14px] text-muted-foreground mt-1">Here's what's happening today.</p>
          </div>
          
          <div className="z-10 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/50 rounded-[12px] p-4 flex items-center gap-3 shadow-sm transform hover:-translate-y-1 transition-transform cursor-default">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-white shadow-inner font-headline font-bold text-[18px]">
               🎉
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider">Milestone</div>
              <div className="text-[14px] font-bold text-card-foreground">Happy 2nd Work Anniversary!</div>
            </div>
          </div>
        </div>
      </div>


      {/* Row 2: 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
        <div className="bg-card rounded-[16px] shadow-sm hover:shadow-hover border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[13px] text-muted-foreground font-medium">Attendance %</p>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Activity size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-[24px] font-bold text-card-foreground font-headline mb-2">{data.attendancePercentage}%</h3>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              +1.2% this month
            </span>
          </div>
        </div>

        <div className="bg-card rounded-[16px] shadow-sm hover:shadow-hover border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[13px] text-muted-foreground font-medium">Leave Balance</p>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarDays size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-[24px] font-bold text-card-foreground font-headline mb-2">{data.leaveBalance.casual + data.leaveBalance.sick + data.leaveBalance.earned} <span className="text-[14px] text-muted-foreground font-medium">Days</span></h3>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-muted text-muted-foreground">
              Available to use
            </span>
          </div>
        </div>

        <div className="bg-card rounded-[16px] shadow-sm hover:shadow-hover border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[13px] text-muted-foreground font-medium">Last Payslip</p>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-[24px] font-bold text-card-foreground font-headline mb-2">{data.lastPayslip ? `$${data.lastPayslip.netSalary.toLocaleString()}` : 'N/A'}</h3>
            <Link href="/employee/my-payslips" className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              View Details
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-[16px] shadow-sm hover:shadow-hover border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[13px] text-muted-foreground font-medium">Performance Score</p>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Target size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-[24px] font-bold text-card-foreground font-headline mb-2">{data.performanceScore} <span className="text-[14px] text-muted-foreground font-medium">/ 5.0</span></h3>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              Top 10% Dept
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: My Goals & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Left: Goals */}
        <div className="lg:col-span-8 bg-card rounded-[16px] shadow-sm border border-border p-0 flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h3 className="text-[16px] font-bold font-headline text-card-foreground">My Goals & OKRs</h3>
            <Link href="/employee/goals" className="text-indigo-600 dark:text-indigo-400 text-[13px] font-medium hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="p-6">
            {data.currentGoals?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.currentGoals.map((goal: any, i: number) => (
                  <div key={i} className="border border-border rounded-[12px] p-5 hover:border-indigo-500/50 transition-colors cursor-default bg-background">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-card-foreground text-[14px] line-clamp-2">{goal.title}</h4>
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider shrink-0 ${
                        goal.status === 'On Track' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                        goal.status === 'At Risk' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                      </div>
                      <span className="text-[12px] font-bold text-card-foreground">{goal.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-[14px]">No active goals found.</div>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="lg:col-span-4 flex flex-col">
          <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <Link href="/employee/my-leaves" className="bg-card rounded-[12px] shadow-sm border border-border p-4 flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:shadow-md transition-all text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 group">
              <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                <CalendarDays size={20} />
              </div>
              <span className="text-[13px] font-semibold">Apply Leave</span>
            </Link>
            <Link href="/employee/my-payslips" className="bg-card rounded-[12px] shadow-sm border border-border p-4 flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:shadow-md transition-all text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 group">
              <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                <FileText size={20} />
              </div>
              <span className="text-[13px] font-semibold">View Payslips</span>
            </Link>
            <Link href="/employee/goals" className="bg-card rounded-[12px] shadow-sm border border-border p-4 flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:shadow-md transition-all text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 group">
              <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                <Target size={20} />
              </div>
              <span className="text-[13px] font-semibold">Update Goals</span>
            </Link>
            <Link href="/employee/ai-assistant" className="bg-card rounded-[12px] shadow-sm border border-border p-4 flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:shadow-md transition-all text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 group">
              <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                <Brain size={20} />
              </div>
              <span className="text-[13px] font-semibold">AI Assistant</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
