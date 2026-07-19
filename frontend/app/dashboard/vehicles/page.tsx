'use client';

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Search, Filter, ArrowUpDown, LayoutGrid, List, Plus, 
  Download, Edit, Trash2, Eye, X, Image as ImageIcon, Loader2, User as UserIcon
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { vehicleService, driverService } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Vehicle, Driver } from '@/types'

// Zod Validation Schema for Vehicle CRUD
const vehicleSchema = z.object({
  vehicle_number: z.string().min(2, "Vehicle number must be at least 2 characters"),
  registration_number: z.string().min(2, "Registration number must be at least 2 characters"),
  vin_number: z.string().min(5, "VIN must be at least 5 characters"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  vehicle_type: z.string().min(1, "Vehicle type is required"),
  manufacturing_year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  purchase_date: z.string().optional().nullable(),
  insurance_number: z.string().optional().default(""),
  insurance_expiry: z.string().optional().nullable(),
  rc_expiry: z.string().optional().nullable(),
  fuel_type: z.string().min(1, "Fuel type is required"),
  mileage: z.coerce.number().min(0).optional().nullable(),
  current_odometer: z.coerce.number().int().min(0, "Odometer must be non-negative"),
  capacity: z.string().min(1, "Capacity is required"),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE']),
  notes: z.string().optional().default(""),
  assigned_driver_id: z.string().optional().nullable(),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

export default function VehiclesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // App Layout State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [fuelFilter, setFuelFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals Open State
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Current logged in user for permission checks
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      }
    }
  }, [])

  // Fetch Vehicles
  const { data: vehiclesData, isLoading, refetch } = useQuery({
    queryKey: ['vehicles', page, pageSize, searchTerm, statusFilter, typeFilter, fuelFilter, sortBy, sortOrder],
    queryFn: () => vehicleService.getAll({
      page,
      page_size: pageSize,
      search: searchTerm,
      status: statusFilter,
      vehicle_type: typeFilter,
      fuel_type: fuelFilter,
      ordering: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`
    })
  })

  // Fetch Drivers for assignment selection
  const { data: driversData } = useQuery({
    queryKey: ['drivers-selection'],
    queryFn: () => driverService.getAll({ page_size: 100 })
  })

  const driversList: Driver[] = driversData?.results || []

  // React Hook Form Setup
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      status: 'AVAILABLE',
      notes: '',
      insurance_number: '',
    }
  })

  // Handle open modal for create
  const handleOpenAdd = () => {
    setEditingVehicle(null)
    setImageFile(null)
    setImagePreview(null)
    reset({
      vehicle_number: '',
      registration_number: '',
      vin_number: '',
      brand: '',
      model: '',
      vehicle_type: '',
      manufacturing_year: new Date().getFullYear(),
      purchase_date: '',
      insurance_number: '',
      insurance_expiry: '',
      rc_expiry: '',
      fuel_type: 'Diesel',
      mileage: 0,
      current_odometer: 0,
      capacity: '',
      status: 'AVAILABLE',
      notes: '',
      assigned_driver_id: '',
    })
    setIsAddEditOpen(true)
  }

  // Handle open modal for edit
  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setImageFile(null)
    setImagePreview(vehicle.image)
    reset({
      vehicle_number: vehicle.vehicle_number,
      registration_number: vehicle.registration_number,
      vin_number: vehicle.vin_number,
      brand: vehicle.brand,
      model: vehicle.model,
      vehicle_type: vehicle.vehicle_type,
      manufacturing_year: vehicle.manufacturing_year,
      purchase_date: vehicle.purchase_date || '',
      insurance_number: vehicle.insurance_number || '',
      insurance_expiry: vehicle.insurance_expiry || '',
      rc_expiry: vehicle.rc_expiry || '',
      fuel_type: vehicle.fuel_type,
      mileage: vehicle.mileage || 0,
      current_odometer: vehicle.current_odometer,
      capacity: vehicle.capacity,
      status: vehicle.status,
      notes: vehicle.notes || '',
      assigned_driver_id: vehicle.assigned_driver ? String(vehicle.assigned_driver.id) : '',
    })
    setIsAddEditOpen(true)
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: (fd: FormData) => vehicleService.create(fd),
    onSuccess: () => {
      toast({ type: 'success', title: 'Vehicle Created', description: 'New vehicle has been added successfully.' })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles-dashboard'] })
      setIsAddEditOpen(false)
    },
    onError: (err: any) => {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to add vehicle'
      toast({ type: 'error', title: 'Registration Failed', description: msg })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: number; fd: FormData }) => vehicleService.update(id, fd),
    onSuccess: () => {
      toast({ type: 'success', title: 'Vehicle Updated', description: 'Vehicle details have been updated successfully.' })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles-dashboard'] })
      setIsAddEditOpen(false)
    },
    onError: (err: any) => {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update vehicle'
      toast({ type: 'error', title: 'Update Failed', description: msg })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => vehicleService.delete(id),
    onSuccess: () => {
      toast({ type: 'success', title: 'Vehicle Deleted', description: 'Vehicle has been removed from the registry.' })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles-dashboard'] })
      setDeletingVehicle(null)
    },
    onError: () => {
      toast({ type: 'error', title: 'Deletion Failed', description: 'Internal server error occurred.' })
    }
  })

  const onSubmit = (values: VehicleFormValues) => {
    const formData = new FormData()
    
    // Add all fields except image and assigned_driver_id if empty
    Object.entries(values).forEach(([key, val]) => {
      if (key === 'assigned_driver_id') {
        if (val) {
          formData.append('assigned_driver_id', String(val))
        }
      } else if (val !== null && val !== undefined) {
        formData.append(key, String(val))
      }
    })

    // Attach image file if picked
    if (imageFile) {
      formData.append('image', imageFile)
    }

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, fd: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = vehiclesData?.results || []
    if (listToExport.length === 0) {
      toast({ type: 'info', title: 'No Data', description: 'There is no vehicle records to export.' })
      return
    }

    const headers = [
      'Vehicle Number', 'Registration Number', 'VIN Number', 'Brand', 'Model',
      'Type', 'Year', 'Fuel Type', 'Odometer', 'Capacity', 'Status', 'Driver'
    ]

    const rows = listToExport.map((v: Vehicle) => [
      v.vehicle_number, v.registration_number, v.vin_number, v.brand, v.model,
      v.vehicle_type, v.manufacturing_year, v.fuel_type, v.current_odometer,
      v.capacity, v.status, v.assigned_driver?.name || 'Unassigned'
    ])

    const csvContent = [headers, ...rows].map(e => e.map((val: any) => `"${val}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `fleet_vehicles_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Permissions mapping check
  const isDriver = currentUser?.role === 'DRIVER'
  const isFleetManager = currentUser?.role === 'FLEET_MANAGER'
  const isAdmin = currentUser?.role === 'ADMIN'

  // Format Status Badge
  const getStatusBadge = (status: string) => {
    const config = {
      AVAILABLE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      IN_USE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      MAINTENANCE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      INACTIVE: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    }[status] || 'bg-gray-500/10 text-gray-500'

    return (
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${config}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vehicles Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage your fleet telemetry, registration profiles, and operator allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="gap-2 text-xs hover:border-primary active:scale-95 bg-card"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          {!isDriver && (
            <Button 
              onClick={handleOpenAdd}
              className="gap-2 text-xs active:scale-95 shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          )}
        </div>
      </div>

      {/* FILTER & TELEMETRY TOOLBAR */}
      <div className="p-4 rounded-xl border bg-card/60 glass-panel grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        {/* Search */}
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search brand, model, registration, VIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background/50 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-background/50 focus:outline-none focus:ring-1 focus:ring-ring text-sm cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="IN_USE">In Use</option>
          <option value="MAINTENANCE">Under Maintenance</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Vehicle Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-background/50 focus:outline-none focus:ring-1 focus:ring-ring text-sm cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="Truck">Truck</option>
          <option value="SUV">SUV</option>
          <option value="Sedan">Sedan</option>
          <option value="Van">Van</option>
          <option value="Bus">Bus</option>
        </select>

        {/* View Mode & Toggles */}
        <div className="flex gap-2 justify-end items-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border transition-all ${viewMode === 'grid' ? 'bg-primary text-white border-primary' : 'bg-background hover:bg-muted text-muted-foreground'}`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border transition-all ${viewMode === 'list' ? 'bg-primary text-white border-primary' : 'bg-background hover:bg-muted text-muted-foreground'}`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* LOADING INDICATOR */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : vehiclesData?.results?.length === 0 ? (
        /* EMPTY STATE */
        <div className="rounded-2xl border bg-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <Truck className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg">No vehicles found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search query or filters. If you are an admin, click Add Vehicle to start registering.
          </p>
        </div>
      ) : (
        /* CONTENT SECTION */
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehiclesData.results.map((v: Vehicle) => (
                <motion.div 
                  key={v.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border bg-card shadow-sm hover-card-effect overflow-hidden flex flex-col"
                >
                  {/* Card Header Media */}
                  <div className="relative h-44 bg-muted flex items-center justify-center text-muted-foreground border-b select-none">
                    {v.image ? (
                      <img src={v.image} alt={v.brand} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-10 w-10 opacity-40" />
                        <span className="text-[10px]">No Image Uploaded</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(v.status)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-base leading-tight truncate">{v.brand} {v.model}</h4>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Plate: {v.vehicle_number}</span>
                        <span>Type: {v.vehicle_type}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t text-xs">
                        <div>
                          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Odometer</p>
                          <p className="font-semibold text-foreground mt-0.5">{v.current_odometer.toLocaleString()} mi</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Fuel Type</p>
                          <p className="font-semibold text-foreground mt-0.5 capitalize">{v.fuel_type.toLowerCase()}</p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border mt-2">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <div className="truncate">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">Assigned Driver</p>
                          <p className="font-semibold text-[11px] truncate">
                            {v.assigned_driver ? v.assigned_driver.name : 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Operations Footer */}
                    <div className="flex items-center justify-between pt-3 border-t gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/vehicles/${v.id}`)}
                        className="flex-1 gap-1 text-[11px] hover:border-primary"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>

                      {!isDriver && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(v)}
                            className="p-2"
                            title="Edit Vehicle"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          {isAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingVehicle(v)}
                              className="p-2"
                              title="Delete Vehicle"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* LIST VIEW (TABLE) */
            <div className="rounded-xl border bg-card overflow-x-auto shadow-sm select-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="p-4 cursor-pointer hover:bg-muted" onClick={() => toggleSort('brand')}>
                      Vehicle <ArrowUpDown className="inline h-3 w-3 ml-1" />
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-muted" onClick={() => toggleSort('vehicle_number')}>
                      Plate <ArrowUpDown className="inline h-3 w-3 ml-1" />
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-muted" onClick={() => toggleSort('vehicle_type')}>
                      Type <ArrowUpDown className="inline h-3 w-3 ml-1" />
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-muted" onClick={() => toggleSort('current_odometer')}>
                      Odometer <ArrowUpDown className="inline h-3 w-3 ml-1" />
                    </th>
                    <th className="p-4">Assigned Driver</th>
                    <th className="p-4 cursor-pointer hover:bg-muted" onClick={() => toggleSort('status')}>
                      Status <ArrowUpDown className="inline h-3 w-3 ml-1" />
                    </th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesData.results.map((v: Vehicle) => (
                    <tr key={v.id} className="border-b last:border-none hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                          {v.image ? (
                            <img src={v.image} alt={v.brand} className="w-full h-full object-cover" />
                          ) : (
                            <Truck className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                        <span className="truncate">{v.brand} {v.model}</span>
                      </td>
                      <td className="p-4 font-mono">{v.vehicle_number}</td>
                      <td className="p-4">{v.vehicle_type}</td>
                      <td className="p-4">{v.current_odometer.toLocaleString()} mi</td>
                      <td className="p-4 truncate">
                        {v.assigned_driver ? (
                          <span className="font-semibold text-primary">{v.assigned_driver.name}</span>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(v.status)}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-1.5 h-16">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/vehicles/${v.id}`)}
                          className="p-2"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {!isDriver && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenEdit(v)}
                              className="p-2"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeletingVehicle(v)}
                                className="p-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION PANEL */}
          <div className="flex items-center justify-between text-xs pt-4 select-none">
            <span className="text-muted-foreground">
              Showing page {page} (Results count: {vehiclesData.results.length} of {vehiclesData.count || vehiclesData.results.length})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="bg-card text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={vehiclesData.results.length < pageSize}
                className="bg-card text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL PANEL */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingVehicle ? "Modify Vehicle Profile" : "Register New Fleet Vehicle"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left">
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vehicle Number (Unique ID)"
              id="vehicle_number"
              error={errors.vehicle_number?.message}
              {...register('vehicle_number')}
            />

            <Input
              label="Registration Number"
              id="registration_number"
              error={errors.registration_number?.message}
              {...register('registration_number')}
            />

            <Input
              label="VIN Number"
              id="vin_number"
              error={errors.vin_number?.message}
              {...register('vin_number')}
            />

            <Input
              label="Brand Manufacturer"
              id="brand"
              error={errors.brand?.message}
              {...register('brand')}
            />

            <Input
              label="Model Name"
              id="model"
              error={errors.model?.message}
              {...register('model')}
            />

            <Select
              label="Vehicle Type"
              id="vehicle_type"
              options={[
                { value: 'Truck', label: 'Truck' },
                { value: 'SUV', label: 'SUV' },
                { value: 'Sedan', label: 'Sedan' },
                { value: 'Van', label: 'Van' },
                { value: 'Bus', label: 'Bus' },
              ]}
              error={errors.vehicle_type?.message}
              {...register('vehicle_type')}
            />

            <Input
              label="Manufacturing Year"
              id="manufacturing_year"
              type="number"
              error={errors.manufacturing_year?.message}
              {...register('manufacturing_year')}
            />

            <Input
              label="Purchase Date"
              id="purchase_date"
              type="date"
              error={errors.purchase_date?.message}
              {...register('purchase_date')}
            />

            <Input
              label="Insurance Number"
              id="insurance_number"
              error={errors.insurance_number?.message}
              {...register('insurance_number')}
            />

            <Input
              label="Insurance Expiry Date"
              id="insurance_expiry"
              type="date"
              error={errors.insurance_expiry?.message}
              {...register('insurance_expiry')}
            />

            <Input
              label="Registration Certificate Expiry (RC)"
              id="rc_expiry"
              type="date"
              error={errors.rc_expiry?.message}
              {...register('rc_expiry')}
            />

            <Select
              label="Fuel Type"
              id="fuel_type"
              options={[
                { value: 'Diesel', label: 'Diesel' },
                { value: 'Petrol', label: 'Petrol' },
                { value: 'Electric', label: 'Electric' },
                { value: 'Hybrid', label: 'Hybrid' },
                { value: 'CNG', label: 'CNG' },
              ]}
              error={errors.fuel_type?.message}
              {...register('fuel_type')}
            />

            <Input
              label="Current Odometer (Miles)"
              id="current_odometer"
              type="number"
              error={errors.current_odometer?.message}
              {...register('current_odometer')}
            />

            <Input
              label="Fuel Economy / Mileage (MPG)"
              id="mileage"
              type="number"
              step="0.1"
              error={errors.mileage?.message}
              {...register('mileage')}
            />

            <Input
              label="Load / Passenger Capacity"
              id="capacity"
              placeholder="e.g. 15 Tons, 5 Passengers"
              error={errors.capacity?.message}
              {...register('capacity')}
            />

            <Select
              label="Operational Status"
              id="status"
              options={[
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'IN_USE', label: 'In Use' },
                { value: 'MAINTENANCE', label: 'Under Maintenance' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              error={errors.status?.message}
              {...register('status')}
            />

            {/* Allocation Selection */}
            <div className="w-full flex flex-col gap-1.5">
              <label htmlFor="assigned_driver_id" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assign Driver
              </label>
              <div className="relative">
                <select
                  id="assigned_driver_id"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer appearance-none pr-10"
                  {...register('assigned_driver_id')}
                >
                  <option value="">Leave Unassigned</option>
                  {driversList.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.employee_id})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                  <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="w-full flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Notes / Technical Remarks
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Photo Picker */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Vehicle Thumbnail</span>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 opacity-40" />
                )}
              </div>
              <label className="cursor-pointer bg-muted hover:bg-muted/80 text-foreground px-4 py-2 border rounded-lg font-bold tracking-wide transition-all active:scale-95">
                Choose Image File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageFile && <span className="text-muted-foreground text-xs">{imageFile.name}</span>}
            </div>
          </div>

          {/* Action Operations */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 text-xs font-bold bg-card"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
              className="px-6 text-xs font-bold shadow-md shadow-primary/20"
            >
              {editingVehicle ? "Save Modifications" : "Submit Vehicle"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Modal
        isOpen={deletingVehicle !== null}
        onClose={() => setDeletingVehicle(null)}
        title="Confirm Vehicle Deletion"
        size="sm"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-muted-foreground">
            Are you absolutely sure you want to delete vehicle <strong className="text-foreground">{deletingVehicle?.brand} {deletingVehicle?.model} ({deletingVehicle?.vehicle_number})</strong> from the database registry?
          </p>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-medium">
            Warning: This action is permanent and will instantly clear any assigned driver relationships linked to this vehicle.
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingVehicle(null)}
              className="bg-card text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deletingVehicle && deleteMutation.mutate(deletingVehicle.id)}
              className="text-xs font-bold"
            >
              Delete Registry
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
