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

const schema = z.object({
  employee_id: z.string().min(1, 'Please select an employee'),
  project_name: z.string().min(1, 'Project name is required'),
  title: z.string().min(1, 'Task detail is required'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Timeline/Due date is required'),
});

export function AssignTaskModal({ open, onOpenChange, employees, defaultEmployeeId }: { open: boolean, onOpenChange: (o: boolean) => void, employees: any[], defaultEmployeeId?: string }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { 
      employee_id: defaultEmployeeId || '', 
      project_name: '', 
      title: '', 
      description: '', 
      due_date: '' 
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.post('/performance/tasks', data);
      if (res.status >= 200 && res.status < 300) {
        reset();
        onOpenChange(false);
        alert('Task assigned successfully!');
      } else {
        alert(`Error: ${res.data?.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Failed to assign task: ${e.response?.data?.detail || e.message}`);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Task to Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee</label>
            <Select onValueChange={(val) => setValue('employee_id', val)} defaultValue={defaultEmployeeId || ''}>
              <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName || emp.first_name} {emp.lastName || emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employee_id && <p className="text-red-500 text-xs">{errors.employee_id.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <Input {...register('project_name')} placeholder="e.g. Q3 Website Redesign" />
            {errors.project_name && <p className="text-red-500 text-xs">{errors.project_name.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Task Detail</label>
            <Input {...register('title')} placeholder="e.g. Implement the new login page" />
            {errors.title && <p className="text-red-500 text-xs">{errors.title.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Information (Optional)</label>
            <Textarea {...register('description')} placeholder="Add any details or links..." rows={3} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Timeline (Due Date)</label>
            <Input type="date" {...register('due_date')} />
            {errors.due_date && <p className="text-red-500 text-xs">{errors.due_date.message as string}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
