const fs = require('fs');
const path = require('path');

const routes = {
  admin: [
    'dashboard', 'employees', 'attendance', 'payroll', 'leave-management',
    'performance', 'recruitment', 'ai-insights', 'audit-log', 'settings'
  ],
  manager: [
    'dashboard', 'my-team', 'attendance', 'leave-approvals',
    'performance-reviews', 'recruitment-support', 'reports'
  ],
  hr: [
    'dashboard', 'recruitment-pipeline', 'ai-screener', 'job-postings',
    'employees', 'leave-management', 'onboarding', 'reports'
  ],
  employee: [
    'dashboard', 'attendance', 'my-leaves', 'my-payslips',
    'my-performance', 'goals', 'team-directory', 'ai-assistant'
  ]
};

const formatTitle = (str) => {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getRoleConfig = (role) => {
  switch (role) {
    case 'admin': return { allowedRoles: "['ADMIN']" };
    case 'manager': return { allowedRoles: "['SENIOR_MANAGER', 'ADMIN']" };
    case 'hr': return { allowedRoles: "['HR_RECRUITER', 'ADMIN']" };
    case 'employee': return { allowedRoles: "['EMPLOYEE', 'ADMIN', 'SENIOR_MANAGER', 'HR_RECRUITER']" };
  }
};

for (const [role, paths] of Object.entries(routes)) {
  for (const p of paths) {
    const dir = path.join(__dirname, '..', 'app', role, p);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const title = formatTitle(p);
    const { allowedRoles } = getRoleConfig(role);
    
    const content = `'use client';

import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ${title.replace(/\s+/g, '')}Page() {
  return (
    <RoleGuard allowedRoles={${allowedRoles}}>
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">${title}</h1>
        <Card className="w-full h-[400px] flex flex-col items-center justify-center bg-gray-50/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-400">Coming Soon</CardTitle>
            <CardDescription>This module is currently under development.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </RoleGuard>
  );
}
`;
    fs.writeFileSync(path.join(dir, 'page.tsx'), content);
  }
}

console.log('Successfully generated all placeholder pages!');
