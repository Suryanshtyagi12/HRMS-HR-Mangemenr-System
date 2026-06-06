'use client';
import { useAuthStore } from '@/store/authStore';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalCard } from '@/components/performance/GoalCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, Target } from 'lucide-react';

export default function EmployeePerformancePage() {
  const user = useAuthStore((s) => s.user);
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await api.get('/performance/goals');
        setGoals(res.data?.items || res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchGoals();
  }, []);

  const handleUpdateGoal = async (id: string, updates: any) => {
    try {
      await api.put(`/performance/goals/${id}`, updates);
    } catch (e) {
      console.error(e);
    }
    // In real app, we'd update state or refetch. 
  };

  const activeGoals = goals.filter(g => g.status !== 'COMPLETED' && g.status !== 'CANCELLED');
  const completedGoals = goals.filter(g => g.status === 'COMPLETED');

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Performance & Goals</h1>
          <p className="text-muted-foreground mt-1">Track your OKRs and manage your self-reviews.</p>
        </div>
        <Button className="bg-primary"><PlusCircle className="w-4 h-4 mr-2" /> New Goal</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center"><Target className="w-5 h-5 mr-2 text-primary" /> Active Goals</h3>
        {activeGoals.length === 0 ? (
          <Card className="bg-muted/30 border-dashed"><CardContent className="py-8 text-center text-muted-foreground">No active goals found. Set a new one!</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map(g => (
              <GoalCard key={g.id} goal={g} isEmployee={true} onUpdate={handleUpdateGoal} />
            ))}
          </div>
        )}
      </div>

      {completedGoals.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-semibold text-muted-foreground">Completed Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
            {completedGoals.map(g => (
              <GoalCard key={g.id} goal={g} isEmployee={true} onUpdate={handleUpdateGoal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
