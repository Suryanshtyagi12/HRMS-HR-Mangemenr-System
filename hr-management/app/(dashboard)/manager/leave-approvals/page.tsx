'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { subscribeToChannel, supabase } from '@/lib/supabase-realtime';
import { LeaveCalendar } from '@/components/leave/LeaveCalendar';
import { useLeaveRequests, useLeaveCalendar, useApproveLeave } from '@/hooks/useLeave';

export default function ManagerLeaveApprovals() {
  const { data: requestsData, refetch: refetchRequests } = useLeaveRequests({ status: 'PENDING' });
  const { data: calendarEventsData, refetch: refetchCalendar } = useLeaveCalendar();
  const { mutateAsync: approveLeave } = useApproveLeave();

  const requests = Array.isArray(requestsData) ? requestsData : (requestsData?.data || requestsData?.items || []);
  const calendarEvents = Array.isArray(calendarEventsData) ? calendarEventsData : (calendarEventsData?.items || []);

  const fetchData = () => {
    refetchRequests();
    refetchCalendar();
  };

  useEffect(() => {
    const ch = subscribeToChannel('leave', 'leave_request_created', () => fetchData());
    return () => { if (ch) supabase.removeChannel(ch); };
  }, []);

  const handleAction = async (id: string, status: string) => {
    try {
      await approveLeave({ id, status });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Team Leave Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
          
          {/* Mobile View */}
          <div className="md:hidden space-y-3 mb-6">
            {requests.map((r: any) => (
              <div key={r.id} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{r.employee?.first_name} {r.employee?.last_name}</div>
                    <div className="text-xs text-muted-foreground">{r.leave_type}</div>
                  </div>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-[10px] font-bold rounded-full uppercase">Pending</span>
                </div>
                <div className="text-sm mb-3">{format(new Date(r.start_date), 'MMM d')} - {format(new Date(r.end_date), 'MMM d')} ({r.days} Days)</div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleAction(r.id, 'APPROVED')}>Approve</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleAction(r.id, 'REJECTED')}>Reject</Button>
                </div>
              </div>
            ))}
            {requests.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm border border-border rounded-xl">No pending requests</div>}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block bg-card rounded-xl border border-border p-4 overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Details</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {requests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-semibold">{r.employee?.first_name} {r.employee?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{r.leave_type}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{format(new Date(r.start_date), 'MMM d')} - {format(new Date(r.end_date), 'MMM d')}</p>
                      <p className="text-xs font-medium">{r.days} Days</p>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" onClick={() => handleAction(r.id, 'APPROVED')}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => handleAction(r.id, 'REJECTED')}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No pending requests</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Team Availability</h2>
          <LeaveCalendar teamEvents={calendarEvents} />
        </div>
      </div>
    </div>
  );
}
