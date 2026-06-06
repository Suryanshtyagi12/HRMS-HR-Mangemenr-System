'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, User, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function HROnboardingDashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/onboarding')
      .then(res => {
        const payload = res.data;
        setEmployees(payload?.data || payload?.items || (Array.isArray(payload) ? payload : []));
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const filtered = filter === 'ALL' ? employees : employees.filter(e => e.status === filter);

  const stats = {
    total: employees.length,
    completed: employees.filter(e => e.status === 'COMPLETED').length,
    inProgress: employees.filter(e => e.status === 'IN_PROGRESS').length,
    notStarted: employees.filter(e => e.status === 'NOT_STARTED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Dashboard</h1>
          <p className="text-muted-foreground">Track new hire onboarding progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Onboarding</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold text-green-600">{stats.completed}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">In Progress</p><p className="text-2xl font-bold text-indigo-600">{stats.inProgress}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Not Started</p><p className="text-2xl font-bold text-amber-600">{stats.notStarted}</p></CardContent></Card>
      </div>

      <div className="flex gap-2 bg-card p-2 rounded-lg border w-fit">
        {['ALL', 'IN_PROGRESS', 'COMPLETED', 'NOT_STARTED'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm" onClick={() => setFilter(f)}>
            {f.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(emp => (
          <Card key={emp.id} className="hover:shadow-md transition-shadow relative overflow-hidden">
            {emp.hasOverdue && (
              <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] px-2 py-1 font-bold rounded-bl-lg flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> OVERDUE TASKS
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex gap-4 items-start mb-4">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={emp.photo_url || emp.photoUrl} />
                  <AvatarFallback><User className="text-slate-400" /></AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{emp.first_name || emp.firstName} {emp.last_name || emp.lastName}</h3>
                  <p className="text-xs text-muted-foreground">{emp.designation} • {emp.department}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Joined {formatDistanceToNow(new Date(emp.joining_date || emp.joiningDate))} ago
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{emp.progress}%</span>
                </div>
                <Progress value={emp.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{emp.completed_tasks || emp.completedTasks} of {emp.total_tasks || emp.totalTasks} tasks completed</p>
              </div>
              
              <Button className="w-full" variant="outline" onClick={() => router.push(`/hr/onboarding/${emp.id}`)}>
                View Checklist
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
