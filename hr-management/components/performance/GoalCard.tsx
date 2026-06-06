'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface GoalCardProps {
  goal: any;
  isEmployee: boolean;
  onUpdate?: (id: string, updates: any) => Promise<void>;
}

export function GoalCard({ goal, isEmployee, onUpdate }: GoalCardProps) {
  const [progress, setProgress] = useState(goal.progress);
  const [status, setStatus] = useState(goal.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (type: 'progress' | 'status', value: any) => {
    if (type === 'progress') setProgress(value);
    if (type === 'status') setStatus(value);
    
    if (onUpdate) {
      setIsUpdating(true);
      await onUpdate(goal.id, { 
        progress: type === 'progress' ? value : progress,
        status: type === 'status' ? value : status
      });
      setIsUpdating(false);
    }
  };

  return (
    <Card className="relative overflow-hidden group">
      {isUpdating && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-base">{goal.title}</h4>
            {goal.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>}
          </div>
          
          {isEmployee ? (
            <Select value={status} onValueChange={(v) => handleUpdate('status', v)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={status === 'COMPLETED' ? 'default' : status === 'IN_PROGRESS' ? 'secondary' : 'outline'}>
              {status.replace('_', ' ')}
            </Badge>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center text-xs font-medium">
            <span>Progress: {progress}%</span>
            {goal.targetDate && <span className="text-muted-foreground">Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>}
          </div>
          
          {isEmployee ? (
            <input 
              type="range" min="0" max="100" step="5" 
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              onMouseUp={() => handleUpdate('progress', progress)}
              onTouchEnd={() => handleUpdate('progress', progress)}
              className="w-full accent-primary cursor-pointer"
            />
          ) : (
            <Progress value={progress} className="h-2" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
