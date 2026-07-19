'use client';

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, Wrench, Truck, ShieldAlert, CheckCircle2, AlertCircle, Clock, 
  DollarSign, Activity, FileText, ChevronRight, Download, Calendar
} from 'lucide-react'
import { maintenanceService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Maintenance, MaintenanceStatus, MaintenancePriority } from '@/types'

export default function MaintenanceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: maint, isLoading, error } = useQuery<Maintenance>({
    queryKey: ['maintenance-detail', id],
    queryFn: () => maintenanceService.getById(id)
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !maint) {
    return (
      <div className="text-center py-20">
        <Wrench className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load service schedule</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This record does not exist or you lack authorization to access it.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/maintenance')} className="mt-4">
          Back to Maintenance
        </Button>
      </div>
    )
  }

  const priorityColors: Record<MaintenancePriority, string> = {
    LOW: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    HIGH: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    CRITICAL: 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse'
  }

  const statusColors: Record<MaintenanceStatus, string> = {
    PENDING: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    SCHEDULED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  }

  // Cost status calculation
  const est = Number(maint.estimated_cost)
  const act = maint.actual_cost ? Number(maint.actual_cost) : null
  const costDifference = act !== null ? act - est : null

  // Timeline phases
  const timelineSteps = [
    { name: 'Request Created', time: maint.created_at.substring(0, 10), desc: 'Service ticket registered and engineer assigned.' },
    { name: 'Scheduled', time: maint.scheduled_date, desc: `Schedules allocated to repair center: ${maint.service_center}.` },
    { name: 'Execution Status', time: maint.completed_date || 'Pending complete', desc: maint.status === 'COMPLETED' ? 'Repair complete, verified and billed.' : 'Execution in progress or pending.' }
  ]

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/dashboard/maintenance')}
          className="hover:border-primary active:scale-95 gap-1.5 mb-4 bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Maintenance
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Service Ticket #{maint.id}</h2>
            <p className="text-sm text-muted-foreground">Type: <span className="capitalize font-semibold">{maint.maintenance_type.toLowerCase()}</span> Service Details</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-bold border uppercase tracking-wider ${priorityColors[maint.priority]}`}>
              {maint.priority.toLowerCase()} Priority
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border uppercase tracking-wider ${statusColors[maint.status]}`}>
              {maint.status.replace('_', ' ').toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Service descriptions card */}
          <Card className="border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Service Summary Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="font-semibold text-muted-foreground">Service Center</p>
                  <p className="font-bold text-foreground mt-1">{maint.service_center}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Assigned Service Engineer</p>
                  <p className="font-bold text-foreground mt-1">{maint.service_engineer}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="font-semibold text-muted-foreground">Issue Category</p>
                  <p className="font-bold text-foreground mt-1">{maint.issue_category}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Scheduled Date</p>
                  <p className="font-bold text-foreground mt-1 font-mono">{maint.scheduled_date}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-muted-foreground">Detailed Description of Work</p>
                <p className="text-foreground mt-1 font-medium bg-muted/20 p-3 rounded-xl border">{maint.description}</p>
              </div>

              {maint.remarks && (
                <div>
                  <p className="font-semibold text-muted-foreground">Specialist Remarks</p>
                  <p className="text-foreground mt-1 italic">{maint.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Differential Analysis */}
          <Card className="border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <DollarSign className="h-4.5 w-4.5 text-primary" />
                Service Financial Differential Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs pt-2">
              <div className="p-3 border rounded-xl bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Estimated Cost</p>
                <p className="text-lg font-bold mt-1 text-foreground">${est.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="p-3 border rounded-xl bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Actual Cost</p>
                <p className="text-lg font-bold mt-1 text-foreground">
                  {act !== null ? `$${act.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Not Completed Yet'}
                </p>
              </div>

              <div className="p-3 border rounded-xl bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Cost Differential</p>
                {costDifference !== null ? (
                  <p className={`text-lg font-bold mt-1 ${
                    costDifference > 0 ? 'text-rose-500' : costDifference < 0 ? 'text-emerald-500' : 'text-foreground'
                  }`}>
                    {costDifference > 0 ? '+' : ''}${costDifference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                ) : (
                  <p className="text-lg font-bold mt-1 text-muted-foreground">—</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          
          {/* Associated Vehicle profile card */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-blue-500" />
                Associated Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-3">
              <div>
                <p className="font-bold text-foreground">{maint.vehicle.brand} {maint.vehicle.model}</p>
                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">Type: {maint.vehicle.vehicle_type}</p>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plate:</span>
                  <span className="font-semibold font-mono">{maint.vehicle.vehicle_number}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/dashboard/vehicles/${maint.vehicle.id}`)}
                className="w-full text-[10px] font-bold py-1.5 h-auto bg-card"
              >
                View Vehicle Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Invoices and PDF attachments downloads */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-500" />
                Service Invoices & Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-3">
              {maint.invoice_upload ? (
                <div className="p-3 border rounded-xl bg-muted/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-foreground truncate">Service_Invoice_{maint.id}</p>
                      <p className="text-[9px] text-muted-foreground">Billed Document</p>
                    </div>
                  </div>
                  <a 
                    href={maint.invoice_upload} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-card border hover:border-primary transition-all active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                  </a>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground italic text-[11px]">
                  No billed service invoices uploaded for this ticket.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Timeline milestones tracking */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-500" />
                Maintenance Timeline History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 border border-card" />
                    {idx < timelineSteps.length - 1 && (
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
