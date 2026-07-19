'use client';

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Users, MapPin, Flame, Wrench, HeartPulse, RefreshCw, AlertTriangle, 
  CheckCircle, Info, Calendar, DollarSign, Milestone, ShieldAlert, Award, 
  ArrowRight, ShieldCheck, TrendingUp, BarChart4, ClipboardList
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { 
  analyticsService, vehicleService, driverService
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'

export default function AnalyticsDashboardPage() {
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)

  // Filters State
  const [range, setRange] = useState('this_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('all')
  const [selectedDriver, setSelectedDriver] = useState('all')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch Dropdown helpers
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-dropdown-dashboard'],
    queryFn: () => vehicleService.getAll({ page_size: 100 })
  })

  const { data: driversData } = useQuery({
    queryKey: ['drivers-dropdown-dashboard'],
    queryFn: () => driverService.getAll({ page_size: 100 })
  })

  const vehicles = vehiclesData?.results || []
  const drivers = driversData?.results || []

  // Construct query params
  const getQueryParams = () => {
    const params: Record<string, string | number | boolean> = { range }
    if (range === 'custom') {
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
    }
    if (selectedVehicle !== 'all') params.vehicle = selectedVehicle
    if (selectedDriver !== 'all') params.driver = selectedDriver
    return params
  }

  // Dashboard Stats Query
  const { 
    data: stats, 
    isLoading: isStatsLoading, 
    refetch: refetchStats,
    isRefetching: isStatsRefetching
  } = useQuery({
    queryKey: ['dashboard-stats', range, startDate, endDate, selectedVehicle, selectedDriver],
    queryFn: () => analyticsService.getStats(getQueryParams())
  })

  // Dashboard KPIs Query
  const { 
    data: kpi, 
    isLoading: isKpisLoading, 
    refetch: refetchKPIs,
    isRefetching: isKpisRefetching
  } = useQuery({
    queryKey: ['dashboard-kpi'],
    queryFn: () => analyticsService.getKPIs()
  })

  // Dashboard Charts Query
  const { 
    data: charts, 
    isLoading: isChartsLoading, 
    refetch: refetchCharts,
    isRefetching: isChartsRefetching
  } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => analyticsService.getCharts()
  })

  // Dashboard Recent Activities Query
  const { 
    data: activities = [], 
    isLoading: isActivitiesLoading, 
    refetch: refetchActivities,
    isRefetching: isActivitiesRefetching
  } = useQuery<any[]>({
    queryKey: ['dashboard-recent-activities'],
    queryFn: () => analyticsService.getRecentActivities()
  })

  const isLoading = isStatsLoading || isKpisLoading || isChartsLoading || isActivitiesLoading
  const isRefetching = isStatsRefetching || isKpisRefetching || isChartsRefetching || isActivitiesRefetching

  const handleRefresh = () => {
    refetchStats()
    refetchKPIs()
    refetchCharts()
    refetchActivities()
    toast({
      type: 'success',
      title: 'Metrics Synchronized',
      description: 'BI database aggregates updated in real-time.'
    })
  }

  // Chart Colors Config
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#8b5cf6']

  return (
    <div className="space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Intelligence Control Panel</h2>
          <p className="text-sm text-muted-foreground">Company logistics analytics, expenses breakdown, asset utilization, and exception warnings.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="self-start gap-2 hover:border-primary active:scale-95 bg-card"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Force Sync
        </Button>
      </div>

      {/* FILTER CONTROL CARD */}
      <Card className="border bg-card shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Timeframe Range</label>
            <Select
              value={range}
              onChange={(e) => {
                setRange(e.target.value)
                if (e.target.value !== 'custom') {
                  setStartDate('')
                  setEndDate('')
                }
              }}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'this_week', label: 'This Week' },
                { value: 'this_month', label: 'This Month' },
                { value: 'this_year', label: 'This Year' },
                { value: 'custom', label: 'Custom Range' }
              ]}
            />
          </div>

          {range === 'custom' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Filter Vehicle</label>
            <Select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              options={[
                { value: 'all', label: 'All Vehicles' },
                ...vehicles.map((v: any) => ({ value: String(v.id), label: v.vehicle_number }))
              ]}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Filter Driver</label>
            <Select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              options={[
                { value: 'all', label: 'All Drivers' },
                ...drivers.map((d: any) => ({ value: String(d.id), label: d.name }))
              ]}
            />
          </div>

        </div>
      </Card>

      {/* RENDER COUNTER CARDS LOADING SKELETON */}
      {isLoading || !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="border shadow-sm p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      ) : (
        /* 18 DASHBOARD CARDS IN MULTI-COLUMNS */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Vehicles summary group */}
          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Vehicles</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1">{stats.total_vehicles}</h3>
            <span className="text-[9px] text-muted-foreground">Assets registered</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Vehicles</span>
            <h3 className="text-xl font-extrabold text-emerald-500 mt-1">{stats.active_vehicles}</h3>
            <span className="text-[9px] text-muted-foreground">Ready / in operation</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Maintenance</span>
            <h3 className="text-xl font-extrabold text-rose-500 mt-1">{stats.vehicles_under_maintenance}</h3>
            <span className="text-[9px] text-muted-foreground">Currently in shop</span>
          </Card>

          {/* Drivers group */}
          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Drivers</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1">{stats.total_drivers}</h3>
            <span className="text-[9px] text-muted-foreground">Assigned operators</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Available Drivers</span>
            <h3 className="text-xl font-extrabold text-blue-500 mt-1">{stats.available_drivers}</h3>
            <span className="text-[9px] text-muted-foreground">Active operator status</span>
          </Card>

          {/* Health index */}
          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none bg-gradient-to-br from-emerald-500/5 to-transparent">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
              <HeartPulse className="h-3.5 w-3.5" />
              Health Score
            </span>
            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.fleet_health_score}%</h3>
            <span className="text-[9px] text-muted-foreground">Non-maintenance ratio</span>
          </Card>

          {/* Trips counts */}
          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Trips Today</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1">{stats.trips_today}</h3>
            <span className="text-[9px] text-muted-foreground">Scheduled starts today</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Running Trips</span>
            <h3 className="text-xl font-extrabold text-emerald-500 mt-1">{stats.running_trips}</h3>
            <span className="text-[9px] text-muted-foreground">Active in-transit dispatches</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Completed Trips</span>
            <h3 className="text-xl font-extrabold text-slate-500 mt-1">{stats.completed_trips}</h3>
            <span className="text-[9px] text-muted-foreground">In selected timeframe</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Cancelled Trips</span>
            <h3 className="text-xl font-extrabold text-rose-500 mt-1">{stats.cancelled_trips}</h3>
            <span className="text-[9px] text-muted-foreground">Aborted operations count</span>
          </Card>

          {/* Utilization rates */}
          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Vehicle Utilization</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1">{stats.vehicle_utilization}%</h3>
            <span className="text-[9px] text-muted-foreground">Vehicles in use</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Driver Utilization</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1">{stats.driver_utilization}%</h3>
            <span className="text-[9px] text-muted-foreground">Operators active</span>
          </Card>

          {/* Expenses */}
          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-amber-500 uppercase">Monthly Fuel Cost</span>
            <h3 className="text-xl font-extrabold text-amber-500 mt-1">${stats.monthly_fuel_cost.toLocaleString()}</h3>
            <span className="text-[9px] text-muted-foreground">Summed total cost</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-rose-500 uppercase">Maintenance Cost</span>
            <h3 className="text-xl font-extrabold text-rose-500 mt-1">${stats.maintenance_cost.toLocaleString()}</h3>
            <span className="text-[9px] text-muted-foreground">Actual repair spendings</span>
          </Card>

          {/* Mileage */}
          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Average Mileage</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1">{stats.average_mileage} KM/L</h3>
            <span className="text-[9px] text-muted-foreground">Refuel records efficiency</span>
          </Card>

          {/* Warnings & exps */}
          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-indigo-500 uppercase">Upcoming Services</span>
            <h3 className="text-xl font-extrabold text-indigo-500 mt-1">{stats.upcoming_services}</h3>
            <span className="text-[9px] text-muted-foreground">Scheduled tickets due</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Insurance Expiry
            </span>
            <h3 className="text-xl font-extrabold text-rose-500 mt-1">{stats.insurance_expiry}</h3>
            <span className="text-[9px] text-muted-foreground">Expiring within 30 days</span>
          </Card>

          <Card className="border bg-card/65 shadow-sm p-4 hover:border-primary/50 transition-all select-none">
            <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              License Expiry
            </span>
            <h3 className="text-xl font-extrabold text-rose-500 mt-1">{stats.license_expiry}</h3>
            <span className="text-[9px] text-muted-foreground">Operators expiring 30 days</span>
          </Card>

        </div>
      )}

      {/* KPI METRIC WIDGETS */}
      {kpi && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3.5 border rounded-xl bg-card flex flex-col justify-between select-none">
            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
              <Milestone className="h-3.5 w-3.5 text-blue-500" />
              Avg Trip Distance
            </span>
            <p className="text-lg font-black text-foreground mt-2">{kpi.average_trip_distance} KM</p>
          </div>

          <div className="p-3.5 border rounded-xl bg-card flex flex-col justify-between select-none">
            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              Avg Fuel Refill
            </span>
            <p className="text-lg font-black text-foreground mt-2">{kpi.average_fuel_consumption} Liters</p>
          </div>

          <div className="p-3.5 border rounded-xl bg-card flex flex-col justify-between select-none">
            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
              <Wrench className="h-3.5 w-3.5 text-rose-500" />
              Avg Repair Cost
            </span>
            <p className="text-lg font-black text-rose-500 mt-2">${kpi.average_repair_cost.toLocaleString()}</p>
          </div>

          <div className="p-3.5 border rounded-xl bg-card flex flex-col justify-between select-none">
            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              Cost Per KM
            </span>
            <p className="text-lg font-black text-foreground mt-2">${kpi.cost_per_kilometer}/KM</p>
          </div>

          <div className="p-3.5 border rounded-xl bg-card flex flex-col justify-between select-none">
            <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-indigo-500" />
              Operator Rating
            </span>
            <p className="text-lg font-black text-foreground mt-2">{kpi.average_driver_rating} / 5</p>
          </div>
        </div>
      )}

      {/* DYNAMIC CHARTS PORTAL (RECHARTS RENDERING) */}
      {isMounted && charts && (
        <div className="space-y-6">
          
          {/* Charts Row 1: Trips & Fuel Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <Card className="border bg-card shadow-sm p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Monthly Trips & expenses
                </CardTitle>
                <CardDescription className="text-[10px]">Monthly total trips completed this year</CardDescription>
              </CardHeader>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.monthly_trends}>
                    <defs>
                      <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="trips" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTrips)" name="Completed Trips" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border bg-card shadow-sm p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1">
                  <Flame className="h-4 w-4 text-amber-500" />
                  Fuel Consumption
                </CardTitle>
                <CardDescription className="text-[10px]">Liters of fuel consumed by month</CardDescription>
              </CardHeader>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthly_trends}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Bar dataKey="fuel_quantity" fill="#f59e0b" name="Quantity (L)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border bg-card shadow-sm p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Fuel Cost & Maintenance Trends
                </CardTitle>
                <CardDescription className="text-[10px]">Monthly operational spendings</CardDescription>
              </CardHeader>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.monthly_trends}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Line type="monotone" dataKey="fuel_cost" stroke="#10b981" name="Fuel ($)" strokeWidth={2} />
                    <Line type="monotone" dataKey="maintenance_cost" stroke="#ef4444" name="Maintenance ($)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>

          {/* Charts Row 2: Status distributions & driver rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <Card className="border bg-card shadow-sm p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold">Vehicle Status Distribution</CardTitle>
                <CardDescription className="text-[10px]">Fleet status groups</CardDescription>
              </CardHeader>
              <div className="h-56 flex items-center justify-center">
                {charts.vehicle_status_distribution.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">No status logs recorded.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.vehicle_status_distribution}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        label={{ fontSize: 9 }}
                      >
                        {charts.vehicle_status_distribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="border bg-card shadow-sm p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold">Driver Performance Radar</CardTitle>
                <CardDescription className="text-[10px]">Kilometers completed by operators</CardDescription>
              </CardHeader>
              <div className="h-56">
                {charts.driver_performance.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No trips completed yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.driver_performance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis type="number" tick={{ fontSize: 9 }} />
                      <YAxis dataKey="driver" type="category" tick={{ fontSize: 9 }} width={70} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Bar dataKey="distance" fill="#6366f1" name="KM covered" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="border bg-card shadow-sm p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold">Fuel Efficiency Comparison</CardTitle>
                <CardDescription className="text-[10px]">Mileage KM/L rating by vehicle number</CardDescription>
              </CardHeader>
              <div className="h-56">
                {charts.fuel_efficiency.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No efficiency logs recorded.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={charts.fuel_efficiency}>
                      <PolarGrid opacity={0.15} />
                      <PolarAngleAxis dataKey="vehicle" tick={{ fontSize: 8 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 8 }} />
                      <Radar name="Fuel KM/L" dataKey="efficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

          </div>

          {/* Charts Row 3: Top operators and yearly breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <Card className="border bg-card shadow-sm p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold">Top Performing Vehicles & Drivers</CardTitle>
                <CardDescription className="text-[10px]">Completed trip dispatches counts</CardDescription>
              </CardHeader>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.top_performing_vehicles}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="vehicle" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Bar dataKey="trips" fill="#10b981" name="Completed dispatches" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border bg-card shadow-sm p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold">Yearly Expenditures Growth</CardTitle>
                <CardDescription className="text-[10px]">Operations cost growth trends by calendar years</CardDescription>
              </CardHeader>
              <div className="h-56">
                {charts.yearly_expenses.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No historical logs.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.yearly_expenses}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Area type="monotone" dataKey="expense" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} name="Yearly Cost ($)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

          </div>

        </div>
      )}

      {/* BI INSIGHTS AND RECENT ACTIVITIES PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BUSINESS INTELLIGENCE INSIGHTS */}
        <Card className="border bg-card shadow-sm col-span-1 lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1">
              <BarChart4 className="h-5 w-5 text-primary" />
              Operational Insights Panel
            </CardTitle>
            <CardDescription className="text-xs">Identified alerts, high-performing assets, and bottleneck checks.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-3 border rounded-xl bg-muted/20 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Most Efficient Vehicle</p>
                <p className="text-sm font-black text-foreground">
                  {charts?.fuel_efficiency?.[0]?.vehicle || 'N/A'}
                </p>
                <p className="text-[10px] text-emerald-500">Highest mileage performer</p>
              </div>

              <div className="p-3 border rounded-xl bg-muted/20 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Top Driver Operator</p>
                <p className="text-sm font-black text-foreground">
                  {charts?.top_drivers?.[0]?.driver || 'N/A'}
                </p>
                <p className="text-[10px] text-emerald-500">Most schedules logged</p>
              </div>

              <div className="p-3 border rounded-xl bg-muted/20 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Downtime Check</p>
                <p className="text-sm font-black text-rose-500">
                  {stats?.vehicles_under_maintenance || 0} Assets
                </p>
                <p className="text-[10px] text-muted-foreground">Awaiting mechanic clearance</p>
              </div>

              <div className="p-3 border rounded-xl bg-muted/20 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Exceptions Check</p>
                <p className="text-sm font-black text-amber-500">
                  {(stats?.insurance_expiry || 0) + (stats?.license_expiry || 0)} Expiries
                </p>
                <p className="text-[10px] text-muted-foreground">Action required within 30 days</p>
              </div>

            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">System Idle Diagnostics</p>
                <p className="text-[10px] mt-0.5 leading-snug">
                  {stats?.vehicles_under_maintenance > 0 
                    ? `We observed some vehicles are undergoing corrective maintenance. Plan tasks distribution accordingly.`
                    : 'All assets diagnostic check passed. Zero critical downtime warnings detected.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TIMELINE FEED */}
        <Card className="border bg-card shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1">
              <ClipboardList className="h-5 w-5 text-indigo-500" />
              System Activity Log
            </CardTitle>
            <CardDescription className="text-xs">Live registry log timeline.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs overflow-y-auto max-h-72 space-y-4">
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-center py-10 italic">No recent activities log found.</p>
            ) : (
              <div className="relative border-l pl-4 space-y-5">
                {activities.map((act) => (
                  <div key={act.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border border-white" />
                    <div>
                      <p className="font-bold text-foreground leading-none">{act.title}</p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">{act.desc}</p>
                      <span className="text-[9px] text-muted-foreground font-mono block mt-1">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
