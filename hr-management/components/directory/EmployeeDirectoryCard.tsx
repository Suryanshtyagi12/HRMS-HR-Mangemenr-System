import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, Phone, User, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DirectoryCardProps {
  employee: {
    id: string;
    name: string;
    designation: string;
    department: string;
    email: string;
    phone: string | null;
    photoUrl: string | null;
    reportingManagerName: string | null;
  };
  departmentColors: Record<string, string>;
  role: string;
}

export function EmployeeDirectoryCard({ employee, departmentColors, role }: DirectoryCardProps) {
  const router = useRouter();
  const empAny = employee as any;
  const deptName = empAny.department?.name || empAny.department || 'Unknown';
  const deptColorClass = departmentColors[deptName] || 'bg-muted text-card-foreground';
  const managerName = empAny.reportingManagerName || (empAny.reporting_manager ? `${empAny.reporting_manager.first_name} ${empAny.reporting_manager.last_name}` : null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleViewProfile = () => {
    if (role === 'ADMIN' || role === 'HR_RECRUITER') {
      router.push(`/admin/employees/${employee.id}`);
    } else {
      router.push(`/admin/employees/${employee.id}`); // Or just open a modal.
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={employee.photoUrl || undefined} />
            <AvatarFallback className="text-lg bg-indigo-100 text-indigo-700">
              {((empAny.firstName || empAny.first_name || 'U')[0] + (empAny.lastName || empAny.last_name || 'K')[0]).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-card-foreground group-hover:text-indigo-600 transition-colors">
              {empAny.firstName || empAny.first_name || employee.name} {empAny.lastName || empAny.last_name || ''}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{employee.designation}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${deptColorClass}`}>
              {deptName}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div 
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-indigo-600 cursor-pointer group transition-colors"
            onClick={() => copyToClipboard(employee.email)}
            title="Click to copy"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-indigo-50">
              <Mail className="h-4 w-4" />
            </div>
            <span className="truncate">{employee.email}</span>
          </div>

          {employee.phone && (
            <div 
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-indigo-600 cursor-pointer group transition-colors"
              onClick={() => copyToClipboard(employee.phone!)}
              title="Click to copy"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-indigo-50">
                <Phone className="h-4 w-4" />
              </div>
              <span className="truncate">{employee.phone}</span>
            </div>
          )}

          {managerName && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="truncate text-xs">Manager: <span className="font-medium text-card-foreground">{managerName}</span></span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={handleViewProfile}>
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
