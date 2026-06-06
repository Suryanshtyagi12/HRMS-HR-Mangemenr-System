'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AttritionRiskCard } from '@/components/performance/AttritionRiskCard';
import { BrainCircuit, Loader2, RefreshCw, BarChart3, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';

export default function AdminPerformancePage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [attritionRisks, setAttritionRisks] = useState<any[]>([]);
  const [isCalculatingRisk, setIsCalculatingRisk] = useState(false);

  useEffect(() => {
    api.get('/performance/cycles')
      .then(res => {
        setCycles(res.data?.items || res.data || []);
      })
      .catch(console.error);
  }, []);

  const handleRecalculateRisks = async () => {
    setIsCalculatingRisk(true);
    try {
      const res = await api.get('/performance/attrition');
      setAttritionRisks(res.data?.items || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculatingRisk(false);
    }
  };

  // Mocked distribution data
  const distributionData = [
    { rating: 'Needs Improvement', count: 12 },
    { rating: 'Meets Expectations', count: 45 },
    { rating: 'Exceeds Expectations', count: 28 },
    { rating: 'Outstanding', count: 15 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Admin Console</h1>
        <p className="text-muted-foreground mt-1">Manage cycles, view distributions, and predict attrition risks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Review Cycles</CardTitle>
                <CardDescription>Manage your company-wide performance cycles</CardDescription>
              </div>
              <Button size="sm">Create Cycle</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-4">
                {cycles.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">No cycles configured.</div>
                ) : (
                  cycles.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
                      <div>
                        <div className="font-semibold">{c.name} ({c.year})</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(c.start_date || c.startDate).toLocaleDateString()} - {new Date(c.end_date || c.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={c.status === 'ACTIVE' ? 'default' : c.status === 'PLANNED' ? 'secondary' : 'outline'}>
                        {c.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-primary" /> Ratings Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="rating" type="category" axisLine={false} tickLine={false} width={150} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="var(--theme-primary, #3b82f6)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: AI Panel */}
        <div className="space-y-6">
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardHeader className="pb-3 border-b border-indigo-100">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center text-indigo-700">
                    <BrainCircuit className="w-5 h-5 mr-2" /> AI Attrition Risk
                  </CardTitle>
                  <CardDescription className="text-indigo-600/70 mt-1">
                    Predictive analysis based on attendance, leave, and performance patterns.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Button 
                onClick={handleRecalculateRisks} 
                disabled={isCalculatingRisk} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isCalculatingRisk ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {isCalculatingRisk ? 'Analyzing Employee Data...' : 'Run Risk Analysis'}
              </Button>

              {attritionRisks.length > 0 && (
                <div className="space-y-4 mt-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {attritionRisks.map(r => (
                    <AttritionRiskCard key={r.id} riskData={r} />
                  ))}
                </div>
              )}

              {!isCalculatingRisk && attritionRisks.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-indigo-400 text-sm text-center">
                  <Users className="w-12 h-12 mb-3 opacity-20" />
                  <p>Run the analysis to identify employees at risk of leaving the company.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
