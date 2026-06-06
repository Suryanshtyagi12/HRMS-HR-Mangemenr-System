'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Image as ImageIcon, Trash, Download, Upload, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useEmployee } from '@/hooks/useEmployees';

const DOCUMENT_TYPES = [
  'RESUME', 'OFFER_LETTER', 'CONTRACT', 'ID_PROOF', 
  'CERTIFICATE', 'PAYSLIP', 'APPRAISAL', 'OTHER'
];

export default function DocumentVaultPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  const { data: employee } = useEmployee(employeeId);
  
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docType, setDocType] = useState('ID_PROOF');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Re-screen State
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isScreening, setIsScreening] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await api.get(`/documents/${employeeId}`);
      setDocuments(res.data || {});
    } catch (error) {
      console.error(error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get('/recruitment/jobs');
      setJobs(res.data);
    } catch (e) {
      console.error('Failed to load jobs for screening');
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchJobs();
  }, [employeeId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);
    if (notes) formData.append('notes', notes);

    try {
      await api.post(`/documents/upload/${employeeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully');
      setUploadOpen(false);
      setFile(null);
      setNotes('');
      fetchDocuments();
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleRescreen = async (docId: string) => {
    if (!selectedJobId) return toast.error('Please select a job first');
    setIsScreening(true);
    try {
      // Dummy endpoint for internal mobility re-screening or trigger existing
      await api.post(`/recruitment/screen`, { employee_id: employeeId, job_id: selectedJobId, document_id: docId });
      toast.success('Resume submitted for re-screening!');
    } catch (error) {
      toast.error('Screening failed');
    } finally {
      setIsScreening(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Vault</h1>
          <p className="text-muted-foreground">{employee?.first_name} {employee?.last_name} • ID: {employee?.employee_code}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="w-4 h-4 mr-2" /> Upload Document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>File (PDF/Image, max 10MB)</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required accept=".pdf,image/*" />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload File
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(documents).length === 0 ? (
        <Card className="bg-muted/30 border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><FileText className="w-12 h-12 mb-4 opacity-20" /><p>No documents uploaded yet</p></CardContent></Card>
      ) : (
        <Accordion type="multiple" defaultValue={Object.keys(documents)} className="space-y-4">
          {Object.entries(documents).map(([type, docs]) => (
            <AccordionItem key={type} value={type} className="bg-card border rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">{type.replace('_', ' ')}</span>
                  <Badge variant="secondary">{docs.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-start justify-between p-4 border rounded-md bg-slate-50/50 hover:bg-muted transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        {doc.file_name.endsWith('.pdf') ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-card-foreground">{doc.file_name}</h4>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                        </div>
                        {doc.notes && <p className="text-sm mt-2 text-muted-foreground bg-card p-2 rounded border">{doc.notes}</p>}
                        
                        {type === 'RESUME' && (
                          <div className="mt-4 p-4 bg-primary/5 rounded-md border border-primary/20 space-y-3">
                            <Label className="text-primary font-semibold">Resume Actions</Label>
                            <div className="flex items-center gap-3">
                              <select 
                                className="flex h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={selectedJobId}
                                onChange={(e) => setSelectedJobId(e.target.value)}
                              >
                                <option value="">Select a job to re-screen...</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                              </select>
                              <Button 
                                size="sm" 
                                onClick={() => handleRescreen(doc.id)} 
                                disabled={isScreening || !selectedJobId}
                              >
                                {isScreening ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                Re-screen against job
                              </Button>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground border-t pt-2 border-primary/10">
                              <span className="font-medium">Extracted Text Preview:</span> 
                              <p className="mt-1 bg-card p-2 rounded line-clamp-3 text-muted-foreground">
                                {doc.notes?.includes('Extracted:') ? doc.notes : "Text extraction runs automatically on upload. Content will appear here."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url || `/api/documents/download/${doc.id}`, '_blank')}>
                        <Download className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(doc.id)}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
