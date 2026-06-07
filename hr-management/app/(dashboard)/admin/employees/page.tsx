'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useEmployeeStore } from '@/store/employeeStore';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { AddEmployeeForm } from '@/components/employees/AddEmployeeForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LayoutGrid, List, Plus, Search, MoreVertical, Upload } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { useEmployees } from '@/hooks/useEmployees';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminEmployeesPage() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery } = useEmployeeStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    api.get('/employees/departments')
      .then(res => setDepartments(res.data))
      .catch(console.error);
  }, []);

  const { data: employeesData, isLoading: loading, refetch } = useEmployees({ 
    search: searchQuery,
    department_id: departmentId || undefined
  });
  const employees = Array.isArray(employeesData) ? employeesData : (employeesData?.items || employeesData?.employees || []);

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Import successful');
      refetch();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'HR_RECRUITER', 'SENIOR_MANAGER']}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-headline text-card-foreground tracking-tight">Employee Directory</h2>
            <p className="text-sm text-muted-foreground mt-1 font-body">Manage your team members, roles, and status across the organization.</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCsv} />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting} variant="outline" className="border-border text-muted-foreground rounded-xl hover:bg-muted hover:text-card-foreground transition-colors hidden sm:flex">
              {isImporting ? <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-current rounded-full" /> : <Upload className="w-4 h-4 mr-2" />}
              {isImporting ? 'Importing...' : 'Import CSV'}
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl px-4 py-2.5 hover:opacity-90 transition font-semibold flex items-center shadow-sm shadow-indigo-500/20 active:scale-95 duration-200 min-h-[44px] text-base md:text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] md:max-w-lg mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-headline text-xl">Add New Employee</DialogTitle>
                </DialogHeader>
                <AddEmployeeForm onSuccess={() => { setIsAddOpen(false); refetch(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-card p-4 rounded-2xl shadow-sm border border-border flex flex-col md:flex-row justify-between items-center gap-4 relative z-20">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input 
              className="w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-muted hover:bg-card focus:bg-card text-card-foreground placeholder:text-slate-400 font-medium min-h-[44px] text-base md:text-sm" 
              placeholder="Search by name, email, or code..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted">
              <button 
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-card shadow-sm text-indigo-600' : 'text-slate-400 hover:text-muted-foreground'}`}
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </button>
              <button 
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-card shadow-sm text-indigo-600' : 'text-slate-400 hover:text-muted-foreground'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            
            <select 
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="appearance-none bg-muted border border-border text-card-foreground rounded-xl px-4 py-2 pr-8 focus:ring-2 focus:ring-indigo-500 outline-none hover:bg-card cursor-pointer font-medium w-full sm:w-auto min-h-[44px] text-base md:text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((emp: any) => (
              <EmployeeCard key={emp.id} employee={emp} basePath="/admin/employees" />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead className="bg-card border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Employee</th>
                    <th className="py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Code</th>
                    <th className="py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Role & Department</th>
                    <th className="py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {employees.map((emp: any, index: number) => (
                    <tr key={emp.id} className={`${index % 2 === 0 ? 'bg-card' : 'bg-slate-50/30'} hover:bg-muted transition-colors`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.firstName} className="h-10 w-10 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shrink-0">
                              {(emp.firstName || emp.first_name || 'U').charAt(0)}{(emp.lastName || emp.last_name || 'U').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-card-foreground group-hover:text-indigo-600 transition-colors">{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</div>
                            <div className="text-xs text-muted-foreground">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-muted-foreground">{emp.employeeCode || emp.employee_code}</td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-card-foreground">{emp.designation || 'Employee'}</div>
                        <div className="text-xs text-muted-foreground">{emp.department?.name || 'Unassigned'}</div>
                      </td>
                      <td className="py-4 px-6">
                        {emp.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                            {emp.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link href={`/admin/employees/${emp.id}`}>
                          <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 px-6 text-center text-muted-foreground">
                        No employees found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Mobile View: Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-muted">
              {employees.map((emp: any) => (
                <EmployeeCard key={emp.id} employee={emp} basePath="/admin/employees" />
              ))}
              {employees.length === 0 && (
                <div className="py-8 px-6 text-center text-muted-foreground">
                  No employees found matching your criteria.
                </div>
              )}
            </div>
            
            {employees.length > 0 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-white/50">
                <span className="text-xs font-medium text-muted-foreground">Showing {employees.length} entries</span>
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-1 text-sm text-slate-400 bg-muted rounded-lg border border-border cursor-not-allowed">Prev</button>
                  <button className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-lg font-medium">1</button>
                  <button className="px-3 py-1 text-sm text-slate-400 bg-muted rounded-lg border border-border cursor-not-allowed">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
