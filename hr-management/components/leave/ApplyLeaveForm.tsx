import { useState } from 'react';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { differenceInDays, isWeekend, parseISO, eachDayOfInterval } from 'date-fns';

const schema = z.object({
  leaveType: z.string().min(1, 'Please select a leave type'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Please provide a valid reason')
});

export function ApplyLeaveForm({ open, onOpenChange, onSuccess, policy }: { open: boolean, onOpenChange: (o: boolean) => void, onSuccess: () => void, policy?: any }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { leaveType: '', startDate: '', endDate: '', reason: '' }
  });

  const watchStart = watch('startDate');
  const watchEnd = watch('endDate');

  let calculatedDays = 0;
  if (watchStart && watchEnd) {
    try {
      const start = parseISO(watchStart);
      const end = parseISO(watchEnd);
      if (end >= start) {
        const days = eachDayOfInterval({ start, end });
        calculatedDays = days.filter(d => {
          if (policy?.excludeWeekends && isWeekend(d)) return false;
          return true;
        }).length;
      }
    } catch(e) {}
  }

  const onSubmit = async (data: any) => {
    if (calculatedDays <= 0) return alert('Invalid date range');
    
    setLoading(true);
    try {
      const payload = {
        leave_type: data.leaveType,
        start_date: data.startDate,
        end_date: data.endDate,
        reason: data.reason,
        days: calculatedDays
      };
      const res = await api.post('/leave/apply', payload);
      
      if (res.status >= 200 && res.status < 300) {
        reset();
        onSuccess();
        onOpenChange(false);
      } else {
        alert(`Error: ${res.data?.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Failed to submit request: ${e.response?.data?.detail || e.message}`);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Leave Type</label>
            <Select onValueChange={(val) => setValue('leaveType', val)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASUAL">Casual Leave</SelectItem>
                <SelectItem value="SICK">Sick Leave</SelectItem>
                <SelectItem value="EARNED">Earned Leave</SelectItem>
                <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                <SelectItem value="PATERNITY">Paternity Leave</SelectItem>
                <SelectItem value="UNPAID">Unpaid Leave</SelectItem>
              </SelectContent>
            </Select>
            {errors.leaveType && <p className="text-red-500 text-xs">{errors.leaveType.message as string}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-red-500 text-xs">{errors.startDate.message as string}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-red-500 text-xs">{errors.endDate.message as string}</p>}
            </div>
          </div>

          <div className="bg-muted dark:bg-slate-900 p-3 rounded-lg border flex justify-between items-center text-sm">
            <span className="font-medium text-muted-foreground">Calculated Days</span>
            <span className="font-bold text-lg text-primary">{calculatedDays} Days</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Textarea {...register('reason')} placeholder="Briefly explain your reason..." rows={3} />
            {errors.reason && <p className="text-red-500 text-xs">{errors.reason.message as string}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || calculatedDays <= 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
