'use client';

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { Shield, User, Mail, Lock, Eye, EyeOff, ClipboardList } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { authService } from '@/lib/api'

// Register Form Schema validation
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Confirm Password is required'),
  role: z.enum(['ADMIN', 'FLEET_MANAGER', 'DRIVER'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'DRIVER',
    },
  })

  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true)
    try {
      await authService.register({
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        full_name: data.fullName,
        role: data.role,
      })
      toast({
        type: 'success',
        title: 'Account Created',
        description: 'Your registration was successful. Welcome onboard!',
      })
      router.push('/dashboard')
    } catch (error: unknown) {
      console.error(error)
      const err = error as { response?: { data?: { email?: string[]; detail?: string } } }
      toast({
        type: 'error',
        title: 'Registration Failed',
        description: err.response?.data?.email?.[0] || err.response?.data?.detail || 'An error occurred during registration. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const roleOptions = [
    { value: 'DRIVER', label: 'Driver' },
    { value: 'FLEET_MANAGER', label: 'Fleet Manager' },
    { value: 'ADMIN', label: 'Admin' },
  ]

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background select-none">
      
      {/* Left Column: Side Branding Info */}
      <div className="hidden lg:flex lg:col-span-6 bg-secondary relative overflow-hidden flex-col justify-between p-12 text-secondary-foreground border-r border-border">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/15 blur-[100px] pointer-events-none" />
        
        {/* Header Branding */}
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

        {/* Info panel illustration details */}
        <div className="my-auto max-w-md space-y-6 z-10">
          <div className="float-animation flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl p-6 w-16 h-16 shadow-inner mb-6">
            <ClipboardList className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Create Your Enterprise Account
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Gain immediate access to our logistics orchestration platform. Fleet management, automated fuel tracking, smart trip optimization, and real-time alerts.
          </p>
          
          <ul className="space-y-3.5 text-sm text-gray-300">
            <li className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent" />
              Comprehensive vehicle & fleet telemetry logs
            </li>
            <li className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent" />
              Automated maintenance tracking alerts
            </li>
            <li className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent" />
              Driver safety rating scoring metrics
            </li>
          </ul>
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground border-t border-white/5 pt-4">
          <p>© 2026 FleetGuard Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="col-span-1 lg:col-span-6 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/5 blur-[80px] pointer-events-none lg:hidden" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-accent/5 blur-[80px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-lg space-y-6 py-8">
          
          {/* Mobile logo and title */}
          <div className="text-center lg:text-left space-y-2">
            <div className="flex items-center justify-center lg:justify-start gap-2 lg:hidden mb-4">
              <div className="p-2 rounded-lg bg-primary text-white">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">FleetGuard</span>
            </div>
            
            <h2 className="text-3xl font-extrabold tracking-tight">
              Create an Account
            </h2>
            <p className="text-sm text-muted-foreground">
              Register a new account to join our logistics network.
            </p>
          </div>

          {/* Card Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 rounded-2xl bg-card border shadow-xl shadow-foreground/5 glass-panel"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Full Name Input */}
              <div className="relative">
                <Input
                  {...register('fullName')}
                  id="fullName"
                  type="text"
                  label="Full Name"
                  placeholder="John Doe"
                  error={errors.fullName?.message}
                  className="pl-10"
                />
                <User className="absolute left-3 top-[34px] h-4.5 w-4.5 text-muted-foreground" />
              </div>

              {/* Email Input */}
              <div className="relative">
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  label="Corporate Email"
                  placeholder="john.doe@company.com"
                  error={errors.email?.message}
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-[34px] h-4.5 w-4.5 text-muted-foreground" />
              </div>

              {/* Grid for Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
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

                {/* Confirm Password Input */}
                <div className="relative">
                  <Input
                    {...register('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    placeholder="••••••••"
                    error={errors.confirmPassword?.message}
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-[34px] h-4.5 w-4.5 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

              </div>

              {/* Password strength tip helper */}
              <div className="text-[11px] text-muted-foreground bg-muted p-3 rounded-lg space-y-1">
                <span className="font-bold uppercase tracking-wider block mb-0.5 text-[9px]">Password Requirements:</span>
                <p>• Minimum 8 characters in length</p>
                <p>• Must contain 1 uppercase, 1 numeric digit, and 1 special symbol</p>
              </div>

              {/* Role Selection dropdown */}
              <Select
                {...register('role')}
                id="role"
                label="Assigned Role"
                options={roleOptions}
                error={errors.role?.message}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-4"
                isLoading={isLoading}
              >
                Register Account
              </Button>
            </form>
          </motion.div>

          {/* Login redirection link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <a href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
