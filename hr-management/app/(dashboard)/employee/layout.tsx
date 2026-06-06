import { HRChatbot } from '@/components/ai/HRChatbot';
import React from 'react';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HRChatbot />
    </>
  );
}
