'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface CreateJobFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateJobForm({ open, onOpenChange, onSuccess }: CreateJobFormProps) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 Data
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [openings, setOpenings] = useState('1');

  // Step 2 Data
  const [requirementsInput, setRequirementsInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level');
  const [generatedJD, setGeneratedJD] = useState<any>(null);

  const resetForm = () => {
    setStep(1);
    setTitle(''); setDepartment(''); setLocation(''); setRequirementsInput('');
    setGeneratedJD(null);
  };

  const [generatingSection, setGeneratingSection] = useState<string | null>(null);

  const handleGenerateSection = async (section: string) => {
    if (!title || !department) return;
    setGeneratingSection(section);
    try {
        if (section === 'requirements' || section === 'skills' || section === 'good_to_have') {
            const res = await api.post('/recruitment/jobs/generate-requirements', {
                title,
                department,
                experience_level: experienceLevel
            });
            if (res.data?.data) {
                const data = res.data.data;
                setGeneratedJD((prev: any) => ({
                    ...prev,
                    responsibilities: section === 'requirements' ? data.requirements || [] : (prev?.responsibilities || []),
                    requiredSkills: section === 'skills' ? data.required_skills || [] : (prev?.requiredSkills || []),
                    niceToHave: section === 'good_to_have' ? data.good_to_have || [] : (prev?.niceToHave || [])
                }));
                if (!generatedJD) {
                    setGeneratedJD({
                        overview: "", responsibilities: section === 'requirements' ? data.requirements || [] : [],
                        requiredSkills: section === 'skills' ? data.required_skills || [] : [],
                        qualifications: [], niceToHave: section === 'good_to_have' ? data.good_to_have || [] : [], benefits: []
                    });
                }
            }
        } else if (section === 'full') {
            const res = await api.post('/recruitment/jobs/generate-jd', {
                title,
                department,
                experience_level: experienceLevel,
                employment_type: employmentType,
                location: location,
                requirements: requirementsInput
            });
            if (res.data?.data) {
                const jd = res.data.data;
                setGeneratedJD({
                    overview: jd.overview || '',
                    responsibilities: jd.responsibilities || [],
                    requiredSkills: jd.required_skills || [],
                    qualifications: jd.qualifications || [],
                    niceToHave: jd.good_to_have || [],
                    benefits: jd.benefits || []
                });
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        setGeneratingSection(null);
    }
  };

  const handlePost = async () => {
    setIsSubmitting(true);
    
    // Format JSON into Markdown
    const markdownDesc = `
## Overview
${generatedJD.overview}

## Responsibilities
${generatedJD.responsibilities.map((r: string) => `- ${r}`).join('\n')}

## Required Skills & Qualifications
${generatedJD.requiredSkills.map((r: string) => `- ${r}`).join('\n')}
${generatedJD.qualifications.map((q: string) => `- ${q}`).join('\n')}

## Nice to Have
${generatedJD.niceToHave.map((n: string) => `- ${n}`).join('\n')}

## Benefits
${generatedJD.benefits.map((b: string) => `- ${b}`).join('\n')}
    `.trim();

    try {
      await api.post('/recruitment/jobs', {
        title,
        department,
        description: markdownDesc,
        requirements: [requirementsInput],
        location,
        employment_type: employmentType,
        salary_min: salaryMin ? parseFloat(salaryMin) : null,
        salary_max: salaryMax ? parseFloat(salaryMax) : null,
        openings: parseInt(openings),
        experience_level: experienceLevel
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job Posting</DialogTitle>
          <DialogDescription>Use Gemini AI to quickly generate a comprehensive job description.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-8 text-sm font-medium text-muted-foreground">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : ''}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
            Basic Info
          </div>
          <div className="flex-1 h-px bg-muted mx-4"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : ''}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
            AI Generation
          </div>
          <div className="flex-1 h-px bg-muted mx-4"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : ''}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
            Review & Post
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Developer" />
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Remote, New York" />
              </div>
              <div className="space-y-2">
                <Label>Salary Range (Min)</Label>
                <Input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="e.g. 80000" />
              </div>
              <div className="space-y-2">
                <Label>Salary Range (Max)</Label>
                <Input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="e.g. 120000" />
              </div>
              <div className="space-y-2">
                <Label>Openings</Label>
                <Input type="number" value={openings} onChange={e => setOpenings(e.target.value)} min="1" />
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <Button onClick={() => setStep(2)} disabled={!title || !department}>
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brief Requirements / Notes</Label>
                  <Textarea 
                    placeholder="E.g. React, Next.js, 5 years exp, leadership skills..." 
                    value={requirementsInput}
                    onChange={e => setRequirementsInput(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm" value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead/Manager">Lead/Manager</option>
                  </select>
                </div>
              </div>
              <Button onClick={() => handleGenerateSection('full')} disabled={!!generatingSection} className="w-full">
                {generatingSection === 'full' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2 text-yellow-300" />}
                {generatingSection === 'full' ? 'Gemini is writing your full JD...' : 'Generate Full JD ✨'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Overview</Label>
                <Textarea value={generatedJD?.overview || ''} onChange={e => setGeneratedJD({...generatedJD, overview: e.target.value})} rows={3} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Requirements (one per line)</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleGenerateSection('requirements')} disabled={!!generatingSection}>
                      {generatingSection === 'requirements' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1 text-yellow-500" />}
                      Generate ✨
                    </Button>
                  </div>
                  <Textarea 
                    value={(generatedJD?.responsibilities || []).join('\n')} 
                    onChange={e => setGeneratedJD({...generatedJD, responsibilities: e.target.value.split('\n')})} 
                    rows={5} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Required Skills (one per line)</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleGenerateSection('skills')} disabled={!!generatingSection}>
                      {generatingSection === 'skills' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1 text-yellow-500" />}
                      Generate ✨
                    </Button>
                  </div>
                  <Textarea 
                    value={(generatedJD?.requiredSkills || []).join('\n')} 
                    onChange={e => setGeneratedJD({...generatedJD, requiredSkills: e.target.value.split('\n')})} 
                    rows={5} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qualifications</Label>
                  <Textarea 
                    value={(generatedJD?.qualifications || []).join('\n')} 
                    onChange={e => setGeneratedJD({...generatedJD, qualifications: e.target.value.split('\n')})} 
                    rows={4} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Good to Have</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleGenerateSection('good_to_have')} disabled={!!generatingSection}>
                      {generatingSection === 'good_to_have' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1 text-yellow-500" />}
                      Generate ✨
                    </Button>
                  </div>
                  <Textarea 
                    value={(generatedJD?.niceToHave || []).join('\n')} 
                    onChange={e => setGeneratedJD({...generatedJD, niceToHave: e.target.value.split('\n')})} 
                    rows={4} 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button onClick={() => setStep(3)} disabled={!generatedJD}>
                Review <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && generatedJD && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-muted p-6 rounded-lg max-h-[50vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <p className="text-muted-foreground mb-6">{department} • {location} • {employmentType}</p>
              
              <h3 className="font-semibold text-lg mb-2">Overview</h3>
              <p className="mb-4">{generatedJD.overview}</p>
              
              <h3 className="font-semibold text-lg mb-2">Responsibilities</h3>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                {generatedJD.responsibilities.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
              
              <h3 className="font-semibold text-lg mb-2">Requirements</h3>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                {generatedJD.requiredSkills.map((r: string, i: number) => <li key={i}>{r}</li>)}
                {generatedJD.qualifications.map((q: string, i: number) => <li key={i}>{q}</li>)}
              </ul>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4 mr-2" /> Edit Output</Button>
              <Button onClick={handlePost} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Confirm & Post Job
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
