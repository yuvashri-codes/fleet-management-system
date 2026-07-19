'use client';

import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-sm select-none">
      <div className="flex flex-col items-center gap-4 text-center">
        
        {/* Animated GPS Navigation Ring */}
        <div className="relative flex items-center justify-center">
          <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-primary/20 opacity-75" />
          <div className="relative rounded-full h-10 w-10 border-4 border-primary border-t-transparent animate-spin" />
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-tight">Syncing Telemetry Logs...</p>
          <p className="text-[10px] text-muted-foreground animate-pulse">Contacting main enterprise backend cluster</p>
        </div>

      </div>
    </div>
  )
}
