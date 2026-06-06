import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building2, Briefcase, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export function EmployeeCard({ employee, basePath }: { employee: any, basePath: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'ON_LEAVE': return 'bg-orange-100 text-orange-700';
      case 'TERMINATED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Link href={`${basePath}/${employee.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={employee.photoUrl || ''} />
              <AvatarFallback>{(employee.firstName || employee.first_name || 'U')[0]}{(employee.lastName || employee.last_name || 'U')[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{employee.firstName || employee.first_name} {employee.lastName || employee.last_name}</h3>
              <p className="text-sm text-gray-500">{employee.employeeCode || employee.employee_code}</p>
            </div>
          </div>
          <Badge className={getStatusColor(employee.status)} variant="outline">
            {employee.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 mt-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              <span>{employee.designation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span>{employee.department?.name || 'No Department'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{employee.phone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
