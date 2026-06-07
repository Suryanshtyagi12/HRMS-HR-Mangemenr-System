'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Briefcase, Upload, Loader2, Trash } from 'lucide-react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { useEmployee } from '@/hooks/useEmployees';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';

export default function EmployeeProfilePage() {
  const params = useParams();
  const { data: employeeData, isLoading: loading } = useEmployee(params.id as string);
  const [employee, setEmployee] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (employeeData) {
      setEmployee(employeeData);
    }
  }, [employeeData]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', e.target.files[0]);

    try {
      const res = await fetch(`/api/employees/${params.id}/photo`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const updated = await res.json();
        setEmployee({ ...employee, photoUrl: updated.photoUrl });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this employee?')) return;
    try {
      await fetch(`/api/employees/${params.id}`, { method: 'DELETE' });
      setEmployee({ ...employee, status: 'TERMINATED' });
    } catch (e) {}
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!employee) return <div>Employee not found</div>;

  return (
    <RoleGuard allowedRoles={['ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER']}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-card p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Badge className={employee.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}>{employee.status}</Badge>
          </div>
          
          <div className="relative group">
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center text-4xl text-gray-400">
              {employee.photoUrl || employee.photo_url ? <img src={employee.photoUrl || employee.photo_url} className="object-cover w-full h-full" /> : (employee.firstName || employee.first_name || 'U')[0]}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">{employee.firstName || employee.first_name} {employee.lastName || employee.last_name}</h1>
            <p className="text-lg text-muted-foreground font-medium mb-4">{employee.designation}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {employee.department?.name}</div>
              <div className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {employee.email}</div>
              {employee.phone && <div className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {employee.phone}</div>}
              <div className="flex items-center gap-1.5 font-mono bg-gray-100 px-2 py-1 rounded">ID: {employee.employeeCode || employee.employee_code}</div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 md:mt-0">
            {user?.role === 'ADMIN' && (
              <>
                <Button variant="outline" onClick={() => setEditOpen(true)}>Edit Profile</Button>
                {employee.status !== 'TERMINATED' && (
                  <Button variant="destructive" onClick={handleTerminate}><Trash className="w-4 h-4 mr-2"/> Terminate</Button>
                )}
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="bg-card border w-full flex overflow-x-auto justify-start rounded-lg h-auto p-1">
            <TabsTrigger value="personal" className="flex-1 rounded-md py-2.5">Personal Info</TabsTrigger>
            <TabsTrigger value="employment" className="flex-1 rounded-md py-2.5">Employment</TabsTrigger>
            <TabsTrigger value="attendance" className="flex-1 rounded-md py-2.5">Attendance</TabsTrigger>
            <TabsTrigger value="performance" className="flex-1 rounded-md py-2.5">Performance</TabsTrigger>
            <TabsTrigger value="documents" asChild className="flex-1 rounded-md py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground cursor-pointer">
              <Link href={`/hr/employees/${params.id}/documents`} className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> Documents
              </Link>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1"><Label className="text-muted-foreground">Full Name</Label><p className="font-medium text-foreground">{employee.firstName || employee.first_name} {employee.lastName || employee.last_name}</p></div>
                <div className="space-y-1"><Label className="text-muted-foreground">Email Address</Label><p className="font-medium text-foreground">{employee.email}</p></div>
                <div className="space-y-1"><Label className="text-muted-foreground">Phone Number</Label><p className="font-medium text-foreground">{employee.phone || '-'}</p></div>
                <div className="space-y-1"><Label className="text-muted-foreground">Date of Birth</Label><p className="font-medium text-foreground">{employee.dateOfBirth || employee.date_of_birth ? new Date(employee.dateOfBirth || employee.date_of_birth).toLocaleDateString() : '-'}</p></div>
                <div className="space-y-1"><Label className="text-muted-foreground">Gender</Label><p className="font-medium text-foreground">{employee.gender || '-'}</p></div>
                <div className="space-y-1 md:col-span-2"><Label className="text-muted-foreground">Address</Label><p className="font-medium text-foreground">{employee.address || '-'}</p></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1"><Label className="text-muted-foreground">Department</Label><p className="font-medium text-foreground">{employee.department?.name || '-'}</p></div>
                <div className="space-y-1"><Label className="text-muted-foreground">Designation</Label><p className="font-medium text-foreground">{employee.designation}</p></div>
                <div className="space-y-1"><Label className="text-muted-foreground">Employment Type</Label><p className="font-medium text-foreground">{employee.employmentType || employee.employment_type}</p></div>
                <div className="space-y-1"><Label className="text-muted-foreground">Joining Date</Label><p className="font-medium text-foreground">{employee.joiningDate || employee.joining_date ? new Date(employee.joiningDate || employee.joining_date).toLocaleDateString() : '-'}</p></div>
                <div className="space-y-1"><Label className="text-muted-foreground">Reporting Manager</Label><p className="font-medium text-foreground">{employee.reportingManager || employee.reporting_manager ? `${(employee.reportingManager || employee.reporting_manager).first_name || (employee.reportingManager || employee.reporting_manager).firstName || 'Assigned'} ${(employee.reportingManager || employee.reporting_manager).last_name || (employee.reportingManager || employee.reporting_manager).lastName || ''}` : 'None'}</p></div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance"><Card><CardContent className="p-10 text-center text-gray-500">Attendance data coming soon...</CardContent></Card></TabsContent>
          <TabsContent value="performance"><Card><CardContent className="p-10 text-center text-gray-500">Performance reviews coming soon...</CardContent></Card></TabsContent>
        </Tabs>

        {employee && (
          <EditEmployeeModal 
            open={editOpen} 
            onOpenChange={setEditOpen} 
            employee={employee} 
          />
        )}
      </div>
    </RoleGuard>
  );
}
