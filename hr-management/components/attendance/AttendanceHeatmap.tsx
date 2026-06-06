'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, XAxis, YAxis, ZAxis } from 'recharts';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export default function AttendanceHeatmap({ month, year, employeeId }: { month: number, year: number, employeeId?: string }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      let url = `/api/attendance?dateFrom=${year}-${month.toString().padStart(2, '0')}-01&dateTo=${year}-${month.toString().padStart(2, '0')}-31&pageSize=1000`;
      if (employeeId) url += `&employeeId=${employeeId}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    };
    fetchData();
  }, [month, year, employeeId]);

  const chartData = useMemo(() => {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(startDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const empMap = new Map();
    data.forEach(log => {
      if (!empMap.has(log.employeeId)) {
        empMap.set(log.employeeId, { name: `${log.employee.firstName} ${log.employee.lastName}`, logs: {} });
      }
      const dayStr = format(new Date(log.date), 'yyyy-MM-dd');
      empMap.get(log.employeeId).logs[dayStr] = log.status;
    });

    const plotData: any[] = [];
    let yIndex = 0;
    empMap.forEach((emp, empId) => {
      days.forEach((day, xIndex) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const status = emp.logs[dayStr] || 'NONE';
        let val = 0;
        if (status === 'PRESENT') val = 1;
        else if (status === 'LATE') val = 2;
        else if (status === 'ABSENT') val = 3;
        else if (status === 'ON_LEAVE') val = 4;
        
        plotData.push({
          x: xIndex,
          y: yIndex,
          z: val,
          status,
          date: dayStr,
          empName: emp.name
        });
      });
      yIndex++;
    });
    
    return { plotData, empCount: yIndex, daysCount: days.length };
  }, [data, month, year]);

  const COLORS = ['#f1f5f9', '#22c55e', '#eab308', '#ef4444', '#3b82f6'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card dark:bg-slate-900 p-2 border dark:border-slate-800 shadow-lg rounded-md text-sm">
          <p className="font-semibold">{data.empName}</p>
          <p className="text-muted-foreground">{data.date}</p>
          <p className="mt-1 font-medium">Status: <span className="text-primary">{data.status}</span></p>
        </div>
      );
    }
    return null;
  };

  if (!chartData.plotData.length) return <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">No heatmap data available for this period.</div>;

  return (
    <div className="h-[400px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 100 }}>
          <XAxis type="number" dataKey="x" tick={false} axisLine={false} />
          <YAxis type="number" dataKey="y" tick={false} axisLine={false} />
          <ZAxis type="number" dataKey="z" range={[100, 100]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={chartData.plotData} shape="square">
            {chartData.plotData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.z] || COLORS[0]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
