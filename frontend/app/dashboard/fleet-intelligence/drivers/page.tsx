'use client';

import React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { aiAnalyticsService } from '@/lib/api'
import { 
  ArrowLeft, Users, Trophy, AlertTriangle, ShieldAlert, Award, Star, TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function DriverIntelligencePage() {
  const router = useRouter()

  const { data: scores = [], isLoading } = useQuery<any[]>({
    queryKey: ['ai-driver-scores'],
    queryFn: () => aiAnalyticsService.getDriverScores()
  })

  // Calculations
  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((sum, item) => sum + (item.overall_score ?? 0), 0) / scores.length)
    : 85

  const topDriver = scores.length > 0 ? scores[0] : null
  const needTraining = scores.filter(s => s.overall_score < 75).length

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
            <Users className="h-6 w-6 text-primary" />
            Driver Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor safety logs, completed dispatch records, and fuel efficiency scorecards.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top Rated Operator</p>
              <h3 className="text-lg font-black text-foreground">
                {isLoading ? <Skeleton className="h-6 w-24" /> : topDriver ? topDriver.driver_name : 'No drivers'}
              </h3>
              {topDriver && (
                <p className="text-[10px] text-emerald-500 font-bold">Overall Score: {topDriver.overall_score}/100</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average Safety Index</p>
              <h3 className="text-2xl font-black text-foreground">
                {isLoading ? <Skeleton className="h-6 w-12" /> : `${averageScore}%`}
              </h3>
              <p className="text-[10px] text-muted-foreground">Fleet-wide average behavior.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Coaching Candidates</p>
              <h3 className="text-2xl font-black text-rose-500">
                {isLoading ? <Skeleton className="h-6 w-12" /> : `${needTraining} Drivers`}
              </h3>
              <p className="text-[10px] text-muted-foreground">Scoring below safety benchmark (75%).</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Roster list */}
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Safety & Performance Rankings</CardTitle>
          <CardDescription className="text-xs">Based on trip completions, mileage efficiency, and safety penalty logs.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : scores.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No active drivers registered.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 text-foreground font-bold border-b">
                    <th className="p-4 uppercase tracking-wider text-center">Rank</th>
                    <th className="p-4 uppercase tracking-wider">Driver Profile</th>
                    <th className="p-4 uppercase tracking-wider text-center">Trip Completion</th>
                    <th className="p-4 uppercase tracking-wider text-center">Fuel Efficiency</th>
                    <th className="p-4 uppercase tracking-wider text-center">Driving Score</th>
                    <th className="p-4 uppercase tracking-wider text-center">Overall Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {scores.map((driver, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 text-center font-bold text-foreground">#{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-foreground">{driver.driver_name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">ID: {driver.employee_id}</div>
                      </td>
                      <td className="p-4 text-center font-semibold text-foreground">
                        {driver.trip_completion_rate}%
                      </td>
                      <td className="p-4 text-center text-foreground font-mono">
                        {driver.average_fuel_efficiency} KM/L
                      </td>
                      <td className="p-4 text-center font-semibold text-foreground">
                        {driver.driving_efficiency}%
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          driver.overall_score >= 85 ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' :
                          driver.overall_score >= 75 ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' :
                          'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                        }`}>
                          {driver.overall_score} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
