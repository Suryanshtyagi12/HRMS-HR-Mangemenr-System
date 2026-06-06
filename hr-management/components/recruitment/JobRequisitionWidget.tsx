import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Building2, Users, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function JobRequisitionWidget() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['hr-job-requests'],
    queryFn: async () => {
      const res = await api.get('/recruitment/requests');
      return res.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/recruitment/requests/${id}/approve`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Request approved & Job Posting created!');
      queryClient.invalidateQueries({ queryKey: ['hr-job-requests'] });
    },
    onError: () => {
      toast.error('Failed to approve request.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/recruitment/requests/${id}/reject`);
    },
    onSuccess: () => {
      toast.success('Request rejected.');
      queryClient.invalidateQueries({ queryKey: ['hr-job-requests'] });
    },
    onError: () => {
      toast.error('Failed to reject request.');
    }
  });

  const pendingRequests = requests.filter((r: any) => r.status === 'PENDING');

  if (isLoading) return null;
  if (pendingRequests.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 border border-border shadow-sm flex flex-col mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-headline font-semibold text-card-foreground flex items-center">
          <Clock className="w-5 h-5 mr-2 text-amber-500" />
          Pending Requisition Requests ({pendingRequests.length})
        </h3>
      </div>
      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
        {pendingRequests.map((req: any) => (
          <div key={req.id} className="p-4 hover:bg-muted/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-50/10 dark:bg-amber-500/5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-semibold text-card-foreground">{req.title}</h4>
              </div>
              <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-4">
                <span className="flex items-center"><Building2 className="w-3 h-3 mr-1" /> {req.department}</span>
                <span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> {req.domain}</span>
                <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {req.headcount} opening{req.headcount > 1 ? 's' : ''}</span>
              </div>
              <p className="text-sm mt-2 text-muted-foreground border-l-2 pl-3 border-border">
                {req.requirements}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                onClick={() => rejectMutation.mutate(req.id)}
                disabled={rejectMutation.isPending || approveMutation.isPending}
              >
                Reject
              </Button>
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => approveMutation.mutate(req.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" /> Approve & Post
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
