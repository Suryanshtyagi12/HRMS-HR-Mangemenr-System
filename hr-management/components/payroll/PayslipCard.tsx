import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, Download } from 'lucide-react';

export function PayslipCard({ payslip, onView, onDownload, isDownloading }: { payslip: any, onView: () => void, onDownload: () => void, isDownloading?: boolean }) {
  const date = new Date(payslip.year, payslip.month - 1);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto border-b sm:border-0 pb-4 sm:pb-0 border-border">
          <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{format(date, 'MMMM yyyy')}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payslip.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-muted text-card-foreground'}`}>
                {payslip.status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-start sm:items-center justify-between sm:justify-end gap-4 sm:gap-8">
          <div className="flex justify-between w-full sm:w-auto">
            <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">Gross Pay</p>
            <p className="font-medium">₹{Number(payslip.grossSalary).toLocaleString()}</p>
          </div>
            <div className="text-right ml-8 sm:ml-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Net Pay</p>
              <p className="text-base sm:text-lg font-bold text-primary">₹{Number(payslip.netSalary).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={onView} className="flex-1 sm:flex-none">View</Button>
            <Button variant="ghost" size="icon" onClick={onDownload} title="Download PDF" disabled={isDownloading}>
              {isDownloading ? <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <Download className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
