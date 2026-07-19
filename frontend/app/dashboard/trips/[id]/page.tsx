'use client';

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, MapPin, Truck, User, Calendar, DollarSign, Activity, 
  Map, Clock, Package, Briefcase, FileText, ChevronRight
} from 'lucide-react'
import { tripService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Trip, TripStatus } from '@/types'

export default function TripDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: trip, isLoading, error } = useQuery<Trip>({
    queryKey: ['trip-detail', id],
    queryFn: () => tripService.getById(id)
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="text-center py-20">
        <MapPin className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load Trip</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This trip schedule does not exist or you lack authorization to access it.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/trips')} className="mt-4">
          Back to Trips
        </Button>
      </div>
    )
  }

  const statusColors: Record<TripStatus, string> = {
    SCHEDULED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    IN_PROGRESS: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    COMPLETED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    DELAYED: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  }

  // Simulated status steps for history
  const statusSteps = [
    { name: 'Trip Scheduled', time: `${trip.start_date} ${trip.start_time}`, desc: 'Trip itinerary loaded into system database.' },
    { name: 'Driver Dispatched', time: `${trip.start_date} ${trip.start_time}`, desc: 'Operator verified cargo container load.' },
    { name: 'In Transit', time: 'Pending Action', desc: 'Active GPS tracking signals.' }
  ]

  return (
    <div className="space-y-6">
      
      {/* Detail Top Navigation */}
      <div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/dashboard/trips')}
          className="hover:border-primary active:scale-95 gap-1.5 mb-4 bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trips
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{trip.trip_name}</h2>
            <p className="text-sm text-muted-foreground">Detailed dispatch telemetry and cargo routing.</p>
          </div>
          <span className={`self-start sm:self-center text-xs px-3 py-1 rounded-full font-bold border uppercase tracking-wider ${statusColors[trip.current_status]}`}>
            {trip.current_status.replace('_', ' ').toLowerCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Journey panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Map Vector placeholder */}
          <Card className="border bg-card overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/10 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Map className="h-4 w-4 text-emerald-500" />
                Live GPS Routing Pipeline
              </CardTitle>
              <CardDescription>Visualizing dispatch route source coordinates to terminal target destination.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 relative h-72 bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
              
              {/* Decorative grid overlay for map styling */}
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
              
              {/* Route line vector */}
              <div className="relative z-10 w-4/5 h-2/3 flex flex-col justify-between items-center text-white">
                <div className="flex justify-between w-full relative">
                  
                  {/* Origin */}
                  <div className="flex flex-col items-center bg-black/40 p-2.5 rounded-xl border border-white/10 backdrop-blur-sm max-w-[120px] text-center">
                    <MapPin className="h-5 w-5 text-emerald-400 mb-1" />
                    <p className="font-extrabold text-[10px] uppercase">Source Origin</p>
                    <p className="text-[9px] text-slate-300 truncate w-full">{trip.source_location}</p>
                  </div>

                  {/* Pulsing route line */}
                  <div className="absolute left-[110px] right-[110px] top-[24px] h-[2px] bg-gradient-to-r from-emerald-400 to-primary flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
                  </div>

                  {/* Destination */}
                  <div className="flex flex-col items-center bg-black/40 p-2.5 rounded-xl border border-white/10 backdrop-blur-sm max-w-[120px] text-center">
                    <MapPin className="h-5 w-5 text-primary mb-1" />
                    <p className="font-extrabold text-[10px] uppercase">Destination</p>
                    <p className="text-[9px] text-slate-300 truncate w-full">{trip.destination}</p>
                  </div>

                </div>

                <div className="text-center bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-[10px] mt-4 max-w-sm">
                  <p className="font-semibold text-slate-400">GPS Target Coordinates Placeholder</p>
                  <p className="text-slate-300 font-mono mt-0.5">{trip.gps_coordinates || '30.2672° N, 97.7431° W (Austin Core)'}</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Journey metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border shadow-sm p-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Total Distance</p>
              <p className="text-lg font-bold text-foreground mt-1 flex items-center gap-1">
                <Activity className="h-4 w-4 text-emerald-500" />
                {trip.distance} KM
              </p>
            </Card>

            <Card className="border shadow-sm p-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Est. Duration</p>
              <p className="text-lg font-bold text-foreground mt-1 flex items-center gap-1">
                <Clock className="h-4 w-4 text-blue-500" />
                {trip.estimated_duration}
              </p>
            </Card>

            <Card className="border shadow-sm p-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Trip Cost</p>
              <p className="text-lg font-bold text-foreground mt-1 flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-amber-500" />
                ${Number(trip.trip_cost).toLocaleString()}
              </p>
            </Card>

            <Card className="border shadow-sm p-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Cargo Class</p>
              <p className="text-lg font-bold text-foreground mt-1 flex items-center gap-1 truncate">
                <Package className="h-4 w-4 text-indigo-500 shrink-0" />
                {trip.cargo_description.split(' ')[0]}
              </p>
            </Card>
          </div>

          {/* Details Tabs content */}
          <Card className="border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Operational Itinerary Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="font-semibold text-muted-foreground">Transit Route Plan</p>
                  <p className="font-bold mt-1 text-foreground">{trip.route}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Cargo Details</p>
                  <p className="font-bold mt-1 text-foreground">{trip.cargo_description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="font-semibold text-muted-foreground">Customer Name</p>
                  <p className="font-bold mt-1 text-foreground">{trip.customer_name}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Customer Contact</p>
                  <p className="font-bold mt-1 text-foreground">{trip.customer_contact}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-muted-foreground">Special Instructions / Notes</p>
                <p className="font-bold mt-1 text-foreground italic">{trip.notes || 'No custom dispatch notes provided.'}</p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar Info cards */}
        <div className="space-y-6">
          
          {/* Driver Card */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <User className="h-4 w-4 text-accent" />
                Assigned Operator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm border border-accent/20">
                  {trip.driver.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-foreground">{trip.driver.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">ID: {trip.driver.employee_id}</p>
                </div>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold">{trip.driver.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold">{trip.driver.phone}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/dashboard/drivers/${trip.driver.id}`)}
                className="w-full text-[10px] font-bold py-1.5 h-auto bg-card"
              >
                View Driver Profile
              </Button>
            </CardContent>
          </Card>

          {/* Vehicle Card */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-blue-500" />
                Assigned Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-3">
              <div>
                <p className="font-bold text-foreground">{trip.vehicle.brand} {trip.vehicle.model}</p>
                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">Type: {trip.vehicle.vehicle_type}</p>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plate Number:</span>
                  <span className="font-semibold font-mono">{trip.vehicle.vehicle_number}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/dashboard/vehicles/${trip.vehicle.id}`)}
                className="w-full text-[10px] font-bold py-1.5 h-auto bg-card"
              >
                View Vehicle Profile
              </Button>
            </CardContent>
          </Card>

          {/* Status logs Timeline */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Journey Log History</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {statusSteps.map((step, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 border border-card" />
                    {idx < statusSteps.length - 1 && (
                      <div className="w-[1.5px] bg-muted h-10 my-0.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{step.name}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{step.time}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
