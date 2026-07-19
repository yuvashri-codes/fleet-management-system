'use client';

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Loading Spinner */}
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Loading FleetGuard...
        </p>
      </div>
    </div>
  )
}
