'use client';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AttendanceHeatmap({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="p-4 text-muted-foreground">No heatmap data available.</div>;

  const getColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-emerald-400';
      case 'LATE': return 'bg-amber-400';
      case 'ABSENT': return 'bg-rose-400';
      case 'WEEKEND': return 'bg-muted';
      default: return 'bg-blue-400'; // Leave
    }
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-block min-w-full">
        {data.map((emp, i) => (
          <div key={i} className="flex items-center mb-2 gap-2">
            <div className="w-32 text-xs font-medium truncate shrink-0">{emp.employeeName}</div>
            <div className="flex gap-1">
              <TooltipProvider delayDuration={100}>
                {emp.dates.map((d: any, j: number) => (
                  <Tooltip key={j}>
                    <TooltipTrigger asChild>
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm \${getColor(d.status)} cursor-pointer hover:opacity-80 transition-opacity`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold text-xs">{d.date}</p>
                      <p className="text-xs capitalize">{d.status.toLowerCase()}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        ))}
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center"><div className="w-3 h-3 bg-emerald-400 rounded-sm mr-1.5" /> Present</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-amber-400 rounded-sm mr-1.5" /> Late</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-blue-400 rounded-sm mr-1.5" /> Leave</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-rose-400 rounded-sm mr-1.5" /> Absent</div>
        </div>
      </div>
    </div>
  );
}
