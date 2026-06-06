'use client';

import AttendanceHeatmap from '@/components/attendance/AttendanceHeatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function ManagerAttendancePage() {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Team Attendance</h1>
      <Card>
        <CardHeader>
          <CardTitle>Team Heatmap - {format(new Date(), 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceHeatmap month={month} year={year} />
        </CardContent>
      </Card>
    </div>
  );
}
