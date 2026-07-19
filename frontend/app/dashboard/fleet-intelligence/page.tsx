'use client';

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { aiAnalyticsService } from '@/lib/api'
import { 
  Brain, Wrench, ShieldAlert, Truck, Sparkles, Fuel, Users, AlertCircle, TrendingUp, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function FleetIntelligencePage() {
  const router = useRouter()

  // Query health and cost forecasts
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ['ai-fleet-health'],
    queryFn: () => aiAnalyticsService.getFleetHealth()
  })

  const { data: forecast, isLoading: isForecastLoading } = useQuery({
    queryKey: ['ai-cost-forecast'],
    queryFn: () => aiAnalyticsService.getCostForecast()
  })

  const { data: recommendations, isLoading: isRecommendationsLoading } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => aiAnalyticsService.getRecommendations()
  })

  const cards = [
    {
      title: "Predictive Maintenance",
      description: "Detect vehicle failures and repair needs using odometer history, daily consumption, and maintenance frequencies.",
      icon: Wrench,
      route: "/dashboard/fleet-intelligence/maintenance",
      color: "from-blue-500/10 to-indigo-500/10 hover:border-blue-500/50",
      badge: "ML Classifier"
    },
    {
      title: "Driver Intelligence",
      description: "Evaluate driver safety profiles, ranking scores, trip completion rates, and average fuel economy standards.",
      icon: Users,
      route: "/dashboard/fleet-intelligence/drivers",
      color: "from-purple-500/10 to-pink-500/10 hover:border-purple-500/50",
      badge: "Efficiency Rank"
    },
    {
      title: "Fuel Consumption Predictor",
      description: "Model future trip fuel consumption and load efficiency rates based on mileage coefficients.",
      icon: Fuel,
      route: "/dashboard/fleet-intelligence/fuel",
      color: "from-emerald-500/10 to-teal-500/10 hover:border-emerald-500/50",
      badge: "Linear Regression"
    },
    {
      title: "Intelligent Recommendations",
      description: "Review automated actions to swap expensive parts, train drivers, optimize schedules, and reduce operation costs.",
      icon: Sparkles,
      route: "/dashboard/fleet-intelligence/recommendations",
      color: "from-amber-500/10 to-orange-500/10 hover:border-amber-500/50",
      badge: "AI Recommendations"
    }
  ]

  return (
    <div className="space-y-6">
      
      {/* Header and Brand */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary animate-pulse" />
            AI Fleet Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            Predict maintenance issues, forecast operating budgets, and audit driver efficiency with machine learning.
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/fleet-intelligence/health')}
          className="bg-primary hover:bg-primary/95 text-white active:scale-95 transition-all gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Detailed Health Analytics
        </Button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fleet Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            {isHealthLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black tracking-tight text-foreground">{health?.overall_score ?? 90}%</span>
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Optimal
                </span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">Aggregated from active vehicle and safety metrics.</p>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Predicted Monthly Expense</CardTitle>
          </CardHeader>
          <CardContent>
            {isForecastLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black tracking-tight text-foreground">
                  ${(Number(forecast?.monthly_fuel_forecast || 0) + Number(forecast?.monthly_maintenance_forecast || 0)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </span>
                <TrendingUp className="h-4 w-4 text-rose-500" />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">Forecasted fuel and service costs combined.</p>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Actionable Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {isRecommendationsLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black tracking-tight text-amber-500">
                  {recommendations?.length ?? 3} Active
                </span>
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">Actions available to reduce operation risks.</p>
          </CardContent>
        </Card>

      </div>

      {/* Intelligence models grid links */}
      <h3 className="text-lg font-bold pt-4">Intelligent AI Modules</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => router.push(item.route)}
              className="cursor-pointer"
            >
              <Card className={`border h-full bg-gradient-to-br ${item.color} shadow-sm transition-all duration-300`}>
                <CardHeader className="flex flex-row justify-between items-start pb-2">
                  <div className="p-2 rounded-xl bg-card border shadow-sm text-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardTitle className="text-base font-bold text-foreground">{item.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

    </div>
  )
}
