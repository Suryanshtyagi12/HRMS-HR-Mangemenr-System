'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const personalSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
});

const employmentSchema = z.object({
  departmentId: z.string().min(1, 'Required'),
  salaryGradeId: z.string().min(1, 'Required'),
  designation: z.string().min(1, 'Required'),
  joiningDate: z.string().min(1, 'Required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
});

const accountSchema = z.object({
  password: z.string().min(6, 'Min 6 chars'),
  role: z.enum(['ADMIN', 'SENIOR_MANAGER', 'HR_RECRUITER', 'EMPLOYEE']),
  sendWelcomeEmail: z.boolean().default(true),
});

export function AddEmployeeForm({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/departments').then(res => res.json()).then(setDepartments);
  }, []);

  const personalForm = useForm({ resolver: zodResolver(personalSchema) });
  const employmentForm = useForm({ resolver: zodResolver(employmentSchema) });
  const accountForm = useForm({ resolver: zodResolver(accountSchema), defaultValues: { sendWelcomeEmail: true, role: 'EMPLOYEE' } });

  const handleNext = async () => {
    if (step === 1) {
      const valid = await personalForm.trigger();
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await employmentForm.trigger();
      if (valid) setStep(3);
    }
  };

  const onSubmit = async () => {
    const valid = await accountForm.trigger();
    if (!valid) return;

    setLoading(true);
    try {
      const payload = {
        personal: personalForm.getValues(),
        employment: employmentForm.getValues(),
        account: accountForm.getValues(),
      };
      
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        onSuccess();
        router.refresh();
      } else {
        alert('Failed to create employee');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between mb-8">
        <div className={`flex-1 text-center pb-2 border-b-2 ${step >= 1 ? 'border-blue-600 font-bold text-blue-600' : 'border-gray-200'}`}>1. Personal</div>
        <div className={`flex-1 text-center pb-2 border-b-2 ${step >= 2 ? 'border-blue-600 font-bold text-blue-600' : 'border-gray-200'}`}>2. Employment</div>
        <div className={`flex-1 text-center pb-2 border-b-2 ${step === 3 ? 'border-blue-600 font-bold text-blue-600' : 'border-gray-200'}`}>3. Account</div>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name *</Label>
            <Input {...personalForm.register('firstName')} />
            {personalForm.formState.errors.firstName && <p className="text-red-500 text-xs">{personalForm.formState.errors.firstName.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label>Last Name *</Label>
            <Input {...personalForm.register('lastName')} />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" {...personalForm.register('email')} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input {...personalForm.register('phone')} />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input type="date" {...personalForm.register('dateOfBirth')} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Department *</Label>
            <Select onValueChange={(v) => employmentForm.setValue('departmentId', v)}>
              <SelectTrigger className="h-11 text-base md:text-sm"><SelectValue placeholder="Select Dept" /></SelectTrigger>
              <SelectContent>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Designation *</Label>
            <Input {...employmentForm.register('designation')} />
          </div>
          <div className="space-y-2">
            <Label>Salary Grade ID *</Label>
            <Input placeholder="Enter Grade UUID" {...employmentForm.register('salaryGradeId')} />
          </div>
          <div className="space-y-2">
            <Label>Joining Date *</Label>
            <Input type="date" {...employmentForm.register('joiningDate')} />
          </div>
          <div className="space-y-2">
            <Label>Employment Type *</Label>
            <Select onValueChange={(v: any) => employmentForm.setValue('employmentType', v)}>
              <SelectTrigger className="h-11 text-base md:text-sm"><SelectValue placeholder="Select Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INTERN">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Initial Password *</Label>
            <Input type="password" {...accountForm.register('password')} />
          </div>
          <div className="space-y-2">
            <Label>System Role *</Label>
            <Select defaultValue="EMPLOYEE" onValueChange={(v: any) => accountForm.setValue('role', v)}>
              <SelectTrigger className="h-11 text-base md:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="HR_RECRUITER">HR Recruiter</SelectItem>
                <SelectItem value="SENIOR_MANAGER">Manager</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="sendEmail" defaultChecked {...accountForm.register('sendWelcomeEmail')} />
            <Label htmlFor="sendEmail">Send Welcome Email</Label>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse md:flex-row justify-between mt-8 pt-4 border-t gap-3">
        <Button variant="outline" className="w-full md:w-auto" onClick={() => setStep(step - 1)} disabled={step === 1}>Back</Button>
        {step < 3 ? (
          <Button className="w-full md:w-auto" onClick={handleNext}>Next</Button>
        ) : (
          <Button className="w-full md:w-auto" onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit
          </Button>
        )}
      </div>
    </div>
  );
}
