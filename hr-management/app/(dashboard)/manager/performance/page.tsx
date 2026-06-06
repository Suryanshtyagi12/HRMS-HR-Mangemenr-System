'use client';
import { useAuthStore } from '@/store/authStore';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReviewForm } from '@/components/performance/ReviewForm';
import { GoalCard } from '@/components/performance/GoalCard';
import { AlertCircle, Target, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ManagerPerformancePage() {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  useEffect(() => {
    // For demo, we fetch all reviews (or we'd filter by reviewerId=session.user.id)
    api.get('/performance/reviews')
      .then(res => {
        setReviews(res.data?.items || res.data || []);
      })
      .catch(console.error);
  }, []);

  const pendingCount = reviews.filter(r => r.status === 'PENDING').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Performance Hub</h1>
        <p className="text-muted-foreground mt-1">Review your direct reports and monitor their OKRs.</p>
      </div>

      {pendingCount > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-bold">Action Required</AlertTitle>
          <AlertDescription className="text-amber-700">
            You have {pendingCount} performance reviews pending your input for the current cycle.
          </AlertDescription>
        </Alert>
      )}

      {activeReviewId ? (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setActiveReviewId(null)}>← Back to Team List</Button>
          <ReviewForm 
            reviewId={activeReviewId}
            initialData={reviews.find(r => r.id === activeReviewId)}
            onSubmit={(data) => {
              alert('Review submitted successfully!');
              setActiveReviewId(null);
            }} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><FileText className="w-5 h-5 mr-2" /> Team Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Employee Name</th>
                      <th className="pb-3 font-medium">Cycle</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Overall Rating</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No reviews found.</td></tr>
                    ) : (
                      reviews.map(r => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-4 font-medium">{r.employee?.first_name || r.employee?.firstName} {r.employee?.last_name || r.employee?.lastName}</td>
                          <td className="py-4">{r.cycle?.name || r.reviewCycle?.name}</td>
                          <td className="py-4">
                            <Badge variant={r.status === 'COMPLETED' ? 'default' : 'secondary'}>{r.status}</Badge>
                          </td>
                          <td className="py-4">
                            {r.overall_rating > 0 || r.overallRating > 0 ? <span className="font-bold text-primary">{r.overall_rating || r.overallRating} / 5</span> : <span className="text-muted-foreground">Not Rated</span>}
                          </td>
                          <td className="py-4 text-right">
                            <Button size="sm" onClick={() => setActiveReviewId(r.id)}>
                              {r.status === 'PENDING' ? 'Write Review' : 'View Details'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
