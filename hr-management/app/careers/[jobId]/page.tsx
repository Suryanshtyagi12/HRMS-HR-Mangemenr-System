'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MapPin, Briefcase, Building2, ChevronLeft, Calendar } from 'lucide-react';

export default function JobDetailPage() {
  const { jobId } = useParams() as { jobId: string };
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await api.get(`/recruitment/public/jobs/${jobId}`);
        setJob(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Job Not Found</h1>
        <p className="text-muted-foreground">The position you are looking for does not exist or has been closed.</p>
        <Link href="/careers">
          <Button variant="outline">Back to Careers</Button>
        </Link>
      </div>
    );
  }

  // Helper to parse job description if it's stored as JSON
  const renderDescription = () => {
    try {
      const parsed = JSON.parse(job.description);
      return (
        <div className="space-y-6">
          <p className="text-card-foreground leading-relaxed text-lg">{parsed.summary || parsed.description}</p>
          
          {parsed.responsibilities && parsed.responsibilities.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-card-foreground mb-4">Key Responsibilities</h3>
              <ul className="list-disc pl-6 space-y-2 text-card-foreground">
                {parsed.responsibilities.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {parsed.skills && parsed.skills.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-card-foreground mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {parsed.skills.map((s: string, i: number) => (
                  <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } catch {
      // Fallback if not JSON
      return <div className="prose max-w-none text-card-foreground">{job.description}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/careers" className="flex items-center text-sm font-medium text-muted-foreground hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Careers
          </Link>
          <div className="font-bold text-card-foreground">ACME Careers</div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-muted border-b py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider">
              {job.department}
            </span>
            <span className="flex items-center text-sm text-muted-foreground font-medium">
              <Calendar className="w-4 h-4 mr-1" />
              Posted on {new Date(job.posted_date).toLocaleDateString()}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-card-foreground tracking-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap gap-6 pt-4 text-muted-foreground font-medium">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-slate-400" />
              {job.location || 'Remote'}
            </div>
            <div className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-slate-400" />
              {job.employment_type || 'Full-time'}
            </div>
            {(job.salary_min || job.salary_max) && (
              <div className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">
                ₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content & Sidebar */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
        <div className="flex-1">
          {renderDescription()}
        </div>
        
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-muted rounded-2xl p-6 border sticky top-24">
            <h3 className="font-bold text-card-foreground text-lg mb-4">Apply for this role</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Join our {job.department} team and help us build amazing products.
            </p>
            <Link href={`/apply/${job.id}`} className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6 shadow-md shadow-indigo-600/20">
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
