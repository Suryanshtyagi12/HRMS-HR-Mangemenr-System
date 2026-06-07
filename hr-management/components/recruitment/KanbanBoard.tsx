'use client';

import React, { useState } from 'react';
import { CandidateCard } from './CandidateCard';

const COLUMNS = [
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'AI_INTERVIEW_TAKEN',
  'INTERVIEW_SCHEDULED',
  'INTERVIEWED',
  'OFFERED',
  'HIRED'
];

interface KanbanBoardProps {
  pipeline: Record<string, any[]>;
  onStatusChange: (applicationId: string, newStatus: string) => void;
  onCandidateClick: (application: any) => void;
  showRejected: boolean;
}

export function KanbanBoard({ pipeline, onStatusChange, onCandidateClick, showRejected }: KanbanBoardProps) {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('applicationId');
    if (appId) {
      onStatusChange(appId, status);
    }
  };

  const getNextStatus = (current: string) => {
    const idx = COLUMNS.indexOf(current);
    if (idx >= 0 && idx < COLUMNS.length - 1) return COLUMNS[idx + 1];
    return current;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)] items-start snap-x snap-mandatory">
      {COLUMNS.map((col) => {
        const columnApps = pipeline[col] || [];
        // Sort by ai_score highest first
        const sortedApps = [...columnApps].sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
        
        return (
          <div 
            key={col} 
            className="flex-shrink-0 w-80 bg-muted/40 rounded-xl flex flex-col h-full max-h-full border border-muted/50 snap-center"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="p-3 border-b border-muted/50 font-semibold text-sm flex justify-between items-center sticky top-0 bg-muted/80 backdrop-blur rounded-t-xl z-10">
              <span className="uppercase tracking-wider text-muted-foreground">{col.replace('_', ' ')}</span>
              <span className="bg-background px-2 py-0.5 rounded-full text-xs font-bold border">{columnApps.length}</span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {sortedApps.map(app => (
                <CandidateCard 
                  key={app.id}
                  application={app}
                  onClick={() => onCandidateClick(app)}
                  onMoveForward={(e) => { e.stopPropagation(); onStatusChange(app.id, getNextStatus(app.status)); }}
                  onReject={(e) => { e.stopPropagation(); onStatusChange(app.id, 'REJECTED'); }}
                />
              ))}
              {columnApps.length === 0 && (
                <div className="h-20 border-2 border-dashed rounded-lg border-muted flex items-center justify-center text-xs text-muted-foreground/50">
                  Drop candidate here
                </div>
              )}
            </div>
          </div>
        );
      })}

      {showRejected && (
        <div 
          className="flex-shrink-0 w-80 bg-rose-50/50 rounded-xl flex flex-col h-full max-h-full border border-rose-100 snap-center"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'REJECTED')}
        >
          <div className="p-3 border-b border-rose-100 font-semibold text-sm flex justify-between items-center sticky top-0 bg-rose-50/80 backdrop-blur rounded-t-xl z-10">
            <span className="uppercase tracking-wider text-rose-800">REJECTED</span>
            <span className="bg-background px-2 py-0.5 rounded-full text-xs font-bold border text-rose-600">{pipeline['REJECTED']?.length || 0}</span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
             {([...(pipeline['REJECTED'] || [])].sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))).map(app => (
                <CandidateCard 
                  key={app.id}
                  application={app}
                  onClick={() => onCandidateClick(app)}
                  onMoveForward={(e) => { e.stopPropagation(); onStatusChange(app.id, 'APPLIED'); }} // Restore
                  onReject={() => {}}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
