'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Download, Printer, Search, RefreshCw, Filter, FileSpreadsheet, 
  MapPin, Truck, User, Flame, Wrench, DollarSign, Calendar
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { reportsService, vehicleService, driverService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

type ReportType = 'fleet' | 'vehicle' | 'driver' | 'trips' | 'fuel' | 'maintenance' | 'expenses'

export default function ReportsPage() {
  const { toast } = useToast()
  
  // States
  const [reportType, setReportType] = useState<ReportType>('fleet')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('all')
  const [selectedDriver, setSelectedDriver] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')

  const [generatedData, setGeneratedData] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch Vehicles & Drivers dropdown options
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-dropdown-reports'],
    queryFn: () => vehicleService.getAll({ page_size: 100 })
  })

  const { data: driversData } = useQuery({
    queryKey: ['drivers-dropdown-reports'],
    queryFn: () => driverService.getAll({ page_size: 100 })
  })

  const vehicles = vehiclesData?.results || []
  const drivers = driversData?.results || []

  // Generate Report action
  const handleGenerateReport = async () => {
    setIsGenerating(true)
    const filters: Record<string, string> = {}
    if (startDate) filters.start_date = startDate
    if (endDate) filters.end_date = endDate
    if (selectedVehicle !== 'all') filters.vehicle = selectedVehicle
    if (selectedDriver !== 'all') filters.driver = selectedDriver
    if (selectedStatus !== 'all') filters.status = selectedStatus
    if (selectedMonth !== 'all') filters.month = selectedMonth
    if (selectedYear !== 'all') filters.year = selectedYear

    try {
      let data: any[] = []
      if (reportType === 'fleet') {
        data = await reportsService.getFleetReport(filters)
      } else if (reportType === 'vehicle') {
        data = await reportsService.getVehicleReport(filters)
      } else if (reportType === 'driver') {
        data = await reportsService.getDriverReport(filters)
      } else if (reportType === 'trips') {
        data = await reportsService.getTripsReport(filters)
      } else if (reportType === 'fuel') {
        data = await reportsService.getFuelReport(filters)
      } else if (reportType === 'maintenance') {
        data = await reportsService.getMaintenanceReport(filters)
      } else if (reportType === 'expenses') {
        const fuel = await reportsService.getFuelReport(filters)
        const maint = await reportsService.getMaintenanceReport(filters)
        // Combine fuel and maintenance expenses into a unified list
        const fuelRows = fuel.map((f: any) => ({
          date: f.fuel_date,
          category: 'Fuel Refuel',
          vehicle: f.vehicle.vehicle_number,
          driver: f.driver.name,
          details: `${f.fuel_station} - ${f.fuel_quantity}L`,
          amount: Number(f.total_cost)
        }))
        const maintRows = maint.map((m: any) => ({
          date: m.scheduled_date,
          category: `Maintenance (${m.maintenance_type})`,
          vehicle: m.vehicle.vehicle_number,
          driver: m.service_center,
          details: m.description,
          amount: Number(m.actual_cost || m.estimated_cost)
        }))
        data = [...fuelRows, ...maintRows].sort((a, b) => b.date.localeCompare(a.date))
      }
      setGeneratedData(data)
      toast({
        type: 'success',
        title: 'Report Generated',
        description: `Found ${data.length} records matching the criteria.`
      })
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Query Failed',
        description: err.message || 'Could not fetch report metrics.'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-generate fleet report on mount
  useEffect(() => {
    handleGenerateReport()
  }, [reportType])

  // Get table header labels based on report type
  const getTableHeaders = () => {
    switch (reportType) {
      case 'fleet':
        return ['Total Vehicles', 'Total Drivers', 'Trips Registered', 'Fuel Logs Count', 'Maintenance Tickets', 'Total Fuel Spendings', 'Total Repair Spendings', 'Consolidated Spendings']
      case 'vehicle':
        return ['Plate Number', 'Brand & Model', 'Type', 'Fuel Type', 'Manufacturing Year', 'Odometer Reading', 'Insurance Expiry', 'Status']
      case 'driver':
        return ['Driver ID', 'Name', 'License Number', 'License Expiry', 'Experience (Yrs)', 'Phone', 'Blood Group', 'Status']
      case 'trips':
        return ['Trip Name', 'Vehicle Number', 'Assigned Driver', 'Source Terminal', 'Destination Terminal', 'Distance (KM)', 'Trip Cost', 'Status']
      case 'fuel':
        return ['Refuel Date', 'Vehicle Number', 'Assigned Driver', 'Station Name', 'Fuel Type', 'Quantity Refilled', 'Total Cost', 'Remarks']
      case 'maintenance':
        return ['Scheduled Date', 'Vehicle Number', 'Type', 'Service Center', 'Service Engineer', 'Issue Category', 'Est. Cost', 'Status']
      case 'expenses':
        return ['Entry Date', 'Category', 'Vehicle Number', 'Driver / Center', 'Ledger Details', 'Amount Spendings']
      default:
        return []
    }
  }

  // Get report filename for export
  const getExportFilename = (ext: string) => {
    return `${reportType}_report_${new Date().toISOString().substring(0, 10)}.${ext}`
  }

  // CSV Exporter
  const handleExportCSV = () => {
    if (generatedData.length === 0) return
    const headers = getTableHeaders()
    let rows: any[][] = []

    if (reportType === 'fleet') {
      rows = generatedData.map(r => [
        r.total_vehicles, r.total_drivers, r.total_trips, r.total_fuel_logs, r.total_maintenance_records,
        `$${r.total_fuel_cost}`, `$${r.total_maintenance_cost}`, `$${r.total_expenses}`
      ])
    } else if (reportType === 'vehicle') {
      rows = generatedData.map(r => [
        r.vehicle_number, `${r.brand} ${r.model}`, r.vehicle_type, r.fuel_type, r.manufacturing_year,
        r.current_odometer, r.insurance_expiry, r.status
      ])
    } else if (reportType === 'driver') {
      rows = generatedData.map(r => [
        r.employee_id, r.name, r.license_number, r.license_expiry, r.experience, r.phone, r.blood_group, r.status
      ])
    } else if (reportType === 'trips') {
      rows = generatedData.map(r => [
        r.trip_name, r.vehicle.vehicle_number, r.driver.name, r.source_location, r.destination,
        r.distance, `$${r.trip_cost}`, r.current_status
      ])
    } else if (reportType === 'fuel') {
      rows = generatedData.map(r => [
        r.fuel_date, r.vehicle.vehicle_number, r.driver.name, r.fuel_station, r.fuel_type,
        r.fuel_quantity, `$${r.total_cost}`, r.remarks
      ])
    } else if (reportType === 'maintenance') {
      rows = generatedData.map(r => [
        r.scheduled_date, r.vehicle.vehicle_number, r.maintenance_type, r.service_center,
        r.service_engineer, r.issue_category, `$${r.estimated_cost}`, r.status
      ])
    } else if (reportType === 'expenses') {
      rows = generatedData.map(r => [
        r.date, r.category, r.vehicle, r.driver, r.details, `$${r.amount}`
      ])
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", getExportFilename('csv'))
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Excel CSV exporter (standard XML or general Excel CSV)
  const handleExportExcel = () => {
    handleExportCSV() // Direct download representation fallback
  }

  // Print & PDF renderer
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 print:p-0 print:m-0">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Intelligence Reports</h2>
          <p className="text-sm text-muted-foreground">Generate, view, and export company logistics spreadsheets, fuel cost balances, and vehicle profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            disabled={generatedData.length === 0}
            className="bg-card hover:border-emerald-500 active:scale-95 gap-1.5"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportExcel}
            disabled={generatedData.length === 0}
            className="bg-card hover:border-blue-500 active:scale-95 gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            disabled={generatedData.length === 0}
            className="bg-card hover:border-primary active:scale-95 gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Dynamic Report Selector Sidebar/Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Sidebar parameters selector */}
        <div className="space-y-4 lg:col-span-1 print:hidden">
          
          <Card className="border bg-card shadow-sm p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-primary">Select Report Category</h3>
            <div className="space-y-1.5">
              {[
                { type: 'fleet', label: 'Fleet Summary' },
                { type: 'vehicle', label: 'Vehicle Report' },
                { type: 'driver', label: 'Driver Report' },
                { type: 'trips', label: 'Trips dispatch Report' },
                { type: 'fuel', label: 'Fuel Ledger Report' },
                { type: 'maintenance', label: 'Maintenance Report' },
                { type: 'expenses', label: 'Expense Balance Sheet' }
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setReportType(item.type as ReportType)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    reportType === item.type 
                      ? 'bg-primary text-white shadow-md' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Dynamic Report filters card */}
          <Card className="border bg-card shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary">Query Filters</h3>
            
            <div className="space-y-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-[10px] text-muted-foreground uppercase">Scheduled From</label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[10px] text-muted-foreground uppercase">Scheduled To</label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="text-xs"
                />
              </div>

              {reportType !== 'vehicle' && reportType !== 'driver' && (
                <>
                  <Select
                    label="Vehicle Plate"
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Vehicles' },
                      ...vehicles.map((v: any) => ({ value: String(v.id), label: v.vehicle_number }))
                    ]}
                  />

                  <Select
                    label="Driver Name"
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Drivers' },
                      ...drivers.map((d: any) => ({ value: String(d.id), label: d.name }))
                    ]}
                  />
                </>
              )}

              <Select
                label="Status filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'AVAILABLE', label: 'Available / Active' },
                  { value: 'IN_USE', label: 'In Use' },
                  { value: 'MAINTENANCE', label: 'Maintenance' },
                  { value: 'SCHEDULED', label: 'Scheduled' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELLED', label: 'Cancelled' }
                ]}
              />

              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: '1', label: 'Jan' },
                    { value: '2', label: 'Feb' },
                    { value: '3', label: 'Mar' },
                    { value: '4', label: 'Apr' },
                    { value: '5', label: 'May' },
                    { value: '6', label: 'Jun' },
                    { value: '7', label: 'Jul' },
                    { value: '8', label: 'Aug' },
                    { value: '9', label: 'Sep' },
                    { value: '10', label: 'Oct' },
                    { value: '11', label: 'Nov' },
                    { value: '12', label: 'Dec' }
                  ]}
                />

                <Select
                  label="Year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: '2024', label: '2024' },
                    { value: '2025', label: '2025' },
                    { value: '2026', label: '2026' }
                  ]}
                />
              </div>

              <Button 
                onClick={handleGenerateReport} 
                className="w-full mt-2" 
                disabled={isGenerating}
              >
                {isGenerating ? 'Compiling Query...' : 'Apply Filters'}
              </Button>

            </div>
          </Card>

        </div>

        {/* Generated Tabular Reports Output Panel */}
        <div className="lg:col-span-3 space-y-4">
          
          <Card className="border bg-card shadow-sm overflow-hidden print:border-none print:shadow-none">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold capitalize">{reportType} Overview Report</CardTitle>
                  <CardDescription className="text-xs">
                    Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </CardDescription>
                </div>
                <div className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  {generatedData.length} records matching
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isGenerating ? (
                <div className="p-12 space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-28 w-full" />
                </div>
              ) : generatedData.length === 0 ? (
                <div className="p-16 text-center text-xs text-muted-foreground select-none">
                  <FileText className="h-10 w-10 text-muted-foreground/35 mx-auto mb-4" />
                  <p className="font-bold">No data matches report query criteria.</p>
                  <p className="text-[10px] mt-0.5">Try widening filters or selecting a different category.</p>
                </div>
              ) : (
                /* TABULAR ROWS VIEW */
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-muted/40 text-foreground font-bold border-b select-none font-sans">
                      <tr>
                        {getTableHeaders().map((head, idx) => (
                          <th key={idx} className="p-3 text-[11px] uppercase tracking-wider">{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-muted-foreground">
                      {reportType === 'fleet' && generatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{row.total_vehicles}</td>
                          <td className="p-3">{row.total_drivers}</td>
                          <td className="p-3">{row.total_trips}</td>
                          <td className="p-3">{row.total_fuel_logs}</td>
                          <td className="p-3">{row.total_maintenance_records}</td>
                          <td className="p-3 text-emerald-500 font-bold">${Number(row.total_fuel_cost).toLocaleString()}</td>
                          <td className="p-3 text-rose-500 font-bold">${Number(row.total_maintenance_cost).toLocaleString()}</td>
                          <td className="p-3 text-foreground font-black">${Number(row.total_expenses).toLocaleString()}</td>
                        </tr>
                      ))}

                      {reportType === 'vehicle' && generatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{row.vehicle_number}</td>
                          <td className="p-3 text-foreground">{row.brand} {row.model}</td>
                          <td className="p-3">{row.vehicle_type}</td>
                          <td className="p-3">{row.fuel_type}</td>
                          <td className="p-3">{row.manufacturing_year}</td>
                          <td className="p-3">{row.current_odometer} KM</td>
                          <td className="p-3">{row.insurance_expiry}</td>
                          <td className="p-3">
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold capitalize">
                              {row.status.toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {reportType === 'driver' && generatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{row.employee_id}</td>
                          <td className="p-3 text-foreground font-bold">{row.name}</td>
                          <td className="p-3">{row.license_number}</td>
                          <td className="p-3">{row.license_expiry}</td>
                          <td className="p-3">{row.experience} Years</td>
                          <td className="p-3">{row.phone}</td>
                          <td className="p-3">{row.blood_group}</td>
                          <td className="p-3">
                            <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-bold capitalize">
                              {row.status.toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {reportType === 'trips' && generatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{row.trip_name}</td>
                          <td className="p-3 text-foreground font-mono">{row.vehicle.vehicle_number}</td>
                          <td className="p-3">{row.driver.name}</td>
                          <td className="p-3">{row.source_location}</td>
                          <td className="p-3">{row.destination}</td>
                          <td className="p-3">{row.distance} KM</td>
                          <td className="p-3 font-bold text-foreground">${Number(row.trip_cost).toLocaleString()}</td>
                          <td className="p-3">
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-bold uppercase">
                              {row.current_status.toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {reportType === 'fuel' && generatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{row.fuel_date}</td>
                          <td className="p-3 font-mono text-foreground">{row.vehicle.vehicle_number}</td>
                          <td className="p-3">{row.driver.name}</td>
                          <td className="p-3">{row.fuel_station}</td>
                          <td className="p-3">{row.fuel_type}</td>
                          <td className="p-3">{row.fuel_quantity} L</td>
                          <td className="p-3 text-foreground font-bold">${Number(row.total_cost).toLocaleString()}</td>
                          <td className="p-3 truncate max-w-[130px]">{row.remarks || '—'}</td>
                        </tr>
                      ))}

                      {reportType === 'maintenance' && generatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{row.scheduled_date}</td>
                          <td className="p-3 font-mono text-foreground">{row.vehicle.vehicle_number}</td>
                          <td className="p-3 capitalize">{row.maintenance_type.toLowerCase()}</td>
                          <td className="p-3">{row.service_center}</td>
                          <td className="p-3">{row.service_engineer}</td>
                          <td className="p-3">{row.issue_category}</td>
                          <td className="p-3 text-foreground font-bold">${Number(row.estimated_cost).toLocaleString()}</td>
                          <td className="p-3">
                            <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-bold uppercase">
                              {row.status.toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {reportType === 'expenses' && generatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{row.date}</td>
                          <td className="p-3 font-bold text-foreground">{row.category}</td>
                          <td className="p-3 font-mono">{row.vehicle}</td>
                          <td className="p-3">{row.driver}</td>
                          <td className="p-3 max-w-xs truncate">{row.details}</td>
                          <td className="p-3 font-black text-rose-500">${row.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
