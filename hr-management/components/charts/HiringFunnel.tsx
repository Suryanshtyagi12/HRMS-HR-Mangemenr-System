'use client';
import React from 'react';
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'];

export function HiringFunnel({ data = [] }: { data?: any[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <Tooltip 
            formatter={(value, name, props: any) => [value ?? 0, props?.payload?.stage ?? name]}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Funnel
            dataKey="count"
            data={data}
            isAnimationActive
          >
            <LabelList position="right" fill="#666" stroke="none" dataKey="stage" />
            <LabelList position="center" fill="#fff" stroke="none" dataKey="count" />
            {data.map((entry, index) => (
              <Cell key={`cell-\${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
