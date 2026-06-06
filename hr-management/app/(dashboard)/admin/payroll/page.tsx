'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { subscribeToChannel, supabase } from '@/lib/supabase-realtime';
import { RunPayrollDialog } from '@/components/payroll/RunPayrollDialog';
import { useRouter } from 'next/navigation';

import { usePayrollRuns } from '@/hooks/usePayroll';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Zap, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';

function AutoPayrollCard({ fetchRuns }: { fetchRuns: () => void }) {
  const [status, setStatus] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/payroll/auto-status');
        setStatus(res.data);
      } catch (err) {}
    };
    fetchStatus();
  }, []);

  const handleForceRun = async () => {
    setRunning(true);
    setProgress({ status: 'Processing payroll for active employees...' });
    try {
      const res = await api.post('/payroll/run-auto', { force: true });
      setProgress({
        status: 'Completed',
        processed: res.data.employees_processed,
        failed: res.data.failed,
        totalNet: res.data.total_net
      });
      fetchRuns();
      // refresh status
      const statusRes = await api.get('/payroll/auto-status');
      setStatus(statusRes.data);
    } catch (err: any) {
      setProgress({ status: 'Error', error: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="bg-indigo-50/50 border-indigo-200 mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-indigo-600" />
              Auto Payroll
            </h3>
            <div className="text-sm text-indigo-700 space-y-1">
              <p>Status: <span className="font-medium text-green-700">Active</span></p>
              <p>Next run: <span className="font-medium">Last working day of this month</span></p>
              {status && (
                <p>This month: {status.run ? (
                  <span className="inline-flex items-center text-green-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center text-amber-700 font-medium">
                    <Clock className="w-4 h-4 mr-1" /> Scheduled
                  </span>
                )}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="bg-card border-indigo-300 text-indigo-700 hover:bg-indigo-50" disabled={running}>
                  {running ? <span className="animate-pulse">Processing...</span> : 'Force Run Now'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately process payroll for all active employees for the current month.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleForceRun} className="bg-indigo-600 hover:bg-indigo-700">
                    Confirm & Run
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {progress && (
              <div className="text-sm border rounded-md p-3 bg-card shadow-sm w-full md:w-64 max-w-full">
                {progress.status === 'Completed' ? (
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-green-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Payroll Run Complete</p>
                    <p>Processed: {progress.processed} | Failed: {progress.failed}</p>
                    <p className="font-medium">Total Net: ₹{progress.totalNet.toLocaleString()}</p>
                  </div>
                ) : progress.status === 'Error' ? (
                  <div className="text-red-600 text-xs flex items-center"><XCircle className="w-3 h-3 mr-1"/> {progress.error}</div>
                ) : (
                  <div className="text-indigo-600 animate-pulse">{progress.status}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPayrollDashboard() {
  const { data: runsData, isLoading: loading, refetch: fetchRuns } = usePayrollRuns();
  const runs = Array.isArray(runsData) ? runsData : (runsData?.data || runsData?.items || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const channel = subscribeToChannel('payroll', 'payroll_completed', () => { fetchRuns(); });
    return () => { if (channel) if (channel) supabase.removeChannel(channel); };
  }, []);

  const totalGross = runs.reduce((acc: number, r: any) => acc + Number(r.total_gross), 0);
  const totalNet = runs.reduce((acc: number, r: any) => acc + Number(r.total_net), 0);
  const totalDed = runs.reduce((acc: number, r: any) => acc + Number(r.total_deductions), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll Dashboard</h1>
        <Button onClick={() => setDialogOpen(true)}>Run Payroll</Button>
      </div>

      <AutoPayrollCard fetchRuns={fetchRuns} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Gross</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-card-foreground">₹{totalGross.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Deductions</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">₹{totalDed.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Net Payload</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">₹{totalNet.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Runs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{runs.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payroll Runs</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r: any) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted dark:hover:bg-slate-800" onClick={() => router.push(`/admin/payroll/${r.id}`)}>
                  <TableCell>{format(new Date(r.year, r.month - 1), 'MMMM yyyy')}</TableCell>
                  <TableCell>{r.total_employees}</TableCell>
                  <TableCell>₹{Number(r.total_gross).toLocaleString()}</TableCell>
                  <TableCell>₹{Number(r.total_net).toLocaleString()}</TableCell>
                  <TableCell><span className={`px-2 py-1 text-xs rounded-full font-medium ${r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></TableCell>
                </TableRow>
              ))}
              {runs.length === 0 && !loading && <TableRow><TableCell colSpan={5} className="text-center">No runs found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RunPayrollDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchRuns} />
    </div>
  );
}
