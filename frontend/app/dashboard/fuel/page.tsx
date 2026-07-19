'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Search, RefreshCw, Download, Edit2, Trash2, Flame, Wrench, Upload, 
  DollarSign, Milestone, FileText
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { fuelService, vehicleService, driverService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { FuelLog, Vehicle, Driver } from '@/types'

const fuelFormSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle selection is required"),
  driver_id: z.string().min(1, "Driver selection is required"),
  fuel_station: z.string().min(2, "Station name must be at least 2 characters"),
  fuel_type: z.string().min(1, "Fuel type is required"),
  fuel_quantity: z.preprocess((val) => Number(val), z.number().min(0.01, "Quantity must be positive")),
  price_per_liter: z.preprocess((val) => Number(val), z.number().min(0.01, "Price must be positive")),
  total_cost: z.preprocess((val) => Number(val), z.number().min(0.01, "Total cost must be positive")),
  mileage: z.preprocess((val) => Number(val), z.number().min(0, "Mileage must be non-negative")),
  current_odometer: z.preprocess((val) => Number(val), z.number().min(0, "Odometer must be non-negative")),
  fuel_date: z.string().min(1, "Fuel date is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  remarks: z.string().optional()
})

type FuelFormValues = z.infer<typeof fuelFormSchema>

export default function FuelManagementPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // State filters
  const [search, setSearch] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [fuelTypeFilter, setFuelTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null)
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  // Fetch Fuel Logs
  const { data: fuelLogsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['fuel', search, vehicleFilter, fuelTypeFilter, dateFilter],
    queryFn: () => {
      const params: Record<string, string | number | boolean> = {
        page_size: 100
      }
      if (search) params.search = search
      if (vehicleFilter !== 'all') params.vehicle = vehicleFilter
      if (fuelTypeFilter !== 'all') params.fuel_type = fuelTypeFilter
      if (dateFilter) {
        params.fuel_date_after = dateFilter
        params.fuel_date_before = dateFilter
      }
      return fuelService.getAll(params)
    }
  })

  // Fetch Vehicles & Drivers for selects
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-dropdown-fuel-page'],
    queryFn: () => vehicleService.getAll({ page_size: 100 })
  })

  const { data: driversData } = useQuery({
    queryKey: ['drivers-dropdown-fuel-page'],
    queryFn: () => driverService.getAll({ page_size: 100 })
  })

  const fuelLogs: FuelLog[] = fuelLogsData?.results || []
  const vehicles: Vehicle[] = vehiclesData?.results || []
  const drivers: Driver[] = driversData?.results || []

  // Forms
  const createForm = useForm<FuelFormValues>({
    resolver: zodResolver(fuelFormSchema),
    defaultValues: {
      vehicle_id: '',
      driver_id: '',
      fuel_station: '',
      fuel_type: 'Diesel',
      fuel_quantity: 0,
      price_per_liter: 0,
      total_cost: 0,
      mileage: 0,
      current_odometer: 0,
      fuel_date: new Date().toISOString().substring(0, 10),
      payment_method: 'Card',
      remarks: ''
    }
  })

  const editForm = useForm<FuelFormValues>({
    resolver: zodResolver(fuelFormSchema)
  })

  // Listeners to auto-compute total cost in create form
  const createQty = createForm.watch('fuel_quantity')
  const createPrice = createForm.watch('price_per_liter')
  useEffect(() => {
    if (createQty > 0 && createPrice > 0) {
      createForm.setValue('total_cost', Number((createQty * createPrice).toFixed(2)))
    }
  }, [createQty, createPrice, createForm])

  // Listeners to auto-compute total cost in edit form
  const editQty = editForm.watch('fuel_quantity')
  const editPrice = editForm.watch('price_per_liter')
  useEffect(() => {
    if (editQty > 0 && editPrice > 0) {
      editForm.setValue('total_cost', Number((editQty * editPrice).toFixed(2)))
    }
  }, [editQty, editPrice, editForm])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (fd: FormData) => fuelService.create(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel'] })
      queryClient.invalidateQueries({ queryKey: ['fuel-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles-dashboard'] })
      setIsCreateOpen(false)
      createForm.reset()
      setReceiptFile(null)
      toast({
        type: 'success',
        title: 'Fuel Log Added',
        description: 'New refueling log successfully recorded.'
      })
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Validation Error',
        description: err.message || 'Failed to submit log.'
      })
    }
  })

  const editMutation = useMutation({
    mutationFn: (fd: FormData) => fuelService.update(selectedLog!.id, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel'] })
      queryClient.invalidateQueries({ queryKey: ['fuel-dashboard'] })
      setIsEditOpen(false)
      setReceiptFile(null)
      toast({
        type: 'success',
        title: 'Fuel Log Saved',
        description: 'Changes to refueling parameters saved successfully.'
      })
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Error Saving Changes',
        description: err.message
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => fuelService.delete(selectedLog!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel'] })
      queryClient.invalidateQueries({ queryKey: ['fuel-dashboard'] })
      setIsDeleteOpen(false)
      toast({
        type: 'success',
        title: 'Log Removed',
        description: 'Refueling log has been successfully removed from fleet ledger.'
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

  const handleOpenEdit = (log: FuelLog) => {
    setSelectedLog(log)
    editForm.reset({
      vehicle_id: String(log.vehicle.id),
      driver_id: String(log.driver.id),
      fuel_station: log.fuel_station,
      fuel_type: log.fuel_type,
      fuel_quantity: Number(log.fuel_quantity),
      price_per_liter: Number(log.price_per_liter),
      total_cost: Number(log.total_cost),
      mileage: Number(log.mileage),
      current_odometer: Number(log.current_odometer),
      fuel_date: log.fuel_date,
      payment_method: log.payment_method,
      remarks: log.remarks
    })
    setIsEditOpen(true)
  }

  const submitCreate = (values: FuelFormValues) => {
    const fd = new FormData()
    Object.entries(values).forEach(([key, val]) => {
      fd.append(key, String(val))
    })
    if (receiptFile) {
      fd.append('receipt_upload', receiptFile)
    }
    createMutation.mutate(fd)
  }

  const submitEdit = (values: FuelFormValues) => {
    const fd = new FormData()
    Object.entries(values).forEach(([key, val]) => {
      fd.append(key, String(val))
    })
    if (receiptFile) {
      fd.append('receipt_upload', receiptFile)
    }
    editMutation.mutate(fd)
  }

  // Cost Aggregations & Mileage Analyser
  const totalCost = fuelLogs.reduce((sum, log) => sum + Number(log.total_cost), 0)
  const averageMileage = fuelLogs.length > 0 
    ? (fuelLogs.reduce((sum, log) => sum + Number(log.mileage), 0) / fuelLogs.length).toFixed(1)
    : '0.0'

  // Identify fuel-efficient and highest cost vehicles
  const vehicleCosts: Record<string, number> = {}
  const vehicleEfficiency: Record<string, { sum: number; count: number }> = {}

  fuelLogs.forEach((log) => {
    const plate = log.vehicle.vehicle_number
    vehicleCosts[plate] = (vehicleCosts[plate] || 0) + Number(log.total_cost)
    
    if (!vehicleEfficiency[plate]) {
      vehicleEfficiency[plate] = { sum: 0, count: 0 }
    }
    vehicleEfficiency[plate].sum += Number(log.mileage)
    vehicleEfficiency[plate].count += 1
  })

  let highestCostVehicle = 'N/A'
  let maxCost = 0
  Object.entries(vehicleCosts).forEach(([plate, cost]) => {
    if (cost > maxCost) {
      maxCost = cost
      highestCostVehicle = plate
    }
  })

  let mostEfficientVehicle = 'N/A'
  let maxEff = 0
  Object.entries(vehicleEfficiency).forEach(([plate, eff]) => {
    const avg = eff.sum / eff.count
    if (avg > maxEff) {
      maxEff = avg
      mostEfficientVehicle = plate
    }
  })

  // CSV Exporter
  const handleExportCSV = () => {
    if (fuelLogs.length === 0) return
    const headers = ['ID', 'Vehicle Number', 'Brand', 'Model', 'Driver', 'Station', 'Fuel Type', 'Quantity (L)', 'Price/L', 'Total Cost', 'Mileage', 'Odometer', 'Fuel Date', 'Payment Method']
    const rows = fuelLogs.map((f) => [
      f.id,
      f.vehicle.vehicle_number,
      f.vehicle.brand,
      f.vehicle.model,
      f.driver.name,
      `"${f.fuel_station.replace(/"/g, '""')}"`,
      f.fuel_type,
      f.fuel_quantity,
      f.price_per_liter,
      f.total_cost,
      f.mileage,
      f.current_odometer,
      f.fuel_date,
      f.payment_method
    ])
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `fuel_ledger_${new Date().toISOString().substring(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      
      {/* Header tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fuel Management</h2>
          <p className="text-sm text-muted-foreground">Keep tracking of fuel logging, expenditures, efficiency parameters, and station receipts.</p>
        </div>
        <div className="flex items-center gap-2">
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
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            disabled={fuelLogs.length === 0}
            className="bg-card hover:border-emerald-500 active:scale-95 gap-1.5"
          >
            <Download className="h-4 w-4" />
            CSV Export
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 gap-1.5 shadow"
          >
            <Plus className="h-4 w-4" />
            Add Fuel Log
          </Button>
        </div>
      </div>

      {/* Fuel Dashboard stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Monthly Fuel Cost</span>
            <p className="text-2xl font-extrabold text-foreground mt-1">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Average Mileage</span>
            <p className="text-2xl font-extrabold text-foreground mt-1">{averageMileage} KM/L</p>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
            <Milestone className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Most Efficient Vehicle</span>
            <p className="text-xl font-extrabold text-foreground mt-1.5 font-mono">{mostEfficientVehicle}</p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Flame className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Highest Cost Vehicle</span>
            <p className="text-xl font-extrabold text-foreground mt-1.5 font-mono">{highestCostVehicle}</p>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
            <Flame className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Fuel Consumption Trend SVG chart panel */}
      {fuelLogs.length > 1 && (
        <Card className="border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Fuel Consumption & Cost Ledger Trends</CardTitle>
            <CardDescription>Visualizing recent fuel refills.</CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-end justify-between gap-2.5 pt-4 text-[9px] font-semibold text-muted-foreground">
            {fuelLogs.slice(0, 8).reverse().map((log, idx) => {
              const heightPct = Math.min(100, Math.max(10, (Number(log.total_cost) / totalCost) * 300))
              return (
                <div key={log.id} className="flex flex-col items-center flex-1 space-y-2">
                  <span className="text-[10px] font-extrabold text-foreground">${Number(log.total_cost).toFixed(0)}</span>
                  <div className="w-full bg-amber-500/10 hover:bg-amber-500/30 rounded-t-lg transition-all" style={{ height: `${heightPct}px` }} />
                  <span className="truncate w-full text-center font-mono">{log.fuel_date.substring(5)}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Filters ledger card */}
      <Card className="border bg-card shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search station, remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
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

          <div>
            <Select
              value={fuelTypeFilter}
              onChange={(e) => setFuelTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Fuel Types' },
                { value: 'Diesel', label: 'Diesel' },
                { value: 'Petrol', label: 'Petrol' },
                { value: 'Electric', label: 'Electric' },
                { value: 'CNG', label: 'CNG' },
                { value: 'Hybrid', label: 'Hybrid' }
              ]}
            />
          </div>

          <div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
      </Card>

      {/* RENDER TABLE LOG LIST */}
      {isLoading ? (
        <Card className="border p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
        </Card>
      ) : fuelLogs.length === 0 ? (
        <Card className="border bg-card text-center p-12 shadow-sm">
          <Flame className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-base font-bold">No fuel logs recorded</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Refueling databases are empty. Check your filters or add a new log.
          </p>
        </Card>
      ) : (
        /* FUEL LOG TABLE VIEW */
        <Card className="border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse text-left text-muted-foreground">
              <thead className="bg-muted/40 text-foreground font-bold border-b select-none">
                <tr>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Station</th>
                  <th className="p-3">Fuel Type</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Price/L</th>
                  <th className="p-3">Total Cost</th>
                  <th className="p-3">Mileage</th>
                  <th className="p-3">Fuel Date</th>
                  <th className="p-3 text-right">Receipt</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fuelLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{log.vehicle.vehicle_number}</td>
                    <td className="p-3 text-foreground">{log.driver.name}</td>
                    <td className="p-3 truncate max-w-[140px]">{log.fuel_station}</td>
                    <td className="p-3">{log.fuel_type}</td>
                    <td className="p-3">{log.fuel_quantity} L</td>
                    <td className="p-3">${log.price_per_liter}</td>
                    <td className="p-3 text-foreground font-bold">${Number(log.total_cost).toLocaleString()}</td>
                    <td className="p-3">{log.mileage} KM/L</td>
                    <td className="p-3">{log.fuel_date}</td>
                    <td className="p-3 text-right">
                      {log.receipt_upload ? (
                        <a 
                          href={log.receipt_upload} 
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
                          onClick={() => handleOpenEdit(log)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log)
                            setIsDeleteOpen(true)
                          }}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE DIALOG */}
      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        title="Record Refueling Log"
      >
        <form onSubmit={createForm.handleSubmit(submitCreate)} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Vehicle Selection *"
              {...createForm.register('vehicle_id')}
              options={[
                { value: '', label: 'Select Vehicle' },
                ...vehicles.map(v => ({ value: String(v.id), label: v.vehicle_number }))
              ]}
              error={createForm.formState.errors.vehicle_id?.message}
            />

            <Select
              label="Driver Selection *"
              {...createForm.register('driver_id')}
              options={[
                { value: '', label: 'Select Driver' },
                ...drivers.map(d => ({ value: String(d.id), label: d.name }))
              ]}
              error={createForm.formState.errors.driver_id?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Fuel Station *</label>
              <Input {...createForm.register('fuel_station')} placeholder="Shell Station #9" />
            </div>

            <Select
              label="Fuel Type *"
              {...createForm.register('fuel_type')}
              options={[
                { value: 'Diesel', label: 'Diesel' },
                { value: 'Petrol', label: 'Petrol' },
                { value: 'Electric', label: 'Electric' },
                { value: 'CNG', label: 'CNG' },
                { value: 'Hybrid', label: 'Hybrid' }
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Quantity (Liters) *</label>
              <Input type="number" step="any" {...createForm.register('fuel_quantity')} />
              {createForm.formState.errors.fuel_quantity && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.fuel_quantity.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Price per Liter *</label>
              <Input type="number" step="any" {...createForm.register('price_per_liter')} />
              {createForm.formState.errors.price_per_liter && (
                <p className="text-rose-500 text-[10px]">{createForm.formState.errors.price_per_liter.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Total Cost ($) *</label>
              <Input type="number" step="any" {...createForm.register('total_cost')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Mileage (KM/L) *</label>
              <Input type="number" step="any" {...createForm.register('mileage')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Odometer (KM) *</label>
              <Input type="number" {...createForm.register('current_odometer')} />
            </div>

            <Select
              label="Payment Method *"
              {...createForm.register('payment_method')}
              options={[
                { value: 'Card', label: 'Card' },
                { value: 'Cash', label: 'Cash' },
                { value: 'Fuel Card', label: 'Fuel Card' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Fuel Date *</label>
              <Input type="date" {...createForm.register('fuel_date')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold flex items-center gap-1">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                Station Receipt
              </label>
              <Input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold">Remarks</label>
            <Input {...createForm.register('remarks')} placeholder="Remarks (optional)" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Uploading...' : 'Record Log'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT DIALOG */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        title="Edit Refueling Log"
      >
        <form onSubmit={editForm.handleSubmit(submitEdit)} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Vehicle Selection *"
              value={editForm.watch('vehicle_id')}
              onChange={(e) => editForm.setValue('vehicle_id', e.target.value)}
              options={vehicles.map(v => ({ value: String(v.id), label: v.vehicle_number }))}
            />

            <Select
              label="Driver Selection *"
              value={editForm.watch('driver_id')}
              onChange={(e) => editForm.setValue('driver_id', e.target.value)}
              options={drivers.map(d => ({ value: String(d.id), label: d.name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Fuel Station *</label>
              <Input {...editForm.register('fuel_station')} />
            </div>

            <Select
              label="Fuel Type *"
              value={editForm.watch('fuel_type')}
              onChange={(e) => editForm.setValue('fuel_type', e.target.value)}
              options={[
                { value: 'Diesel', label: 'Diesel' },
                { value: 'Petrol', label: 'Petrol' },
                { value: 'Electric', label: 'Electric' },
                { value: 'CNG', label: 'CNG' },
                { value: 'Hybrid', label: 'Hybrid' }
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Quantity (L) *</label>
              <Input type="number" step="any" {...editForm.register('fuel_quantity')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Price/L *</label>
              <Input type="number" step="any" {...editForm.register('price_per_liter')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Total Cost *</label>
              <Input type="number" step="any" {...editForm.register('total_cost')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Mileage (KM/L) *</label>
              <Input type="number" step="any" {...editForm.register('mileage')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Odometer *</label>
              <Input type="number" {...editForm.register('current_odometer')} />
            </div>

            <Select
              label="Payment Method *"
              value={editForm.watch('payment_method')}
              onChange={(e) => editForm.setValue('payment_method', e.target.value)}
              options={[
                { value: 'Card', label: 'Card' },
                { value: 'Cash', label: 'Cash' },
                { value: 'Fuel Card', label: 'Fuel Card' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold">Fuel Date *</label>
              <Input type="date" {...editForm.register('fuel_date')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold flex items-center gap-1">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                Replace Receipt
              </label>
              <Input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
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
        title="Remove Fuel Log"
      >
        <p className="text-xs text-muted-foreground mb-4">
          Are you sure you want to delete this refueling record? This will adjust financial stats sums.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Keep Record</Button>
          <Button 
            variant="destructive" 
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Log'}
          </Button>
        </div>
      </Modal>

    </div>
  )
}
