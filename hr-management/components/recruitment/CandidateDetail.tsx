import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InterviewTranscript } from '@/components/ai/InterviewTranscript';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import api from '@/lib/api';
import { toast } from 'sonner';

interface CandidateDetailProps {
  application: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: string) => void;
}

const STATUSES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'AI_INTERVIEW_TAKEN', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFERED', 'HIRED', 'REJECTED'];

export function CandidateDetail({ application, open, onOpenChange, onStatusChange }: CandidateDetailProps) {
  const [scheduleDate, setScheduleDate] = React.useState('');
  const [scheduleTopic, setScheduleTopic] = React.useState('');
  const [scheduleLink, setScheduleLink] = React.useState('');
  const [scheduleNotes, setScheduleNotes] = React.useState('');
  const [isScheduling, setIsScheduling] = React.useState(false);

  if (!application) return null;

  let interviewQuestions = [];
  if (application.interview_transcript) {
    try {
      interviewQuestions = typeof application.interview_transcript === 'string' 
        ? JSON.parse(application.interview_transcript) 
        : application.interview_transcript;
    } catch (e) {}
  }

  const handleScheduleMain = async () => {
    try {
      setIsScheduling(true);
      await api.post(`/recruitment/application/${application.id}/schedule-main`, {
        date_time: scheduleDate,
        topic: scheduleTopic,
        google_meet_link: scheduleLink,
        notes: scheduleNotes
      });
      toast.success("Main interview scheduled & email sent!");
      onStatusChange("INTERVIEW_SCHEDULED");
      setScheduleDate('');
      setScheduleTopic('');
      setScheduleLink('');
      setScheduleNotes('');
    } catch (err) {
      toast.error("Failed to schedule main interview");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-2xl">{application.candidate_name}</SheetTitle>
              <SheetDescription>{application.candidate_email} • {application.candidate_phone}</SheetDescription>
            </div>
            <Badge variant={application.status === 'REJECTED' ? 'destructive' : 'default'} className="text-sm">
              {application.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Status Management</h3>
            <div className="flex items-center gap-4">
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={application.status}
                onChange={e => onStatusChange(e.target.value)}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </section>

          {(application.status === 'AI_INTERVIEW_TAKEN') && (
            <section className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Schedule Main Interview</h3>
              <div className="bg-muted p-4 rounded-lg space-y-4 border border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic / Focus</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Technical Round, Culture Fit"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={scheduleTopic}
                      onChange={e => setScheduleTopic(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Google Meet Link</label>
                  <input 
                    type="url" 
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={scheduleLink}
                    onChange={e => setScheduleLink(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Notes to Candidate</label>
                  <Textarea 
                    placeholder="Any specific instructions..."
                    value={scheduleNotes}
                    onChange={e => setScheduleNotes(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleScheduleMain} 
                  disabled={!scheduleDate || !scheduleTopic || !scheduleLink || isScheduling}
                  className="w-full"
                >
                  {isScheduling ? "Scheduling..." : "Schedule & Send Invite Email"}
                </Button>
              </div>
            </section>
          )}

          {application.ai_score !== null && application.ai_score !== undefined && (
            <section className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">AI Resume Screening</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-black text-primary">{Math.round(application.ai_score)}</div>
                  <div className="text-sm font-medium text-muted-foreground uppercase">Resume Score</div>
                </div>
                
                <h4 className="font-medium mb-1">AI Summary</h4>
                <p className="text-sm text-muted-foreground mb-4">{application.ai_summary}</p>

                {application.ai_skills_match && application.ai_skills_match.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Matched Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.ai_skills_match.map((s: string, i: number) => (
                        <Badge key={i} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {application.ai_red_flags && application.ai_red_flags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-rose-600 mb-2">Red Flags</h4>
                    <ul className="list-disc pl-5 text-sm text-rose-700 space-y-1">
                      {application.ai_red_flags.map((f: string, i: number) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {interviewQuestions && interviewQuestions.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 flex justify-between items-center">
                AI Voice Interview
                {application.interview_score !== null && application.interview_score !== undefined && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Interview Score: {Math.round(application.interview_score)}
                  </Badge>
                )}
              </h3>
              
              <InterviewTranscript history={interviewQuestions} />
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
