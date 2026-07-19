'use client';

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { aiAnalyticsService } from '@/lib/api'
import { 
  ArrowLeft, Brain, Wrench, ShieldAlert, AlertCircle, Calendar, Gauge, Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function PredictiveMaintenancePage() {
  const router = useRouter()

  const { data: predictions = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['ai-predictive-maintenance'],
    queryFn: () => aiAnalyticsService.getMaintenancePredictions()
  })

  // Count risk levels
  const highRiskCount = predictions.filter(p => p.risk_level === 'HIGH').length
  const mediumRiskCount = predictions.filter(p => p.risk_level === 'MEDIUM').length
  const lowRiskCount = predictions.filter(p => p.risk_level === 'LOW').length

  return (
    <div className="space-y-6">
      
      {/* Header and Back navigation */}
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
            <Wrench className="h-6 w-6 text-primary" />
            Predictive Maintenance
          </h2>
          <p className="text-sm text-muted-foreground">
            Machine learning forecast of vehicle failure risks and scheduled service calendar.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="border border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500 text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Critical High Risk</p>
              <h3 className="text-2xl font-black text-rose-500">{isLoading ? <Skeleton className="h-6 w-10" /> : highRiskCount} Vehicles</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500 text-white">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Medium Risk Alert</p>
              <h3 className="text-2xl font-black text-amber-500">{isLoading ? <Skeleton className="h-6 w-10" /> : mediumRiskCount} Vehicles</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Optimal Low Risk</p>
              <h3 className="text-2xl font-black text-emerald-500">{isLoading ? <Skeleton className="h-6 w-10" /> : lowRiskCount} Vehicles</h3>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main List */}
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Predictive Risk Index</CardTitle>
          <CardDescription className="text-xs">Based on odometer intervals, vehicle age, and historical breakdown logs.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : predictions.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No vehicles available for predictive analytics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 text-foreground font-bold border-b">
                    <th className="p-4 uppercase tracking-wider">Vehicle ID</th>
                    <th className="p-4 uppercase tracking-wider">Model Profile</th>
                    <th className="p-4 uppercase tracking-wider text-center">Maintenance Probability</th>
                    <th className="p-4 uppercase tracking-wider text-center">Risk Level</th>
                    <th className="p-4 uppercase tracking-wider">Suggested Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {predictions.map((vehicle, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-foreground">{vehicle.vehicle_number}</td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{vehicle.brand} {vehicle.model}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Vehicle age: {vehicle.vehicle_age_months ?? 12} Months</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold text-foreground">{Math.round((vehicle.maintenance_probability ?? 0) * 100)}%</span>
                          <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                vehicle.risk_level === 'HIGH' ? 'bg-rose-500' :
                                vehicle.risk_level === 'MEDIUM' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.round((vehicle.maintenance_probability ?? 0) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          vehicle.risk_level === 'HIGH' ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20' :
                          vehicle.risk_level === 'MEDIUM' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' :
                          'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {vehicle.risk_level}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-foreground flex items-center gap-1.5 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {vehicle.suggested_service_date}
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
