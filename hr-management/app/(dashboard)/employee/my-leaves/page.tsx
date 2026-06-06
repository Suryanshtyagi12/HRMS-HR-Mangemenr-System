'use client';
import { useState, useEffect } from 'react';
import { LeaveBalanceCard } from '@/components/leave/LeaveBalanceCard';
import { LeaveCalendar } from '@/components/leave/LeaveCalendar';
import { ApplyLeaveForm } from '@/components/leave/ApplyLeaveForm';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { subscribeToChannel, supabase } from '@/lib/supabase-realtime';
import { useLeaveBalance, useLeaveRequests, useLeaveCalendar, useLeavePolicy } from '@/hooks/useLeave';
import { useAuthStore } from '@/store/authStore';

export default function EmployeeLeavePortal() {
  const user = useAuthStore(s => s.user);
  const { data: balances, refetch: refetchBalances } = useLeaveBalance(user?.id || '');
  const { data: requestsData, refetch: refetchRequests } = useLeaveRequests({ employee_id: user?.id });
  const { data: calendarEventsData, refetch: refetchCalendar } = useLeaveCalendar();
  const { data: policyData } = useLeavePolicy();
  
  const requests = Array.isArray(requestsData) ? requestsData : (requestsData?.data || requestsData?.items || []);
  const calendarEvents = Array.isArray(calendarEventsData) ? calendarEventsData : (calendarEventsData?.items || []);
  const policy = policyData || { casualLeave: 12, sickLeave: 10, earnedLeave: 15, maternityLeave: 180, paternityLeave: 15 };

  const [applyOpen, setApplyOpen] = useState(false);

  const fetchData = () => {
    refetchBalances();
    refetchRequests();
    refetchCalendar();
  };

  useEffect(() => {
    const ch = subscribeToChannel('leave', 'leave_request_approved', () => fetchData());
    return () => { if (ch) supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Dashboard</h1>
        <Button onClick={() => setApplyOpen(true)}>Apply Leave</Button>
      </div>

      {balances && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <LeaveBalanceCard title="Casual" used={policy.casualLeave - balances.casual_leave} total={policy.casualLeave} colorClass="bg-blue-500" />
          <LeaveBalanceCard title="Sick" used={policy.sickLeave - balances.sick_leave} total={policy.sickLeave} colorClass="bg-red-500" />
          <LeaveBalanceCard title="Earned" used={policy.earnedLeave - balances.earned_leave} total={policy.earnedLeave} colorClass="bg-green-500" />
          <LeaveBalanceCard title="Maternity" used={policy.maternityLeave - balances.maternity_leave} total={policy.maternityLeave} colorClass="bg-purple-500" />
          <LeaveBalanceCard title="Paternity" used={policy.paternityLeave - balances.paternity_leave} total={policy.paternityLeave} colorClass="bg-orange-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">My Requests</h2>
          <div className="bg-card dark:bg-slate-950 rounded-xl border border-border dark:border-slate-800 p-4">
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Dates</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {requests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.leave_type}</TableCell>
                    <TableCell>{format(new Date(r.start_date), 'MMM d')} - {format(new Date(r.end_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{r.days}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No requests found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Team Calendar</h2>
          <LeaveCalendar teamEvents={calendarEvents} />
        </div>
      </div>

      <ApplyLeaveForm open={applyOpen} onOpenChange={setApplyOpen} onSuccess={fetchData} policy={policy} />
    </div>
  );
}
