'use client';
import React from 'react';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex w-full mt-4 space-x-3 max-w-sm ml-0 mr-auto">
      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      
      <div className="bg-muted text-foreground p-3 rounded-2xl rounded-tl-sm flex items-center space-x-1.5 h-10">
        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
      </div>
    </div>
  );
}
