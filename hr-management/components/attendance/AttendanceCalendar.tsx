'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AttendanceCalendar({ employeeId }: { employeeId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const yearStr = currentDate.getFullYear().toString();
      const res = await fetch(`/api/attendance?employeeId=${employeeId}&dateFrom=${yearStr}-${monthStr}-01&dateTo=${yearStr}-${monthStr}-31`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    };
    if (employeeId) fetchLogs();
  }, [currentDate, employeeId]);

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const getColor = (day: Date) => {
    const log = logs.find(l => isSameDay(new Date(l.date), day));
    if (!log) {
      const d = getDay(day);
      if (d === 0 || d === 6) return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'; 
      return 'bg-muted dark:bg-slate-900 border border-border dark:border-slate-800'; 
    }
    switch (log.status) {
      case 'PRESENT': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'ABSENT': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'ON_LEAVE': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default: return 'bg-muted dark:bg-slate-900 border-border dark:border-slate-800';
    }
  };

  return (
    <div className="p-4 bg-card dark:bg-slate-950 rounded-xl shadow-sm border border-border dark:border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium mb-2 text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: getDay(start) }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => (
          <div key={day.toISOString()} className={`aspect-square flex flex-col items-center justify-center rounded-lg ${getColor(day)} border`} title={format(day, 'PP')}>
            <span className="text-lg font-semibold">{format(day, 'd')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
