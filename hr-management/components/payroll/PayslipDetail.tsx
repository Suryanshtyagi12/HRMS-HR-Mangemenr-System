import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export function PayslipDetail({ payslip, open, onOpenChange }: { payslip: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!payslip) return null;
  const date = new Date(payslip.year, payslip.month - 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payslip - {format(date, 'MMMM yyyy')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Employee Name</p>
              <p className="font-semibold">{payslip.employee?.firstName} {payslip.employee?.lastName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Employee Code</p>
              <p className="font-semibold">{payslip.employee?.employeeCode}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-semibold">{payslip.employee?.department?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Working Days</p>
              <p className="font-semibold">{payslip.workingDays} (Present: {payslip.presentDays})</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3 text-card-foreground">Earnings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Basic Salary</span><span>₹{Number(payslip.basicSalary).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">House Rent Allowance</span><span>₹{Number(payslip.hra).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dearness Allowance</span><span>₹{Number(payslip.da).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Other Allowances</span><span>₹{Number(payslip.allowances).toLocaleString()}</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold"><span>Gross Earnings</span><span>₹{Number(payslip.grossSalary).toLocaleString()}</span></div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-card-foreground">Deductions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Provident Fund (PF)</span><span>₹{Number(payslip.pfDeduction).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Income Tax (TDS)</span><span>₹{Number(payslip.taxDeduction).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Other Deductions</span><span>₹{Number(payslip.otherDeductions).toLocaleString()}</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total Deductions</span>
                  <span>₹{(Number(payslip.pfDeduction) + Number(payslip.taxDeduction) + Number(payslip.otherDeductions)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center mt-6">
            <span className="font-semibold text-lg text-primary">Net Payable Salary</span>
            <span className="text-2xl font-bold text-primary">₹{Number(payslip.netSalary).toLocaleString()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
