import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileLineChart } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-[calc(100vh-64px)] flex flex-col justify-center items-center">
      <Card className="w-full max-w-md bg-muted border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-20 w-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <FileLineChart size={40} />
          </div>
          <h2 className="text-2xl font-bold text-card-foreground mb-2">Advanced Reports</h2>
          <p className="text-muted-foreground mb-8">
            The reporting module is currently under development. Soon, you'll be able to generate comprehensive PDF and Excel exports for payroll, performance, and attendance data.
          </p>
          <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold text-sm">
            Coming in Phase 3
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
