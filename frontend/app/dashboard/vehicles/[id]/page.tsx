'use client';

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, Truck, Calendar, Fuel, Shield, Award, Clipboard, Wrench, Flame, 
  MapPin, Clock, FileText, User as UserIcon, Settings, Info, Gauge, Inbox
} from 'lucide-react'
import { vehicleService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Vehicle } from '@/types'

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [activeTab, setActiveTab] = useState<'details' | 'insurance' | 'timeline' | 'maintenance' | 'fuel'>('details')

  // Fetch single vehicle details
  const { data: vehicle, isLoading, error } = useQuery<Vehicle>({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getById(id)
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-40" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border">
            <CardHeader className="items-center">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-5 w-32 mt-4" />
              <Skeleton className="h-3 w-20 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2 border">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-44 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full">
          <Truck className="h-12 w-12" />
        </div>
        <h3 className="font-bold text-lg text-foreground">Vehicle registry not found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          The requested vehicle may have been removed or does not exist.
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard/vehicles')}>
          Back to Vehicles
        </Button>
      </div>
    )
  }

  // Format Status Badge
  const getStatusBadge = (status: string) => {
    const config = {
      AVAILABLE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      IN_USE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      MAINTENANCE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      INACTIVE: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    }[status] || 'bg-gray-500/10 text-gray-500'

    return (
      <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${config}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Back navigation header */}
      <div className="flex items-center gap-4 select-none">
        <button 
          onClick={() => router.push('/dashboard/vehicles')}
          className="p-2 border rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{vehicle.brand} {vehicle.model}</h2>
          <p className="text-xs text-muted-foreground">ID: {vehicle.vehicle_number} • Serial: {vehicle.registration_number}</p>
        </div>
      </div>

      {/* OVERVIEW PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side Profile Card */}
        <div className="space-y-6">
          <Card className="border bg-card overflow-hidden shadow-sm flex flex-col items-center text-center p-6 relative">
            <div className="absolute top-4 right-4">
              {getStatusBadge(vehicle.status)}
            </div>

            {/* Profile Avatar / Photo */}
            <div className="w-28 h-28 rounded-2xl bg-muted border flex items-center justify-center overflow-hidden mb-4 mt-2 shadow-inner">
              {vehicle.image ? (
                <img src={vehicle.image} alt={vehicle.brand} className="w-full h-full object-cover" />
              ) : (
                <Truck className="h-10 w-10 text-muted-foreground opacity-50" />
              )}
            </div>

            <h3 className="font-bold text-lg text-foreground leading-tight">{vehicle.brand} {vehicle.model}</h3>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{vehicle.vehicle_type}</p>

            <div className="w-full border-t border-white/5 my-5 pt-4 space-y-3.5 text-xs text-left">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Odometer</span>
                <span className="font-bold text-foreground">{vehicle.current_odometer.toLocaleString()} mi</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Fuel className="h-4 w-4 text-emerald-500" /> Fuel Type</span>
                <span className="font-semibold text-foreground capitalize">{vehicle.fuel_type.toLowerCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Info className="h-4 w-4 text-amber-500" /> Capacity</span>
                <span className="font-semibold text-foreground">{vehicle.capacity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-500" /> Year</span>
                <span className="font-semibold text-foreground">{vehicle.manufacturing_year}</span>
              </div>
            </div>
          </Card>

          {/* Assigned Driver Profile Box */}
          <Card className="border bg-card p-5 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Assigned Operator</h4>
            {vehicle.assigned_driver ? (
              <div className="flex items-center gap-3.5 bg-muted/30 p-3 rounded-xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase">
                  {vehicle.assigned_driver.name.charAt(0)}
                </div>
                <div className="overflow-hidden text-xs flex-1">
                  <p className="font-bold text-sm text-foreground truncate">{vehicle.assigned_driver.name}</p>
                  <p className="text-muted-foreground truncate">{vehicle.assigned_driver.email}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">ID: {vehicle.assigned_driver.employee_id} • {vehicle.assigned_driver.phone}</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-muted/20 border border-dashed rounded-xl text-xs text-muted-foreground">
                No driver currently assigned to this vehicle.
              </div>
            )}
          </Card>
        </div>

        {/* Right Side detailed Tabs View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-border text-xs gap-1 select-none overflow-x-auto whitespace-nowrap pb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'insurance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Insurance & Reg
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'timeline' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'maintenance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Maintenance (MOCK)
            </button>
            <button
              onClick={() => setActiveTab('fuel')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'fuel' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Fuel (MOCK)
            </button>
          </div>

          <div className="min-h-80">
            {/* DETAILS TAB */}
            {activeTab === 'details' && (
              <Card className="border p-6 space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                    <Clipboard className="h-4.5 w-4.5 text-primary" /> Technical Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Manufacturer</span>
                      <span className="font-semibold">{vehicle.brand}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-semibold">{vehicle.model}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Vehicle Type</span>
                      <span className="font-semibold">{vehicle.vehicle_type}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Odometer Index</span>
                      <span className="font-mono font-semibold">{vehicle.current_odometer.toLocaleString()} mi</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Fuel Consumption (MPG)</span>
                      <span className="font-semibold">{vehicle.mileage ? `${vehicle.mileage} mpg` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Payload Capacity</span>
                      <span className="font-semibold">{vehicle.capacity}</span>
                    </div>
                  </div>
                </div>

                {vehicle.notes && (
                  <div>
                    <h3 className="font-bold text-sm text-foreground mb-2">Remarks / Notes</h3>
                    <p className="p-3 bg-muted/40 border rounded-lg text-xs leading-relaxed text-muted-foreground">
                      {vehicle.notes}
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* INSURANCE & REGISTRATION TAB */}
            {activeTab === 'insurance' && (
              <Card className="border p-6 space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  {/* Insurance details */}
                  <div className="space-y-3.5 p-4 border rounded-xl bg-muted/10 relative">
                    <Shield className="absolute top-4 right-4 h-6 w-6 text-primary/20" />
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Shield className="h-4.5 w-4.5 text-primary" /> Insurance Policy
                    </h4>
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">Policy Number</span>
                        <span className="font-semibold">{vehicle.insurance_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between pb-1.5">
                        <span className="text-muted-foreground">Expiry Date</span>
                        <span className={`font-semibold ${
                          vehicle.insurance_expiry && new Date(vehicle.insurance_expiry) < new Date() ? 'text-rose-500' : 'text-foreground'
                        }`}>{vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registration details */}
                  <div className="space-y-3.5 p-4 border rounded-xl bg-muted/10 relative">
                    <Award className="absolute top-4 right-4 h-6 w-6 text-emerald-500/20" />
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Award className="h-4.5 w-4.5 text-emerald-500" /> Registration & RC
                    </h4>
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">RC / Reg Certificate</span>
                        <span className="font-semibold">{vehicle.registration_number}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-muted-foreground">VIN / Chassis Number</span>
                        <span className="font-mono font-semibold">{vehicle.vin_number}</span>
                      </div>
                      <div className="flex justify-between pb-1.5">
                        <span className="text-muted-foreground">RC Expiry</span>
                        <span className={`font-semibold ${
                          vehicle.rc_expiry && new Date(vehicle.rc_expiry) < new Date() ? 'text-rose-500' : 'text-foreground'
                        }`}>{vehicle.rc_expiry ? new Date(vehicle.rc_expiry).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <Card className="border p-6 space-y-4 animate-fadeIn">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-primary" /> Lifecycle Events
                </h3>
                
                <div className="relative border-l border-muted-foreground/20 pl-4 ml-2.5 py-2 space-y-6 text-xs text-left">
                  {/* Event 1 */}
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <span className="text-[10px] text-muted-foreground">{new Date(vehicle.created_at).toLocaleDateString()}</span>
                    <h4 className="font-bold text-foreground mt-0.5">Asset Onboarded</h4>
                    <p className="text-muted-foreground mt-0.5">Vehicle registered to FleetGuard inventory ledger.</p>
                  </div>
                  {/* Event 2 */}
                  {vehicle.purchase_date && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-background" />
                      <span className="text-[10px] text-muted-foreground">{new Date(vehicle.purchase_date).toLocaleDateString()}</span>
                      <h4 className="font-bold text-foreground mt-0.5">Asset Acquired</h4>
                      <p className="text-muted-foreground mt-0.5">Purchased and scheduled for transport allocation.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* MAINTENANCE SUMMARY PLACEHOLDER */}
            {activeTab === 'maintenance' && (
              <Card className="border p-8 text-center flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full">
                  <Wrench className="h-10 w-10 animate-bounce" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Maintenance Operations Placeholder</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Historical servicing orders, diagnostic faults, and calendar schedules will be implemented in subsequent sprints.
                </p>
              </Card>
            )}

            {/* FUEL SUMMARY PLACEHOLDER */}
            {activeTab === 'fuel' && (
              <Card className="border p-8 text-center flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full">
                  <Flame className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Fuel Auditing Logs Placeholder</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Refueling logs, monthly efficiency averages, and smart telemetry billing reports will be configured in Sprint 4.
                </p>
              </Card>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
