'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function HROnboardingDetail() {
  const { employeeId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get(`/onboarding/${employeeId}`);
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [employeeId]);

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/onboarding/${employeeId}`, {
        task_id: taskId,
        is_completed: !currentStatus
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const sendReminder = async () => {
    setSending(true);
    try {
      await api.post(`/onboarding/${employeeId}/remind`);
      alert('Reminder email sent!');
    } catch (err) {
      console.error(err);
      alert('Failed to send reminder');
    }
    setSending(false);
  };

  if (!data) return <div>Loading...</div>;

  const { employee, tasks, progress, total, completed } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Button variant="link" onClick={() => router.push('/hr/onboarding')} className="px-0 mb-2">&larr; Back to Dashboard</Button>
          <div className="flex gap-4 items-center">
            <Avatar className="h-16 w-16 border">
              <AvatarImage src={employee.photo_url || employee.photoUrl} />
              <AvatarFallback><User className="h-8 w-8 text-slate-400" /></AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{employee.first_name || employee.firstName} {employee.last_name || employee.lastName}</h1>
              <p className="text-muted-foreground">{employee.designation} • {employee.department?.name}</p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Joined: {format(new Date(employee.joining_date || employee.joiningDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sendReminder} disabled={sending || progress === 100}>
            <Mail className="h-4 w-4 mr-2" /> Send Reminder Email
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <div className="relative h-24 w-24 flex-shrink-0 flex items-center justify-center rounded-full border-4 border-border">
            <svg className="absolute inset-0 h-full w-full transform -rotate-90">
              <circle cx="44" cy="44" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
              <circle cx="44" cy="44" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-600" strokeDasharray={`${progress * 2.51} 251`} />
            </svg>
            <span className="text-xl font-bold">{progress}%</span>
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold">Overall Progress</h3>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{completed} out of {total} tasks completed</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(tasks).map(([category, catTasks]: [string, any]) => (
          <Card key={category}>
            <CardHeader className="bg-muted border-b pb-4">
              <CardTitle className="text-lg">{category.replace('_', ' ')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {catTasks.map((task: any) => (
                  <div key={task.id} className={`p-4 flex gap-4 ${task.is_completed || task.isCompleted ? 'bg-slate-50/50' : ''}`}>
                    <Checkbox 
                      checked={task.is_completed || task.isCompleted} 
                      onCheckedChange={() => toggleTask(task.id, task.is_completed || task.isCompleted)} 
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${task.is_completed || task.isCompleted ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p>
                      {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-slate-400">
                        {(task.due_date || task.dueDate) && <span>Due: {format(new Date(task.due_date || task.dueDate), 'MMM dd, yyyy')}</span>}
                        {(task.is_completed || task.isCompleted) && (task.completed_by || task.completedBy) && (
                          <span className="text-green-600">Completed by {task.completed_by || task.completedBy} on {format(new Date(task.completed_at || task.completedAt), 'MMM dd')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
