import { Card, CardContent } from '@/components/ui/card';

export function LeaveBalanceCard({ title, used, total, colorClass = "bg-blue-500" }: { title: string, used: number, total: number, colorClass?: string }) {
  const percentage = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const remaining = total - used;

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="font-semibold text-muted-foreground text-sm mb-4 uppercase tracking-wider">{title}</h3>
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-3xl font-bold">{remaining}</p>
            <p className="text-xs text-muted-foreground">Remaining of {total}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{used} used</p>
          </div>
        </div>
        <div className="h-2 w-full bg-muted dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}
