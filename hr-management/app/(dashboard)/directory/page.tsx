'use client';
import { useAuthStore } from '@/store/authStore';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EmployeeDirectoryCard } from '@/components/directory/EmployeeDirectoryCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useDebounce } from '@/lib/hooks';

const DEPT_COLORS: Record<string, string> = {
  'Engineering': 'bg-blue-100 text-blue-800',
  'Marketing': 'bg-pink-100 text-pink-800',
  'Finance': 'bg-green-100 text-green-800',
  'Operations': 'bg-orange-100 text-orange-800',
  'HR': 'bg-purple-100 text-purple-800',
  'Sales': 'bg-yellow-100 text-yellow-800',
  'Unknown': 'bg-muted text-card-foreground'
};

export default function DirectoryPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'EMPLOYEE';

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  
  // Custom hook usage if it exists, otherwise just a simple delay
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    
    // Fetch departments if we haven't
    if (departments.length === 0) {
      api.get('/employees/departments').then(res => {
        setDepartments(res.data.map((d: any) => d.name));
      }).catch(console.error);
    }
    
    const params = new URLSearchParams();
    if (debouncedSearch) params.append('search', debouncedSearch);
    
    // Note: The backend expects department_id, but we'll send department name and let the backend handle it or we should just send name.
    // If backend doesn't support filtering by name, we might just fetch all and filter in frontend for this simple app, or update the backend.
    
    api.get(`/employees?${params.toString()}`)
      .then(res => {
        let emps = res.data?.items || [];
        // Filter by department if activeTab is not ALL
        if (activeTab !== 'ALL') {
          emps = emps.filter((emp: any) => emp.department && emp.department.name === activeTab);
        }
        setEmployees(emps);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedSearch, activeTab]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Company Directory</h1>
          <Badge variant="secondary" className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700">
            {employees.length} Employees
          </Badge>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search by name, designation, or department..." 
            className="pl-10 h-12 text-lg shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
            ${activeTab === 'ALL' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-muted-foreground hover:text-card-foreground'}`}
          onClick={() => setActiveTab('ALL')}
        >
          All Departments
        </button>
        {departments.map(dept => (
          <button
            key={dept}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
              ${activeTab === dept ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-muted-foreground hover:text-card-foreground'}`}
            onClick={() => setActiveTab(dept)}
          >
            {dept}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading directory...</div>
      ) : employees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => (
            <EmployeeDirectoryCard 
              key={emp.id} 
              employee={emp} 
              departmentColors={DEPT_COLORS} 
              role={role}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted rounded-xl border border-dashed border-slate-300">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-card-foreground">No employees found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
