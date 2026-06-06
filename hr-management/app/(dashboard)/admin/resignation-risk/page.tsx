'use client';
import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BrainCircuit, Loader2, AlertTriangle, ChevronDown, ChevronUp, CalendarPlus } from 'lucide-react';

export default function ResignationRiskPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/resignation-risk');
      setData(res.data);
    } catch (err) {
      console.error("Failed to analyze", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            🚨 Resignation Risk Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            AI predicts employees likely to resign in the next 30 days
          </p>
        </div>
        <Button 
          onClick={handleAnalyze} 
          disabled={loading}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing active employees...
            </>
          ) : (
            <>
              <BrainCircuit className="mr-2 h-5 w-5" />
              Analyze All Employees
            </>
          )}
        </Button>
      </div>

      {data && data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-red-700 font-medium">HIGH Risk</CardDescription>
              <CardTitle className="text-3xl text-red-700">{data.summary.high_risk}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-700 font-medium">MEDIUM Risk</CardDescription>
              <CardTitle className="text-3xl text-amber-700">{data.summary.medium_risk}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-700 font-medium">LOW Risk</CardDescription>
              <CardTitle className="text-3xl text-green-700">{data.summary.low_risk}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-indigo-700 font-medium">Total Risk %</CardDescription>
              <CardTitle className="text-3xl text-indigo-700">{data.summary.risk_percentage}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {data && data.employees && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Risk Details</CardTitle>
            <CardDescription>Last analyzed: {data.analyzed_at}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-12 bg-muted/50 p-4 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-3">Employee</div>
                <div className="col-span-2">Dept / Tenure</div>
                <div className="col-span-2">Risk Score</div>
                <div className="col-span-1">Level</div>
                <div className="col-span-3">Top Risk Factor</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {data.employees.map((emp: any) => {
                  const isHigh = emp.risk_level === 'HIGH';
                  const isMedium = emp.risk_level === 'MEDIUM';
                  const isLow = emp.risk_level === 'LOW';
                  
                  const isExpanded = !!expandedRows[emp.employee_id];

                  return (
                    <div key={emp.employee_id} className={`flex flex-col ${isHigh ? 'bg-red-50/20' : ''}`}>
                      <div className="grid grid-cols-12 p-4 items-center text-sm">
                        <div className="col-span-3 font-medium">
                          {emp.employee_name}
                          <div className="text-xs text-muted-foreground font-normal">{emp.designation}</div>
                        </div>
                        <div className="col-span-2">
                          <div>{emp.department}</div>
                          <div className="text-xs text-muted-foreground">{emp.tenure_months} months</div>
                        </div>
                        <div className="col-span-2 pr-4">
                          <div className="flex justify-between mb-1 text-xs">
                            <span>{emp.risk_score}/100</span>
                          </div>
                          <Progress 
                            value={emp.risk_score} 
                            className={`h-2 ${isHigh ? 'animate-pulse [&>div]:bg-red-500' : isMedium ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} 
                          />
                        </div>
                        <div className="col-span-1">
                          <Badge variant="outline" className={`
                            ${isHigh ? 'bg-red-100 text-red-800 border-red-200' : ''}
                            ${isMedium ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}
                            ${isLow ? 'bg-green-100 text-green-800 border-green-200' : ''}
                          `}>
                            {isHigh && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {emp.risk_level}
                          </Badge>
                        </div>
                        <div className="col-span-3 text-xs text-muted-foreground truncate pr-4">
                          {emp.risk_factors.length > 0 ? emp.risk_factors[0] : emp.positive_factors[0] || 'No specific factors'}
                        </div>
                        <div className="col-span-1 text-right">
                          <Button variant="ghost" size="sm" onClick={() => toggleRow(emp.employee_id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-8 pb-6 pt-2 bg-muted/10 border-t border-dashed">
                          <div className="grid grid-cols-2 gap-8 mt-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Risk Factors</h4>
                                <div className="flex flex-wrap gap-2">
                                  {emp.risk_factors.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">None identified</span>
                                  ) : emp.risk_factors.map((f: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200 font-normal">
                                      {f}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Positive Signals</h4>
                                <div className="flex flex-wrap gap-2">
                                  {emp.positive_factors.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">None identified</span>
                                  ) : emp.positive_factors.map((f: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200 font-normal">
                                      {f}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              {emp.ai_insight && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                                  <h4 className="text-xs font-semibold text-indigo-800 flex items-center mb-1">
                                    <BrainCircuit className="w-3 h-3 mr-1" /> AI Insight
                                  </h4>
                                  <p className="text-sm text-indigo-900">{emp.ai_insight}</p>
                                </div>
                              )}
                              
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Recommended Actions</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground list-decimal list-inside mb-4">
                                  {emp.recommended_actions.map((act: string, i: number) => (
                                    <li key={i}>{act}</li>
                                  ))}
                                </ul>
                                <Button size="sm" className="w-full">
                                  <CalendarPlus className="w-4 h-4 mr-2" />
                                  Schedule Meeting
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
          <BrainCircuit className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No Analysis Run Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            Click the Analyze All Employees button to run the AI resignation prediction model across your entire active workforce.
          </p>
        </div>
      )}
    </div>
  );
}
