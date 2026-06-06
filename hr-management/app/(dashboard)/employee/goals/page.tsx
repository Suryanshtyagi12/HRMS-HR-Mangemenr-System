'use client';
import { useAuthStore } from '@/store/authStore';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, Clock, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeeTasksPage() {
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/performance/tasks');
      setTasks(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setActionLoading(taskId);
    try {
      await api.put(`/performance/tasks/${taskId}`, { status: newStatus });
      await fetchTasks();
    } catch (e) {
      console.error(e);
      alert('Failed to update task status');
    }
    setActionLoading(null);
  };

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const activeTasks = tasks.filter(t => t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks & Goals</h1>
          <p className="text-muted-foreground mt-1">Manage tasks assigned by your manager.</p>
        </div>
      </div>

      {pendingTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center text-amber-600"><Clock className="w-5 h-5 mr-2" /> Pending Acceptance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTasks.map(task => (
              <Card key={task.id} className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{task.title}</h4>
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">New</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Project: {task.project_name}</p>
                  <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-amber-200/50">
                    <span className="text-xs font-semibold text-muted-foreground">Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                    <Button 
                      size="sm" 
                      onClick={() => updateTaskStatus(task.id, 'ACCEPTED')}
                      disabled={actionLoading === task.id}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {actionLoading === task.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Accept Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center"><Target className="w-5 h-5 mr-2 text-indigo-600" /> Active Tasks</h3>
        {activeTasks.length === 0 ? (
          <Card className="bg-muted border-dashed border-border"><CardContent className="py-8 text-center text-muted-foreground">No active tasks found.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTasks.map(task => (
              <Card key={task.id} className="border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{task.title}</h4>
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">Accepted</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Project: {task.project_name}</p>
                  <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                    <span className="text-xs font-semibold text-muted-foreground">Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                    <Button 
                      size="sm" 
                      onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                      disabled={actionLoading === task.id}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {actionLoading === task.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Mark Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-muted-foreground">Completed Tasks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
            {completedTasks.map(task => (
              <Card key={task.id} className="bg-muted border-border">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-card-foreground line-through">{task.title}</h4>
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Completed</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Project: {task.project_name}</p>
                  <span className="text-xs font-semibold text-muted-foreground">Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
