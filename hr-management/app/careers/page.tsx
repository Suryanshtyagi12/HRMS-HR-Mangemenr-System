'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Briefcase, Building2, Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await api.get('/recruitment/public/jobs');
        setJobs(res.data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) || 
    job.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">H</div>
            <span className="text-xl font-bold tracking-tight">ACME Careers</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-indigo-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Join Our Mission</h1>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
            We are looking for passionate people to help us build the future. Explore our open roles below.
          </p>
          <div className="max-w-xl mx-auto relative mt-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="Search by role or department..." 
              className="pl-10 py-6 text-lg bg-white/10 border-white/20 text-white placeholder:text-indigo-300 focus-visible:ring-white/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Jobs Listing */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-card-foreground">Open Positions</h2>
          <span className="text-sm font-medium text-muted-foreground bg-slate-200 px-3 py-1 rounded-full">
            {filteredJobs.length} roles available
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted rounded-t-xl"></CardHeader>
                <CardContent className="h-20"></CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground">No open positions found</h3>
            <p className="text-muted-foreground mt-1">We couldn't find any roles matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <Card key={job.id} className="group hover:border-indigo-500 transition-colors flex flex-col h-full overflow-hidden shadow-sm hover:shadow-md">
                <CardHeader className="bg-muted border-b">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">
                      {job.department}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {new Date(job.posted_date).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">
                    {job.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex-1 space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {job.location || 'Remote'}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                    {job.employment_type || 'Full-time'}
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
                      ₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  <Link href={`/careers/${job.id}`} className="w-full">
                    <Button className="w-full justify-between" variant="outline">
                      View Details
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
