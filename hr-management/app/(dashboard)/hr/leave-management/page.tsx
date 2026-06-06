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
        <Table>
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
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
