'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Clock, CreditCard, CalendarDays,
  TrendingUp, UserSearch, Brain, FileText, Settings,
  Briefcase, HeartHandshake, FileLineChart, LogOut, ChevronLeft, ChevronRight,
  Network, BookUser
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/lib/auth-client';
import { motion, AnimatePresence } from 'framer-motion';

type NavItem = {
  title: string;
  href: string;
  icon: any;
  section: string;
  badge?: number;
};

const adminNav: NavItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, section: 'Overview' },
  { title: 'Employees', href: '/admin/employees', icon: Users, section: 'Workforce' },
  { title: 'Attendance', href: '/admin/attendance', icon: Clock, section: 'Workforce' },
  { title: 'Leave Management', href: '/hr/leave-management', icon: CalendarDays, section: 'Workforce', badge: 3 },
  { title: 'Payroll', href: '/admin/payroll', icon: CreditCard, section: 'Finance' },
  { title: 'Recruitment', href: '/hr/recruitment/pipeline', icon: UserSearch, section: 'Talent' },
  { title: 'Performance', href: '/admin/performance', icon: TrendingUp, section: 'Talent' },
  { title: 'AI Insights', href: '/admin/ai-insights', icon: Brain, section: 'AI & Insights' },
  { title: 'Resignation Risk', href: '/admin/resignation-risk', icon: Brain, section: 'AI & Insights' },
  { title: 'Audit Log', href: '/admin/audit-log', icon: FileText, section: 'AI & Insights' },
  { title: 'Org Chart', href: '/org-chart', icon: Network, section: 'Company' },
  { title: 'Directory', href: '/directory', icon: BookUser, section: 'Company' },
];

const managerNav: NavItem[] = [
  { title: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard, section: 'Overview' },
  { title: 'My Team', href: '/manager/my-team', icon: Users, section: 'Management' },
  { title: 'Attendance', href: '/manager/attendance', icon: Clock, section: 'Management' },
  { title: 'Leave Approvals', href: '/manager/leave-approvals', icon: CalendarDays, section: 'Management', badge: 5 },
  { title: 'Performance Reviews', href: '/manager/performance', icon: TrendingUp, section: 'Management' },
  { title: 'Recruitment Support', href: '/manager/recruitment-support', icon: UserSearch, section: 'Recruitment' },
  { title: 'Reports', href: '/manager/reports', icon: FileLineChart, section: 'System' },
  { title: 'Org Chart', href: '/org-chart', icon: Network, section: 'Company' },
  { title: 'Directory', href: '/directory', icon: BookUser, section: 'Company' },
];

const hrNav: NavItem[] = [
  { title: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard, section: 'Overview' },
  { title: 'Recruitment Pipeline', href: '/hr/recruitment/pipeline', icon: UserSearch, section: 'Talent', badge: 12 },
  { title: 'AI Screener', href: '/hr/recruitment/screener', icon: Brain, section: 'Talent' },
  { title: 'Interview Bot', href: '/hr/recruitment/interview', icon: Briefcase, section: 'Talent' },
  { title: 'Job Postings', href: '/hr/recruitment/jobs', icon: Briefcase, section: 'Talent' },
  { title: 'Employees', href: '/hr/employees', icon: Users, section: 'Workforce' },
  { title: 'Leave Management', href: '/hr/leave-management', icon: CalendarDays, section: 'Workforce' },
  { title: 'Onboarding', href: '/hr/onboarding', icon: HeartHandshake, section: 'Workforce' },
  { title: 'Reports', href: '/hr/reports', icon: FileLineChart, section: 'System' },
  { title: 'Org Chart', href: '/org-chart', icon: Network, section: 'Company' },
  { title: 'Directory', href: '/directory', icon: BookUser, section: 'Company' },
];

const employeeNav: NavItem[] = [
  { title: 'My Dashboard', href: '/employee/dashboard', icon: LayoutDashboard, section: 'Overview' },
  { title: 'Attendance', href: '/employee/attendance', icon: Clock, section: 'Workforce' },
  { title: 'My Leaves', href: '/employee/my-leaves', icon: CalendarDays, section: 'Workforce' },
  { title: 'My Payslips', href: '/employee/my-payslips', icon: CreditCard, section: 'Finance' },
  { title: 'My Performance', href: '/employee/my-performance', icon: TrendingUp, section: 'Talent' },
  { title: 'Goals', href: '/employee/goals', icon: FileText, section: 'Talent' },
  { title: 'AI Assistant', href: '/employee/ai-assistant', icon: Brain, section: 'AI & Insights' },
  { title: 'My Team', href: '/employee/my-team', icon: Users, section: 'Company' },
  { title: 'Org Chart', href: '/org-chart', icon: Network, section: 'Company' },
  { title: 'Directory', href: '/directory', icon: BookUser, section: 'Company' },
];

export function Sidebar({ onLinkClick, mobile }: { onLinkClick?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = user?.role || '';
  const userName = user?.name || 'User';

  let navItems: NavItem[] = [];
  if (role === 'ADMIN') navItems = adminNav;
  if (role === 'SENIOR_MANAGER') navItems = managerNav;
  if (role === 'HR_RECRUITER') navItems = hrNav;
  if (role === 'EMPLOYEE') navItems = employeeNav;

  // Group items by section
  const groupedNav = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'ADMIN': return { label: 'Admin', color: 'text-indigo-400 bg-indigo-400/10' };
      case 'SENIOR_MANAGER': return { label: 'Manager', color: 'text-violet-400 bg-violet-400/10' };
      case 'HR_RECRUITER': return { label: 'HR', color: 'text-emerald-400 bg-emerald-400/10' };
      default: return { label: 'Employee', color: 'text-amber-400 bg-amber-400/10' };
    }
  };

  const roleInfo = getRoleBadge(role);

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] dark:bg-background text-white overflow-hidden border-r border-white/5 dark:border-border relative">
      {/* Top Section */}
      <div className={cn("flex items-center h-[64px] shrink-0 transition-all duration-300", isCollapsed ? "justify-center" : "px-6")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
            H
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col overflow-hidden">
              <span className="font-bold text-[15px] tracking-tight leading-tight whitespace-nowrap">HRMS Pro</span>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Enterprise Edition</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* User Card */}
      {!isCollapsed && (
        <div className="px-4 mb-4 shrink-0">
          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-[14px] font-bold truncate">{userName}</div>
              <div className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full inline-block mt-0.5", roleInfo.color)}>
                {roleInfo.label}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-none py-2">
        {Object.entries(groupedNav).map(([section, items]) => (
          <div key={section} className="mb-6">
            {!isCollapsed && (
              <div className="px-6 mb-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{section}</span>
              </div>
            )}
            <div className="space-y-0.5">
              {items.map((item, idx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => { if (onLinkClick) onLinkClick(); }}
                    className={cn(
                      "flex items-center group relative h-[44px] transition-all duration-150 ease-in-out mx-2",
                      isCollapsed ? "justify-center rounded-xl" : "px-4 rounded-[10px]",
                      isActive 
                        ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))] text-white font-semibold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    {isActive && !isCollapsed && (
                      <motion.div 
                        layoutId="activeNavIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                      />
                    )}
                    <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                      <Icon size={20} className={cn("transition-colors duration-150", isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white")} />
                      {item.badge && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-slate-900 shadow-sm animate-in zoom-in">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="ml-3 text-[14px] truncate">{item.title}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="shrink-0 p-2 border-t border-white/5">
        {!isCollapsed && (
          <Link
            href="/admin/settings"
            onClick={() => { if (onLinkClick) onLinkClick(); }}
            className="flex items-center px-4 h-[44px] mx-2 rounded-[10px] text-slate-300 hover:bg-white/5 hover:text-white transition-colors duration-150"
          >
            <Settings size={20} className="text-slate-400 shrink-0" />
            <span className="ml-3 text-[14px]">Settings</span>
          </Link>
        )}
        <button
          onClick={logout}
          className={cn(
            "flex items-center h-[44px] w-full text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-150 group",
            isCollapsed ? "justify-center rounded-xl" : "px-4 mx-2 rounded-[10px]"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut size={20} className="text-slate-400 group-hover:text-rose-400 shrink-0" />
          {!isCollapsed && <span className="ml-3 text-[14px]">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10 shadow-sm hidden md:flex"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );

  // When rendered inside the mobile Sheet, return content directly
  if (mobile) {
    return (
      <div className="flex flex-col h-full w-full">
        {SidebarContent}
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <motion.aside 
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:block fixed inset-y-0 left-0 z-40 h-screen shadow-2xl"
      >
        {SidebarContent}
      </motion.aside>

      {/* Spacer */}
      <motion.div 
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:block shrink-0 h-screen"
      />
    </>
  );
}
