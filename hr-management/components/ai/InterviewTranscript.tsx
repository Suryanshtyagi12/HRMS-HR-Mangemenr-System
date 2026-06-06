import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QA {
  questionNumber: number;
  question: string;
  answer: string;
  evaluation?: {
    score: number;
    feedback: string;
    keyPointsCovered: string[];
    keyPointsMissed: string[];
  };
}

export function InterviewTranscript({ history }: { history: QA[] }) {
  if (!history || history.length === 0) {
    return <div className="text-muted-foreground text-center py-8">No transcript available yet.</div>;
  }

  return (
    <div className="space-y-6">
      {history.map((qa, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="bg-muted p-4 border-b">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">Q{qa.questionNumber}</Badge> 
              {qa.question}
            </h4>
          </div>
          <CardContent className="p-4 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Candidate's Answer</span>
              <p className="text-sm italic text-foreground/80">"{qa.answer}"</p>
            </div>
            
            {qa.evaluation && (
              <div className="bg-primary/5 rounded-lg p-4 mt-4 border border-primary/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-primary">AI Evaluation</span>
                  <Badge variant={qa.evaluation.score >= 7 ? 'default' : qa.evaluation.score >= 4 ? 'secondary' : 'destructive'}>
                    Score: {qa.evaluation.score}/10
                  </Badge>
                </div>
                <p className="text-sm mb-3">{qa.evaluation.feedback}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-emerald-600 block mb-1">Points Covered:</span>
                    <ul className="list-disc pl-4 text-muted-foreground">
                      {qa.evaluation.keyPointsCovered?.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-rose-600 block mb-1">Points Missed:</span>
                    <ul className="list-disc pl-4 text-muted-foreground">
                      {qa.evaluation.keyPointsMissed?.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
