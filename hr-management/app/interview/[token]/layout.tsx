import React from 'react';

export const metadata = {
  title: 'AI Voice Interview',
  description: 'Automated AI Interview platform',
};

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted flex flex-col font-sans">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter">
            HR
          </div>
          <span className="text-xl font-bold font-headline tracking-tight text-card-foreground">
            HRMS Pro <span className="font-medium text-slate-400">Interview</span>
          </span>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto p-0 md:p-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
