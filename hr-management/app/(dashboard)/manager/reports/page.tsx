"use client";
import React from 'react';
import { HeadcountChart } from '@/components/charts/HeadcountChart';
import { HiringFunnel } from '@/components/charts/HiringFunnel';
import { PayrollChart } from '@/components/charts/PayrollChart';
import { AttendanceDonut } from '@/components/charts/AttendanceDonut';

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-headline text-card-foreground tracking-tight">Advanced Reports</h2>
          <p className="text-sm text-muted-foreground mt-1 font-body">Comprehensive overview of headcount, hiring, payroll, and attendance.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-muted text-card-foreground rounded-xl border border-border hover:bg-card transition shadow-sm font-medium text-sm" onClick={() => alert('Exporting PDF...')}>
            Export PDF
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition font-medium text-sm shadow-sm" onClick={() => alert('Exporting Excel...')}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold mb-4 font-headline">Headcount Trends</h3>
          <div className="h-[300px]">
            <HeadcountChart />
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold mb-4 font-headline">Payroll Overview</h3>
          <div className="h-[300px]">
            <PayrollChart />
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold mb-4 font-headline">Hiring Pipeline</h3>
          <div className="h-[300px]">
            <HiringFunnel />
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold mb-4 font-headline">Attendance Overview</h3>
          <div className="h-[300px] flex justify-center items-center pb-8">
            <AttendanceDonut />
          </div>
        </div>
      </div>
    </div>
  );
}
