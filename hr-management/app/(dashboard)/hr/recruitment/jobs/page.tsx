'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CreateJobForm } from '@/components/recruitment/CreateJobForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building2, Users, MoreHorizontal, Wand2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/recruitment/jobs');
      setJobs(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      try {
        await api.delete(`/recruitment/jobs/${id}`);
        fetchJobs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClose = async (id: string) => {
    if (confirm('Are you sure you want to close this job posting?')) {
      try {
        await api.patch(`/recruitment/jobs/${id}/close`);
        fetchJobs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const copyPublicLink = (url: string) => {
    if (url) {
      navigator.clipboard.writeText(url);
      alert('Public application link copied to clipboard!');
    } else {
      alert('No public link available for this job.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Postings</h1>
          <p className="text-muted-foreground mt-2">Manage open roles and generate descriptions using AI.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Job Posting
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Role Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Openings</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Posted Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground border-border">
                  No job postings found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : jobs.map((job) => (
              <TableRow key={job.id} className="border-border">
                <TableCell className="font-medium text-card-foreground">
                  <div className="flex items-center gap-2">
                    {job.title}
                    {job.ai_generated_jd && (
                      <Wand2 className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" /> {job.department}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={job.status === 'OPEN' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-card-foreground">{job.openings}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-card-foreground">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {job.application_count || 0}
                  </div>
                </TableCell>
                <TableCell className="text-card-foreground">{new Date(job.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.location.href = `/hr/recruitment/pipeline?jobId=${job.id}`}>
                        View Pipeline
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = `/hr/recruitment/screener`}>
                        Screen Resumes
                      </DropdownMenuItem>
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => copyPublicLink(job.public_application_url || `${window.location.origin}/apply/${job.id}`)}>
                          <LinkIcon className="w-4 h-4 mr-2" /> Copy Public Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(job.public_application_url || `${window.location.origin}/apply/${job.id}`, '_blank')}>
                          <ExternalLink className="w-4 h-4 mr-2" /> Open Portal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                      {job.status === 'OPEN' && (
                        <DropdownMenuItem onClick={() => handleClose(job.id)}>
                          Close Posting
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(job.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateJobForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={fetchJobs} 
      />
    </div>
  );
}
