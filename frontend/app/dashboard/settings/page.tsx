'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { settingsService, backupService, api } from '@/lib/api'
import { 
  Settings, Building2, Sliders, Bell, Eye, Download, Upload, 
  Activity, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, Moon, Sun
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const { toast } = useToast()
  
  // Settings Form State
  const [companyName, setCompanyName] = useState('FleetGuard Logistics')
  const [companyEmail, setCompanyEmail] = useState('info@fleetguard.com')
  const [currency, setCurrency] = useState('USD')
  const [fuelUnit, setFuelUnit] = useState('Liters')
  const [distanceUnit, setDistanceUnit] = useState('Kilometers')
  const [emailNotification, setEmailNotification] = useState(true)
  const [smsNotification, setSmsNotification] = useState(true)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Monitoring States
  const [dbHealth, setDbHealth] = useState<'ONLINE' | 'OFFLINE'>('ONLINE')
  const [flaskHealth, setFlaskHealth] = useState<'ONLINE' | 'OFFLINE'>('ONLINE')
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)

  // Fetch settings from DB
  const { data: serverSettings, isLoading, refetch } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => settingsService.get()
  })

  useEffect(() => {
    if (serverSettings) {
      setCompanyName(serverSettings.company_name)
      setCompanyEmail(serverSettings.company_email)
      setCurrency(serverSettings.currency)
      setFuelUnit(serverSettings.fuel_unit)
      setDistanceUnit(serverSettings.distance_unit)
      setEmailNotification(serverSettings.notification_email)
      setSmsNotification(serverSettings.notification_sms)
    }
  }, [serverSettings])

  // Check health statuses
  const checkSystemHealth = async () => {
    setIsCheckingHealth(true)
    try {
      // 1. Check Flask Health
      const flaskRes = await api.get('/api/ai/fleet-health/').catch(() => null)
      if (flaskRes) {
        setFlaskHealth('ONLINE')
      } else {
        setFlaskHealth('OFFLINE')
      }
      
      // 2. Check Database Health
      const dbRes = await api.get('/api/dashboard/').catch(() => null)
      if (dbRes) {
        setDbHealth('ONLINE')
      } else {
        setDbHealth('OFFLINE')
      }
    } catch {
      setDbHealth('OFFLINE')
      setFlaskHealth('OFFLINE')
    } finally {
      setIsCheckingHealth(false)
    }
  }

  useEffect(() => {
    checkSystemHealth()
    
    // Check if dark mode is active
    if (typeof window !== 'undefined') {
      setIsDarkMode(window.document.documentElement.classList.contains('dark'))
    }
  }, [])

  // Toggle Dark Mode
  const handleToggleTheme = () => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      if (isDarkMode) {
        root.classList.remove('dark')
        setIsDarkMode(false)
      } else {
        root.classList.add('dark')
        setIsDarkMode(true)
      }
      toast({
        type: 'success',
        title: 'Theme Preference Updated',
        description: `Theme changed to ${!isDarkMode ? 'Dark' : 'Light'} Mode.`
      })
    }
  }

  // Update settings handler
  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await settingsService.update({
        company_name: companyName,
        company_email: companyEmail,
        currency: currency,
        fuel_unit: fuelUnit,
        distance_unit: distanceUnit,
        notification_email: emailNotification,
        notification_sms: smsNotification
      })
      toast({
        type: 'success',
        title: 'Settings Saved',
        description: 'System-wide configuration profile successfully saved.'
      })
      refetch()
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        description: err.message || 'Could not save company configuration settings.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Export DB Backup handler
  const handleExportBackup = async () => {
    try {
      const blob = await backupService.exportBackup()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `fleetguard_backup_${new Date().toISOString().substring(0, 10)}.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({
        type: 'success',
        title: 'Backup Exported',
        description: 'Database tables successfully dumped to JSON.'
      })
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Export Failed',
        description: err.message || 'Could not build database backup.'
      })
    }
  }

  // Import DB Backup handler
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    try {
      await backupService.importBackup(file)
      toast({
        type: 'success',
        title: 'Backup Restored',
        description: 'Database tables successfully rebuilt from source.'
      })
      window.location.reload()
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Restore Failed',
        description: err.message || 'Verification of backup dump failed.'
      })
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          System Settings & Control Panel
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure company preferences, manage database backup files, and inspect microservice health status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Core Preferences Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Company Profile Card */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Company Name</label>
                    <Input 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Operations Email Address</label>
                    <Input 
                      type="email"
                      value={companyEmail} 
                      onChange={(e) => setCompanyEmail(e.target.value)} 
                      className="text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unit Settings */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Units & Currency Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select 
                    label="Operations Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    options={[
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'INR', label: 'INR (₹)' },
                      { value: 'GBP', label: 'GBP (£)' }
                    ]}
                  />

                  <Select 
                    label="Fuel Measurement Unit"
                    value={fuelUnit}
                    onChange={(e) => setFuelUnit(e.target.value)}
                    options={[
                      { value: 'Liters', label: 'Liters (L)' },
                      { value: 'Gallons', label: 'Gallons (gal)' }
                    ]}
                  />

                  <Select 
                    label="Odometer Distance Unit"
                    value={distanceUnit}
                    onChange={(e) => setDistanceUnit(e.target.value)}
                    options={[
                      { value: 'Kilometers', label: 'Kilometers (KM)' },
                      { value: 'Miles', label: 'Miles (mi)' }
                    ]}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notification Channels Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-3.5 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs font-bold text-foreground">Email Alert Notifications</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Send alerts for license and insurance expiries within 30 days.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={emailNotification} 
                  onChange={(e) => setEmailNotification(e.target.checked)}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-3.5 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs font-bold text-foreground">SMS Warning Broadcasts</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Broadcast SMS warning alerts for high fuel cost exceptions.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={smsNotification} 
                  onChange={(e) => setSmsNotification(e.target.checked)}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSaveSettings} 
            disabled={isSaving} 
            className="w-full font-bold active:scale-98 transition-all"
          >
            {isSaving ? 'Saving Configurations...' : 'Save Configuration Profile'}
          </Button>

        </div>

        {/* Sidebar Monitoring and Backup Actions Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Health Monitor check */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Service Health Checks
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkSystemHealth}
                disabled={isCheckingHealth}
                className="h-7 w-7 p-0 bg-card hover:bg-muted"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              
              <div className="flex items-center justify-between text-xs bg-muted/20 p-3 rounded-xl border border-white/5">
                <span className="font-bold text-muted-foreground">Backend Core (Django)</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                  <CheckCircle className="h-3.5 w-3.5" />
                  ONLINE
                </span>
              </div>

              <div className="flex items-center justify-between text-xs bg-muted/20 p-3 rounded-xl border border-white/5">
                <span className="font-bold text-muted-foreground">Database Instance (PostgreSQL)</span>
                <span className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded ${
                  dbHealth === 'ONLINE' ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
                }`}>
                  {dbHealth === 'ONLINE' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {dbHealth}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs bg-muted/20 p-3 rounded-xl border border-white/5">
                <span className="font-bold text-muted-foreground">AI Analytics Service (Flask)</span>
                <span className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded ${
                  flaskHealth === 'ONLINE' ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
                }`}>
                  {flaskHealth === 'ONLINE' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {flaskHealth}
                </span>
              </div>

            </CardContent>
          </Card>

          {/* Theme card preference */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                {isDarkMode ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                Interface Styling Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Select system UI theme color mode.</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleToggleTheme}
                className="bg-card hover:bg-muted active:scale-95 border font-bold"
              >
                {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
              </Button>
            </CardContent>
          </Card>

          {/* Backup card */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Database Backup & Restore
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              
              <Button 
                variant="outline" 
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 bg-card hover:bg-muted font-bold active:scale-95"
              >
                <Download className="h-4 w-4 text-primary" />
                Export Database JSON
              </Button>

              <div className="relative border border-dashed border-muted-foreground/30 p-4 rounded-xl text-center bg-muted/10 hover:bg-muted/15 transition-all">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={isRestoring}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-bold text-foreground">Import Backup JSON File</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Clears existing database records and imports backup.</p>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
