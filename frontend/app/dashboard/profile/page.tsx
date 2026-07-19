'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { authService, auditLogsService, api } from '@/lib/api'
import { 
  User as UserIcon, Lock, ClipboardList, Shield, Calendar, Mail, 
  MapPin, Clock, KeyRound, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function UserProfilePage() {
  const { toast } = useToast()

  // Profile Form States
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [joinedAt, setJoinedAt] = useState('')

  // Password Modification States
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Fetch current profile
  const { data: userProfile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile-detail'],
    queryFn: () => authService.fetchProfile()
  })

  // Fetch user activity audit logs
  const { data: auditLogs = [], isLoading: isLogsLoading } = useQuery<any[]>({
    queryKey: ['user-audit-logs'],
    queryFn: () => auditLogsService.getAll()
  })

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '')
      setLastName(userProfile.last_name || '')
      setEmail(userProfile.email || '')
      setRole(userProfile.role || 'DRIVER')
      setJoinedAt(userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : '')
    }
  }, [userProfile])

  // Save profile updates
  const handleUpdateProfile = async () => {
    setIsSavingProfile(true)
    try {
      // In this project, personal details can be updated via a profile POST or general profile serializers update view
      const response = await api.put('/api/auth/profile/', {
        first_name: firstName,
        last_name: lastName
      })
      toast({
        type: 'success',
        title: 'Profile Updated',
        description: 'Personal account details successfully saved.'
      })
      refetchProfile()
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        description: err.message || 'Could not save profile details.'
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Change password handler
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        type: 'error',
        title: 'Validation Error',
        description: 'New password confirmation does not match.'
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      // In this project, we can call password change endpoint
      await api.post('/api/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword
      })
      toast({
        type: 'success',
        title: 'Password Updated',
        description: 'Your security password has been changed.'
      })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        description: err.message || 'Could not verify old password.'
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserIcon className="h-7 w-7 text-primary" />
          My Operator Profile
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal identifiers, update passwords, and inspect security access logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Profile Card and Password Edit */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* User Badge Info Card */}
          <Card className="border bg-card shadow-sm text-center relative overflow-hidden">
            <div className="h-20 bg-primary/10 absolute top-0 left-0 right-0 z-0" />
            <CardContent className="pt-10 space-y-4 relative z-10">
              
              {/* Profile Photo Mock */}
              <div className="h-20 w-20 rounded-full bg-secondary border-2 border-card shadow-md flex items-center justify-center mx-auto text-primary text-3xl font-black uppercase">
                {firstName ? firstName[0] : (email ? email[0] : 'U')}
              </div>

              <div>
                <h3 className="font-bold text-base text-foreground">
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User Profile'}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full mt-1.5 inline-block">
                  {role}
                </span>
              </div>

              <div className="text-left text-xs space-y-2.5 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined on {joinedAt || '2026-07-20'}</span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Change Password Form */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                Update Security Password
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Current Password</label>
                <Input 
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">New Password</label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Confirm New Password</label>
                <Input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button 
                onClick={handleChangePassword} 
                disabled={isUpdatingPassword} 
                className="w-full font-bold active:scale-95 transition-all text-xs"
              >
                {isUpdatingPassword ? 'Updating Password...' : 'Save Password changes'}
              </Button>

            </CardContent>
          </Card>

        </div>

        {/* Details Edit & Activity Logs Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Edit Details */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Personal Information Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">First Name</label>
                  <Input 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Last Name</label>
                  <Input 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
              <Button 
                onClick={handleUpdateProfile}
                disabled={isSavingProfile}
                className="w-full sm:w-auto px-6 font-bold text-xs"
              >
                {isSavingProfile ? 'Saving Details...' : 'Update Profile Details'}
              </Button>
            </CardContent>
          </Card>

          {/* Activity Log Audit Timeline list */}
          <Card className="border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Profile Security Access Logs
              </CardTitle>
              <CardDescription className="text-xs">Chronological trail of updates, configurations, and sign-ins on your profile.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLogsLoading ? (
                <div className="p-12 space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  No activity logs registered for this profile yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 text-foreground font-bold border-b select-none">
                        <th className="p-4 uppercase tracking-wider">Timestamp</th>
                        <th className="p-4 uppercase tracking-wider">IP Address</th>
                        <th className="p-4 uppercase tracking-wider">Logged Event</th>
                        <th className="p-4 uppercase tracking-wider">Context Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-muted-foreground">
                      {auditLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-semibold text-foreground whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4 font-mono">{log.ip_address || '127.0.0.1'}</td>
                          <td className="p-4">
                            <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 max-w-xs truncate text-foreground/80">{log.details || '—'}</td>
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
