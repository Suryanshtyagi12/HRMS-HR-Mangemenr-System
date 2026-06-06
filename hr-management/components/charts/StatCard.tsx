import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number; // percentage
  trendLabel?: string;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendLabel = "vs last month", description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">{value}</div>
          
          {(trend !== undefined || description) && (
            <div className="flex items-center text-xs">
              {trend !== undefined && (
                <span className={`flex items-center mr-2 font-medium \${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                  {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : <Minus className="w-3 h-3 mr-0.5" />}
                  {Math.abs(trend)}%
                </span>
              )}
              <span className="text-muted-foreground">{description || trendLabel}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
