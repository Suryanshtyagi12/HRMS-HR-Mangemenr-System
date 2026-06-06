import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ResumeScreenerResultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: {
    candidateName: string;
    aiScore: number;
    aiSummary: string;
    aiSkillsMatch: string[];
    aiRedFlags: string[];
    recommendation: 'SHORTLIST' | 'REJECT' | 'HOLD';
  } | null;
  onAction?: (action: string) => void;
}

export function ResumeScreenerResult({ open, onOpenChange, result, onAction }: ResumeScreenerResultProps) {
  if (!result) return null;

  const scoreColor = 
    result.aiScore >= 70 ? 'text-emerald-500' :
    result.aiScore >= 40 ? 'text-amber-500' : 'text-rose-500';

  const badgeColor = 
    result.recommendation === 'SHORTLIST' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
    result.recommendation === 'HOLD' ? 'bg-amber-100 text-amber-800 border-amber-300' :
    'bg-rose-100 text-rose-800 border-rose-300';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>{result.candidateName}</span>
            <Badge variant="outline" className={`ml-4 ${badgeColor}`}>
              {result.recommendation}
            </Badge>
          </DialogTitle>
          <DialogDescription>AI Resume Screening Analysis</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div className="col-span-1 flex flex-col items-center justify-center p-6 bg-muted/30 rounded-xl border">
            <div className={`text-6xl font-black ${scoreColor}`}>
              {Math.round(result.aiScore)}
            </div>
            <div className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-wider">AI Score</div>
          </div>
          
          <div className="col-span-2 space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" /> 
                Matched Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.aiSkillsMatch?.length ? result.aiSkillsMatch.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                    {skill}
                  </Badge>
                )) : <span className="text-sm text-muted-foreground">No matching skills identified.</span>}
              </div>
            </div>

            {result.aiRedFlags && result.aiRedFlags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center text-rose-600">
                  <AlertTriangle className="h-4 w-4 mr-1" /> 
                  Red Flags
                </h4>
                <ul className="list-disc pl-5 text-sm text-rose-700 space-y-1">
                  {result.aiRedFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">AI Summary</h4>
            <div className="p-4 bg-muted rounded-lg text-sm leading-relaxed">
              {result.aiSummary}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => onAction && onAction('SHORTLIST')}>Add to Pipeline</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
