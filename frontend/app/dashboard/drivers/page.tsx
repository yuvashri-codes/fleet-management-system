'use client';

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Search, Filter, AlertTriangle, UserPlus, Eye, Edit, Trash2, 
  Mail, Phone, ShieldAlert, Calendar, MapPin, Heart, Image as ImageIcon, Loader2, Truck
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { driverService, vehicleService } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Driver, Vehicle } from '@/types'

// Zod Validation Schema for Driver CRUD
const driverSchema = z.object({
  employee_id: z.string().min(2, "Employee ID must be at least 2 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone is required"),
  license_number: z.string().min(3, "License number is required"),
  license_expiry: z.string().min(1, "License expiry date is required"),
  joining_date: z.string().min(1, "Joining date is required"),
  experience: z.coerce.number().int().min(0, "Experience must be non-negative"),
  address: z.string().optional().default(""),
  emergency_contact: z.string().min(1, "Emergency contact is required"),
  blood_group: z.string().optional().default(""),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  assigned_vehicle_id: z.string().optional().nullable(),
})

type DriverFormValues = z.infer<typeof driverSchema>

export default function DriversPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Search, Filters & Warnings toggles
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'near' | 'expired'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  // Modals Open State
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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

  // Fetch Drivers based on filters
  const { data: driversData, isLoading, refetch } = useQuery({
    queryKey: ['drivers', page, pageSize, searchTerm, statusFilter, expiryFilter],
    queryFn: () => {
      const params: Record<string, string | number | boolean> = {
        page,
        page_size: pageSize,
        search: searchTerm,
        status: statusFilter,
      }
      if (expiryFilter === 'near') {
        params.license_expiry_near = 'true'
      } else if (expiryFilter === 'expired') {
        params.license_expired = 'true'
      }
      return driverService.getAll(params)
    }
  })

  // Fetch Vehicles for allocation dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-selection'],
    queryFn: () => vehicleService.getAll({ page_size: 100 })
  })

  const vehiclesList: Vehicle[] = vehiclesData?.results || []

  // React Hook Form Setup
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      status: 'ACTIVE',
      experience: 0,
      address: '',
      blood_group: '',
    }
  })

  const handleOpenAdd = () => {
    setEditingDriver(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    reset({
      employee_id: '',
      name: '',
      email: '',
      phone: '',
      license_number: '',
      license_expiry: '',
      joining_date: '',
      experience: 0,
      address: '',
      emergency_contact: '',
      blood_group: '',
      status: 'ACTIVE',
      assigned_vehicle_id: '',
    })
    setIsAddEditOpen(true)
  }

  const handleOpenEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setPhotoFile(null)
    setPhotoPreview(driver.profile_photo)
    reset({
      employee_id: driver.employee_id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
      joining_date: driver.joining_date,
      experience: driver.experience,
      address: driver.address || '',
      emergency_contact: driver.emergency_contact,
      blood_group: driver.blood_group || '',
      status: driver.status,
      assigned_vehicle_id: driver.assigned_vehicle ? String(driver.assigned_vehicle.id) : '',
    })
    setIsAddEditOpen(true)
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: (fd: FormData) => driverService.create(fd),
    onSuccess: () => {
      toast({ type: 'success', title: 'Driver Registered', description: 'Operator profile created successfully.' })
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['drivers-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setIsAddEditOpen(false)
    },
    onError: (err: any) => {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to register driver'
      toast({ type: 'error', title: 'Registration Failed', description: msg })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: number; fd: FormData }) => driverService.update(id, fd),
    onSuccess: () => {
      toast({ type: 'success', title: 'Driver Profile Updated', description: 'Driver profile details have been saved.' })
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['drivers-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setIsAddEditOpen(false)
    },
    onError: (err: any) => {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update driver'
      toast({ type: 'error', title: 'Update Failed', description: msg })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => driverService.delete(id),
    onSuccess: () => {
      toast({ type: 'success', title: 'Driver Record Removed', description: 'Driver profile removed from registry.' })
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['drivers-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setDeletingDriver(null)
    },
    onError: () => {
      toast({ type: 'error', title: 'Deletion Failed', description: 'Failed to clear driver record.' })
    }
  })

  const onSubmit = (values: DriverFormValues) => {
    const formData = new FormData()
    
    Object.entries(values).forEach(([key, val]) => {
      if (key === 'assigned_vehicle_id') {
        if (val) {
          formData.append('assigned_vehicle_id', String(val))
        }
      } else if (val !== null && val !== undefined) {
        formData.append(key, String(val))
      }
    })

    if (photoFile) {
      formData.append('profile_photo', photoFile)
    }

    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver.id, fd: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  // Permissions mapping check
  const isDriver = currentUser?.role === 'DRIVER'
  const isFleetManager = currentUser?.role === 'FLEET_MANAGER'
  const isAdmin = currentUser?.role === 'ADMIN'

  // Expiry check logic (returns: 'expired' | 'warning' | 'ok')
  const getLicenseStatus = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'expired'
    if (diffDays <= 30) return 'warning'
    return 'ok'
  }

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      INACTIVE: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      SUSPENDED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    }[status] || 'bg-gray-500/10 text-gray-500'

    return (
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${config}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Drivers Registry</h2>
          <p className="text-sm text-muted-foreground">
            Manage system operator directory, driving permits, and vehicle assignment mappings.
          </p>
        </div>

        {!isDriver && (
          <Button 
            onClick={handleOpenAdd}
            className="gap-2 text-xs active:scale-95 shadow-md shadow-primary/20"
          >
            <UserPlus className="h-4 w-4" />
            Register Driver
          </Button>
        )}
      </div>

      {/* FILTER & TELEMETRY TOOLBAR */}
      <div className="p-4 rounded-xl border bg-card/60 glass-panel grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search driver name, employee ID, license..."
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
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        {/* License Expiry Filter */}
        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value as any)}
          className="w-full px-3 py-2 border rounded-lg bg-background/50 focus:outline-none focus:ring-1 focus:ring-ring text-sm cursor-pointer"
        >
          <option value="all">All License Permits</option>
          <option value="near">Expiring &lt; 30 Days</option>
          <option value="expired">Expired Permits</option>
        </select>
      </div>

      {/* LOADING */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : driversData?.results?.length === 0 ? (
        /* EMPTY STATE */
        <div className="rounded-2xl border bg-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg">No drivers registered</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search criteria or register a new driver if you are a manager.
          </p>
        </div>
      ) : (
        /* CARDS GRID */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {driversData.results.map((d: Driver) => {
              const licenseStatus = getLicenseStatus(d.license_expiry)
              return (
                <motion.div 
                  key={d.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border bg-card shadow-sm hover-card-effect flex flex-col justify-between overflow-hidden"
                >
                  {/* Warning Header Banner */}
                  {licenseStatus === 'expired' && (
                    <div className="bg-rose-500 text-white px-3 py-1 flex items-center gap-1.5 justify-center text-[10px] font-bold uppercase tracking-wider select-none animate-pulse">
                      <AlertTriangle className="h-3 w-3" /> Permit Expired
                    </div>
                  )}
                  {licenseStatus === 'warning' && (
                    <div className="bg-amber-500 text-white px-3 py-1 flex items-center gap-1.5 justify-center text-[10px] font-bold uppercase tracking-wider select-none">
                      <AlertTriangle className="h-3 w-3" /> Permit Near Expiry
                    </div>
                  )}

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    {/* Avatar & Basic Info */}
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted border flex items-center justify-center flex-shrink-0 overflow-hidden select-none">
                        {d.profile_photo ? (
                          <img src={d.profile_photo} alt={d.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-lg text-muted-foreground uppercase">{d.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground leading-tight truncate max-w-[120px]">{d.name}</h4>
                          {getStatusBadge(d.status)}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">ID: {d.employee_id}</p>
                        <p className="text-[10px] text-muted-foreground">Exp: {d.experience} Years</p>
                      </div>
                    </div>

                    {/* Contact Telemetry */}
                    <div className="space-y-2 border-t pt-3.5 text-xs text-muted-foreground select-none">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">{d.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                        <span>{d.phone}</span>
                      </div>
                    </div>

                    {/* Assigned Vehicle */}
                    <div className="pt-2">
                      <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border text-xs">
                        <Truck className="h-4 w-4 text-primary" />
                        <div className="overflow-hidden">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">Assigned Truck</p>
                          <p className="font-semibold text-[11px] truncate">
                            {d.assigned_vehicle ? `${d.assigned_vehicle.brand} ${d.assigned_vehicle.model} (${d.assigned_vehicle.vehicle_number})` : 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Operations Footer */}
                    <div className="flex items-center justify-between pt-3.5 border-t gap-1.5 mt-auto select-none">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/drivers/${d.id}`)}
                        className="flex-1 gap-1 text-[11px] hover:border-primary"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Profile
                      </Button>

                      {!isDriver && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(d)}
                            className="p-2"
                            title="Edit Profile"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          {isAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingDriver(d)}
                              className="p-2"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* PAGINATION PANEL */}
          <div className="flex items-center justify-between text-xs pt-4 select-none">
            <span className="text-muted-foreground">
              Showing page {page} (Results count: {driversData.results.length} of {driversData.count || driversData.results.length})
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
                disabled={driversData.results.length < pageSize}
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
        title={editingDriver ? "Modify Operator Profile" : "Register New Operator"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left">
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Employee ID (Unique ID)"
              id="employee_id"
              error={errors.employee_id?.message}
              {...register('employee_id')}
            />

            <Input
              label="Driver Name"
              id="name"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email Address"
              id="email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              id="phone"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Driving License Number"
              id="license_number"
              error={errors.license_number?.message}
              {...register('license_number')}
            />

            <Input
              label="License Expiry Date"
              id="license_expiry"
              type="date"
              error={errors.license_expiry?.message}
              {...register('license_expiry')}
            />

            <Input
              label="Joining Date"
              id="joining_date"
              type="date"
              error={errors.joining_date?.message}
              {...register('joining_date')}
            />

            <Input
              label="Years of Experience"
              id="experience"
              type="number"
              error={errors.experience?.message}
              {...register('experience')}
            />

            <Input
              label="Emergency Contact Info"
              id="emergency_contact"
              placeholder="e.g. Spouse / Relative Name & Phone"
              error={errors.emergency_contact?.message}
              {...register('emergency_contact')}
            />

            <Input
              label="Blood Group"
              id="blood_group"
              placeholder="e.g. O+, A-, B+"
              error={errors.blood_group?.message}
              {...register('blood_group')}
            />

            <Select
              label="Employment Status"
              id="status"
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
              error={errors.status?.message}
              {...register('status')}
            />

            {/* Vehicle Selection dropdown */}
            <div className="w-full flex flex-col gap-1.5">
              <label htmlFor="assigned_vehicle_id" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assign Vehicle
              </label>
              <div className="relative">
                <select
                  id="assigned_vehicle_id"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer appearance-none pr-10"
                  {...register('assigned_vehicle_id')}
                >
                  <option value="">Leave Unassigned</option>
                  {vehiclesList.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.vehicle_number})
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

          {/* Address */}
          <div className="w-full flex flex-col gap-1.5">
            <label htmlFor="address" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Permanent Address
            </label>
            <textarea
              id="address"
              rows={3}
              {...register('address')}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Avatar Photo picker */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Profile Photo</span>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 opacity-40" />
                )}
              </div>
              <label className="cursor-pointer bg-muted hover:bg-muted/80 text-foreground px-4 py-2 border rounded-lg font-bold tracking-wide transition-all active:scale-95">
                Choose Photo File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              {photoFile && <span className="text-muted-foreground text-xs">{photoFile.name}</span>}
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
              {editingDriver ? "Save Changes" : "Submit Profile"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Modal
        isOpen={deletingDriver !== null}
        onClose={() => setDeletingDriver(null)}
        title="Confirm Driver Record Deletion"
        size="sm"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the operator profile of <strong className="text-foreground">{deletingDriver?.name} ({deletingDriver?.employee_id})</strong>?
          </p>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-medium">
            Warning: This action is irreversible. All details and vehicle mappings linked to this operator will be cleared.
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingDriver(null)}
              className="bg-card text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deletingDriver && deleteMutation.mutate(deletingDriver.id)}
              className="text-xs font-bold"
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
