'use client';
import { useAuthStore } from '@/store/authStore';
import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  "How many leaves do I have?",
  "When is my next appraisal?",
  "Am I eligible for earned leave?"
];

export function HRChatbot() {
  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          userId: user?.id
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply, timestamp: new Date() }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now.", timestamp: new Date() }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "An error occurred.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Expanded Panel */}
      {isOpen && (
        <div className="fixed inset-0 md:static md:inset-auto w-full h-full md:w-[380px] md:h-[500px] bg-card md:rounded-2xl shadow-2xl md:border border-border flex flex-col overflow-hidden md:mb-4 transition-all duration-300 animate-in zoom-in-95 z-[100] md:z-auto">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Bot className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-headline font-bold text-sm leading-tight">HR AI Assistant</h3>
                <p className="text-indigo-100 text-xs font-label flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50" style={{ scrollbarWidth: 'thin' }}>
            <div className="text-center text-xs font-label text-slate-400 my-2">Today</div>
            
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in">
                <Bot className="w-12 h-12 text-slate-300" />
                <div>
                  <h4 className="font-bold text-card-foreground">Hi {user?.name?.split(' ')[0] || 'there'}!</h4>
                  <p className="text-xs text-muted-foreground mt-1">Ask me about policies, leaves, or IT requests.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => sendMessage(s)}
                      className="bg-card border border-border hover:border-indigo-300 text-xs text-muted-foreground px-3 py-1.5 rounded-full transition-colors text-left shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 max-w-[85%] \${m.role === 'user' ? 'self-end' : 'self-start'}`}>
                    {m.role !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-auto">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`p-3 text-sm font-body shadow-sm \${m.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' : 'bg-muted text-card-foreground rounded-2xl rounded-bl-sm border border-slate-200/50'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-2 max-w-[85%] self-start mt-2 animate-in fade-in">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-auto">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted text-card-foreground py-3 px-4 rounded-2xl rounded-bl-sm shadow-sm border border-slate-200/50 flex items-center gap-1 h-10">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-border shrink-0">
            <div className="flex items-end gap-2 relative">
              <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 mb-1">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <textarea 
                  className="w-full bg-muted border border-border rounded-xl py-2.5 pl-4 pr-3 text-sm focus:bg-card focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none max-h-24" 
                  placeholder="Type your message..." 
                  rows={1}
                  style={{ minHeight: '44px' }}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                ></textarea>
              </div>
              <button 
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-md shrink-0 disabled:opacity-50"
              >
                <Send className="w-5 h-5 translate-x-[1px] translate-y-[1px]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 group z-[101]",
          isOpen ? "hidden md:flex" : "flex"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />}
      </button>
    </div>
  );
}
