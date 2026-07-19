'use client';

import React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { aiAnalyticsService } from '@/lib/api'
import { 
  ArrowLeft, Brain, Sparkles, AlertCircle, ShieldAlert, CheckCircle2, Award, Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function AIRecommendationsPage() {
  const router = useRouter()

  const { data: recommendations = [], isLoading } = useQuery<any[]>({
    queryKey: ['ai-recommendations-list'],
    queryFn: () => aiAnalyticsService.getRecommendations()
  })

  // Category visual attributes mapper
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'MAINTENANCE':
        return { bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Zap }
      case 'COST':
        return { bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: ShieldAlert }
      case 'TRAINING':
        return { bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Award }
      default:
        return { bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertCircle }
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/dashboard/fleet-intelligence')}
          className="bg-card hover:bg-muted active:scale-95 transition-all h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            AI Operations Recommendations
          </h2>
          <p className="text-sm text-muted-foreground">
            Intelligent recommendations to optimize fleet budgets and manage drivers safety.
          </p>
        </div>
      </div>

      {/* Main checklist */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="p-16 text-center text-xs text-muted-foreground border rounded-xl bg-card">
          No actionable recommendations at this time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec, idx) => {
            const styles = getCategoryStyles(rec.category)
            const Icon = styles.icon
            return (
              <Card key={idx} className="border bg-card shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                {/* Visual side-border */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  rec.category === 'MAINTENANCE' ? 'bg-blue-500' :
                  rec.category === 'COST' ? 'bg-rose-500' :
                  rec.category === 'TRAINING' ? 'bg-purple-500' :
                  'bg-amber-500'
                }`} />
                
                <CardHeader className="pl-6 pb-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${styles.bg}`}>
                      {rec.category}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground mt-2">{rec.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="pl-6 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rec.detail}
                  </p>
                  <div className="flex justify-between items-center text-xs bg-muted/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-muted-foreground font-semibold">Predicted Impact:</span>
                    <span className="font-bold text-emerald-500">{rec.impact}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

    </div>
  )
}
