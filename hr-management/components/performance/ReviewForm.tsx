'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ReviewForm({ reviewId, initialData, onSubmit }: { reviewId: string, initialData: any, onSubmit: (data: any) => void }) {
  // Parse initialData if comments is a JSON string
  const initialComments = initialData?.comments ? (typeof initialData.comments === 'string' && initialData.comments.startsWith('{') ? JSON.parse(initialData.comments) : {}) : {};

  const [ratings, setRatings] = useState({
    technical: initialComments.technicalRating || 0,
    communication: initialComments.communicationRating || 0,
    leadership: initialComments.leadershipRating || 0,
    goalsAchievement: initialComments.goalsAchievement || 0,
  });
  
  const [textAnswers, setTextAnswers] = useState({
    strengths: initialComments.strengths || '',
    areasOfImprovement: initialComments.areasOfImprovement || ''
  });

  const [aiSummary, setAiSummary] = useState<any>(initialData?.ai_narrative ? (typeof initialData.ai_narrative === 'string' && initialData.ai_narrative.startsWith('{') ? JSON.parse(initialData.ai_narrative) : { narrative: initialData.ai_narrative }) : null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const overall = (ratings.technical + ratings.communication + ratings.leadership + ratings.goalsAchievement) / 4;

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setError('');
    try {
      // First save the current drafted ratings so the AI has access to them
      await api.put(`/performance/reviews/${reviewId}`, {
        status: 'COMPLETED',
        overall_rating: overall,
        comments: JSON.stringify({
          technicalRating: ratings.technical,
          communicationRating: ratings.communication,
          leadershipRating: ratings.leadership,
          goalsAchievement: ratings.goalsAchievement,
          strengths: textAnswers.strengths,
          areasOfImprovement: textAnswers.areasOfImprovement
        })
      });

      // The backend auto-generates AI narrative when status becomes COMPLETED
      // So we can just fetch the review again to get the generated AI narrative
      const res = await api.get(`/performance/reviews`);
      const review = res.data?.items?.find((r: any) => r.id === reviewId);
      
      if (review && review.ai_narrative) {
        setAiSummary(typeof review.ai_narrative === 'string' && review.ai_narrative.startsWith('{') ? JSON.parse(review.ai_narrative) : { narrative: review.ai_narrative });
      } else {
        setError('Failed to generate AI summary');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSlider = (key: keyof typeof ratings, val: number) => {
    setRatings(prev => ({ ...prev, [key]: val }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-primary/20">
      <CardHeader>
        <CardTitle>Performance Review Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['technical', 'communication', 'leadership', 'goalsAchievement'] as const).map(key => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <span className="font-bold text-primary">{ratings[key]} / 5</span>
              </div>
              <input 
                type="range" min="0" max="5" step="0.5" 
                value={ratings[key]} 
                onChange={(e) => handleSlider(key, parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
          <span className="font-semibold">Overall Computed Rating:</span>
          <span className="text-2xl font-black text-primary">{overall.toFixed(1)} / 5</span>
        </div>

        {/* Text Areas */}
        <div className="space-y-2">
          <Label>Key Strengths & Achievements</Label>
          <Textarea 
            rows={4} 
            value={textAnswers.strengths} 
            onChange={(e) => setTextAnswers(prev => ({ ...prev, strengths: e.target.value }))}
            placeholder="Highlight major wins..."
          />
        </div>
        <div className="space-y-2">
          <Label>Areas for Improvement</Label>
          <Textarea 
            rows={4} 
            value={textAnswers.areasOfImprovement} 
            onChange={(e) => setTextAnswers(prev => ({ ...prev, areasOfImprovement: e.target.value }))}
            placeholder="Where can they grow?"
          />
        </div>

        {/* AI Action */}
        <div className="border-t pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center"><Sparkles className="w-5 h-5 text-amber-500 mr-2" /> AI Narrative Summary</h3>
            <Button onClick={handleGenerateAI} disabled={isGenerating} variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate AI Summary
            </Button>
          </div>
          
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          {aiSummary && (
            <Card className="bg-amber-50 border-amber-200 shadow-sm">
              <CardContent className="pt-6 space-y-4 text-sm">
                <p className="leading-relaxed">{aiSummary.narrative}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-emerald-700">Strengths Highlighted by AI</h4>
                    <ul className="list-disc pl-5 mt-1">
                      {aiSummary.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-700">Growth Areas Highlighted by AI</h4>
                    <ul className="list-disc pl-5 mt-1">
                      {aiSummary.improvements?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
                
                <div className="bg-card p-3 rounded border font-medium mt-4">
                  Overall Assessment: {aiSummary.overallAssessment}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={() => onSubmit({ ratings, textAnswers, overall })}>
          Submit Review
        </Button>
      </CardFooter>
    </Card>
  );
}
