import { AuditLogView } from '@/components/audit/AuditLogPage';
import { RoleGuard } from '@/components/layout/RoleGuard';

export default function AdminAuditLogPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto font-body animate-in fade-in duration-300">
        <AuditLogView />
      </div>
    </RoleGuard>
  );
}
