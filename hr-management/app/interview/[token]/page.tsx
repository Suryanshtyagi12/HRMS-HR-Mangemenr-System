"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Mic, MicOff, AlertTriangle, CheckCircle, Clock } from "lucide-react";

type InterviewState = "LOADING" | "INVALID" | "PRE_INTERVIEW" | "ACTIVE_INTERVIEW" | "COMPLETED";

export default function InterviewPage() {
  const { token } = useParams() as { token: string };
  const [state, setState] = useState<InterviewState>("LOADING");
  const [session, setSession] = useState<any>(null);
  
  // Checks
  const [micReady, setMicReady] = useState(false);
  const [browserCompatible, setBrowserCompatible] = useState(false);
  
  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timer, setTimer] = useState(180); // 3 minutes
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  
  // Warnings
  const [tabWarning, setTabWarning] = useState(false);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tabSwitchCount = useRef(0);

  // 1. Initial Fetch
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await api.get(`/recruitment/interview/session/${token}`);
        setSession(res.data);
        if (res.data.status === "COMPLETED") {
          setState("COMPLETED");
        } else {
          setState("PRE_INTERVIEW");
          checkCompatibility();
        }
      } catch (err) {
        setState("INVALID");
      }
    }
    fetchSession();
  }, [token]);

  // Compatibility Checks
  const checkCompatibility = async () => {
    // Browser check
    const isChromeOrEdge = /Chrome/.test(navigator.userAgent) && /Google Inc|Microsoft/.test(navigator.vendor);
    // Safari/Firefox support is limited for speech recognition, but we'll allow standard API if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setBrowserCompatible(!!SpeechRecognition);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicReady(true);
    } catch (e) {
      setMicReady(false);
    }
  };

  // Anti-Cheat & Security
  useEffect(() => {
    if (state !== "ACTIVE_INTERVIEW") return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setTabWarning(true);
        tabSwitchCount.current += 1;
        try {
          await api.post(`/recruitment/interview/session/${token}/log-tab-switch`);
        } catch (e) {}
        
        if (tabSwitchCount.current >= 3) {
          alert("Multiple tab switches detected. This session has been flagged.");
        }
        setTimeout(() => setTabWarning(false), 3000);
      }
    };

    const handleContextMenu = (e: Event) => e.preventDefault();
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure? Your interview will be lost.";
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['t', 'w', 'n', 'r', 'c', 'v'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [state, token]);

  // Timer Management
  useEffect(() => {
    if (state === "ACTIVE_INTERVIEW" && !answerSubmitted) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, answerSubmitted, currentQuestion]);

  const handleTimeUp = () => {
    if (isRecording) stopRecording();
    submitAnswer();
  };

  const readQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startInterview = async () => {
    try {
      const res = await api.post(`/recruitment/interview/session/${token}/start`);
      setCurrentQuestion(res.data);
      setState("ACTIVE_INTERVIEW");
      setTimer(180);
      setTranscript("");
      setAnswerSubmitted(false);
      setFeedbackScore(null);
      readQuestion(res.data.question);
    } catch (e) {
      alert("Failed to start interview");
    }
  };

  // Speech Recognition
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported in this browser.");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAnswer = async () => {
    if (isRecording) stopRecording();
    setAnswerSubmitted(true);
    
    try {
      const res = await api.post(`/recruitment/interview/session/${token}/answer`, {
        question_number: currentQuestion.question_number,
        answer_text: transcript || "No answer provided"
      });

      setFeedbackScore(res.data.evaluation?.score || 0);

      setTimeout(() => {
        if (res.data.is_complete) {
          setState("COMPLETED");
        } else {
          setCurrentQuestion(res.data.next_question);
          setTimer(180);
          setTranscript("");
          setAnswerSubmitted(false);
          setFeedbackScore(null);
          readQuestion(res.data.next_question.question);
        }
      }, 2000);

    } catch (e) {
      alert("Error submitting answer.");
      setAnswerSubmitted(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (state === "LOADING") {
    return <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-50 font-body"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
  }

  if (state === "INVALID") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-slate-950 text-slate-50 font-body">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold font-headline mb-2 tracking-tight">Interview link is invalid or expired</h1>
        <p className="text-slate-400">Please contact HR for a new link.</p>
      </div>
    );
  }

  if (state === "COMPLETED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-slate-950 text-slate-50 font-body">
        <CheckCircle className="w-20 h-20 text-emerald-500 mb-6" />
        <h1 className="text-3xl font-bold font-headline mb-4 tracking-tight">✅ Interview Complete</h1>
        <p className="text-xl text-slate-300 mb-2">Thank you, {session?.candidate_name}!</p>
        <p className="text-slate-400 mb-2">Your responses have been recorded.</p>
        <p className="text-slate-400 mb-8">You will hear back from us shortly.</p>
        <p className="text-sm text-muted-foreground">You may now close this tab.</p>
      </div>
    );
  }

  if (state === "PRE_INTERVIEW") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-body flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
          <h2 className="text-slate-400 uppercase tracking-widest text-[12px] font-bold mb-2">HRMS Pro</h2>
          <h1 className="text-[32px] font-bold font-headline mb-2 tracking-tight">Hello, {session?.candidate_name}</h1>
          <p className="text-lg text-indigo-400 mb-8 font-medium">Interview for: <span className="text-white">{session?.job_title}</span></p>

          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-8">
            <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-white">
              📋 Before you begin:
            </h3>
            <ul className="space-y-3 text-slate-300 text-[15px]">
              <li>• This interview has <span className="font-bold text-white">{session?.total_questions || 5} questions</span></li>
              <li>• You have <span className="font-bold text-white">3 minutes</span> per question</li>
              <li>• Speak clearly into your microphone</li>
              <li>• This session is monitored for tab switching</li>
              <li>• Do not switch tabs or windows</li>
              <li>• Once started, you cannot pause the interview</li>
            </ul>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className={`flex-1 rounded-xl p-4 border ${micReady ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-900/20 border-rose-500/30 text-rose-400'}`}>
              <p className="font-medium text-[14px] flex items-center gap-2">{micReady ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>} {micReady ? 'Microphone: Ready' : 'Microphone: Blocked or not found'}</p>
            </div>
            <div className={`flex-1 rounded-xl p-4 border ${browserCompatible ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-900/20 border-amber-500/30 text-amber-400'}`}>
              <p className="font-medium text-[14px] flex items-center gap-2">{browserCompatible ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>} {browserCompatible ? 'Browser: Compatible' : 'Browser: Speech API limited'}</p>
            </div>
          </div>

          <button 
            onClick={startInterview}
            disabled={!micReady}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-lg shadow-lg shadow-indigo-600/20"
          >
            Begin Interview
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE_INTERVIEW
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-body flex flex-col relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none blur-3xl"></div>

      {tabWarning && (
        <div className="absolute top-0 left-0 w-full bg-rose-600 text-white text-center py-3 font-bold z-50 text-[14px] shadow-lg animate-in slide-in-from-top-full">
          WARNING: Tab switch detected! This action has been logged.
        </div>
      )}

      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md relative z-10">
        <div>
          <p className="text-slate-400 text-[13px] font-bold uppercase tracking-wider mb-2">Question {currentQuestion?.question_number} of {session?.total_questions || 5}</p>
          <div className="flex gap-2">
            {Array.from({ length: session?.total_questions || 5 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-12 h-1.5 rounded-full transition-colors duration-500 ${
                  i + 1 < currentQuestion?.question_number ? 'bg-indigo-500' 
                  : i + 1 === currentQuestion?.question_number ? 'bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                  : 'bg-slate-800'
                }`} 
              />
            ))}
          </div>
        </div>
        
        <div className={`flex items-center gap-2 font-mono text-[24px] font-bold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 transition-colors ${
          timer <= 30 ? 'text-rose-500 border-rose-500/50' : timer <= 60 ? 'text-amber-500 border-amber-500/50' : 'text-emerald-500'
        }`}>
          <Clock className="w-5 h-5" />
          {formatTime(timer)}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center relative z-10">
        
        {/* Question Card */}
        <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-[24px] p-10 shadow-2xl border border-slate-800 mb-12 text-center transform transition-all hover:scale-[1.01]">
          <p className="text-[28px] font-bold font-headline leading-relaxed text-white tracking-tight">
            {currentQuestion?.question}
          </p>
        </div>

        {/* Microphone / Answer Area */}
        <div className="w-full flex flex-col items-center">
          {!answerSubmitted ? (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-xl ${
                  isRecording 
                    ? 'bg-rose-500 hover:bg-rose-600 animate-pulse ring-8 ring-rose-500/30 scale-110' 
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {isRecording ? <Mic className="w-10 h-10 text-white" /> : <MicOff className="w-10 h-10 text-white" />}
              </button>
              
              <p className={`text-[15px] mb-8 font-medium transition-colors ${isRecording ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                {isRecording ? 'Recording... click to stop' : 'Click microphone to start answering'}
              </p>

              <div className="w-full bg-slate-900/50 rounded-2xl p-6 min-h-[160px] mb-8 border border-slate-800 shadow-inner">
                <p className={`font-mono text-[15px] leading-relaxed ${transcript ? 'text-slate-300' : 'text-muted-foreground'}`}>
                  {transcript || (isRecording ? "Listening closely..." : "Your speech will be transcribed here in real-time...")}
                </p>
              </div>

              <button
                onClick={submitAnswer}
                disabled={!transcript && !isRecording}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-[16px] shadow-lg shadow-emerald-600/20"
              >
                Submit Answer
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-md rounded-[24px] p-12 border border-slate-800 w-full animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <p className="text-[24px] font-bold font-headline mb-3 text-white tracking-tight">Answer recorded successfully</p>
              {feedbackScore !== null && (
                <div className="flex items-center gap-3 text-slate-400 mt-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                  <p className="text-[15px] font-medium">Processing and loading next question...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
