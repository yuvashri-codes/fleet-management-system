'use client';

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, Eye, EyeOff, Truck, Navigation } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { authService } from '@/lib/api'

// Validation schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Register react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Detect session expiry URL parameters
  useEffect(() => {
    if (searchParams.get('session_expired')) {
      toast({
        type: 'error',
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again.',
      })
    }
  }, [searchParams, toast])

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true)
    try {
      await authService.login(data.email, data.password)
      toast({
        type: 'success',
        title: 'Login Successful',
        description: 'Welcome back to FleetGuard!',
      })
      router.push('/dashboard')
    } catch (error: unknown) {
      console.error(error)
      const err = error as { response?: { data?: { detail?: string } } }
      toast({
        type: 'error',
        title: 'Authentication Failed',
        description: err.response?.data?.detail || 'Invalid email or password. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background select-none">
      
      {/* Left Column: Fleet Illustration & Brand details */}
      <div className="hidden lg:flex lg:col-span-7 bg-secondary relative overflow-hidden flex-col justify-between p-12 text-secondary-foreground border-r border-border">
        
        {/* Abstract Glowing Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/15 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

        {/* Top brand signature */}
        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              FleetGuard
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Enterprise Systems
            </p>
          </div>
        </div>

        {/* Dynamic Vector/CSS Fleet Illustration */}
        <div className="my-auto relative flex items-center justify-center h-96 z-10">
          
          {/* Pulsing grid and map simulation */}
          <div className="absolute w-[90%] h-[90%] border border-white/5 rounded-2xl bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] flex items-center justify-center">
            
            {/* GPS Tracker Node 1 */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 absolute animate-ping" />
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/50">
                <Navigation className="w-3.5 h-3.5 rotate-45" />
              </div>
            </motion.div>

            {/* GPS Tracker Node 2 */}
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-1/4 right-1/3 flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-accent/20 absolute animate-ping" />
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/50">
                <Truck className="w-4 h-4" />
              </div>
            </motion.div>

            {/* Connection routing line */}
            <svg className="absolute w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                d="M 230,130 L 480,240" 
                stroke="#06b6d4" 
                strokeWidth="2" 
                strokeDasharray="6,4"
              />
            </svg>
          </div>

          <div className="float-animation flex flex-col items-center text-center max-w-md">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3">
              Optimizing Global Logistics
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed px-4">
              Real-time monitoring, AI telemetry route planning, fuel utilization tracking, predictive maintenance diagnostic, and unified operations dispatch.
            </p>
          </div>
        </div>

        {/* Footer legal signature */}
        <div className="flex justify-between items-center text-xs text-muted-foreground z-10 border-t border-white/5 pt-4">
          <p>© 2026 FleetGuard Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Right Column: Glassmorphism Login Form */}
      <div className="col-span-1 lg:col-span-5 flex items-center justify-center p-6 sm:p-12 md:p-16 relative">
        
        {/* Soft background decor for mobile */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/5 blur-[80px] pointer-events-none lg:hidden" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-accent/5 blur-[80px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-md space-y-8">
          
          {/* Logo & Welcome Header */}
          <div className="text-center lg:text-left space-y-2">
            <div className="flex items-center justify-center lg:justify-start gap-2 lg:hidden mb-4">
              <div className="p-2 rounded-lg bg-primary text-white">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">FleetGuard</span>
            </div>
            
            <h2 className="text-3xl font-extrabold tracking-tight">
              Welcome Back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your fleet operations dashboard.
            </p>
          </div>

          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 rounded-2xl bg-card border shadow-xl shadow-foreground/5 glass-panel"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Email Input */}
              <div className="relative">
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  label="Corporate Email"
                  placeholder="name@company.com"
                  error={errors.email?.message}
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-[34px] h-4.5 w-4.5 text-muted-foreground" />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  className="pl-10 pr-10"
                />
                <Lock className="absolute left-3 top-[34px] h-4.5 w-4.5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm select-none">
                <Checkbox
                  {...register('rememberMe')}
                  id="rememberMe"
                  label="Remember Me"
                />
                <a href="#" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Log In
              </Button>
            </form>
          </motion.div>

          {/* Registration link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">New to FleetGuard? </span>
            <a href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Create an account
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
