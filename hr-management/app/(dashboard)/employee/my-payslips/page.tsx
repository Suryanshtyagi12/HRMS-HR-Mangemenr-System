'use client';
import { useState, useEffect } from 'react';
import { PayslipCard } from '@/components/payroll/PayslipCard';
import { PayslipDetail } from '@/components/payroll/PayslipDetail';
import { subscribeToChannel, supabase } from '@/lib/supabase-realtime';

import { usePayslips } from '@/hooks/usePayroll';

export default function EmployeePayslipsPage() {
  const { data: payslipsData, refetch: fetchPayslips } = usePayslips();
  const payslips = Array.isArray(payslipsData) ? payslipsData : (payslipsData?.data || payslipsData?.items || []);
  const [selected, setSelected] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (payslip: any) => {
    if (payslip.pdfUrl) {
      window.open(payslip.pdfUrl, '_blank');
      return;
    }

    setDownloadingId(payslip.id);
    try {
      const res = await fetch(`/api/download/payslip/${payslip.id}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip-${payslip.month}-${payslip.year}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        // Refresh to get the updated pdfUrl
        fetchPayslips();
      } else {
        alert('Failed to generate PDF');
      }
    } catch (e) {
      console.error(e);
      alert('Error generating PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const channel = subscribeToChannel('payroll', 'payslip_sent', () => { fetchPayslips(); });
    return () => { if (channel) if (channel) supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">My Payslips</h1>
        <p className="text-sm md:text-base text-muted-foreground">Access your historical salary slips and tax deductions.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
        {payslips.map((p: any) => (
          <PayslipCard 
            key={p.id} 
            payslip={p} 
            onView={() => setSelected(p)} 
            onDownload={() => handleDownload(p)} 
            isDownloading={downloadingId === p.id}
          />
        ))}
        {payslips.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No payslips found.</p>}
      </div>

      <PayslipDetail payslip={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
