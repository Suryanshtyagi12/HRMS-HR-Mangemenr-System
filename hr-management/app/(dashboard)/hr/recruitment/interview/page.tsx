'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Link as LinkIcon, Loader2, Eye, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function InterviewPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string>('');
  
  // Transcript Modal State
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);

  useEffect(() => {
    api.get('/recruitment/jobs?status=OPEN').then(res => {
      const data = res.data?.items || [];
      setJobs(data);
      if (data.length > 0) setSelectedJobId(data[0].id);
    });
  }, []);

  const fetchApplications = async () => {
    if (!selectedJobId) return;
    try {
      const res = await api.get(`/recruitment/pipeline?job_id=${selectedJobId}`);
      if (res.data && res.data.data) {
        const short = res.data.data['SHORTLISTED'] || [];
        setApplications(short);
        if (short.length > 0) setSelectedAppId(short[0].id);
        else setSelectedAppId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessions = async () => {
    if (!selectedJobId) return;
    try {
      const res = await api.get(`/recruitment/interview/sessions?job_posting_id=${selectedJobId}`);
      if (res.data) {
        setSessions(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchSessions();
  }, [selectedJobId]);

  const generateSession = async () => {
    if (!selectedAppId) return;
    setIsStarting(true);
    setGeneratedToken('');

    try {
      const res = await api.post('/recruitment/interview/create', {
        job_posting_id: selectedJobId,
        application_id: selectedAppId
      });
      
      const data = res.data;
      if (data.session_id) {
        setGeneratedToken(data.interview_link);
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate session');
    } finally {
      setIsStarting(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };
  
  const viewTranscript = async (id: string) => {
    try {
      const res = await api.get(`/recruitment/interview/sessions/${id}/transcript`);
      setSelectedTranscript(res.data);
      setTranscriptModalOpen(true);
    } catch(err) {
      alert("Failed to load transcript");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Interview Management</h1>
        <p className="text-muted-foreground mt-2">Generate and manage unique AI interview links for shortlisted candidates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-1">
          <CardHeader>
            <CardTitle>Create Interview Link</CardTitle>
            <CardDescription>Send this to a shortlisted candidate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Job Role</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Candidate</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                disabled={applications.length === 0}
              >
                {applications.length === 0 ? (
                  <option value="">No shortlisted candidates found</option>
                ) : (
                  applications.map(app => (
                    <option key={app.id} value={app.id}>{app.candidate_name} (Score: {Math.round(app.ai_score)})</option>
                  ))
                )}
              </select>
            </div>

            <Button 
              className="w-full mt-4" 
              onClick={generateSession}
              disabled={!selectedAppId || isStarting}
            >
              {isStarting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
              Generate Interview ✨
            </Button>
            
            {generatedToken && (
              <div className="mt-4 bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-lg text-sm">
                <p className="font-semibold mb-2 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> Success</p>
                <div className="flex gap-2 mb-2">
                  <input readOnly value={generatedToken} className="w-full text-xs p-2 rounded border bg-card" />
                  <Button size="sm" onClick={() => copyLink(generatedToken)}>Copy</Button>
                </div>
                <p className="text-xs text-emerald-700 italic">Share this link with the candidate. They will take the interview on a secure page.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Track the status of candidate interviews.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Tab Switches</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No interview sessions generated yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.candidate_name}</TableCell>
                      <TableCell>{s.job_title}</TableCell>
                      <TableCell>
                        {s.status === 'PENDING' && <Badge variant="secondary" className="bg-muted text-card-foreground">Not Started</Badge>}
                        {s.status === 'IN_PROGRESS' && <Badge variant="default" className="bg-blue-500 animate-pulse">In Progress</Badge>}
                        {s.status === 'COMPLETED' && <Badge variant="default" className="bg-emerald-500">Completed</Badge>}
                        {s.status === 'EXPIRED' && <Badge variant="destructive">Expired</Badge>}
                      </TableCell>
                      <TableCell>
                        {s.status === 'COMPLETED' && s.score !== null ? (
                          <Badge variant="outline" className="font-mono">{s.score}/100</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={s.tab_switches > 2 ? 'text-red-600 font-bold' : ''}>
                          {s.tab_switches || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {s.status === 'COMPLETED' && (
                          <Button variant="ghost" size="sm" onClick={() => viewTranscript(s.id)}>
                            <Eye className="w-4 h-4 mr-1" /> View Transcript
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/hr/recruitment/pipeline'}>
                          <ExternalLink className="w-4 h-4 mr-1" /> Pipeline
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={transcriptModalOpen} onOpenChange={setTranscriptModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Transcript - {selectedTranscript?.candidate_name}</DialogTitle>
            <DialogDescription>
              Role: {selectedTranscript?.job_title} | Overall Score: {selectedTranscript?.overall_score}/100
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {selectedTranscript?.answers?.map((ans: any, i: number) => (
              <div key={i} className="border rounded-lg p-4 bg-muted">
                <p className="font-semibold text-card-foreground mb-2">Q{ans.question_number}: {ans.question}</p>
                <div className="mb-4 bg-card p-3 rounded border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Candidate Answer:</p>
                  <p className="text-card-foreground">{ans.answer}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-emerald-700 mb-1">Feedback ({ans.evaluation?.score}/10):</p>
                    <p className="text-muted-foreground">{ans.evaluation?.feedback}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground mb-1">Quality: {ans.evaluation?.answer_quality}</p>
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-emerald-600">Covered:</span>
                      <ul className="list-disc pl-4 text-xs text-muted-foreground">
                        {ans.evaluation?.key_points_covered?.map((p: string, idx: number) => <li key={idx}>{p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-red-600">Missed:</span>
                      <ul className="list-disc pl-4 text-xs text-muted-foreground">
                        {ans.evaluation?.key_points_missed?.map((p: string, idx: number) => <li key={idx}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
