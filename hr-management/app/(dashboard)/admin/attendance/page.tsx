'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { subscribeToChannel, supabase } from '@/lib/supabase-realtime';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function AdminAttendanceDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0, avgPct: 0 });

  const fetchData = async () => {
    try {
      const today = new Date();
      const res = await api.get(`/attendance?date_from=${format(today, 'yyyy-MM-dd')}&date_to=${format(today, 'yyyy-MM-dd')}`);
      if (res.status === 200) {
        const json = res.data;
        setLogs(json.items || []);
        
        let present = 0, absent = 0, leave = 0;
        (json.items || []).forEach((l: any) => {
          if (l.status === 'PRESENT' || l.status === 'LATE' || l.status === 'HALF_DAY') present++;
          if (l.status === 'ABSENT') absent++;
          if (l.status === 'ON_LEAVE') leave++;
        });
        const total = present + absent + leave;
        setStats({ present, absent, leave, avgPct: total ? Math.round((present / total) * 100) : 0 });
      }

      const anRes = await api.get(`/attendance/anomalies?year=${today.getFullYear()}&month=${today.getMonth() + 1}`);
      if (anRes.status === 200) {
        setAnomalies(anRes.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = subscribeToChannel('attendance', 'attendance_updated', () => {
      fetchData(); 
    });
    const channel2 = subscribeToChannel('attendance', 'attendance_anomaly_detected', () => {
      fetchData();
    });

    return () => {
      if (channel) if (channel) if (channel) supabase.removeChannel(channel);
      if (channel2) if (channel2) if (channel2) supabase.removeChannel(channel2);
    };
  }, []);

  const exportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');
    
    worksheet.columns = [
      { header: 'Employee', key: 'emp', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Clock In', key: 'in', width: 15 },
      { header: 'Clock Out', key: 'out', width: 15 },
      { header: 'Hours', key: 'hrs', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    
    logs.forEach(l => {
      worksheet.addRow({
        emp: l.employee ? `${l.employee.first_name} ${l.employee.last_name}` : 'Unknown',
        date: format(new Date(l.date), 'yyyy-MM-dd'),
        in: l.clockIn ? format(new Date(l.clockIn), 'HH:mm') : '',
        out: l.clockOut ? format(new Date(l.clockOut), 'HH:mm') : '',
        hrs: l.hoursWorked || 0,
        status: l.status
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
        <Button onClick={exportExcel} variant="outline">Export Excel</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Clocked In Today</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{stats.present}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Absent Today</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-600">{stats.absent}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">On Leave</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-blue-600">{stats.leave}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Attendance Rate</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.avgPct}%</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Today's Logs</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p>Loading...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.employee ? `${log.employee.first_name} ${log.employee.last_name}` : 'Unknown'}</TableCell>
                      <TableCell>{log.clock_in ? format(new Date(log.clock_in), 'p') : '--'}</TableCell>
                      <TableCell>{log.clock_out ? format(new Date(log.clock_out), 'p') : '--'}</TableCell>
                      <TableCell>{log.status}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No logs today</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Anomaly Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomalies.map((an, i) => (
                <div key={i} className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/10 border-red-200">
                  <div className="flex justify-between">
                    <span className="font-semibold">{an.employee_name}</span>
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Alert</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{an.consecutive_absences > 0 ? `${an.consecutive_absences} Absences` : `${an.late_arrivals} Late Arrivals`}</p>
                </div>
              ))}
              {anomalies.length === 0 && <p className="text-muted-foreground text-sm">No anomalies detected.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
