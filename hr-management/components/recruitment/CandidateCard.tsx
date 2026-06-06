import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, ArrowRight, XCircle, Code2 } from 'lucide-react';

interface CandidateCardProps {
  application: any;
  onClick: () => void;
  onMoveForward: (e: React.MouseEvent) => void;
  onReject: (e: React.MouseEvent) => void;
}

export function CandidateCard({ application, onClick, onMoveForward, onReject }: CandidateCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('applicationId', application.id);
  };

  const isRejected = application.status === 'REJECTED';
  const scoreColor = application.ai_score >= 70 ? 'bg-emerald-500 border-emerald-600' :
                     application.ai_score >= 40 ? 'bg-amber-500 border-amber-600' : 
                     'bg-rose-500 border-rose-600';
  const skillsCount = application.ai_skills_match?.length || 0;

  return (
    <Card 
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing border-l-4 ${isRejected ? 'opacity-60 grayscale' : ''} ${application.ai_score ? 'border-l-primary' : 'border-l-muted'}`}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-sm line-clamp-1 flex-1 pr-2">{application.candidate_name}</h4>
          {application.ai_score !== null && application.ai_score !== undefined && (
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border text-white text-xs font-bold shrink-0 ${scoreColor} shadow-sm`}>
              {Math.round(application.ai_score)}
            </div>
          )}
        </div>
        
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center text-xs text-muted-foreground">
            <Mail className="h-3 w-3 mr-1.5" />
            <span className="truncate">{application.candidate_email}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Code2 className="h-3 w-3 mr-1.5 text-indigo-500" />
            <span>{skillsCount} matched skills</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1.5" />
            {new Date(application.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex gap-1 mt-3 pt-2 border-t" onClick={e => e.stopPropagation()}>
          {!isRejected && (
            <>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={onMoveForward}>
                Next <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={onReject}>
                Reject <XCircle className="h-3 w-3 ml-1" />
              </Button>
            </>
          )}
          {isRejected && (
            <div className="text-xs text-rose-500 font-medium w-full text-center py-1">Rejected</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
