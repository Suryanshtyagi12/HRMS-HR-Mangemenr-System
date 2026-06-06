'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BulkUploadZone } from '@/components/ai/BulkUploadZone';
import { Search, Calendar as Schedule, Star, CheckCircle, XCircle as Cancel, Sparkles as AutoAwesome, MapPin as LocationOn, Briefcase as Work, X as Close, UserCheck as HowToReg, Loader2 } from 'lucide-react';

const parseJsonField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try { return JSON.parse(field); } catch { return []; }
  }
  return [];
};

export default function ScreenerPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [applications, setApplications] = useState<any[]>([]);
  
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  useEffect(() => {
    api.get('/recruitment/jobs?status=OPEN').then((res) => {
      const data = res.data?.items || [];
      setJobs(data);
      if (data.length > 0) setSelectedJobId(data[0].id);
    }).catch(console.error);
  }, []);

  const fetchApplications = async (jobId: string) => {
    try {
      // Assuming pipeline has the data. Or wait, pipeline groups by status.
      // Let's use the pipeline endpoint or add a new one for applications.
      // Wait, pipeline returns { data: { SCREENING: [...], ... } }
      const res = await api.get(`/recruitment/pipeline?job_id=${jobId}`);
      if (res.data && res.data.data) {
        // Flatten all applications from the pipeline
        const allApps = Object.values(res.data.data).flat() as any[];
        // Sort by ai_score descending
        const sorted = allApps.sort((a: any, b: any) => (b.ai_score || 0) - (a.ai_score || 0));
        setApplications(sorted);
        if (sorted.length > 0) setSelectedResult(sorted[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchApplications(selectedJobId);
    }
  }, [selectedJobId]);

  const handleProcessResumes = async (files: File[]) => {
    if (!selectedJobId) return;
    
    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });
    
    try {
      const formData = new FormData();
      formData.append('job_posting_id', selectedJobId);
      for (const file of files) {
        formData.append('files', file);
      }
      
      await api.post('/recruitment/screen/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProgress({ current: files.length, total: files.length });
      await fetchApplications(selectedJobId);
    } catch (error) {
      console.error('Error during screening:', error);
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const fd = new FormData();
    fd.append('status', status);
    await api.patch(`/recruitment/application/${id}/status`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  };

  const handleShortlist = async (id: string) => {
    await updateStatus(id, 'SHORTLISTED');
    setApplications(apps => apps.map(a => a.id === id ? { ...a, status: 'SHORTLISTED' } : a));
    if (selectedResult?.id === id) {
      setSelectedResult({ ...selectedResult, status: 'SHORTLISTED' });
    }
  };

  const handleReject = async (id: string) => {
    await updateStatus(id, 'REJECTED');
    setApplications(apps => apps.map(a => a.id === id ? { ...a, status: 'REJECTED' } : a));
    if (selectedResult?.id === id) {
      setSelectedResult({ ...selectedResult, status: 'REJECTED' });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-300 min-h-screen">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-card-foreground tracking-tight">AI Resume Screener</h2>
          <p className="text-muted-foreground mt-1 font-body">Upload and automatically evaluate candidate resumes using Gemini AI.</p>
        </div>
      </div>

      {/* Top Section: Job Select & Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border">
          <label className="block text-sm font-semibold text-card-foreground mb-2">Select Active Job Posting</label>
          <select 
            className="w-full bg-muted border border-border text-sm font-medium text-card-foreground rounded-xl py-3 pl-4 pr-10 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title} - {job.department}</option>
            ))}
          </select>
          {selectedJobId && jobs.find(j => j.id === selectedJobId) && (
             <div className="mt-4 text-sm bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-muted-foreground">
               <span className="font-semibold text-indigo-700">Requirements:</span> {jobs.find(j => j.id === selectedJobId).requirements}
             </div>
          )}
        </div>
        
        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-2">Upload Resumes</h3>
          <BulkUploadZone 
            onProcess={handleProcessResumes}
            isProcessing={isProcessing}
            progress={progress}
          />
        </div>
      </div>

      {/* Main Results Layout */}
      {applications.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-auto lg:h-[800px]">
          
          {/* Left Column (30%) - Candidate List */}
          <div className="w-full lg:w-[35%] flex flex-col h-[400px] lg:h-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 md:p-6 border-b border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-headline text-card-foreground">Candidates</h2>
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">{applications.length}</span>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" 
                  placeholder="Search names..." 
                  type="text"
                />
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                <button className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-medium whitespace-nowrap">All</button>
                <button className="px-3 py-1 bg-muted text-muted-foreground hover:bg-slate-200 rounded-full text-xs font-medium whitespace-nowrap transition-colors">Shortlisted</button>
                <button className="px-3 py-1 bg-muted text-muted-foreground hover:bg-slate-200 rounded-full text-xs font-medium whitespace-nowrap transition-colors">Needs Review</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {applications.map((app) => {
                const isActive = selectedResult?.id === app.id;
                const scoreColor = app.ai_score >= 70 ? 'text-emerald-800 bg-emerald-100' : app.ai_score >= 40 ? 'text-amber-800 bg-amber-100' : 'text-rose-800 bg-rose-100';
                
                return (
                  <div 
                    key={app.id} 
                    onClick={() => setSelectedResult(app)}
                    className={`p-4 rounded-xl shadow-sm cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-card border-2 border-indigo-500' 
                        : 'bg-card border border-border hover:border-slate-300 hover:shadow-md opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-lg flex-shrink-0 ${isActive ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-muted text-muted-foreground border-border'}`}>
                          {app.candidate_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-card-foreground">{app.candidate_name}</h3>
                          <p className="text-xs text-muted-foreground truncate w-32">{jobs.find(j=>j.id===selectedJobId)?.title || 'Applicant'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center space-x-1 text-xs text-muted-foreground">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{app.status}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${scoreColor}`}>
                        <Star size={12} className={app.ai_score >= 70 ? 'fill-emerald-800' : ''} />
                        <span>{Math.round(app.ai_score)}% Match</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right Column (70%) - Analysis Panel */}
          {selectedResult && (
            <div className="w-full lg:w-[65%] flex flex-col h-auto lg:h-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              
              {/* Panel Header */}
              <div className="p-4 md:p-6 border-b border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-card z-10 sticky top-0">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl border-2 border-white shadow-sm overflow-hidden relative">
                    {selectedResult.candidate_name.charAt(0)}
                    <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${selectedResult.status === 'SHORTLISTED' ? 'bg-emerald-500' : selectedResult.status === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-headline text-card-foreground tracking-tight">{selectedResult.candidate_name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center"><Work size={14} className="mr-1" /> {selectedResult.ai_details?.current_role || jobs.find(j=>j.id===selectedJobId)?.title || 'Role'} {selectedResult.ai_details?.current_company ? `at ${selectedResult.ai_details.current_company}` : ''}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center text-muted-foreground">{selectedResult.ai_details?.total_experience_years || 0} years exp</span>
                      {selectedResult.candidate_email && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>{selectedResult.candidate_email}</span>
                        </>
                      )}
                      {selectedResult.candidate_phone && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>{selectedResult.candidate_phone}</span>
                        </>
                      )}
                    </div>
                    {selectedResult.ai_details?.recommendation && (
                      <div className="mt-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${selectedResult.ai_details.recommendation === 'SHORTLIST' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : selectedResult.ai_details.recommendation === 'REJECT' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                          AI Rec: {selectedResult.ai_details.recommendation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleReject(selectedResult.id)}
                    disabled={selectedResult.status === 'REJECTED'}
                    className="px-4 py-2 border border-slate-300 text-card-foreground rounded-xl hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-medium text-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Close size={18} />
                    <span>Reject</span>
                  </button>
                  <button 
                    onClick={() => handleShortlist(selectedResult.id)}
                    disabled={selectedResult.status === 'SHORTLISTED'}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 font-medium text-sm transition-opacity shadow-sm flex items-center space-x-2 disabled:opacity-50"
                  >
                    <HowToReg size={18} />
                    <span>Shortlist</span>
                  </button>
                </div>
              </div>
              
              {/* Panel Body */}
              <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/30">
                
                {/* Top Grid: Score & Progress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  
                  {/* AI Match Score Card */}
                  <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex items-center justify-between relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-2xl opacity-50"></div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center space-x-2">
                        <AutoAwesome className="text-indigo-500 w-4 h-4" />
                        <span>AI Match Score</span>
                      </h3>
                      <div className="mt-4">
                        <span className="text-4xl font-extrabold text-card-foreground font-headline">{Math.round(selectedResult.ai_score)}<span className="text-2xl text-slate-400">%</span></span>
                      </div>
                      <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center">
                        {selectedResult.ai_score >= 70 ? 'Strong candidate match' : selectedResult.ai_score >= 40 ? 'Average match' : 'Weak match'}
                      </p>
                    </div>
                    
                    {/* Circular Progress (CSS based) */}
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-slate-100" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                        <circle 
                          className={selectedResult.ai_score >= 70 ? "text-emerald-500" : selectedResult.ai_score >= 40 ? "text-amber-500" : "text-rose-500"} 
                          cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" 
                          strokeDasharray="251.2" 
                          strokeDashoffset={251.2 - (251.2 * selectedResult.ai_score) / 100} 
                          strokeLinecap="round" strokeWidth="8"
                          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckCircle className={selectedResult.ai_score >= 70 ? "text-emerald-500 w-6 h-6" : selectedResult.ai_score >= 40 ? "text-amber-500 w-6 h-6" : "text-rose-500 w-6 h-6"} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Experience Match Bars (Mocked distribution based on total score) */}
                  <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center space-x-2">
                      <Work className="text-purple-500 w-4 h-4" />
                      <span>Score Breakdown</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span className="text-card-foreground">Skills Score</span>
                          <span className="text-emerald-600">{selectedResult.ai_details?.score_breakdown?.skills_score || selectedResult.ai_score || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${selectedResult.ai_details?.score_breakdown?.skills_score || selectedResult.ai_score || 0}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span className="text-card-foreground">Experience Score</span>
                          <span className="text-indigo-600">{selectedResult.ai_details?.score_breakdown?.experience_score || selectedResult.ai_score || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${selectedResult.ai_details?.score_breakdown?.experience_score || selectedResult.ai_score || 0}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span className="text-card-foreground">Education Score</span>
                          <span className="text-purple-600">{selectedResult.ai_details?.score_breakdown?.education_score || selectedResult.ai_score || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${selectedResult.ai_details?.score_breakdown?.education_score || selectedResult.ai_score || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Middle Grid: Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Key Strengths */}
                  <div className="bg-card rounded-2xl p-6 shadow-sm border border-emerald-100 bg-emerald-50/30">
                    <h3 className="text-sm font-semibold text-emerald-800 mb-4 flex items-center space-x-2">
                      <CheckCircle className="text-emerald-500 w-4 h-4" />
                      <span>Key Strengths</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {parseJsonField(selectedResult.ai_skills_match).map((skill: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
                          {skill}
                        </span>
                      ))}
                      {parseJsonField(selectedResult.ai_skills_match).length === 0 && (
                        <span className="text-sm text-muted-foreground">No specific matched skills extracted.</span>
                      )}
                    </div>
                    {parseJsonField(selectedResult.ai_details?.strengths || []).length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wide">Key Strengths</h4>
                            <ul className="space-y-1">
                                {parseJsonField(selectedResult.ai_details.strengths).map((strength: string, i: number) => (
                                    <li key={i} className="text-xs text-emerald-700 flex items-start space-x-2">
                                        <span>•</span><span>{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                  </div>
                  
                  {/* Missing Skills */}
                  <div className="bg-card rounded-2xl p-6 shadow-sm border border-rose-100 bg-rose-50/30">
                    <h3 className="text-sm font-semibold text-rose-800 mb-4 flex items-center space-x-2">
                      <Cancel className="text-rose-500 w-4 h-4" />
                      <span>Missing Skills</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {parseJsonField(selectedResult.ai_details?.missing_skills || []).map((skill: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200">
                          {skill}
                        </span>
                      ))}
                      {parseJsonField(selectedResult.ai_details?.missing_skills || []).length === 0 && (
                        <span className="text-sm text-muted-foreground">No major missing requirements. Candidate fits profile well.</span>
                      )}
                    </div>

                    {(selectedResult.ai_details?.projects || []).length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-card-foreground mb-2">Projects Count</h3>
                        <span className="px-3 py-1 bg-muted text-card-foreground text-sm font-medium rounded-lg">
                          {selectedResult.ai_details.projects.length} Projects
                        </span>
                      </div>
                    )}
                    
                    {parseJsonField(selectedResult.ai_details?.red_flags || []).length > 0 && (
                      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <h3 className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">Amber Warnings</h3>
                        <ul className="space-y-1">
                          {parseJsonField(selectedResult.ai_details.red_flags).map((flag: string, i: number) => (
                            <li key={i} className="text-xs text-amber-700 flex items-start space-x-2">
                              <span>•</span><span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bottom: AI Summary */}
                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <AutoAwesome size={100} />
                  </div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center space-x-2">
                    <AutoAwesome className="text-indigo-500 w-4 h-4" />
                    <span>AI Executive Summary</span>
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl relative z-10 whitespace-pre-line">
                    {selectedResult.ai_summary || `Based on the resume analysis, ${selectedResult.candidate_name} presents a ${Math.round(selectedResult.ai_score)}% match for the position. ${selectedResult.ai_score >= 70 ? 'They possess strong relevant skills and align well with the core requirements. Strongly recommend proceeding to the next stage.' : selectedResult.ai_score >= 40 ? 'They meet some basic criteria but may lack depth in key areas. Consider for screening call to verify experience.' : 'They do not appear to meet the minimum qualifications for this role.'}`}
                  </p>
                </div>
                
              </div>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}
