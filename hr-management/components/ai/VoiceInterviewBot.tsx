'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Mic, MicOff, PhoneOff, Settings, Volume2, Loader2, Download, MessageSquare } from 'lucide-react';

interface VoiceInterviewBotProps {
  sessionId: string;
  initialQuestion: string;
  onComplete: (summaryData: any) => void;
}

export function VoiceInterviewBot({ sessionId, initialQuestion, onComplete }: VoiceInterviewBotProps) {
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(120);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [history, setHistory] = useState<Array<{role: 'AI'|'Candidate', text: string}>>([
    { role: 'AI', text: initialQuestion }
  ]);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const readQuestionAloud = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    readQuestionAloud(initialQuestion);
  }, [initialQuestion, readQuestionAloud]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, transcript]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let currentTrans = '';
          for (let i = 0; i < event.results.length; ++i) {
            currentTrans += event.results[i][0].transcript;
          }
          setTranscript(currentTrans);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopListening();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Recognition already started');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSubmit = async () => {
    if (isListening) stopListening();
    if (!transcript.trim()) return;

    setIsProcessing(true);
    setEvaluation(null);
    window.speechSynthesis.cancel();

    const currentAnswer = transcript;
    setHistory(prev => [...prev, { role: 'Candidate', text: currentAnswer }]);

    try {
      const res = await fetch('/api/recruitment/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionNumber,
          question: currentQuestion,
          answer: currentAnswer
        })
      });

      const data = await res.json();
      if (data.success) {
        const { evaluation, nextQuestion, isComplete, finalScore, summary } = data.data;
        
        setEvaluation(evaluation);
        setHistory(prev => [...prev, { role: 'AI', text: evaluation.feedback }]);

        if (isComplete) {
          setTimeout(() => {
            onComplete({ finalScore, summary });
          }, 4000);
        } else {
          setHistory(prev => [...prev, { role: 'AI', text: nextQuestion }]);
          setCurrentQuestion(nextQuestion);
          setQuestionNumber(prev => prev + 1);
          setTranscript('');
          setTimeLeft(120);
          
          setTimeout(() => {
            readQuestionAloud(nextQuestion);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Submit error', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-50 font-body min-h-screen flex flex-col overflow-hidden">
      
      {/* Shared TopNavBar styled for dark mode */}
      <header className="flex justify-between items-center h-16 px-6 w-full bg-slate-900 border-b border-slate-800 shadow-sm shrink-0 z-30">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-headline font-bold text-white">Interview Call</h1>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Live Call
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300 font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 relative">
        
        {/* Left Column: Video/Avatar Area (60%) */}
        <div className="w-full xl:w-[60%] flex flex-col gap-6 h-full min-h-[400px] md:min-h-[600px]">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative flex flex-col">
            
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-slate-950/80 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-400">
                  You
                </div>
                <div>
                  <h2 className="font-headline font-semibold text-slate-100">Candidate Session</h2>
                  <p className="text-xs text-slate-400">Question {questionNumber} of 5</p>
                </div>
              </div>
            </div>

            {/* AI Visualizer Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
              <div className="relative w-48 h-48 mb-12">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-full opacity-80 mix-blend-screen animate-pulse shadow-[0_0_40px_15px_rgba(99,102,241,0.5)]"></div>
                <div className="absolute inset-2 bg-gradient-to-bl from-indigo-400 to-indigo-800 rounded-full opacity-90 backdrop-blur-sm blur-[2px]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot className="text-white w-16 h-16 opacity-90" />
                </div>
              </div>
              
              {/* Audio Waveform */}
              <div className="flex items-end gap-1.5 h-16 mt-8">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className={`w-2 rounded-t-full bg-indigo-500 \${isListening ? 'animate-bounce' : 'h-2'}`} style={{ height: isListening ? `\${Math.random() * 40 + 20}px` : '8px', animationDelay: `\${i * 0.1}s` }}></div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-indigo-300 font-medium tracking-wide">WorkForce AI Assistant</p>
                <p className="text-xs text-muted-foreground mt-1">{isListening ? 'Listening to you...' : (isProcessing ? 'Evaluating...' : 'Waiting for you to speak...')}</p>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-center items-center gap-6">
              <button 
                onClick={toggleListening}
                disabled={isProcessing}
                className="flex flex-col items-center gap-2 group disabled:opacity-50"
              >
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-colors \${isListening ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                  {isListening ? <Mic className="text-white w-6 h-6" /> : <MicOff className="text-slate-300 w-6 h-6" />}
                </div>
                <span className="text-xs text-slate-400 font-medium">{isListening ? 'Mute' : 'Unmute'}</span>
              </button>
              
              <button 
                onClick={handleSubmit}
                disabled={!transcript.trim() || isProcessing}
                className="flex flex-col items-center gap-2 group ml-4 disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 flex items-center justify-center transition-all transform hover:scale-105">
                  {isProcessing ? <Loader2 className="text-white w-8 h-8 animate-spin" /> : <MessageSquare className="text-white w-8 h-8" />}
                </div>
                <span className="text-xs text-emerald-400 font-bold tracking-wide">Submit</span>
              </button>
              
              <button 
                onClick={() => onComplete({ finalScore: 0, summary: "Ended early" })}
                className="flex flex-col items-center gap-2 group ml-4"
              >
                <div className="w-14 h-14 rounded-full bg-rose-600/20 border border-rose-500/30 flex items-center justify-center hover:bg-rose-600/40 transition-colors">
                  <PhoneOff className="text-rose-400 w-5 h-5" />
                </div>
                <span className="text-xs text-slate-400 font-medium">End Call</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Transcript & Sentiment (40%) */}
        <div className="w-full xl:w-[40%] flex flex-col gap-6 h-full">
          
          {/* Top Card: Candidate Sentiment */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-6 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-headline font-semibold text-slate-200 flex items-center gap-2">
                Real-time Sentiment
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">CONFIDENT</span>
            </div>
            
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
              <div className="bg-emerald-500 h-full" style={{ width: '80%' }}></div>
              <div className="bg-amber-500 h-full" style={{ width: '15%' }}></div>
              <div className="bg-rose-500 h-full" style={{ width: '5%' }}></div>
            </div>
            
            <div className="flex justify-between mt-3 text-[11px] font-medium text-slate-400">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span>Positive (80%)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span>Neutral (15%)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span>Negative (5%)</span></div>
            </div>
          </div>

          {/* Bottom Card: Live Transcript */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg flex-1 flex flex-col overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-sm font-headline font-semibold text-slate-200 flex items-center gap-2">
                Live Transcript
              </h3>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-900/30 custom-scrollbar">
              {history.map((msg, i) => (
                <div key={i} className={`flex gap-3 max-w-[85%] \${msg.role === 'Candidate' ? 'self-end ml-auto flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg \${msg.role === 'AI' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-700 border border-slate-600'}`}>
                    {msg.role === 'AI' ? <Bot className="text-white w-4 h-4" /> : <div className="text-xs font-bold">You</div>}
                  </div>
                  <div className={`flex flex-col gap-1 \${msg.role === 'Candidate' ? 'items-end' : ''}`}>
                    <span className={`text-[10px] text-muted-foreground font-medium \${msg.role === 'Candidate' ? 'mr-1' : 'ml-1'}`}>{msg.role}</span>
                    <div className={`rounded-2xl p-3.5 shadow-sm \${msg.role === 'AI' ? 'bg-slate-800 border border-slate-700 rounded-tl-sm' : 'bg-indigo-600 border border-indigo-500 rounded-tr-sm'}`}>
                      <p className="text-sm text-slate-200 leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Transcript Block */}
              {transcript && (
                <div className="flex gap-3 max-w-[85%] self-end ml-auto flex-row-reverse opacity-70">
                  <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 shadow-lg">
                    <div className="text-xs font-bold">You</div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] text-muted-foreground font-medium mr-1">You (Speaking...)</span>
                    <div className="bg-indigo-600 border border-indigo-500 rounded-2xl rounded-tr-sm p-3.5 shadow-md">
                      <p className="text-sm text-white leading-relaxed">{transcript}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </main>
      
      {/* Global styles for scrollbar included via inline style since we can't easily inject to global CSS here */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.8); border-radius: 8px; }
      `}} />
    </div>
  );
}
