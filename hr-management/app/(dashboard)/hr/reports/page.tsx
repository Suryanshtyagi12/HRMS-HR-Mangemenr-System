"use client";

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Download, FileText, FileSpreadsheet, Users, Calendar, DollarSign, Briefcase, Plane, Loader2, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, FileBarChart } from 'lucide-react';

const REPORT_TYPES = [
  { id: 'HEADCOUNT', title: 'Headcount & Demographics', icon: Users, desc: 'Employee counts, departments, and employment types.' },
  { id: 'ATTENDANCE', title: 'Attendance Trends', icon: Calendar, desc: 'Check-ins, absences, and late arrivals.' },
  { id: 'PAYROLL', title: 'Payroll Summary', icon: DollarSign, desc: 'Gross salary, deductions, and net payouts.' },
  { id: 'RECRUITMENT', title: 'Hiring Pipeline', icon: Briefcase, desc: 'Job postings, AI scores, and candidate stages.' },
  { id: 'LEAVE', title: 'Leave & Time Off', icon: Plane, desc: 'Leave requests, types, and approval statuses.' },
];

const MONTHS = [
  { val: 1, label: 'January' }, { val: 2, label: 'February' }, { val: 3, label: 'March' },
  { val: 4, label: 'April' }, { val: 5, label: 'May' }, { val: 6, label: 'June' },
  { val: 7, label: 'July' }, { val: 8, label: 'August' }, { val: 9, label: 'September' },
  { val: 10, label: 'October' }, { val: 11, label: 'November' }, { val: 12, label: 'December' }
];

const YEARS = [2023, 2024, 2025, 2026];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState('HEADCOUNT');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handlePreview = async () => {
    setIsLoading(true);
    setPreviewData(null);
    try {
      const res = await api.get('/reports/preview', {
        params: { report_type: selectedType, month: selectedMonth, year: selectedYear }
      });
      setPreviewData(res.data);
    } catch (err) {
      console.error("Preview failed:", err);
      alert("Failed to generate preview. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'excel') => {
    try {
      const res = await api.get(`/reports/export/${format}`, {
        params: { report_type: selectedType, month: selectedMonth, year: selectedYear },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `HRMS-Report-${selectedType}-${selectedYear}-${selectedMonth}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download report.");
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight flex items-center space-x-3">
          <FileBarChart className="w-8 h-8 text-primary" />
          <span>AI Report Generator</span>
        </h2>
        <p className="text-muted-foreground mt-2 font-body text-lg">
          Generate comprehensive, AI-analyzed reports from live database metrics.
        </p>
      </div>

      {/* Configuration Controls */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-card-foreground mb-3">Report Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REPORT_TYPES.map(rt => {
                const isSelected = selectedType === rt.id;
                const Icon = rt.icon;
                return (
                  <button 
                    key={rt.id}
                    onClick={() => setSelectedType(rt.id)}
                    className={`flex items-start p-3 rounded-xl border text-left transition-all ${isSelected ? 'bg-primary/10 border-primary shadow-md ring-1 ring-primary' : 'bg-card border-border hover:border-primary/50 hover:bg-muted/50'}`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-card-foreground'}`}>{rt.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rt.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-card-foreground mb-3">Time Period</label>
             <div className="space-y-3">
               <select 
                 value={selectedMonth} 
                 onChange={(e) => setSelectedMonth(Number(e.target.value))}
                 className="w-full bg-muted border border-border text-sm font-medium text-card-foreground rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                 {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
               </select>
               <select 
                 value={selectedYear} 
                 onChange={(e) => setSelectedYear(Number(e.target.value))}
                 className="w-full bg-muted border border-border text-sm font-medium text-card-foreground rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                 {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
             </div>
          </div>

          <div className="flex flex-col justify-end space-y-3 pt-6 lg:pt-0">
             <button 
               onClick={handlePreview}
               disabled={isLoading}
               className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center disabled:opacity-70"
             >
               {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
               Generate Preview
             </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
            <div className="font-semibold text-foreground">
              Generated Report: <span className="text-primary">{previewData.report_type}</span> • {MONTHS.find(m=>m.val===previewData.month)?.label} {previewData.year}
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button onClick={() => handleDownload('pdf')} className="flex-1 sm:flex-none px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-sm hover:opacity-90 flex items-center justify-center space-x-2">
                <FileText size={18} /> <span>Export PDF</span>
              </button>
              <button onClick={() => handleDownload('excel')} className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:opacity-90 flex items-center justify-center space-x-2">
                <FileSpreadsheet size={18} /> <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Summary Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card rounded-2xl p-6 shadow-sm border-2 border-primary/20 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Sparkles size={120}/></div>
                
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-primary" /> Executive Summary
                </h3>
                
                <div className="mb-6">
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 uppercase tracking-wider
                    ${previewData.ai_summary.overall_health === 'EXCELLENT' ? 'bg-emerald-500/20 text-emerald-500' :
                      previewData.ai_summary.overall_health === 'GOOD' ? 'bg-primary/20 text-primary' :
                      previewData.ai_summary.overall_health === 'NEEDS_ATTENTION' ? 'bg-rose-500/20 text-rose-500' :
                      'bg-amber-500/20 text-amber-500'}`}>
                    Health: {previewData.ai_summary.overall_health}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {previewData.ai_summary.executive_summary}
                  </p>
                </div>

                <div className="space-y-4">
                  {previewData.ai_summary.highlights?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-emerald-500 flex items-center mb-2"><CheckCircle2 className="w-4 h-4 mr-1"/> Highlights</h4>
                      <ul className="space-y-1.5">
                        {previewData.ai_summary.highlights.map((item:string, i:number) => (
                          <li key={i} className="text-xs text-muted-foreground pl-5 relative"><span className="absolute left-1.5 top-0 text-emerald-500">•</span>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {previewData.ai_summary.concerns?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-rose-500 flex items-center mb-2"><AlertTriangle className="w-4 h-4 mr-1"/> Concerns</h4>
                      <ul className="space-y-1.5">
                        {previewData.ai_summary.concerns.map((item:string, i:number) => (
                          <li key={i} className="text-xs text-muted-foreground pl-5 relative"><span className="absolute left-1.5 top-0 text-rose-500">•</span>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {previewData.ai_summary.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-primary flex items-center mb-2"><Lightbulb className="w-4 h-4 mr-1"/> Recommendations</h4>
                      <ul className="space-y-1.5">
                        {previewData.ai_summary.recommendations.map((item:string, i:number) => (
                          <li key={i} className="text-xs text-muted-foreground pl-5 relative"><span className="absolute left-1.5 top-0 text-primary">•</span>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Data Table Column */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden h-full flex flex-col">
                <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                  <h3 className="font-bold text-card-foreground">Data Preview</h3>
                  <span className="text-xs font-semibold bg-background border px-2 py-1 rounded-md text-muted-foreground">Showing {previewData.preview_rows.length} of {previewData.total_rows} rows</span>
                </div>
                <div className="overflow-x-auto flex-1">
                  {previewData.preview_rows.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                        <tr>
                          {Object.keys(previewData.preview_rows[0]).map(key => (
                            <th key={key} className="px-4 py-3 font-semibold whitespace-nowrap">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.preview_rows.map((row:any, idx:number) => (
                          <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                            {Object.values(row).map((val:any, i:number) => (
                              <td key={i} className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <FileBarChart className="w-12 h-12 mb-3 opacity-20" />
                      <p>No data records found for this period.</p>
                    </div>
                  )}
                </div>
                {previewData.total_rows > previewData.preview_rows.length && (
                  <div className="p-3 bg-muted/30 border-t border-border text-center text-xs text-muted-foreground font-medium">
                    Export to PDF or Excel to view all {previewData.total_rows} rows.
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      )}

    </div>
  );
}
