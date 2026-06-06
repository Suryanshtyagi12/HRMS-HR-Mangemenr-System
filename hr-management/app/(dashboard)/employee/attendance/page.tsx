"use client"
// TODO P1-10: Wire up to FastAPI GET /attendance/my-logs via TanStack Query
// Temporarily rendered as client component with loading state until FastAPI is ready

import { useAuthStore } from "@/store/authStore"
import { RoleGuard } from "@/components/layout/RoleGuard"
import { Loader2, Clock, CalendarDays, History } from "lucide-react"
import { useAttendanceLogs, useAttendanceSummary } from "@/hooks/useAttendance"
import ClockButton from "@/components/attendance/ClockButton"
import { AttendanceDonut } from "@/components/charts/AttendanceDonut"
import { useState, useEffect } from "react"

export default function EmployeeAttendancePage() {
  const user = useAuthStore((s) => s.user)
  const employeeId = user?.employeeId || "";
  const { data: logsData, isLoading: logsLoading } = useAttendanceLogs({ employee_id: employeeId })
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary(employeeId)
  
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const logs = Array.isArray(logsData) ? logsData : (logsData?.items || logsData?.logs || [])

  const donutData = {
    present: summary?.present_days || 0,
    absent: summary?.absent_days || 0,
    onLeave: summary?.leave_days || 0,
    total: (summary?.present_days || 0) + (summary?.absent_days || 0) + (summary?.leave_days || 0)
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('present') || s.includes('on time')) {
      return <span className="bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">On Time</span>;
    }
    if (s.includes('late')) {
      return <span className="bg-amber-50 text-amber-700 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">Late</span>;
    }
    if (s.includes('absent')) {
      return <span className="bg-rose-50 text-rose-700 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">Absent</span>;
    }
    if (s.includes('leave')) {
      return <span className="bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">On Leave</span>;
    }
    return <span className="bg-muted text-card-foreground rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">{status || 'Unknown'}</span>;
  }

  return (
    <RoleGuard allowedRoles={["EMPLOYEE"]}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-300 font-body space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-card-foreground font-headline mb-1">My Attendance</h1>
          <p className="text-[14px] text-muted-foreground">Track your daily attendance and working hours.</p>
        </div>

        {/* Top Section: Clock In/Out Hero Card */}
        <div className="bg-card rounded-[16px] shadow-sm border border-border overflow-hidden relative group">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100 to-violet-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"></div>
          
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between relative z-10 gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-4 text-[14px] tracking-wide uppercase">
                <CalendarDays size={18} />
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-[48px] md:text-[64px] font-bold font-headline text-card-foreground tracking-tight leading-none mb-2">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <p className="text-muted-foreground text-[15px] font-medium">Your current working status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span></p>
            </div>
            
            <div className="w-full md:w-auto md:min-w-[320px]">
              <ClockButton employeeId={employeeId} />
            </div>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: This Week's Log */}
          <div className="lg:col-span-8 bg-card rounded-[16px] shadow-sm border border-border flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-[16px] font-bold font-headline text-card-foreground flex items-center gap-2">
                <History size={20} className="text-indigo-600" />
                Recent Logs
              </h3>
            </div>
            
            <div className="p-0 overflow-x-auto">
              {(logsLoading) ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
              ) : logs.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Clock In</th>
                      <th className="px-6 py-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Clock Out</th>
                      <th className="px-6 py-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-card-foreground text-[14px]">
                            {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-muted-foreground font-medium">
                          {log.clock_in ? new Date(log.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-muted-foreground font-medium">
                          {log.clock_out ? new Date(log.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-card-foreground font-bold">
                          {log.hours_worked ? `${log.hours_worked.toFixed(1)}h` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {getStatusBadge(log.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-muted-foreground text-[14px]">
                  No attendance logs found for the selected period.
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary Donut Chart */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-card rounded-[16px] shadow-sm border border-border p-6 flex flex-col">
              <h3 className="text-[16px] font-bold font-headline text-card-foreground mb-6 text-center">Monthly Summary</h3>
              {summaryLoading ? (
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="flex-1 relative min-h-[300px] flex items-center justify-center">
                  <AttendanceDonut data={donutData} />
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[12px] p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Avg Hours</span>
                <span className="text-[24px] font-bold font-headline text-indigo-900 dark:text-indigo-300">{summary?.avg_hours || '0'}h</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[12px] p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Present</span>
                <span className="text-[24px] font-bold font-headline text-emerald-900 dark:text-emerald-300">{summary?.present_days || '0'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </RoleGuard>
  )
}
