'use client';
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Goal {
  title: string;
  progress: number;
  status: string;
}

export function GoalsProgress({ goals }: { goals: Goal[] }) {
  if (!goals || goals.length === 0) return <div className="text-muted-foreground p-4 text-sm">No active goals.</div>;

  return (
    <div className="space-y-6">
      {goals.map((goal, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm">{goal.title}</span>
            <Badge variant={goal.status === 'On Track' ? 'default' : goal.status === 'At Risk' ? 'destructive' : 'secondary'} className="text-[10px]">
              {goal.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={goal.progress} className="h-2 flex-1" />
            <span className="text-xs font-bold w-8 text-right">{goal.progress}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
