'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { KanbanBoard } from '@/components/recruitment/KanbanBoard';
import { CandidateDetail } from '@/components/recruitment/CandidateDetail';
import { Button } from '@/components/ui/button';
import { Filter, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

export default function PipelinePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  
  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [showRejected, setShowRejected] = useState(false); // Collapsed by default

  const [isScreening, setIsScreening] = useState(false);
  const [screeningResult, setScreeningResult] = useState<any>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  useEffect(() => {
    api.get('/recruitment/jobs?status=OPEN').then(res => {
      const data = res.data?.items || [];
      setJobs(data);
      
      // Auto-select job from URL if present
      const params = new URLSearchParams(window.location.search);
      const jobIdFromUrl = params.get('jobId');
      
      if (jobIdFromUrl && data.find((j: any) => j.id === jobIdFromUrl)) {
        setSelectedJobId(jobIdFromUrl);
      } else if (data.length > 0) {
        setSelectedJobId(data[0].id);
      }
    }).catch(console.error);
  }, []);

  const fetchPipeline = async (jobId: string) => {
    try {
      const res = await api.get(`/recruitment/pipeline?job_id=${jobId}`);
      if (res.data && res.data.data) {
        setPipeline(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedJobId) fetchPipeline(selectedJobId);
  }, [selectedJobId]);

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    // Optimistic UI update
    setPipeline(prev => {
      const newPipeline = { ...prev };
      let movedApp = null;
      
      // Find and remove from old status
      for (const status of Object.keys(newPipeline)) {
        const idx = newPipeline[status].findIndex(a => a.id === applicationId);
        if (idx !== -1) {
          movedApp = { ...newPipeline[status][idx], status: newStatus };
          newPipeline[status].splice(idx, 1);
          break;
        }
      }
      
      // Add to new status
      if (movedApp && newPipeline[newStatus]) {
        newPipeline[newStatus].push(movedApp);
      } else if (movedApp) {
        newPipeline[newStatus] = [movedApp];
      }
      
      return newPipeline;
    });

    if (selectedCandidate && selectedCandidate.id === applicationId) {
      setSelectedCandidate({ ...selectedCandidate, status: newStatus });
    }

    try {
      await api.patch(`/recruitment/application/${applicationId}/status`, { status: newStatus });
    } catch (e) {
      console.error('Failed to update status', e);
      // Rollback would go here in a robust implementation
      fetchPipeline(selectedJobId);
    }
  };

  const handleCandidateClick = (app: any) => {
    setSelectedCandidate(app);
    setIsDetailOpen(true);
  };

  const handleRunAiScreening = async () => {
    if (!selectedJobId) return;
    setIsScreening(true);
    try {
      const res = await api.post('/recruitment/pipeline/run-auto', { job_posting_id: selectedJobId });
      setScreeningResult(res.data.data);
      setShowResultDialog(true);
      fetchPipeline(selectedJobId); // Refresh pipeline
    } catch (e) {
      console.error('Failed to run AI screening', e);
    } finally {
      setIsScreening(false);
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const stats = screeningResult ? {
    shortlisted: screeningResult.shortlisted,
    openings: screeningResult.openings,
    total: screeningResult.total_processed
  } : pipeline['SHORTLISTED'] ? {
    shortlisted: pipeline['SHORTLISTED'].length,
    openings: selectedJob?.openings || 1,
    total: pipeline['APPLIED']?.length || 0 + (pipeline['SHORTLISTED']?.length || 0)
  } : null;

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Recruitment Pipeline</h1>
          <p className="text-muted-foreground mt-1 flex items-center">
            <Users className="w-4 h-4 mr-2" /> 
            Track candidates through the hiring process for specific roles.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 items-end">
          <div className="flex gap-2">
            <select 
              className="flex h-10 w-64 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              {jobs.length === 0 && <option value="">No open jobs</option>}
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title} - {job.department}</option>
              ))}
            </select>
            
            <Button 
              onClick={handleRunAiScreening} 
              disabled={!selectedJobId || isScreening}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Run AI Screening 
              <Play className="w-3 h-3 ml-1 fill-current" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 bg-muted p-2 rounded-lg border">
            <Switch id="show-rejected" checked={showRejected} onCheckedChange={setShowRejected} />
            <Label htmlFor="show-rejected" className="text-xs cursor-pointer">Show Rejected Column</Label>
          </div>
        </div>
      </div>

      {stats && (
        <div className="mb-4 bg-muted/30 border p-3 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {stats.shortlisted} shortlisted for {stats.openings} openings (Ratio: {Math.max(1, Math.round(stats.shortlisted/stats.openings))}:1)
          </span>
          <div className="w-64 flex items-center gap-2">
            <Progress value={Math.min(100, (stats.shortlisted / (stats.openings * 2.5)) * 100)} className="h-2" />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {!selectedJobId ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
            <div className="text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Please select a job posting to view its pipeline.</p>
            </div>
          </div>
        ) : (
          <KanbanBoard 
            pipeline={pipeline} 
            onStatusChange={handleStatusChange} 
            onCandidateClick={handleCandidateClick} 
            showRejected={showRejected}
          />
        )}
      </div>

      <CandidateDetail 
        application={selectedCandidate}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onStatusChange={(status) => handleStatusChange(selectedCandidate.id, status)}
      />

      {/* Progress Dialog */}
      <Dialog open={isScreening} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Running AI Screening...</DialogTitle>
            <DialogDescription>
              Gemini AI is processing resumes for {selectedJob?.title}. This may take a moment.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Screening resumes...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Card Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30">
          <DialogHeader>
            <DialogTitle className="flex items-center text-indigo-700">
              <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
              Screening Complete
            </DialogTitle>
            <DialogDescription>
              Job: {screeningResult?.job_title}
            </DialogDescription>
          </DialogHeader>
          
          {screeningResult && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm">
                <span className="text-sm font-medium flex items-center">
                  <span className="w-6 text-center">📄</span> Resumes Processed
                </span>
                <span className="font-bold">{screeningResult.total_processed}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium flex items-center text-emerald-800">
                    <span className="w-6 text-center">✅</span> Shortlisted
                  </span>
                  <span className="text-xs text-emerald-600 ml-6">({screeningResult.shortlist_ratio})</span>
                </div>
                <span className="font-bold text-emerald-700">{screeningResult.shortlisted}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium flex items-center text-rose-800">
                    <span className="w-6 text-center">❌</span> Auto Rejected
                  </span>
                  <span className="text-xs text-rose-600 ml-6">(score below 30)</span>
                </div>
                <span className="font-bold text-rose-700">{screeningResult.rejected}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium flex items-center text-amber-800">
                    <span className="w-6 text-center">🔍</span> In Review
                  </span>
                  <span className="text-xs text-amber-600 ml-6">(HR decision needed)</span>
                </div>
                <span className="font-bold text-amber-700">{screeningResult.screening}</span>
              </div>
              
              <div className="text-center text-xs text-muted-foreground mt-4 pt-4 border-t">
                Score threshold used: {screeningResult.threshold_score}/100
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowResultDialog(false)} className="w-full">
              View Updated Pipeline
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
