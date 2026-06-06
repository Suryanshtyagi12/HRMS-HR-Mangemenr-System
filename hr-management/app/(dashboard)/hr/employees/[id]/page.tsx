'use client';
import AdminEmployeeProfilePage from '@/app/(dashboard)/admin/employees/[id]/page';
export default function HrEmployeeProfilePage() {
  // Uses identical layout to Admin but RoleGuard enforces HR_RECRUITER
  return <AdminEmployeeProfilePage />;
}
