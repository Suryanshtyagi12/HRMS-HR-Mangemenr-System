'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import api from '@/lib/api';

export default function AIInsightsPage() {
  const [report, setReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState('');

  const generateReport = async () => {
    setGenerating(true);
    setReportError('');
    try {
      const res = await api.post('/ai/insights');
      setReport(res.data?.data);
    } catch (err) {
      setReportError('Failed to generate report. Try again.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-card-foreground font-headline tracking-tight mb-1">AI Strategic Insights</h1>
          <p className="text-muted-foreground font-medium">Powered by Gemini AI — analyzing real company data</p>
        </div>
        <button 
          onClick={generateReport} 
          disabled={generating}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
        >
          {generating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          Regenerate Report
        </button>
      </div>

      {/* Error */}
      {reportError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm mb-4">
            {reportError}
        </div>
      )}

      {generating && !report && (
        <div className="p-12 flex flex-col justify-center items-center text-muted-foreground gap-4 mt-12">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="animate-pulse">Gemini AI is analyzing dashboard data...</p>
        </div>
      )}

      {/* Report Results */}
      {report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {Object.entries(report.key_metrics || {}).map(([key, value]: any) => (
                      <div key={key} className="bg-card rounded-xl p-3 text-center border border-border shadow-sm">
                          <div className="text-lg font-bold text-card-foreground">
                              {value}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 capitalize">
                              {key.replace(/_/g, ' ')}
                          </div>
                      </div>
                  ))}
              </div>

              {/* Executive Summary */}
              <div className="p-6 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl shadow-sm">
                  <h3 className="font-semibold text-indigo-900 mb-2 text-lg">
                      Executive Summary
                  </h3>
                  <p className="text-sm md:text-base text-indigo-800 leading-relaxed whitespace-pre-line">
                      {report.executive_summary}
                  </p>
              </div>

              {/* 3 column grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Highlights */}
                  <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                      <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
                          ✅ Highlights
                      </h3>
                      <div className="space-y-3">
                      {(report.highlights || []).map((h: any, i: number) => (
                          <div key={i} className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                              <div className="font-medium text-emerald-800 text-sm">
                                  {h.title}
                              </div>
                              <div className="text-xs text-emerald-600 mt-1">
                                  {h.detail}
                              </div>
                              {h.metric && (
                                  <div className="mt-2 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                      {h.metric}
                                  </div>
                              )}
                          </div>
                      ))}
                      </div>
                  </div>

                  {/* Concerns */}
                  <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                      <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
                          ⚠️ Concerns
                      </h3>
                      <div className="space-y-3">
                      {(report.concerns || []).map((c: any, i: number) => (
                          <div key={i} className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                              <div className="font-medium text-amber-800 text-sm">
                                  {c.title}
                              </div>
                              <div className="text-xs text-amber-600 mt-1">
                                  {c.detail}
                              </div>
                              {c.severity && (
                                  <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.severity === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                                      {c.severity}
                                  </div>
                              )}
                          </div>
                      ))}
                      </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                      <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
                          💡 Recommendations
                      </h3>
                      <div className="space-y-3">
                      {(report.recommendations || []).map((r: any, i: number) => (
                          <div key={i} className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                              <div className="font-medium text-blue-800 text-sm">
                                  {r.title}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                  {r.detail}
                              </div>
                              {r.priority && (
                                  <div className="mt-2 inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                      {r.priority} priority
                                  </div>
                              )}
                          </div>
                      ))}
                      </div>
                  </div>
              </div>

              {/* Department Health */}
              {report.department_health && report.department_health.length > 0 && (
                  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                      <h3 className="text-lg font-semibold text-card-foreground mb-4">
                          Department Health
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {report.department_health.map((d: any, i: number) => (
                          <div key={i} className="p-5 rounded-xl border text-center flex flex-col justify-between"
                              style={{
                                  background: d.status === "HEALTHY" ? "#ECFDF5" : d.status === "AT_RISK" ? "#FFFBEB" : "#FFF1F2",
                                  borderColor: d.status === "HEALTHY" ? "#D1FAE5" : d.status === "AT_RISK" ? "#FDE68A" : "#FECDD3"
                              }}>
                              <div className="text-3xl font-bold"
                                  style={{
                                      color: d.status === "HEALTHY" ? "#059669" : d.status === "AT_RISK" ? "#D97706" : "#E11D48"
                                  }}>
                                  {d.health_score}
                              </div>
                              <div>
                                <div className="text-sm font-medium mt-2 text-card-foreground">
                                    {d.department}
                                </div>
                                <div className="text-xs mt-1 text-muted-foreground font-bold uppercase tracking-wider">
                                    {d.status.replace('_', ' ')}
                                </div>
                              </div>
                              {d.key_issue && (
                                  <div className="text-xs mt-3 pt-3 border-t border-slate-200/50 text-muted-foreground line-clamp-2">
                                      {d.key_issue}
                                  </div>
                              )}
                          </div>
                      ))}
                      </div>
                  </div>
              )}

              {/* Generated timestamp */}
              <p className="text-xs text-slate-400 text-right pt-2 pb-8">
                  Report generated: {report.generated_at}
              </p>

          </div>
      )}
    </div>
  );
}
