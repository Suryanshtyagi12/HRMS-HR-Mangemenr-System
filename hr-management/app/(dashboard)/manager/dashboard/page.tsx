'use client';

import React, { useEffect, useState } from 'react';
import { Users, Gauge as Speedometer, Clock, AlertTriangle, CalendarDays, TrendingUp, TrendingDown, Filter, Check, X, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useManagerDashboard } from '@/hooks/useDashboard';

export default function ManagerDashboard() {
  const { data: dashboardData } = useManagerDashboard();
  const data = dashboardData || null;

  if (!data) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen font-body animate-pulse">
        <div className="h-32 bg-muted rounded-[16px] mb-8 w-full"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-[16px]"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-7 h-[300px] bg-muted rounded-[16px]"></div>
          <div className="lg:col-span-5 h-[300px] bg-muted rounded-[16px]"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-[300px] bg-muted rounded-[16px]"></div>
          <div className="lg:col-span-5 h-[300px] bg-muted rounded-[16px]"></div>
        </div>
      </div>
    );
  }

  const performanceData = [
    { name: 'Q1', score: 4.1 },
    { name: 'Q2', score: 4.3 },
    { name: 'Q3', score: 4.2 },
    { name: 'Q4 (Proj)', score: 4.5 },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-300 min-h-screen">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card rounded-2xl p-8 shadow-sm border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 dark:from-indigo-900/20 to-purple-50 dark:to-purple-900/20 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
        <div className="z-10">
          <h2 className="text-xl md:text-2xl font-extrabold text-card-foreground font-headline mb-2 tracking-tight">Good morning, Manager</h2>
          <p className="text-muted-foreground font-body text-sm md:text-base max-w-lg">Here is the latest snapshot of your team's performance, pending requests, and critical alerts needing your attention today.</p>
        </div>
        <div className="mt-6 md:mt-0 z-10">
          <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl px-4 md:px-6 py-2 md:py-3 hover:opacity-90 transition font-semibold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transform active:scale-95 duration-200 text-sm md:text-base w-full md:w-auto justify-center">
            <CalendarDays size={20} />
            <span>Schedule 1:1</span>
          </button>
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <Users size={24} />
            </div>
            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full px-2.5 py-1 text-xs font-semibold flex items-center">
              <TrendingUp size={14} className="mr-1" /> +2
            </span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-card-foreground font-headline tracking-tight">{data.teamSize}</h3>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-1">Team Members</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <TrendingUp size={24} />
            </div>
            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full px-2.5 py-1 text-xs font-semibold flex items-center">
              <TrendingUp size={14} className="mr-1" /> +5%
            </span>
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <h3 className="text-2xl md:text-3xl font-black text-card-foreground font-headline tracking-tight">4.2</h3>
              <span className="text-muted-foreground/70 font-medium text-xs md:text-sm">/ 5.0</span>
            </div>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-1">Avg Performance</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <Clock size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-card-foreground font-headline tracking-tight">{data.pendingLeaveRequests}</h3>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-1">Pending Approvals</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 group relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-5">
            <AlertTriangle size={120} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-black text-card-foreground font-headline tracking-tight">2</h3>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-1">Flight Risks Detected</p>
          </div>
        </div>
      </div>

      {/* Row 2: Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left: Team Performance Chart (60%) */}
        <div className="lg:col-span-7 bg-card rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-card-foreground font-headline">Team Performance</h3>
            <select className="bg-muted border-none text-sm font-medium text-muted-foreground rounded-lg py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 cursor-pointer outline-none">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="flex-1 h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Flight Risk Alerts (40%) */}
        <div className="lg:col-span-5 bg-card rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="text-rose-500 dark:text-rose-400 w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-card-foreground font-headline">Flight Risk Alerts</h3>
            </div>
            <span className="bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold px-2.5 py-0.5 rounded-full">2 Active</span>
          </div>
          <div className="flex-1 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-muted/50 hover:bg-card hover:border-rose-100 dark:hover:border-rose-900 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    ML
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-card-foreground">Marcus Lee</h4>
                    <p className="text-xs text-muted-foreground">Senior Developer</p>
                  </div>
                </div>
                <span className="bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">High Risk</span>
              </div>
              <div className="mt-3 flex items-center text-sm text-muted-foreground bg-card p-2 rounded-lg border border-border">
                <TrendingDown className="text-rose-400 w-4 h-4 mr-2" />
                <span className="font-medium text-xs">Low engagement score last 30 days</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/50 hover:bg-card hover:border-amber-100 dark:hover:border-amber-900 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    SC
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-card-foreground">Sarah Chen</h4>
                    <p className="text-xs text-muted-foreground">Product Designer</p>
                  </div>
                </div>
                <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">Medium Risk</span>
              </div>
              <div className="mt-3 flex items-center text-sm text-muted-foreground bg-card p-2 rounded-lg border border-border">
                <AlertTriangle className="text-amber-500 dark:text-amber-400 w-4 h-4 mr-2" />
                <span className="font-medium text-xs">Compensation gap vs market avg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Approvals and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 pb-12">
        {/* Left: Leave Approvals Table (60%) */}
        <div className="lg:col-span-7 bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center bg-card z-10 sticky top-0">
            <h3 className="text-lg font-bold text-card-foreground font-headline">Pending Approvals</h3>
            <button className="text-muted-foreground hover:text-indigo-600 transition-colors">
              <Filter size={20} />
            </button>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3 border-b border-border">Employee</th>
                  <th className="px-6 py-3 border-b border-border">Dates</th>
                  <th className="px-6 py-3 border-b border-border">Type</th>
                  <th className="px-6 py-3 border-b border-border text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-card-foreground divide-y divide-border">
                {data.upcomingLeaves.length > 0 ? data.upcomingLeaves.slice(0,3).map((l: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {l.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <span className="text-card-foreground font-semibold group-hover:text-indigo-600 transition-colors">{l.name}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{l.from} - {l.to}</td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full px-2 py-1 text-[10px] font-bold uppercase">Leave</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors" title="Approve">
                        <Check size={18} />
                      </button>
                      <button className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors" title="Reject">
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No pending approvals.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data.upcomingLeaves.length > 3 && (
            <div className="p-4 border-t border-border bg-muted/30 mt-auto">
              <button className="text-sm font-medium text-muted-foreground hover:text-indigo-600 w-full text-center transition-colors">View All Requests</button>
            </div>
          )}
        </div>

        {/* Right: Recent Team Activity (40%) */}
        <div className="lg:col-span-5 bg-card rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col">
          <h3 className="text-lg font-bold text-card-foreground font-headline mb-6">Recent Activity</h3>
          <div className="relative flex-1 pl-4 border-l-2 border-border space-y-6">
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-card shadow-sm"></div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-card-foreground"><span className="font-bold">Jane Smith</span> completed mandatory compliance training.</p>
                <span className="text-xs text-muted-foreground mt-1">2 hours ago</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card shadow-sm"></div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-card-foreground"><span className="font-bold">Alex Rivera</span> closed 3 Q3 OKRs.</p>
                <span className="text-xs text-muted-foreground mt-1">4 hours ago</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-card shadow-sm"></div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-card-foreground"><span className="font-bold">John Doe</span> clocked in 30 mins late.</p>
                <span className="text-xs text-muted-foreground mt-1">Today, 9:30 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
