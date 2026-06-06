'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Briefcase, ArrowLeft } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const appId = searchParams.get('appId');
  const jobTitle = searchParams.get('job');

  return (
    <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border p-8 text-center space-y-6">
      
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      
      <h1 className="text-3xl font-extrabold text-card-foreground tracking-tight">
        Application Submitted!
      </h1>
      
      <p className="text-muted-foreground text-lg">
        Thank you for applying for the <span className="font-semibold text-card-foreground">{jobTitle || 'role'}</span>. We have received your application and resume.
      </p>

      {appId && (
        <div className="bg-muted border rounded-xl p-4 text-sm mt-6">
          <p className="text-muted-foreground mb-1">Your Application ID</p>
          <p className="font-mono font-medium text-card-foreground tracking-wider">{appId}</p>
        </div>
      )}

      <div className="pt-8">
        <Link href="/careers" className="block">
          <Button variant="outline" className="w-full py-6 text-lg group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Return to Careers
          </Button>
        </Link>
      </div>

    </div>
  );
}

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Suspense fallback={<div className="p-8 text-muted-foreground text-center w-full">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
