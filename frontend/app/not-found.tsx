'use client';

import React from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center select-none">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6 max-w-md z-10">
        
        {/* Brand signature logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary text-white">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">FleetGuard</span>
        </div>

        {/* 404 Header */}
        <div className="space-y-2">
          <h1 className="text-8xl font-black tracking-tight text-primary">404</h1>
          <h2 className="text-2xl font-bold tracking-tight">Route Disruption Detected</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page coordinate you are searching for does not exist in our telemetry logs or is currently under maintenance.
          </p>
        </div>

        {/* Redirect Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()} 
            className="w-full sm:w-auto gap-2 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          
          <Button 
            onClick={() => router.push('/')} 
            className="w-full sm:w-auto gap-2 active:scale-95"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Button>
        </div>

      </div>
    </div>
  )
}
