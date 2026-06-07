'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, LogOut, CheckCircle2 } from 'lucide-react';
import { subscribeToChannel, supabase } from '@/lib/supabase-realtime';
import { useClockInOut } from '@/hooks/useAttendance';

export default function ClockButton({ employeeId, initialStatus, initialClockIn }: { employeeId: string, initialStatus?: string, initialClockIn?: Date | null }) {
  const [status, setStatus] = useState(initialStatus || 'ABSENT');
  const [clockInTime, setClockInTime] = useState<Date | null>(initialClockIn ? new Date(initialClockIn) : null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const { mutateAsync: clockInOut, isPending: loading } = useClockInOut();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'PRESENT' && clockInTime) {
      interval = setInterval(() => {
        const diff = Date.now() - clockInTime.getTime();
        const hrs = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const mins = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
        const secs = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        setElapsed(`${hrs}:${mins}:${secs}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, clockInTime]);

  useEffect(() => {
    const channel = subscribeToChannel('attendance', 'attendance_updated', (payload: any) => {
      if (payload.employeeId === employeeId) {
        setStatus(payload.clockOut ? 'COMPLETED' : payload.attendanceStatus);
      }
    });
    return () => { if (channel) if (channel) supabase.removeChannel(channel); };
  }, [employeeId]);

  const handleClock = async () => {
    try {
      const data = await clockInOut({});
      setStatus(data.clockOut ? 'COMPLETED' : 'PRESENT');
      if (data.clockIn && !data.clockOut) {
        setClockInTime(new Date(data.clockIn));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === 'COMPLETED') {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-10 flex flex-col items-center justify-center relative overflow-hidden">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 z-10">Time & Attendance</h3>
        <div className="z-10 group relative w-48 h-48 rounded-full bg-muted border-4 border-border flex flex-col items-center justify-center text-slate-400">
           <CheckCircle2 size={48} className="mb-2" />
           <span className="text-xl font-black font-headline tracking-wide">COMPLETED</span>
        </div>
        <div className="z-10 mt-8 text-center">
          <div className="text-sm text-muted-foreground mb-2">Total Shift Time</div>
          <div className="text-4xl font-mono font-bold text-card-foreground tracking-tight">{elapsed || '08:00:00'}</div>
        </div>
      </div>
    );
  }

  const isClockedIn = status === 'PRESENT';

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-10 flex flex-col items-center justify-center relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNlNTRmNmMiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PC9zdmc+')] [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-50"></div>
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 z-10">Time & Attendance</h3>
      
      <button 
        onClick={handleClock}
        disabled={loading}
        className={`z-10 group relative w-full h-20 md:w-48 md:h-48 rounded-2xl md:rounded-full shadow-xl flex flex-col md:flex-col items-center justify-center text-white transform hover:scale-105 active:scale-95 transition-all duration-300 ${
          isClockedIn 
            ? 'bg-gradient-to-b from-rose-400 to-rose-600 shadow-rose-500/30' 
            : 'bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-emerald-500/30'
        }`}
      >
        <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isClockedIn ? 'bg-rose-400' : 'bg-emerald-400'}`}></div>
        {isClockedIn ? (
           <LogOut size={48} className="mb-2" />
        ) : (
           <Fingerprint size={48} className="mb-2" />
        )}
        <span className="text-xl md:text-2xl font-black font-headline tracking-wide">
           {isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
        </span>
      </button>

      <div className="z-10 mt-8 text-center">
        <div className="text-sm text-muted-foreground mb-2">Current Shift Elapsed</div>
        <div className="text-5xl font-mono font-bold text-card-foreground tracking-tight">{elapsed}</div>
      </div>
    </div>
  );
}
