'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UploadCloud, CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ApplyPage() {
  const { jobId } = useParams() as { jobId: string };
  const router = useRouter();
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    currentCompany: '',
  });

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await api.get(`/recruitment/public/jobs/${jobId}`);
        setJob(res.data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchJob();
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a resume.");
      return;
    }
    
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('job_id', jobId);
      fd.append('full_name', formData.fullName);
      fd.append('email', formData.email);
      fd.append('phone', formData.phone);
      fd.append('experience', formData.experience);
      if (formData.currentCompany) fd.append('current_company', formData.currentCompany);
      fd.append('resume', file);
      
      const res = await api.post('/recruitment/public/apply', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.status === 'success') {
        router.push(`/application-success?appId=${res.data.application_id}&job=${encodeURIComponent(job?.title || 'Role')}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!job) {
    return <div className="min-h-screen bg-muted flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href={`/careers/${jobId}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-indigo-600 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Job Details
        </Link>
        
        <div className="bg-card rounded-2xl shadow-sm border p-8">
          <div className="mb-8 border-b pb-6">
            <h1 className="text-2xl font-bold text-card-foreground">Apply for {job.title}</h1>
            <p className="text-muted-foreground mt-1">{job.department} • {job.location || 'Remote'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-card-foreground border-b pb-2">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="fullName" 
                    required 
                    placeholder="Jane Doe"
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    required 
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-semibold text-card-foreground border-b pb-2">Professional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Total Experience <span className="text-red-500">*</span></Label>
                  <Input 
                    id="experience" 
                    required 
                    placeholder="e.g. 5 Years"
                    value={formData.experience}
                    onChange={e => setFormData({...formData, experience: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentCompany">Current Company</Label>
                  <Input 
                    id="currentCompany" 
                    placeholder="Optional"
                    value={formData.currentCompany}
                    onChange={e => setFormData({...formData, currentCompany: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-semibold text-card-foreground border-b pb-2">Resume <span className="text-red-500">*</span></h2>
              
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 bg-muted hover:bg-muted'}`}>
                <input 
                  type="file" 
                  id="resume" 
                  accept=".pdf,.doc,.docx" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <Label htmlFor="resume" className="cursor-pointer flex flex-col items-center">
                  {file ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-indigo-500 mb-3" />
                      <span className="font-medium text-card-foreground">{file.name}</span>
                      <span className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className="text-indigo-600 text-sm mt-2 font-medium hover:underline">Click to change file</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                      <span className="font-medium text-card-foreground">Click to upload your resume</span>
                      <span className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX up to 5MB</span>
                    </>
                  )}
                </Label>
              </div>
            </div>

            <div className="pt-6 border-t mt-8">
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-lg" 
                disabled={loading || !file}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting Application (AI Screening)...</>
                ) : (
                  'Submit Application'
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4">
                By submitting this application, you agree to our privacy policy and terms of service.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
