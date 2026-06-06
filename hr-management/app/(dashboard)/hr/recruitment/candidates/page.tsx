'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Trophy, Users, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function CandidateRankingPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  
  // Ranked List State
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [weights, setWeights] = useState({
    skills_match: 40,
    experience: 30,
    education: 15,
    interview_score: 15
  });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Compare State
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [compareResult, setCompareResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchRankedCandidates();
    } else {
      setCandidates([]);
      setCompareResult(null);
    }
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/recruitment/jobs');
      setJobs(res.data.items || []);
    } catch (e) {
      toast.error('Failed to load jobs');
    }
  };

  const fetchRankedCandidates = async () => {
    if (!selectedJob) return;
    setLoading(true);
    
    // Normalize weights to 0.0 - 1.0
    const normalizedWeights = {
      skills_match: weights.skills_match / 100,
      experience: weights.experience / 100,
      education: weights.education / 100,
      interview_score: weights.interview_score / 100
    };

    try {
      const res = await api.get(`/recruitment/candidates/ranked`, {
        params: {
          job_posting_id: selectedJob,
          weights: JSON.stringify(normalizedWeights)
        }
      });
      setCandidates(res.data.items || []);
    } catch (e) {
      toast.error('Failed to load ranked candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!compareA || !compareB) return toast.error('Select both candidates');
    if (compareA === compareB) return toast.error('Select different candidates');
    
    setComparing(true);
    try {
      const res = await api.post(`/recruitment/candidates/compare`, {
        application_id_a: compareA,
        application_id_b: compareB,
        job_posting_id: selectedJob
      });
      setCompareResult(res.data);
    } catch (e) {
      toast.error('Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const handleExport = () => {
    if (!selectedJob) return toast.error('Select a job first');
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/recruitment/candidates/export?job_posting_id=${selectedJob}&format=csv`;
  };

  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Advanced Candidate Ranking</h1>
          <p className="text-muted-foreground mt-1">Multi-factor AI scoring and candidate comparison</p>
        </div>
        <div className="w-full md:w-80">
          <Label>Select Job Posting</Label>
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger>
              <SelectValue placeholder="Select a job..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedJob ? (
        <Card className="border-dashed bg-muted"><CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground"><Users className="w-12 h-12 mb-4 opacity-20" /><p>Select a job posting to view candidates</p></CardContent></Card>
      ) : (
        <Tabs defaultValue="ranked" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="ranked">Ranked List</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="ranked" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-center">
                  Ranking Weights
                  <Button variant="outline" size="sm" onClick={fetchRankedCandidates}>Recalculate</Button>
                </CardTitle>
                <CardDescription>Adjust the importance of each factor (0-100)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Skills Match ({weights.skills_match}%)</Label>
                  <input type="range" className="w-full" min="0" max="100" value={weights.skills_match} onChange={e => setWeights({...weights, skills_match: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Experience ({weights.experience}%)</Label>
                  <input type="range" className="w-full" min="0" max="100" value={weights.experience} onChange={e => setWeights({...weights, experience: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Education ({weights.education}%)</Label>
                  <input type="range" className="w-full" min="0" max="100" value={weights.education} onChange={e => setWeights({...weights, education: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Interview ({weights.interview_score}%)</Label>
                  <input type="range" className="w-full" min="0" max="100" value={weights.interview_score} onChange={e => setWeights({...weights, interview_score: parseInt(e.target.value)})} />
                </div>
              </CardContent>
            </Card>

            <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Rank</th>
                    <th className="px-4 py-3 font-medium">Candidate</th>
                    <th className="px-4 py-3 font-medium text-center">Composite</th>
                    <th className="px-4 py-3 font-medium text-center hidden md:table-cell">Skills</th>
                    <th className="px-4 py-3 font-medium text-center hidden md:table-cell">Exp.</th>
                    <th className="px-4 py-3 font-medium text-center hidden lg:table-cell">Rec.</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
                  ) : candidates.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No candidates found</td></tr>
                  ) : (
                    candidates.map((cand, index) => (
                      <React.Fragment key={cand.id}>
                        <tr className={`hover:bg-muted cursor-pointer ${expandedRow === cand.id ? 'bg-muted' : ''}`} onClick={() => setExpandedRow(expandedRow === cand.id ? null : cand.id)}>
                          <td className="px-4 py-4 font-bold text-slate-400">#{index + 1}</td>
                          <td className="px-4 py-4 font-medium">{cand.candidate_name}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-bold ${getColor(cand.composite_score)}`}>{cand.composite_score}</span>
                          </td>
                          <td className="px-4 py-4 text-center hidden md:table-cell">{cand.ai_score || 0}</td>
                          <td className="px-4 py-4 text-center hidden md:table-cell">{cand.experience_years || 0}y</td>
                          <td className="px-4 py-4 text-center hidden lg:table-cell"><Badge variant="outline">{cand.ai_recommendation || 'PENDING'}</Badge></td>
                          <td className="px-4 py-4 text-right">
                            <Button variant="ghost" size="sm">{expandedRow === cand.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</Button>
                          </td>
                        </tr>
                        {expandedRow === cand.id && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={7} className="px-6 py-4 border-t border-dashed">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold text-sm mb-2 text-primary">AI Summary</h4>
                                  <p className="text-sm text-muted-foreground">{cand.ai_summary || 'No summary available'}</p>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold text-sm mb-1 text-green-700">Top Skills</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {cand.ai_skills_match?.map((s:any, i:number) => <Badge key={i} variant="secondary" className="bg-green-100">{s}</Badge>)}
                                    </div>
                                  </div>
                                  {cand.ai_red_flags && cand.ai_red_flags.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-1 text-red-700">Red Flags</h4>
                                      <ul className="text-sm text-red-600 list-disc pl-4">
                                        {cand.ai_red_flags.map((r:any, i:number) => <li key={i}>{r}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="compare" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Side-by-Side Comparison</CardTitle>
                <CardDescription>Select two candidates to run a deep AI comparison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Candidate A</Label>
                    <Select value={compareA} onValueChange={setCompareA}>
                      <SelectTrigger><SelectValue placeholder="Select candidate..." /></SelectTrigger>
                      <SelectContent>
                        {candidates.map(c => <SelectItem key={c.id} value={c.id}>{c.candidate_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Candidate B</Label>
                    <Select value={compareB} onValueChange={setCompareB}>
                      <SelectTrigger><SelectValue placeholder="Select candidate..." /></SelectTrigger>
                      <SelectContent>
                        {candidates.map(c => <SelectItem key={c.id} value={c.id}>{c.candidate_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <Button onClick={handleCompare} disabled={comparing || !compareA || !compareB} className="w-full md:w-auto">
                    {comparing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                    Compare with AI
                  </Button>
                </div>

                {compareResult && (
                  <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-24 h-24 text-purple-600" /></div>
                      <h3 className="text-xl font-bold text-purple-900 mb-2">AI Verdict: Candidate {compareResult.winner}</h3>
                      <p className="text-purple-800 font-medium">{compareResult.winner_name}</p>
                      <p className="text-purple-700 mt-4 leading-relaxed">{compareResult.reasoning}</p>
                      <div className="mt-4 pt-4 border-t border-purple-200/50">
                        <p className="text-sm font-semibold text-purple-900">Recommendation:</p>
                        <p className="text-sm text-purple-800">{compareResult.recommendation}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-green-200">
                        <CardHeader className="bg-green-50/50 pb-3">
                          <CardTitle className="text-sm text-green-800">Candidate A Strengths</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
                            {compareResult.a_strengths?.map((s:any, i:number) => <li key={i}>{s}</li>)}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200">
                        <CardHeader className="bg-blue-50/50 pb-3">
                          <CardTitle className="text-sm text-blue-800">Candidate B Strengths</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
                            {compareResult.b_strengths?.map((s:any, i:number) => <li key={i}>{s}</li>)}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Ranked Candidates</CardTitle>
                <CardDescription>Download a CSV file containing all computed scores and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-md border text-sm text-muted-foreground font-mono">
                  Export includes: Rank, Name, Email, Composite Score, Skills Score, Experience, Education Score, Interview Score, Recommendation
                </div>
                <Button onClick={handleExport} className="w-full md:w-auto">
                  <Download className="w-4 h-4 mr-2" /> Export to CSV
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      )}
    </div>
  );
}
