'use client';

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus, Search, RefreshCw, Calendar as CalendarIcon, List, Edit2, 
  Trash2, Wrench, Clock, Upload, ChevronRight, FileText
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { maintenanceService, vehicleService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Maintenance, MaintenanceType, MaintenanceStatus, MaintenancePriority, Vehicle } from '@/types'

const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle selection is required"),
  maintenance_type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION']),
  service_center: z.string().min(2, "Service center name is required"),
  service_engineer: z.string().min(2, "Service engineer name is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  issue_category: z.string().min(2, "Issue category is required"),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  completed_date: z.string().optional().nullable(),
  estimated_cost: z.preprocess((val) => val === '' ? 0 : Number(val), z.number().min(0, "Estimated cost must be positive")),
  actual_cost: z.preprocess((val) => val === '' ? null : Number(val), z.number().min(0, "Actual cost must be positive").optional().nullable()),
  remarks: z.string().optional()
})

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>

export default function MaintenancePage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  // State parameters
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [vehicleFilter, setVehicleFilter] = useState('all')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedMaint, setSelectedMaint] = useState<Maintenance | null>(null)

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

  // Fetch Maintenance Logs
  const { data: maintData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['maintenance', search, statusFilter, priorityFilter, vehicleFilter],
    queryFn: () => {
      const params: Record<string, string | number | boolean> = {
        page_size: 100
      }
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      if (vehicleFilter !== 'all') params.vehicle = vehicleFilter
      return maintenanceService.getAll(params)
    }
  })

  // Fetch Vehicles list
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-dropdown-maintenance-page'],
    queryFn: () => vehicleService.getAll({ page_size: 100 })
  })

  const maintenanceList: Maintenance[] = maintData?.results || []
  const vehicles: Vehicle[] = vehiclesData?.results || []

  // Forms
  const createForm = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicle_id: '',
      maintenance_type: 'PREVENTIVE',
      service_center: '',
      service_engineer: '',
      description: '',
      issue_category: 'Engine',
      priority: 'MEDIUM',
      status: 'PENDING',
      scheduled_date: new Date().toISOString().substring(0, 10),
      completed_date: null,
      estimated_cost: 0,
      actual_cost: null,
      remarks: ''
    }
  })

  const editForm = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema)
  })

  const handleOpenEdit = (maint: Maintenance) => {
    setSelectedMaint(maint)
    editForm.reset({
      vehicle_id: String(maint.vehicle.id),
      maintenance_type: maint.maintenance_type,
      service_center: maint.service_center,
      service_engineer: maint.service_engineer,
      description: maint.description,
      issue_category: maint.issue_category,
      priority: maint.priority,
      status: maint.status,
      scheduled_date: maint.scheduled_date,
      completed_date: maint.completed_date,
      estimated_cost: Number(maint.estimated_cost),
      actual_cost: maint.actual_cost ? Number(maint.actual_cost) : null,
      remarks: maint.remarks
    })
    setIsEditOpen(true)
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: (fd: FormData) => maintenanceService.create(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles-dashboard'] })
      setIsCreateOpen(false)
      createForm.reset()
      setInvoiceFile(null)
      toast({
        type: 'success',
        title: 'Service Scheduled',
        description: 'Maintenance schedule has been successfully created.'
      })
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Error Creating Schedule',
        description: err.response?.data?.completed_date || err.message
      })
    }
  })

  const editMutation = useMutation({
    mutationFn: (fd: FormData) => maintenanceService.update(selectedMaint!.id, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-dashboard'] })
      setIsEditOpen(false)
      setInvoiceFile(null)
      toast({
        type: 'success',
        title: 'Service Updated',
        description: 'Service logs saved successfully.'
      })
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Error Saving Changes',
        description: err.response?.data?.completed_date || err.message
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => maintenanceService.delete(selectedMaint!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-dashboard'] })
      setIsDeleteOpen(false)
      toast({
        type: 'success',
        title: 'Schedule Cancelled',
        description: 'The maintenance record has been removed from system files.'
      })
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Error',
        description: err.message
      })
    }
  })

  const submitCreate = (values: MaintenanceFormValues) => {
    const fd = new FormData()
    Object.entries(values).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        fd.append(key, String(val))
      }
    })
    if (invoiceFile) {
      fd.append('invoice_upload', invoiceFile)
    }
    createMutation.mutate(fd)
  }

  const submitEdit = (values: MaintenanceFormValues) => {
    const fd = new FormData()
    Object.entries(values).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        fd.append(key, String(val))
      }
    })
    if (invoiceFile) {
      fd.append('invoice_upload', invoiceFile)
    }
    editMutation.mutate(fd)
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

  // Group maintenance schedules by date for Calendar Grid Mode
  const getCalendarSchedules = () => {
    const dates: Record<string, Maintenance[]> = {}
    maintenanceList.forEach((m) => {
      if (!dates[m.scheduled_date]) {
        dates[m.scheduled_date] = []
      }
      dates[m.scheduled_date].push(m)
    })
    return dates
  }

  const calendarSchedules = getCalendarSchedules()

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Maintenance Management Center</h2>
          <p className="text-sm text-muted-foreground">Schedule inspections, assign engineering centers, track repair bills and timeline updates.</p>
        </div>
        <div className="flex items-center gap-2">
          
          {/* Toggles ViewMode */}
          <div className="border bg-card rounded-lg p-0.5 flex">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 text-xs gap-1.5"
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="h-8 text-xs gap-1.5"
            >
              <CalendarIcon className="h-4 w-4" />
              Calendar List
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="bg-card hover:border-primary active:scale-95 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            size="sm" 
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 gap-1.5 shadow"
          >
            <Plus className="h-4 w-4" />
            Schedule Service
          </Button>
        </div>
      </div>

      {/* Query Filters dashboard */}
      <Card className="border bg-card shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search service engineer, center..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending Action' },
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' }
              ]}
            />
          </div>

          <div>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' }
              ]}
            />
          </div>

          <div>
            <Select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Vehicles' },
                ...vehicles.map(v => ({ value: String(v.id), label: v.vehicle_number }))
              ]}
            />
          </div>
        </div>
      </Card>

      {/* RENDER VIEWS */}
      {isLoading ? (
        <Card className="border p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
        </Card>
      ) : maintenanceList.length === 0 ? (
        <Card className="border bg-card text-center p-12 shadow-sm">
          <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-base font-bold">No maintenance logs found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Check your filter parameters or schedule a new service event.
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        
        /* LIST DIRECTORY TABLE VIEW */
        <Card className="border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse text-left text-muted-foreground">
              <thead className="bg-muted/40 text-foreground font-bold border-b select-none font-sans">
                <tr>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Service Type</th>
                  <th className="p-3">Service Center</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Scheduled Date</th>
                  <th className="p-3">Est. Cost</th>
                  <th className="p-3">Actual Cost</th>
                  <th className="p-3 text-right">Invoice</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {maintenanceList.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{m.vehicle.vehicle_number}</td>
                    <td className="p-3 capitalize">{m.maintenance_type.toLowerCase()}</td>
                    <td className="p-3 truncate max-w-[130px]">{m.service_center}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${priorityColors[m.priority]}`}>
                        {m.priority.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${statusColors[m.status]}`}>
                        {m.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{m.scheduled_date}</td>
                    <td className="p-3">${Number(m.estimated_cost).toLocaleString()}</td>
                    <td className="p-3 text-foreground font-bold">{m.actual_cost ? `$${Number(m.actual_cost).toLocaleString()}` : '—'}</td>
                    <td className="p-3 text-right">
                      {m.invoice_upload ? (
                        <a 
                          href={m.invoice_upload} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-bold text-primary hover:underline flex items-center justify-end gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">None</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(m)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMaint(m)
                            setIsDeleteOpen(true)
                          }}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/maintenance/${m.id}`)}
                          className="h-7 w-7 p-0 text-primary"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        
        /* INTERACTIVE CALENDAR LIST SCHEDULES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(calendarSchedules).map(([dateStr, items]) => (
            <Card key={dateStr} className="border bg-card shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  {new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 border rounded-xl bg-muted/10 hover:bg-muted/30 cursor-pointer transition-all space-y-2.5"
                    onClick={() => router.push(`/dashboard/maintenance/${item.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-foreground">{item.vehicle.brand} {item.vehicle.model}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.vehicle.vehicle_number}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold ${priorityColors[item.priority]}`}>
                        {item.priority.toLowerCase()}
                      </span>
                    </div>

                    <p className="text-muted-foreground line-clamp-2">{item.description}</p>

                    <div className="flex justify-between items-center text-[10px] pt-2 border-t">
                      <span className="font-bold capitalize text-foreground">{item.maintenance_type.toLowerCase()}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${statusColors[item.status]}`}>
                        {item.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE DIALOG */}
      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        title="Schedule Maintenance Event"
        size="lg"
      >
        <form onSubmit={createForm.handleSubmit(submitCreate)} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Vehicle *"
              {...createForm.register('vehicle_id')}
              options={[
                { value: '', label: 'Select Vehicle' },
                ...vehicles.map(v => ({ value: String(v.id), label: `${v.vehicle_number} (${v.brand})` }))
              ]}
              error={createForm.formState.errors.vehicle_id?.message}
            />

            <Select
              label="Maintenance Type *"
              {...createForm.register('maintenance_type')}
              options={[
                { value: 'PREVENTIVE', label: 'Preventive' },
                { value: 'CORRECTIVE', label: 'Corrective' },
                { value: 'EMERGENCY', label: 'Emergency' },
                { value: 'INSPECTION', label: 'Inspection' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Service Center *</label>
              <Input {...createForm.register('service_center')} placeholder="Dallas Repair Hub" />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Service Engineer Name *</label>
              <Input {...createForm.register('service_engineer')} placeholder="Engineer Austin" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Issue Category *</label>
              <Input {...createForm.register('issue_category')} placeholder="e.g. Engine, Brakes, Transmission" />
            </div>

            <Select
              label="Priority Tag"
              {...createForm.register('priority')}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' }
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold">Service Description *</label>
            <Input {...createForm.register('description')} placeholder="e.g. Scheduled 50k mile fluid inspection and brake pad replacement" />
            {createForm.formState.errors.description && (
              <p className="text-rose-500 text-[10px]">{createForm.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Scheduled Date *</label>
              <Input type="date" {...createForm.register('scheduled_date')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Est. Cost ($) *</label>
              <Input type="number" step="any" {...createForm.register('estimated_cost')} />
            </div>

            <Select
              label="Service Status"
              {...createForm.register('status')}
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold flex items-center gap-1">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                Service Invoice (Optional)
              </label>
              <Input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Remarks</label>
              <Input {...createForm.register('remarks')} placeholder="Remarks (optional)" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT DIALOG */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        title="Edit Service Log"
        size="lg"
      >
        <form onSubmit={editForm.handleSubmit(submitEdit)} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Vehicle *"
              value={editForm.watch('vehicle_id')}
              onChange={(e) => editForm.setValue('vehicle_id', e.target.value)}
              options={vehicles.map(v => ({ value: String(v.id), label: v.vehicle_number }))}
            />

            <Select
              label="Maintenance Type *"
              value={editForm.watch('maintenance_type')}
              onChange={(e) => editForm.setValue('maintenance_type', e.target.value as any)}
              options={[
                { value: 'PREVENTIVE', label: 'Preventive' },
                { value: 'CORRECTIVE', label: 'Corrective' },
                { value: 'EMERGENCY', label: 'Emergency' },
                { value: 'INSPECTION', label: 'Inspection' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Service Center *</label>
              <Input {...editForm.register('service_center')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Service Engineer Name *</label>
              <Input {...editForm.register('service_engineer')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Issue Category *</label>
              <Input {...editForm.register('issue_category')} />
            </div>

            <Select
              label="Priority Tag"
              value={editForm.watch('priority')}
              onChange={(e) => editForm.setValue('priority', e.target.value as any)}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' }
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold">Service Description *</label>
            <Input {...editForm.register('description')} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Scheduled Date *</label>
              <Input type="date" {...editForm.register('scheduled_date')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Est. Cost ($) *</label>
              <Input type="number" step="any" {...editForm.register('estimated_cost')} />
            </div>

            <Select
              label="Service Status"
              value={editForm.watch('status')}
              onChange={(e) => editForm.setValue('status', e.target.value as any)}
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' }
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1 col-span-1">
              <label className="font-semibold">Completed Date</label>
              <Input 
                type="date" 
                value={editForm.watch('completed_date') || ''} 
                onChange={(e) => editForm.setValue('completed_date', e.target.value || null)} 
              />
            </div>

            <div className="space-y-1 col-span-1">
              <label className="font-semibold">Actual Cost ($)</label>
              <Input 
                type="number" 
                step="any"
                value={editForm.watch('actual_cost') || ''} 
                onChange={(e) => editForm.setValue('actual_cost', e.target.value === '' ? null : Number(e.target.value))} 
              />
            </div>

            <div className="space-y-1 col-span-1">
              <label className="font-semibold flex items-center gap-1">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                Replace Invoice
              </label>
              <Input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold">Remarks</label>
            <Input {...editForm.register('remarks')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Saving...' : 'Apply Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE DIALOG */}
      <Modal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        title="Remove Service Entry"
      >
        <p className="text-xs text-muted-foreground mb-4">
          Are you sure you want to delete this maintenance schedule? This will affect vehicle health calculations.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Keep Schedule</Button>
          <Button 
            variant="destructive" 
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Service'}
          </Button>
        </div>
      </Modal>

    </div>
  )
}
