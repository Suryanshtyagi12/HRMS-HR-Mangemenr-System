'use client';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function AttendanceDonut({ data }: { data: any }) {
  const chartData = [
    { name: 'Present', value: data.present, color: '#10b981' }, // emerald-500
    { name: 'Absent', value: data.absent, color: '#f43f5e' }, // rose-500
    { name: 'On Leave', value: data.onLeave, color: '#f59e0b' }, // amber-500
  ].filter(d => d.value > 0);

  if (chartData.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>;
  }

  return (
    <div className="h-[300px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={110}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-4">
        <span className="text-3xl font-bold">{data.total}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
      </div>
    </div>
  );
}
