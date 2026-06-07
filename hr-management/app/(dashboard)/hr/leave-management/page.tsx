'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function HRLeaveManagement() {
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/leave/requests');
      setRequests(res.data?.items || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Leave Analytics & Management</h1>
      <p className="text-muted-foreground">Global overview of all organizational leave activity.</p>
      
      <div className="bg-card dark:bg-slate-950 rounded-xl border p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">All Recent Requests</h2>
        
        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold">{r.employee?.first_name || r.employee?.firstName} {r.employee?.last_name || r.employee?.lastName}</div>
                <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {r.status}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-1">{r.leave_type || r.leaveType} ({r.days} days)</div>
              <div className="text-xs text-muted-foreground">{format(new Date(r.start_date || r.startDate), 'MMM d, yyyy')} - {format(new Date(r.end_date || r.endDate), 'MMM d, yyyy')}</div>
            </div>
          ))}
          {requests.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No recent requests.</div>}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto w-full rounded-xl border border-border">
          <Table className="min-w-[600px] w-full">
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Dates</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.employee?.first_name || r.employee?.firstName} {r.employee?.last_name || r.employee?.lastName}</TableCell>
                  <TableCell>{r.leave_type || r.leaveType}</TableCell>
                  <TableCell>{format(new Date(r.start_date || r.startDate), 'MMM d, yyyy')} - {format(new Date(r.end_date || r.endDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{r.days}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No recent requests.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
