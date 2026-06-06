'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Users, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerRecruitmentSupportPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    domain: '',
    headcount: 1,
    requirements: ''
  });
  
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['job-requests'],
    queryFn: async () => {
      const res = await api.get('/recruitment/requests');
      return res.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await api.post('/recruitment/requests', data);
    },
    onSuccess: () => {
      toast.success('Job requisition submitted successfully!');
      setShowForm(false);
      setFormData({ title: '', department: '', domain: '', headcount: 1, requirements: '' });
      queryClient.invalidateQueries({ queryKey: ['job-requests'] });
    },
    onError: () => {
      toast.error('Failed to submit request');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
    if (status === 'APPROVED') return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1"/> Approved</Badge>;
    if (status === 'REJECTED') return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
    return <Badge>{status}</Badge>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recruitment Support</h1>
          <p className="text-muted-foreground">Manage your job requisitions and team hiring needs.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel Request' : 'New Requisition'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Submit New Job Requisition</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input 
                  placeholder="e.g. Senior Frontend Developer" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input 
                  placeholder="e.g. Engineering" 
                  value={formData.department} 
                  onChange={e => setFormData({...formData, department: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain / Specialization</label>
                <Input 
                  placeholder="e.g. React & Next.js" 
                  value={formData.domain} 
                  onChange={e => setFormData({...formData, domain: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Headcount Required</label>
                <Input 
                  type="number" 
                  min="1" 
                  value={formData.headcount} 
                  onChange={e => setFormData({...formData, headcount: parseInt(e.target.value)})} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Core Requirements & Justification</label>
              <Textarea 
                placeholder="Explain why this role is needed and key skills required..." 
                className="h-32"
                value={formData.requirements} 
                onChange={e => setFormData({...formData, requirements: e.target.value})} 
                required 
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitMutation.isPending}>
                Submit to HR
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <h3 className="font-semibold">My Requisitions</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border-2 border-dashed mx-4 my-4 rounded-xl">
            You haven't submitted any job requisitions yet.
          </div>
        ) : (
          <div className="divide-y">
            {requests.map((req: any) => (
              <div key={req.id} className="p-4 hover:bg-muted transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold">{req.title}</h4>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-4">
                    <span className="flex items-center"><Building2 className="w-3 h-3 mr-1" /> {req.department}</span>
                    <span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> {req.domain}</span>
                    <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {req.headcount} opening{req.headcount > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Submitted</div>
                  <div className="text-sm font-medium">{new Date(req.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
