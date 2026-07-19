'use client';

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, Users, Calendar, Mail, Phone, Award, ShieldAlert, Clock, 
  MapPin, Heart, FileText, BarChart3, Map, CheckCircle, Info, Truck, Landmark, Eye
} from 'lucide-react'
import { driverService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Driver } from '@/types'

export default function DriverDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [activeTab, setActiveTab] = useState<'details' | 'vehicle' | 'trips' | 'performance' | 'documents'>('details')

  // Fetch driver details
  const { data: driver, isLoading, error } = useQuery<Driver>({
    queryKey: ['driver', id],
    queryFn: () => driverService.getById(id)
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

  if (error || !driver) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full">
          <Users className="h-12 w-12" />
        </div>
        <h3 className="font-bold text-lg text-foreground">Driver record not found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          The requested operator profile may have been removed or does not exist.
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard/drivers')}>
          Back to Drivers
        </Button>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      INACTIVE: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      SUSPENDED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    }[status] || 'bg-gray-500/10 text-gray-500'

    return (
      <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${config}`}>
        {status}
      </span>
    )
  }

  // License Expiry Check
  const expiryStatus = () => {
    const expiry = new Date(driver.license_expiry)
    const today = new Date()
    const diff = expiry.getTime() - today.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Expired', color: 'text-rose-500' }
    if (days <= 30) return { label: `Expiring in ${days} days`, color: 'text-amber-500' }
    return { label: 'Valid', color: 'text-emerald-500' }
  }

  return (
    <div className="space-y-6">
      
      {/* Header back navigation */}
      <div className="flex items-center gap-4 select-none">
        <button 
          onClick={() => router.push('/dashboard/drivers')}
          className="p-2 border rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{driver.name}</h2>
          <p className="text-xs text-muted-foreground">ID: {driver.employee_id} • Status: {driver.status.toLowerCase()}</p>
        </div>
      </div>

      {/* DETAILED LAYOUT PROFILE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Profile card */}
        <div className="space-y-6">
          <Card className="border bg-card overflow-hidden shadow-sm flex flex-col items-center text-center p-6 relative">
            <div className="absolute top-4 right-4">
              {getStatusBadge(driver.status)}
            </div>

            {/* Profile Avatar / Photo */}
            <div className="w-28 h-28 rounded-full bg-muted border flex items-center justify-center overflow-hidden mb-4 mt-2 shadow-inner select-none">
              {driver.profile_photo ? (
                <img src={driver.profile_photo} alt={driver.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="h-10 w-10 text-muted-foreground opacity-50" />
              )}
            </div>

            <h3 className="font-bold text-lg text-foreground leading-tight">{driver.name}</h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Experience: {driver.experience} Years</p>

            <div className="w-full border-t border-white/5 my-5 pt-4 space-y-3.5 text-xs text-left select-none">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Email</span>
                <span className="font-semibold text-foreground truncate max-w-[160px]">{driver.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> Phone</span>
                <span className="font-semibold text-foreground">{driver.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-500" /> Joined</span>
                <span className="font-semibold text-foreground">{new Date(driver.joining_date).toLocaleDateString()}</span>
              </div>
              {driver.blood_group && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" /> Blood Group</span>
                  <span className="font-bold text-rose-500 uppercase">{driver.blood_group}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Assigned Vehicle Quick Reference */}
          <Card className="border bg-card p-5 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Assigned Fleet Vehicle</h4>
            {driver.assigned_vehicle ? (
              <div className="flex items-center gap-3.5 bg-muted/30 p-3 rounded-xl border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border flex items-center justify-center text-emerald-500 overflow-hidden">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="overflow-hidden text-xs flex-1">
                  <p 
                    className="font-bold text-sm text-foreground truncate hover:text-primary cursor-pointer"
                    onClick={() => router.push(`/dashboard/vehicles/${driver.assigned_vehicle?.id}`)}
                  >
                    {driver.assigned_vehicle.brand} {driver.assigned_vehicle.model}
                  </p>
                  <p className="text-muted-foreground">Plate: {driver.assigned_vehicle.vehicle_number}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Type: {driver.assigned_vehicle.vehicle_type}</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-muted/20 border border-dashed rounded-xl text-xs text-muted-foreground">
                No fleet vehicle assigned to this operator.
              </div>
            )}
          </Card>
        </div>

        {/* Right detailed tab panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-border text-xs gap-1 select-none overflow-x-auto whitespace-nowrap pb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Operator Details
            </button>
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'vehicle' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Assigned Vehicle
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'trips' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Trips (MOCK)
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'performance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Performance (MOCK)
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${activeTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Documents (MOCK)
            </button>
          </div>

          <div className="min-h-80">
            {/* DETAILS TAB */}
            {activeTab === 'details' && (
              <Card className="border p-6 space-y-6 animate-fadeIn">
                {/* License Details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-primary" /> Driving License Permits
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">License Number</span>
                      <span className="font-mono font-semibold">{driver.license_number}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">License Status</span>
                      <span className={`font-bold ${expiryStatus().color}`}>{expiryStatus().label}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Expiry Date</span>
                      <span className="font-semibold">{new Date(driver.license_expiry).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Experience Log</span>
                      <span className="font-semibold">{driver.experience} Years On Road</span>
                    </div>
                  </div>
                </div>

                {/* Additional Personal info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pt-4 border-t">
                  <div className="space-y-2">
                    <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Emergency Contact</h4>
                    <p className="font-semibold text-foreground bg-muted/30 p-2.5 rounded-lg border border-white/5">{driver.emergency_contact}</p>
                  </div>
                  {driver.address && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Permanent Address</h4>
                      <p className="font-semibold text-foreground bg-muted/30 p-2.5 rounded-lg border border-white/5">{driver.address}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ASSIGNED VEHICLE DETAILS TAB */}
            {activeTab === 'vehicle' && (
              <Card className="border p-6 space-y-4 animate-fadeIn">
                {driver.assigned_vehicle ? (
                  <div>
                    <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                      <Truck className="h-4.5 w-4.5 text-primary" /> Active Assigned Asset
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Vehicle Brand</span>
                        <span className="font-semibold">{driver.assigned_vehicle.brand}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Model</span>
                        <span className="font-semibold">{driver.assigned_vehicle.model}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Registration Plate</span>
                        <span className="font-mono font-semibold">{driver.assigned_vehicle.vehicle_number}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Vehicle Classification</span>
                        <span className="font-semibold">{driver.assigned_vehicle.vehicle_type}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push(`/dashboard/vehicles/${driver.assigned_vehicle?.id}`)}
                      className="mt-6 text-xs gap-1.5"
                    >
                      <Eye className="h-4 w-4" /> View Vehicle Telemetry
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-10 flex flex-col items-center justify-center space-y-4">
                    <Truck className="h-10 w-10 text-muted-foreground opacity-40" />
                    <p className="text-xs text-muted-foreground">No active vehicle assigned to this operator.</p>
                  </div>
                )}
              </Card>
            )}

            {/* TRIPS SUMMARY PLACEHOLDER */}
            {activeTab === 'trips' && (
              <Card className="border p-8 text-center flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                <div className="p-4 bg-primary/10 text-primary rounded-full">
                  <Map className="h-10 w-10 animate-pulse" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Trips Operations Logs Placeholder</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Historical routes tracking, dispatched deliveries, client cargo handovers, and waypoint telemetry will be enabled in Sprint 3.
                </p>
              </Card>
            )}

            {/* PERFORMANCE PLACEHOLDER */}
            {activeTab === 'performance' && (
              <Card className="border p-8 text-center flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full">
                  <BarChart3 className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Driver Safety Scorecard Placeholder</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Smart safety ratings, average speeds, harsh braking events, and carbon emission stats will be implemented in Sprint 5.
                </p>
              </Card>
            )}

            {/* DOCUMENTS PLACEHOLDER */}
            {activeTab === 'documents' && (
              <Card className="border p-8 text-center flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                <div className="p-4 bg-muted text-muted-foreground rounded-full">
                  <FileText className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Documents Repository Placeholder</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Digital permits, background checks, medical certificates, and employment contracts will be linked in Sprint 6.
                </p>
              </Card>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
