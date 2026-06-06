import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function LeaveCalendar({ teamEvents = [] }: { teamEvents?: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const getColor = (type: string) => {
    switch (type) {
      case 'CASUAL': return 'bg-blue-500';
      case 'SICK': return 'bg-red-500';
      case 'EARNED': return 'bg-green-500';
      case 'MATERNITY': return 'bg-purple-500';
      case 'PATERNITY': return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="bg-card dark:bg-slate-950 rounded-xl shadow-sm border border-border dark:border-slate-800 p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold mb-2 text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      
      <div className="grid grid-cols-7 gap-2 min-h-[400px] auto-rows-fr">
        {Array.from({ length: getDay(start) }).map((_, i) => <div key={`empty-${i}`} className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg" />)}
        
        {days.map(day => {
          const eventsToday = teamEvents.filter(e => {
            const s = new Date(e.startDate); s.setHours(0,0,0,0);
            const en = new Date(e.endDate); en.setHours(23,59,59,999);
            return day >= s && day <= en;
          });

          return (
            <div key={day.toISOString()} className="border border-border dark:border-slate-800 rounded-lg p-1 flex flex-col h-full min-h-[80px]">
              <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 flex-1 flex flex-col gap-1 overflow-y-auto">
                <TooltipProvider>
                  {eventsToday.map(ev => (
                    <Tooltip key={ev.id}>
                      <TooltipTrigger asChild>
                        <div className={`${getColor(ev.leaveType)} text-white text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-help`}>
                          {ev.employee.firstName}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{ev.employee.firstName} {ev.employee.lastName}</p>
                        <p className="text-xs text-slate-300">{ev.leaveType} Leave</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
