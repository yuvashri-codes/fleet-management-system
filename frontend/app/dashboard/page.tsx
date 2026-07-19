'use client';

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Truck, Users, MapPin, Flame, Wrench, HeartPulse, 
  RefreshCw, AlertTriangle, CheckCircle, Info
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { vehicleService, driverService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Vehicle, Driver } from '@/types'

export default function DashboardPage() {
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

  const isLoading = isVehiclesLoading || isDriversLoading
  const isRefetching = isVehiclesRefetching || isDriversRefetching

  const handleRefresh = () => {
    refetchVehicles()
    refetchDrivers()
  }

  const vehicles: Vehicle[] = vehiclesData?.results || []
  const drivers: Driver[] = driversData?.results || []

  // Calculate vehicle states
  const totalVehiclesCount = vehiclesData?.count || vehicles.length
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length
  const inUseVehicles = vehicles.filter(v => v.status === 'IN_USE').length
  const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE').length
  const inactiveVehicles = vehicles.filter(v => v.status === 'INACTIVE').length

  // Calculate driver states
  const totalDriversCount = driversData?.count || drivers.length
  const activeDrivers = drivers.filter(d => d.status === 'ACTIVE').length
  const inactiveDrivers = drivers.filter(d => d.status === 'INACTIVE').length
  const suspendedDrivers = drivers.filter(d => d.status === 'SUSPENDED').length
  const driverUtilization = totalDriversCount > 0 ? Math.round((activeDrivers / totalDriversCount) * 100) : 0

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

  // Dashboard Stats Grid layout
  const stats = [
    {
      title: "Total Vehicles",
      value: String(totalVehiclesCount),
      description: `${inUseVehicles} In Use • ${availableVehicles} Available • ${maintenanceVehicles} Down`,
      icon: Truck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: `${availableVehicles + inUseVehicles} Active Status`,
      trendType: "up"
    },
    {
      title: "Active Drivers",
      value: String(totalDriversCount),
      description: `${activeDrivers} Active • ${inactiveDrivers} Inactive • ${suspendedDrivers} Suspended`,
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10",
      trend: `${driverUtilization}% utilization`,
      trendType: "up"
    },
    {
      title: "Trips Today",
      value: "245",
      description: "210 Completed • 35 In Progress",
      icon: MapPin,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      trend: "+12% vs yesterday",
      trendType: "up"
    },
    {
      title: "Fuel Cost",
      value: "$12,450",
      description: "Daily average: $11,890",
      icon: Flame,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      trend: "+4.2% price surge",
      trendType: "down"
    },
    {
      title: "Maintenance Cost",
      value: "$3,210",
      description: "2 Major service operations pending",
      icon: Wrench,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      trend: "-12% vs last month",
      trendType: "up"
    },
    {
      title: "Fleet Health",
      value: "94.8%",
      description: "Target metric benchmark: 95.0%",
      icon: HeartPulse,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      trend: "+0.5% optimization",
      trendType: "up"
    }
  ]

  // Mock Telemetry Activities
  const recentEvents = [
    { id: 1, type: 'warning', title: 'Speed Limit Violations', desc: 'Driver #28 (Vehicle #TX-293) exceeded 80mph on I-35', time: '12m ago' },
    { id: 2, type: 'success', title: 'Scheduled Service Completed', desc: 'Vehicle #NY-902 completed 50k miles inspection', time: '45m ago' },
    { id: 3, type: 'info', title: 'Geofence Exit Detected', desc: 'Vehicle #CA-112 departed Dallas Hub Terminal', time: '1h ago' },
    { id: 4, type: 'info', title: 'Dispatch Plan Created', desc: 'Trip #2039 assigned to driver Robert M.', time: '2h ago' }
  ]

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
                      <div className="text-3xl font-extrabold tracking-tight mb-1">
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
            
            {/* Live activity log */}
            <motion.div variants={cardVariants} className="lg:col-span-2">
              <Card className="border bg-card shadow-sm h-full flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Recent Telemetry Events</CardTitle>
                  <CardDescription>Live notifications received from vehicle GPS hubs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentEvents.map((evt) => (
                    <div 
                      key={evt.id} 
                      className="flex items-start justify-between p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-all text-xs"
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {evt.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          {evt.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                          {evt.type === 'info' && <Info className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className="font-bold">{evt.title}</p>
                          <p className="text-muted-foreground mt-0.5">{evt.desc}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-4">{evt.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Health Meter Radial/Progress indicator */}
            <motion.div variants={cardVariants}>
              <Card className="border bg-card shadow-sm h-full flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Operational Performance</CardTitle>
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
