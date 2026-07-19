'use client';

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus, Search, RefreshCw, Edit2, Trash2, MapPin, 
  Clock, Truck, User, Calendar, Shield, ChevronRight
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { tripService, vehicleService, driverService } from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Trip, TripStatus, Vehicle, Driver } from '@/types'

const tripFormSchema = z.object({
  trip_name: z.string().min(2, "Trip name must be at least 2 characters"),
  vehicle_id: z.string().min(1, "Vehicle selection is required"),
  driver_id: z.string().min(1, "Driver selection is required"),
  source_location: z.string().min(2, "Source location is required"),
  destination: z.string().min(2, "Destination is required"),
  route: z.string().min(2, "Route details are required"),
  start_date: z.string().min(1, "Start date is required"),
  start_time: z.string().min(1, "Start time is required"),
  expected_end_date: z.string().min(1, "Expected end date is required"),
  actual_end_date: z.string().optional().nullable(),
  distance: z.preprocess((val) => Number(val), z.number().min(0, "Distance must be non-negative")),
  estimated_duration: z.string().min(1, "Estimated duration is required"),
  current_status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED']),
  trip_cost: z.preprocess((val) => Number(val), z.number().min(0, "Trip cost must be non-negative")),
  cargo_description: z.string().min(2, "Cargo description is required"),
  customer_name: z.string().min(2, "Customer name is required"),
  customer_contact: z.string().min(2, "Customer contact is required"),
  notes: z.string().optional(),
  gps_coordinates: z.string().optional()
})

type TripFormValues = z.infer<typeof tripFormSchema>

export default function TripsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  // User details
  const [currentUser, setCurrentUser] = useState<any>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      }
    }
  }, [])

  const isDriver = currentUser?.role === 'DRIVER'
  const isManagerOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'FLEET_MANAGER'

  // States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vehicleFilter, setVehicleFilter] = useState<string>('all')
  const [driverFilter, setDriverFilter] = useState<string>('all')
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  // Fetch Trips
  const { data: tripsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['trips', search, statusFilter, vehicleFilter, driverFilter],
    queryFn: () => {
      const params: Record<string, string | number | boolean> = {
        page_size: 100
      }
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (vehicleFilter !== 'all') params.vehicle = vehicleFilter
      if (driverFilter !== 'all') params.driver = driverFilter
      return tripService.getAll(params)
    }
  })

  // Fetch Vehicles & Drivers list for dropdowns
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-dropdown-trips-page'],
    queryFn: () => vehicleService.getAll({ page_size: 100 })
  })

  const { data: driversData } = useQuery({
    queryKey: ['drivers-dropdown-trips-page'],
    queryFn: () => driverService.getAll({ page_size: 100 })
  })

  const trips: Trip[] = tripsData?.results || []
  const vehicles: Vehicle[] = vehiclesData?.results || []
  const drivers: Driver[] = driversData?.results || []

  // Forms
  const createForm = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      trip_name: '',
      vehicle_id: '',
      driver_id: '',
      source_location: '',
      destination: '',
      route: '',
      start_date: '',
      start_time: '08:00',
      expected_end_date: '',
      actual_end_date: null,
      distance: 0,
      estimated_duration: '',
      current_status: 'SCHEDULED',
      trip_cost: 0,
      cargo_description: '',
      customer_name: '',
      customer_contact: '',
      notes: '',
      gps_coordinates: ''
    }
  })

  const editForm = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema)
  })

  // Open Edit Modal
  const handleOpenEdit = (trip: Trip) => {
    setSelectedTrip(trip)
    editForm.reset({
      trip_name: trip.trip_name,
      vehicle_id: String(trip.vehicle.id),
      driver_id: String(trip.driver.id),
      source_location: trip.source_location,
      destination: trip.destination,
      route: trip.route,
      start_date: trip.start_date,
      start_time: trip.start_time.substring(0, 5),
      expected_end_date: trip.expected_end_date,
      actual_end_date: trip.actual_end_date,
      distance: Number(trip.distance),
      estimated_duration: trip.estimated_duration,
      current_status: trip.current_status,
      trip_cost: Number(trip.trip_cost),
      cargo_description: trip.cargo_description,
      customer_name: trip.customer_name,
      customer_contact: trip.customer_contact,
      notes: trip.notes,
      gps_coordinates: trip.gps_coordinates
    })
    setIsEditOpen(true)
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: TripFormValues) => tripService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['trips-dashboard'] })
      setIsCreateOpen(false)
      createForm.reset()
      toast({
        type: 'success',
        title: 'Trip Scheduled',
        description: 'New trip has been created and assigned successfully.'
      })
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Error Creating Trip',
        description: err.response?.data?.expected_end_date || err.message || 'Validation checks failed.'
      })
    }
  })

  const editMutation = useMutation({
    mutationFn: (data: TripFormValues) => tripService.update(selectedTrip!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['trips-dashboard'] })
      setIsEditOpen(false)
      toast({
        type: 'success',
        title: 'Trip Updated',
        description: 'Trip schedule and parameters saved successfully.'
      })
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Error Updating Trip',
        description: err.response?.data?.detail || err.message || 'Failed to apply updates.'
      })
    }
  })

  const driverStatusMutation = useMutation({
    mutationFn: (newStatus: TripStatus) => tripService.update(selectedTrip!.id, { current_status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['trips-dashboard'] })
      setIsEditOpen(false)
      toast({
        type: 'success',
        title: 'Status Updated',
        description: `Trip status has been updated.`
      })
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Update Refused',
        description: err.response?.data?.detail || err.message || 'Permissions limits exceeded.'
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => tripService.delete(selectedTrip!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['trips-dashboard'] })
      setIsDeleteOpen(false)
      toast({
        type: 'success',
        title: 'Trip Deleted',
        description: 'The trip registry has been permanently deleted.'
      })
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Deletion Failed',
        description: err.response?.data?.detail || err.message
      })
    }
  })

  const statusColors: Record<TripStatus, string> = {
    SCHEDULED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    IN_PROGRESS: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    COMPLETED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    DELAYED: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  }

  return (
    <div className="space-y-6">
      
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trip Management</h2>
          <p className="text-sm text-muted-foreground">
            {isDriver ? 'View and update status of your assigned dispatch trips.' : 'Dispatch control center: create routes, monitor active trips, and manage status logs.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="hover:border-primary bg-card active:scale-95 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isManagerOrAdmin && (
            <Button 
              size="sm" 
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 gap-1.5 shadow"
            >
              <Plus className="h-4 w-4" />
              Schedule Trip
            </Button>
          )}
        </div>
      </div>

      {/* Query Filter panel */}
      <Card className="border bg-card shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Trip name, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/20"
            />
          </div>

          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'DELAYED', label: 'Delayed' }
              ]}
            />
          </div>

          <div>
            <Select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Vehicles' },
                ...vehicles.map(v => ({ value: String(v.id), label: `${v.vehicle_number} (${v.brand})` }))
              ]}
            />
          </div>

          <div>
            <Select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Drivers' },
                ...drivers.map(d => ({ value: String(d.id), label: d.name }))
              ]}
            />
          </div>
        </div>
      </Card>

      {/* RENDER LISTINGS */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border shadow-sm">
              <CardContent className="space-y-3 pt-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <Card className="border bg-card text-center p-12 shadow-sm">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-base font-bold">No trips found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            No trip records match the selected search options or role constraints.
          </p>
        </Card>
      ) : (
        /* TRIPS CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <motion.div 
              key={trip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <Card className="hover-card-effect border bg-card shadow-sm h-full flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${statusColors[trip.current_status]}`}>
                        {trip.current_status.replace('_', ' ').toLowerCase()}
                      </span>
                      <h4 className="text-base font-extrabold tracking-tight text-foreground mt-2 line-clamp-1">{trip.trip_name}</h4>
                    </div>

                    {/* Actions button */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(trip)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      {isManagerOrAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTrip(trip)
                            setIsDeleteOpen(true)
                          }}
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="text-xs text-muted-foreground space-y-3 pt-2">
                  {/* Route parameters */}
                  <div className="flex items-center gap-2 border bg-muted/20 p-2 rounded-xl text-foreground font-semibold">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    <span className="truncate">{trip.source_location}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{trip.destination}</span>
                  </div>

                  {/* Vehicle details */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" />
                      {trip.vehicle.brand} {trip.vehicle.model}
                    </span>
                    <span className="font-semibold text-foreground">{trip.vehicle.vehicle_number}</span>
                  </div>

                  {/* Driver details */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {trip.driver.name}
                    </span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">{trip.driver.employee_id}</span>
                  </div>

                  {/* Date details */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Start: {trip.start_date} • Cost: ${Number(trip.trip_cost).toLocaleString()}</span>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/trips/${trip.id}`)}
                      className="text-primary hover:underline p-0 h-auto font-bold flex items-center gap-1"
                    >
                      View Journey Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE DIALOG */}
      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        title="Schedule Dispatch Trip"
        size="lg"
      >
        <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Trip Name *</label>
              <Input {...createForm.register('trip_name')} placeholder="e.g. Austin Regional Cargo" />
              {createForm.formState.errors.trip_name && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.trip_name.message}</p>
              )}
            </div>

            <Select
              label="Current Status"
              {...createForm.register('current_status')}
              options={[
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'DELAYED', label: 'Delayed' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Vehicle *"
              {...createForm.register('vehicle_id')}
              options={[
                { value: '', label: 'Select Vehicle' },
                ...vehicles.map(v => ({ value: String(v.id), label: `${v.vehicle_number} (${v.brand} ${v.model})` }))
              ]}
              error={createForm.formState.errors.vehicle_id?.message}
            />

            <Select
              label="Driver *"
              {...createForm.register('driver_id')}
              options={[
                { value: '', label: 'Select Driver' },
                ...drivers.map(d => ({ value: String(d.id), label: `${d.name} (${d.employee_id})` }))
              ]}
              error={createForm.formState.errors.driver_id?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Source Location *</label>
              <Input {...createForm.register('source_location')} placeholder="e.g. Austin Hub Terminal" />
              {createForm.formState.errors.source_location && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.source_location.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Destination *</label>
              <Input {...createForm.register('destination')} placeholder="e.g. Dallas Center North" />
              {createForm.formState.errors.destination && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.destination.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold">Route Details *</label>
            <Input {...createForm.register('route')} placeholder="e.g. I-35 North Route directly" />
            {createForm.formState.errors.route && (
              <p className="text-rose-500 text-[10px]">{createForm.formState.errors.route.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Start Date *</label>
              <Input type="date" {...createForm.register('start_date')} />
              {createForm.formState.errors.start_date && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Start Time *</label>
              <Input type="time" {...createForm.register('start_time')} />
              {createForm.formState.errors.start_time && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Expected End *</label>
              <Input type="date" {...createForm.register('expected_end_date')} />
              {createForm.formState.errors.expected_end_date && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.expected_end_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Distance (KM) *</label>
              <Input type="number" step="any" {...createForm.register('distance')} />
              {createForm.formState.errors.distance && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.distance.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Estimated Duration *</label>
              <Input {...createForm.register('estimated_duration')} placeholder="e.g. 3 hours" />
              {createForm.formState.errors.estimated_duration && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.estimated_duration.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Trip Cost ($) *</label>
              <Input type="number" step="any" {...createForm.register('trip_cost')} />
              {createForm.formState.errors.trip_cost && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.trip_cost.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Customer Name *</label>
              <Input {...createForm.register('customer_name')} placeholder="ACME Enterprises" />
              {createForm.formState.errors.customer_name && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.customer_name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Customer Contact *</label>
              <Input {...createForm.register('customer_contact')} placeholder="555-0100" />
              {createForm.formState.errors.customer_contact && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.customer_contact.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold">Cargo Description *</label>
            <Input {...createForm.register('cargo_description')} placeholder="e.g. Heavy industry components" />
            {createForm.formState.errors.cargo_description && (
              <p className="text-rose-500 text-[10px]">{createForm.formState.errors.cargo_description.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-semibold">GPS Target coordinates (Optional)</label>
            <Input {...createForm.register('gps_coordinates')} placeholder="e.g. 30.2672, -97.7431" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold">Notes</label>
            <Input {...createForm.register('notes')} placeholder="Special delivery instructions" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT/UPDATE DIALOG (HAS DRIVER SPECIFIC CONDITIONS) */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        title="Update Trip Registry"
        size="lg"
      >
        {isDriver ? (
          /* DRIVER VIEW: CAN ONLY UPDATE STATUS */
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-start gap-2.5">
              <Shield className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Driver Telemetry Mode</p>
                <p className="text-[10px] mt-0.5">Under enterprise policies, drivers can only update the status parameter of their assigned trips.</p>
              </div>
            </div>

            <Select
              label="Trip Status"
              value={editForm.watch('current_status')}
              onChange={(e) => editForm.setValue('current_status', e.target.value as any)}
              options={[
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'DELAYED', label: 'Delayed' }
              ]}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => driverStatusMutation.mutate(editForm.watch('current_status'))}
                disabled={driverStatusMutation.isPending}
              >
                {driverStatusMutation.isPending ? 'Saving...' : 'Update Status'}
              </Button>
            </div>
          </div>
        ) : (
          /* MANAGER/ADMIN VIEW: FULL EDIT ACCESS */
          <form onSubmit={editForm.handleSubmit((data) => editMutation.mutate(data))} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Trip Name *</label>
                <Input {...editForm.register('trip_name')} />
                {editForm.formState.errors.trip_name && (
                  <p className="text-rose-500 text-[10px]">{editForm.formState.errors.trip_name.message}</p>
                )}
              </div>

              <Select
                label="Current Status"
                value={editForm.watch('current_status')}
                onChange={(e) => editForm.setValue('current_status', e.target.value as any)}
                options={[
                  { value: 'SCHEDULED', label: 'Scheduled' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                  { value: 'DELAYED', label: 'Delayed' }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Vehicle *"
                value={editForm.watch('vehicle_id')}
                onChange={(e) => editForm.setValue('vehicle_id', e.target.value)}
                options={vehicles.map(v => ({ value: String(v.id), label: `${v.vehicle_number} (${v.brand} ${v.model})` }))}
              />

              <Select
                label="Driver *"
                value={editForm.watch('driver_id')}
                onChange={(e) => editForm.setValue('driver_id', e.target.value)}
                options={drivers.map(d => ({ value: String(d.id), label: `${d.name} (${d.employee_id})` }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Source Location *</label>
                <Input {...editForm.register('source_location')} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Destination *</label>
                <Input {...editForm.register('destination')} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Route Details *</label>
              <Input {...editForm.register('route')} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Start Date *</label>
                <Input type="date" {...editForm.register('start_date')} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Start Time *</label>
                <Input type="time" {...editForm.register('start_time')} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Expected End *</label>
                <Input type="date" {...editForm.register('expected_end_date')} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Distance (KM) *</label>
                <Input type="number" step="any" {...editForm.register('distance')} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Estimated Duration *</label>
                <Input {...editForm.register('estimated_duration')} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Trip Cost ($) *</label>
                <Input type="number" step="any" {...editForm.register('trip_cost')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Customer Name *</label>
                <Input {...editForm.register('customer_name')} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Customer Contact *</label>
                <Input {...editForm.register('customer_contact')} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Cargo Description *</label>
              <Input {...editForm.register('cargo_description')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Actual End Date (If Completed/Cancelled)</label>
              <Input 
                type="date" 
                value={editForm.watch('actual_end_date') || ''} 
                onChange={(e) => editForm.setValue('actual_end_date', e.target.value || null)} 
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">GPS Target coordinates (Optional)</label>
              <Input {...editForm.register('gps_coordinates')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Notes</label>
              <Input {...editForm.register('notes')} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending ? 'Saving...' : 'Apply Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Modal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        title="Cancel & Delete Trip Schedule?"
      >
        <p className="text-xs text-muted-foreground mb-4">
          Are you sure you want to delete this trip registry? This action is irreversible and will remove all scheduled logs.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Keep Schedule</Button>
          <Button 
            variant="destructive" 
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </div>
      </Modal>

    </div>
  )
}
