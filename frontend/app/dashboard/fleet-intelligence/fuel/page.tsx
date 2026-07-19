'use client';

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { aiAnalyticsService } from '@/lib/api'
import { 
  ArrowLeft, Fuel, Sparkles, TrendingUp, ShieldAlert, Scale, MapPin
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

export default function FuelPredictionPage() {
  const router = useRouter()
  const [distance, setDistance] = useState<number>(300)
  const [load, setLoad] = useState<number>(10)

  // Fetch fuel predictions query
  const { data: predictions = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['ai-fuel-prediction', distance, load],
    queryFn: () => aiAnalyticsService.getFuelPredictions({ distance, load_tons: load }),
    enabled: true
  })

  const handleRunSimulation = () => {
    refetch()
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
            <Fuel className="h-6 w-6 text-primary" />
            Fuel Consumption Predictor
          </h2>
          <p className="text-sm text-muted-foreground">
            Linear Regression models forecasting fuel costs and efficiency margins based on cargo weights.
          </p>
        </div>
      </div>

      {/* Simulator Inputs Drawer */}
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            Simulation Parameters
          </CardTitle>
          <CardDescription className="text-xs">Adjust distance and load parameters to run predictions across the fleet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Distance Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Trip Distance (KM)
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="50" 
                  max="1500" 
                  value={distance} 
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="flex-1 accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <Input 
                  type="number" 
                  value={distance} 
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-24 text-xs font-bold font-mono"
                />
              </div>
            </div>

            {/* Load Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Scale className="h-3.5 w-3.5" />
                Cargo Weight Load (Tons)
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={load} 
                  onChange={(e) => setLoad(Number(e.target.value))}
                  className="flex-1 accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <Input 
                  type="number" 
                  value={load} 
                  onChange={(e) => setLoad(Number(e.target.value))}
                  className="w-24 text-xs font-bold font-mono"
                />
              </div>
            </div>

          </div>

          <Button onClick={handleRunSimulation} className="w-full mt-2 font-bold active:scale-98 transition-all">
            Recalculate Forecast
          </Button>

        </CardContent>
      </Card>

      {/* Roster Predictions List */}
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Simulated Fleet Consumption</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : predictions.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No active fleet vehicles detected.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 text-foreground font-bold border-b">
                    <th className="p-4 uppercase tracking-wider">Plate Number</th>
                    <th className="p-4 uppercase tracking-wider">Model Name</th>
                    <th className="p-4 uppercase tracking-wider text-center">Avg Mileage</th>
                    <th className="p-4 uppercase tracking-wider text-center">Expected Consumption</th>
                    <th className="p-4 uppercase tracking-wider text-center">Expected Cost</th>
                    <th className="p-4 uppercase tracking-wider text-center">Efficiency Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {predictions.map((vehicle, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-foreground">{vehicle.vehicle_number}</td>
                      <td className="p-4 text-foreground font-semibold">{vehicle.brand} {vehicle.model}</td>
                      <td className="p-4 text-center font-bold text-foreground">{vehicle.mileage ?? 10.0} KM/L</td>
                      <td className="p-4 text-center text-foreground font-bold font-mono">
                        {vehicle.expected_fuel_consumption} Liters
                      </td>
                      <td className="p-4 text-center font-bold text-rose-500 font-mono">
                        ${Number(vehicle.expected_cost).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          vehicle.efficiency_score >= 80 ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' :
                          vehicle.efficiency_score >= 60 ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' :
                          'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                        }`}>
                          {vehicle.efficiency_score} %
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
