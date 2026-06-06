'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { PayslipDetail } from '@/components/payroll/PayslipDetail';

export default function AdminPayrollDetail() {
  const { runId } = useParams();
  const router = useRouter();
  const [run, setRun] = useState<any>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchRun = async () => {
    const res = await fetch(`/api/payroll/run/${runId}`);
    if (res.ok) setRun(await res.json());
  };

  useEffect(() => { fetchRun(); }, [runId]);

  const handleApprove = async () => {
    const res = await fetch(`/api/payroll/run/${runId}`, { method: 'PUT' });
    if (res.ok) fetchRun();
  };

  const handleSend = async () => {
    const res = await fetch(`/api/payroll/send`, { 
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId }) 
    });
    if (res.ok) {
      alert('Payslips sent!');
      fetchRun();
    }
  };

  const handleGeneratePDFs = async () => {
    if (!run || !run.payslips) return;
    setIsGenerating(true);
    setProgressText(`Generating PDFs for ${run.payslips.length} payslips...`);
    try {
      const res = await fetch('/api/payroll/payslip/bulk-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payrollRunId: runId })
      });
      if (res.ok) {
        const { generated, failed } = await res.json();
        alert(`Generation complete. Generated: ${generated}, Failed: ${failed}`);
        fetchRun();
      }
    } catch (e) {
      console.error(e);
      alert('Error generating PDFs');
    } finally {
      setIsGenerating(false);
      setProgressText('');
    }
  };

  const handleDownload = async (payslip: any) => {
    if (payslip.pdfUrl) {
      window.open(payslip.pdfUrl, '_blank');
      return;
    }
    setDownloadingId(payslip.id);
    try {
      const res = await fetch(`/api/payroll/payslip/${payslip.id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip-${payslip.month}-${payslip.year}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        fetchRun();
      }
    } catch (e) {
      console.error(e);
      alert('Error downloading PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!run) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="link" onClick={() => router.push('/admin/payroll')} className="px-0 mb-2">&larr; Back to Runs</Button>
          <h1 className="text-3xl font-bold">Payroll Run - {format(new Date(run.year, run.month - 1), 'MMMM yyyy')}</h1>
          <p className="text-muted-foreground mt-1">Status: <span className="font-semibold text-primary">{run.status}</span></p>
        </div>
        <div className="space-x-3 flex items-center">
          {isGenerating && <span className="text-sm text-indigo-600 font-medium animate-pulse">{progressText}</span>}
          {run.status === 'DRAFT' && <Button onClick={handleApprove}>Approve Payroll</Button>}
          {run.status === 'COMPLETED' && (
            <>
              <Button onClick={handleGeneratePDFs} disabled={isGenerating}>Generate All PDFs</Button>
              <Button onClick={handleSend} variant="secondary" disabled={isGenerating}>Send All via Email</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Employees</p><p className="text-2xl font-bold">{run.totalEmployees}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Gross</p><p className="text-2xl font-bold">₹{Number(run.totalGross).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Deductions</p><p className="text-2xl font-bold text-red-500">₹{Number(run.totalDeductions).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Net Payable</p><p className="text-2xl font-bold text-green-600">₹{Number(run.totalNet).toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payslips</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.payslips.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.employee.firstName} {p.employee.lastName}</p>
                    <p className="text-xs text-muted-foreground">{p.employee.employeeCode} | {p.employee.department.name}</p>
                  </TableCell>
                  <TableCell>₹{Number(p.grossSalary).toLocaleString()}</TableCell>
                  <TableCell>₹{(Number(p.pfDeduction) + Number(p.taxDeduction) + Number(p.otherDeductions)).toLocaleString()}</TableCell>
                  <TableCell className="font-medium text-primary">₹{Number(p.netSalary).toLocaleString()}</TableCell>
                  <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-muted dark:bg-slate-800'}`}>{p.status}</span></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPayslip(p)}>View</Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownload(p)}
                        disabled={downloadingId === p.id}
                      >
                        {downloadingId === p.id ? 'Loading...' : p.pdfUrl ? 'Download PDF' : 'Generate PDF'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PayslipDetail payslip={selectedPayslip} open={!!selectedPayslip} onOpenChange={(o) => !o && setSelectedPayslip(null)} />
    </div>
  );
}
