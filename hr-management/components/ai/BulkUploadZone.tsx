'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface BulkUploadZoneProps {
  onProcess: (files: File[]) => void;
  isProcessing: boolean;
  progress: { current: number; total: number };
}

export function BulkUploadZone({ onProcess, isProcessing, progress }: BulkUploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (files.length + acceptedFiles.length > 20) {
      setError('You can only upload up to 20 files at once.');
      return;
    }
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    disabled: isProcessing
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcess = () => {
    if (files.length > 0) {
      onProcess(files);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 md:p-10 text-center transition-colors cursor-pointer ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop the PDFs here ...</p>
        ) : (
          <div>
            <p className="text-lg font-medium">Drag & drop resumes here, or click to select files</p>
            <p className="text-sm text-muted-foreground mt-1">Only PDF files are supported. Max 20 files.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center text-destructive text-sm bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Selected Resumes ({files.length})</h4>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {files.map((file, idx) => (
              <li key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                {!isProcessing && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col space-y-3">
            {isProcessing && progress.total > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Processing...</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <Progress value={(progress.current / progress.total) * 100} className="h-2" />
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={handleProcess} 
              disabled={isProcessing || files.length === 0}
            >
              {isProcessing ? 'Screening Resumes...' : 'Screen All Resumes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
