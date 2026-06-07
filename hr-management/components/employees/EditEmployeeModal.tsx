'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useUpdateEmployee } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import api from '@/lib/api';

export function EditEmployeeModal({ employee, open, onOpenChange }: { employee: any, open: boolean, onOpenChange: (val: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const { mutateAsync: updateEmployee } = useUpdateEmployee();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    designation: '',
    department_id: '',
    employment_type: '',
    status: ''
  });

  useEffect(() => {
    if (open) {
      api.get('/employees/departments').then(res => setDepartments(res.data)).catch(console.error);
      
      setFormData({
        first_name: employee.first_name || employee.firstName || '',
        last_name: employee.last_name || employee.lastName || '',
        phone: employee.phone || '',
        address: employee.address || '',
        designation: employee.designation || '',
        department_id: employee.department_id || employee.department?.id || '',
        employment_type: employee.employment_type || employee.employmentType || 'FULL_TIME',
        status: employee.status || 'ACTIVE'
      });
    }
  }, [open, employee]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      await updateEmployee({ id: employee.id, payload: formData });
      toast.success('Employee updated successfully');
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] md:max-w-lg mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Edit Employee Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={formData.first_name} onChange={(e) => handleChange('first_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={formData.last_name} onChange={(e) => handleChange('last_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
          </div>

          <hr />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={formData.department_id} onValueChange={(v) => handleChange('department_id', v)}>
                <SelectTrigger className="h-11 text-base md:text-sm"><SelectValue placeholder="Select Dept" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input value={formData.designation} onChange={(e) => handleChange('designation', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={formData.employment_type} onValueChange={(v) => handleChange('employment_type', v)}>
                <SelectTrigger className="h-11 text-base md:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERN">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger className="h-11 text-base md:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end pt-4 border-t gap-3">
            <Button className="w-full md:w-auto" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="w-full md:w-auto" onClick={onSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
