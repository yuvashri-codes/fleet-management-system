'use client';

import React, { useEffect } from 'react'
import { Shield, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("System exception caught at boundary:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center select-none">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-rose-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6 max-w-md z-10">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary text-white">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">FleetGuard</span>
        </div>

        {/* 500 Exception header */}
        <div className="space-y-2">
          <h1 className="text-8xl font-black tracking-tight text-rose-500">500</h1>
          <h2 className="text-2xl font-bold tracking-tight">System Outage Detected</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error has disrupted the system telemetry loop. Our engineers have been alerted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => reset()} 
            className="w-full sm:w-auto gap-2 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Coordinates
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            className="w-full sm:w-auto gap-2 active:scale-95"
          >
            <Home className="h-4 w-4" />
            Control Dashboard
          </Button>
        </div>

      </div>
    </div>
  )
}
