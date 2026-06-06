import React from 'react';
import { Progress } from '@/components/ui/progress';

export function InterviewProgress({ currentQuestion, totalQuestions }: { currentQuestion: number, totalQuestions: number }) {
  const percentage = (currentQuestion / totalQuestions) * 100;
  
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm font-medium">
        <span>Question {currentQuestion} of {totalQuestions}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
