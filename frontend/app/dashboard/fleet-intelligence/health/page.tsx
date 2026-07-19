'use client';

import React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { aiAnalyticsService } from '@/lib/api'
import { 
  ArrowLeft, Brain, BarChart3, AlertCircle, CheckCircle, Activity, Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function FleetHealthPage() {
  const router = useRouter()

  const { data: health, isLoading } = useQuery({
    queryKey: ['ai-fleet-health-detail'],
    queryFn: () => aiAnalyticsService.getFleetHealth()
  })

  // Metric labels maps
  const metrics = [
    { name: "Vehicle Availability", value: health?.vehicle_availability ?? 95, color: "bg-blue-500" },
    { name: "Fuel Efficiency Target", value: health?.fuel_efficiency ?? 88, color: "bg-emerald-500" },
    { name: "Maintenance Quality", value: health?.maintenance_health ?? 90, color: "bg-indigo-500" },
    { name: "Trip Completion Rate", value: health?.trip_success_rate ?? 97, color: "bg-purple-500" },
    { name: "Safety Operator Index", value: health?.driver_performance ?? 86, color: "bg-amber-500" }
  ]

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
            <Activity className="h-6 w-6 text-primary" />
            Fleet Health Index
          </h2>
          <p className="text-sm text-muted-foreground">
            Aggregate operations diagnostic assessment score based on dispatch and cost reports.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Score Circular Gauge / Display */}
        <Card className="border bg-card shadow-sm lg:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold text-center">Score Card Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            
            {/* Custom SVG Circular Gauge */}
            {isLoading ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : (
              <div className="relative flex items-center justify-center h-44 w-44">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-muted fill-none" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-primary fill-none transition-all duration-1000 ease-out" 
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (health?.overall_score ?? 90)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-foreground">{health?.overall_score ?? 90}%</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-500 mt-0.5">Fleet Optimal</span>
                </div>
              </div>
            )}
            
            <p className="text-xs text-center text-muted-foreground leading-relaxed pt-2">
              An index score above 85% represents minimal operational risk and efficient dispatch schedules.
            </p>
          </CardContent>
        </Card>

        {/* Metrics breakdowns */}
        <Card className="border bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Metrics Index Breakdown</CardTitle>
            <CardDescription className="text-xs">Individual component efficiency ratios analyzed in the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              metrics.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="text-foreground">{Math.round(item.value)}%</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* Auto Recommendations Section */}
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Health Recommendations
          </CardTitle>
          <CardDescription className="text-xs">Dynamic operational guidelines targeting sub-scores below 90%.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-3.5">
              {(health?.recommendations ?? []).map((rec: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-white/5">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-muted-foreground">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
