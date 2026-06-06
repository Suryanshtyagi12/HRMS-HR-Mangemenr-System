'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown } from 'lucide-react';

export function AttritionRiskCard({ riskData }: { riskData: any }) {
  const getColors = (level: string) => {
    switch(level) {
      case 'HIGH': return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'MEDIUM': return 'bg-amber-50 border-amber-200 text-amber-800';
      default: return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    }
  };

  const getScoreColor = (level: string) => {
    switch(level) {
      case 'HIGH': return 'text-rose-600 bg-rose-100';
      case 'MEDIUM': return 'text-amber-600 bg-amber-100';
      default: return 'text-emerald-600 bg-emerald-100';
    }
  };

  return (
    <Card className={`overflow-hidden border shadow-sm \${getColors(riskData.riskLevel)}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{riskData.name}</h3>
            <p className="text-xs font-medium opacity-80">{riskData.department}</p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-sm \${getScoreColor(riskData.riskLevel)}`}>
            {riskData.riskScore}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase opacity-70 mb-2 flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1" /> Risk Factors
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {riskData.riskFactors?.map((f: string, i: number) => (
              <Badge key={i} variant="outline" className="bg-white/50 text-[10px] font-medium border-black/10">
                {f}
              </Badge>
            ))}
            {(!riskData.riskFactors || riskData.riskFactors.length === 0) && (
               <span className="text-xs opacity-70">No specific factors identified.</span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-black/10">
          <h4 className="text-xs font-bold uppercase opacity-70 mb-2 flex items-center">
            <TrendingDown className="w-3 h-3 mr-1" /> AI Recommendations
          </h4>
          <ul className="text-xs space-y-1.5 opacity-90 pl-3 list-disc">
            {riskData.recommendations?.map((r: string, i: number) => (
              <li key={i} className="leading-snug">{r}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
