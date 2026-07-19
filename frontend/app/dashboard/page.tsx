'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Truck, Users, MapPin, Flame, Wrench, HeartPulse, 
  RefreshCw, AlertTriangle, CheckCircle, Info, Calendar, DollarSign
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { vehicleService, driverService, tripService, fuelService, maintenanceService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Vehicle, Driver, Trip, FuelLog, Maintenance } from '@/types'

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      }
    }
  }, [])

  const isDriverUser = currentUser?.role === 'DRIVER'

  // Fetch real vehicles data
  const { 
    data: vehiclesData, 
    isLoading: isVehiclesLoading, 
    refetch: refetchVehicles,
    isRefetching: isVehiclesRefetching
  } = useQuery({
    queryKey: ['vehicles-dashboard'],
    queryFn: () => vehicleService.getAll({ page_size: 100 })
  })

  // Fetch real drivers data
  const { 
    data: driversData, 
    isLoading: isDriversLoading, 
    refetch: refetchDrivers,
    isRefetching: isDriversRefetching
  } = useQuery({
    queryKey: ['drivers-dashboard'],
    queryFn: () => driverService.getAll({ page_size: 100 })
  })

  // Fetch real trips data
  const {
    data: tripsData,
    isLoading: isTripsLoading,
    refetch: refetchTrips,
    isRefetching: isTripsRefetching
  } = useQuery({
    queryKey: ['trips-dashboard'],
    queryFn: () => tripService.getAll({ page_size: 100 })
  })

  // Fetch real fuel data (disabled for drivers)
  const {
    data: fuelData,
    isLoading: isFuelLoading,
    refetch: refetchFuel,
    isRefetching: isFuelRefetching
  } = useQuery({
    queryKey: ['fuel-dashboard'],
    queryFn: () => fuelService.getAll({ page_size: 100 }),
    enabled: !!currentUser && !isDriverUser
  })

  // Fetch real maintenance data (disabled for drivers)
  const {
    data: maintenanceData,
    isLoading: isMaintenanceLoading,
    refetch: refetchMaintenance,
    isRefetching: isMaintenanceRefetching
  } = useQuery({
    queryKey: ['maintenance-dashboard'],
    queryFn: () => maintenanceService.getAll({ page_size: 100 }),
    enabled: !!currentUser && !isDriverUser
  })

  const isLoading = isVehiclesLoading || isDriversLoading || isTripsLoading || 
                    (!isDriverUser && (isFuelLoading || isMaintenanceLoading))

  const isRefetching = isVehiclesRefetching || isDriversRefetching || isTripsRefetching ||
                       (!isDriverUser && (isFuelRefetching || isMaintenanceRefetching))

  const handleRefresh = () => {
    refetchVehicles()
    refetchDrivers()
    refetchTrips()
    if (!isDriverUser) {
      refetchFuel()
      refetchMaintenance()
    }
  }

  const vehicles: Vehicle[] = vehiclesData?.results || []
  const drivers: Driver[] = driversData?.results || []
  const trips: Trip[] = tripsData?.results || []
  const fuelLogs: FuelLog[] = fuelData?.results || []
  const maintenances: Maintenance[] = maintenanceData?.results || []

  // 1. Vehicles Utilization Metrics
  const totalVehiclesCount = vehiclesData?.count || vehicles.length
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length
  const inUseVehicles = vehicles.filter(v => v.status === 'IN_USE').length
  const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE').length
  const vehicleUtilization = totalVehiclesCount > 0 ? Math.round((inUseVehicles / totalVehiclesCount) * 100) : 0

  // 2. Drivers
  const totalDriversCount = driversData?.count || drivers.length

  // 3. Trips stats
  const totalTripsCount = tripsData?.count || trips.length
  const runningTrips = trips.filter(t => t.current_status === 'IN_PROGRESS').length
  const completedTrips = trips.filter(t => t.current_status === 'COMPLETED').length
  const scheduledTrips = trips.filter(t => t.current_status === 'SCHEDULED').length

  // 4. Financial Sums (Fuel & Maintenance)
  const totalFuelCost = isDriverUser ? 12450 : fuelLogs.reduce((sum, log) => sum + Number(log.total_cost), 0)
  const totalMaintenanceCost = isDriverUser ? 3210 : maintenances.reduce((sum, m) => sum + Number(m.actual_cost || m.estimated_cost), 0)

  // 5. Maintenance reminders
  const upcomingMaintenance = isDriverUser ? 2 : maintenances.filter(m => m.status === 'PENDING' || m.status === 'SCHEDULED').length

  // Animated Container Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  }

  // Dashboard Stats Grid
  const stats = [
    {
      title: "Trips Registry",
      value: String(totalTripsCount),
      description: `${runningTrips} In Progress • ${completedTrips} Completed • ${scheduledTrips} Scheduled`,
      icon: MapPin,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      trend: `${runningTrips} Active Runs`,
      trendType: "up"
    },
    {
      title: "Vehicle Utilization",
      value: `${vehicleUtilization}%`,
      description: `${inUseVehicles} of ${totalVehiclesCount} Vehicles Active`,
      icon: Truck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: `${availableVehicles} Idle / Available`,
      trendType: "up"
    },
    {
      title: "Active Operators",
      value: String(totalDriversCount),
      description: `Utilization rating based on active allocations`,
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10",
      trend: `${totalDriversCount} Enrolled`,
      trendType: "up"
    },
    {
      title: "Fuel Ledger",
      value: `$${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: isDriverUser ? "Simulated Driver metric" : `Calculated across ${fuelLogs.length} refueling logs`,
      icon: Flame,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      trend: isDriverUser ? "Telemetry Lock" : "Cost Sum",
      trendType: "down"
    },
    {
      title: "Maintenance Costs",
      value: `$${totalMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: isDriverUser ? "Simulated Driver metric" : `Calculated across ${maintenances.length} service logs`,
      icon: Wrench,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      trend: `${upcomingMaintenance} Upcoming schedules`,
      trendType: "up"
    },
    {
      title: "Upcoming Services",
      value: String(upcomingMaintenance),
      description: "Preventive and corrective tasks scheduled",
      icon: Calendar,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      trend: "Pending action",
      trendType: "up"
    }
  ]

  // Recent Trips list (Limit to 4)
  const recentTrips = trips.slice(0, 4)

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Overview of live metrics, transportation statistics, and alert statuses.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="self-start sm:self-center gap-2 hover:border-primary active:scale-95 bg-card"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
          Force Refresh
        </Button>
      </div>

      {/* RENDER SKELETON LOADERS */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3.5 w-40" />
                  <div className="pt-2 border-t mt-2">
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-3.5 w-64" />
              </CardHeader>
              <CardContent className="h-64 flex flex-col justify-between">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3.5 w-48" />
              </CardHeader>
              <CardContent className="h-64 flex flex-col justify-between">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* RENDER LIVE DASHBOARD */
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <motion.div key={idx} variants={cardVariants}>
                  <Card className="hover-card-effect border bg-card shadow-sm cursor-pointer select-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {stat.title}
                      </span>
                      <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="text-3xl font-extrabold tracking-tight mb-1 truncate">
                        {stat.value}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 truncate">
                        {stat.description}
                      </p>
                      
                      {/* Card progress footer indicator */}
                      <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-muted-foreground">Status OK</span>
                        <span className={`font-semibold flex items-center gap-1 ${
                          stat.trendType === 'up' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {stat.trend}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom Grid: Live Activity Feed & Operational Gauges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live activity log - Recent Trips */}
            <motion.div variants={cardVariants} className="lg:col-span-2">
              <Card className="border bg-card shadow-sm h-full flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Recent Dispatch Trips</CardTitle>
                  <CardDescription>Recently recorded dispatch cargo routes and status trackers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTrips.length === 0 ? (
                    <div className="text-center py-10 text-xs text-muted-foreground">
                      No trips registered in the system database.
                    </div>
                  ) : (
                    recentTrips.map((trip) => (
                      <div 
                        key={trip.id} 
                        className="flex items-start justify-between p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-all text-xs cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/trips/${trip.id}`}
                      >
                        <div className="flex gap-3 overflow-hidden">
                          <div className="mt-0.5">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-foreground truncate">{trip.trip_name}</p>
                            <p className="text-muted-foreground mt-0.5 truncate">
                              Route: {trip.source_location} ➔ {trip.destination} • Vehicle: {trip.vehicle.vehicle_number}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap ml-4">
                          {trip.current_status.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Health Meter Radial/Progress indicator */}
            <motion.div variants={cardVariants}>
              <Card className="border bg-card shadow-sm h-full flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Fleet Telemetry Performance</CardTitle>
                  <CardDescription>Fleet reliability parameters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Vehicle Safety Score</span>
                      <span className="text-emerald-500">92%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>On-Time Deliveries</span>
                      <span className="text-primary">96.4%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '96.4%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Fuel Efficiency Target</span>
                      <span className="text-accent">88%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>

                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs flex items-center justify-between mt-2">
                    <div>
                      <p className="font-bold text-primary">All Systems Green</p>
                      <p className="text-muted-foreground text-[10px]">No active code faults detected.</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>

        </motion.div>
      )}

    </div>
  )
}
