'use client';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';

export default function EmployeeOnboardingPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    if (!user?.employeeId) return;
    try {
      const res = await api.get(`/onboarding/${user.employeeId}`);
      if (res.data) {
        const json = res.data;
        setData(json);
        
        // Trigger confetti if exactly 100% and it wasn't already triggered
        if (json.progress === 100 && !sessionStorage.getItem('onboarding_confetti')) {
          fireConfetti();
          sessionStorage.setItem('onboarding_confetti', 'true');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!user?.employeeId) return;
    try {
      await api.patch(`/onboarding/${user.employeeId}`, {
        task_id: taskId,
        is_completed: !currentStatus
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const fireConfetti = () => {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    var interval: any = setInterval(function() {
      var timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      var particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  if (!data) return <div>Loading...</div>;

  const { employee, tasks, progress, total, completed } = data;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome to HRMS Pro, {employee.first_name || employee.firstName}! 🎉</h1>
        <p className="text-indigo-100 max-w-2xl">
          We are thrilled to have you on board as our new {employee.designation}. 
          Please complete your onboarding checklist below to get fully set up.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-lg font-semibold">Your Onboarding Journey</h3>
              <p className="text-sm text-muted-foreground">{completed} of {total} tasks completed</p>
            </div>
            <span className="text-2xl font-bold text-indigo-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
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
                      {(task.due_date || task.dueDate) && !(task.is_completed || task.isCompleted) && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">Due: {format(new Date(task.due_date || task.dueDate), 'MMM dd, yyyy')}</p>
                      )}
                      {(task.is_completed || task.isCompleted) && (task.completed_by || task.completedBy) && (
                        <p className="text-xs text-green-600 mt-2">Completed on {format(new Date(task.completed_at || task.completedAt), 'MMM dd, yyyy')}</p>
                      )}
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
