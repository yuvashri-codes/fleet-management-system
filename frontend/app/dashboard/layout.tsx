'use client';

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Menu, X, LayoutDashboard, Truck, Users, MapPin, 
  Flame, Wrench, FileText, BarChart3, Settings, LogOut, 
  Search, Bell, User as UserIcon, Lock, ChevronLeft, ChevronRight, Moon, Sun
} from 'lucide-react'
import { authService } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { User } from '@/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false)
  const [showNotifications, setShowNotifications] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // Auth protection check
  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    const token = localStorage.getItem('accessToken')

    if (!token || !currentUser) {
      toast({
        type: 'error',
        title: 'Access Denied',
        description: 'Please authenticate to access the dashboard.',
      })
      router.push('/login')
    } else {
      setUser(currentUser)
      setIsAuthenticated(true)
      
      // Attempt to fetch fresh profile from API to ensure token is valid and data is fresh
      authService.fetchProfile()
        .then((freshUser) => {
          setUser(freshUser)
        })
        .catch((err) => {
          console.error("Profile refresh failed:", err)
        })
    }
  }, [router, toast])

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      if (!isDarkMode) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  const handleLogout = () => {
    authService.logout()
    toast({
      type: 'info',
      title: 'Logged Out',
      description: 'You have been successfully signed out of FleetGuard.',
    })
  }

  // Navigation Items
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', active: true, disabled: false },
    { name: 'Vehicles', icon: Truck, href: '#', active: false, disabled: true },
    { name: 'Drivers', icon: Users, href: '#', active: false, disabled: true },
    { name: 'Trips', icon: MapPin, href: '#', active: false, disabled: true },
    { name: 'Fuel Management', icon: Flame, href: '#', active: false, disabled: true },
    { name: 'Maintenance', icon: Wrench, href: '#', active: false, disabled: true },
    { name: 'Reports', icon: FileText, href: '#', active: false, disabled: true },
    { name: 'Analytics', icon: BarChart3, href: '#', active: false, disabled: true },
    { name: 'Settings', icon: Settings, href: '#', active: false, disabled: true },
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      
      {/* SIDEBAR - Desktop (Collapsible) */}
      <aside 
        className={`hidden lg:flex flex-col border-r bg-secondary text-secondary-foreground transition-all duration-300 relative z-30 h-screen select-none ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary text-white">
              <Shield className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col"
              >
                <span className="font-bold text-sm tracking-tight text-white">FleetGuard</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Enterprise</span>
              </motion.div>
            )}
          </div>
          
          {/* Collapse toggle button */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.name} className="relative group">
                <a
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    item.active 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : item.disabled
                        ? 'text-gray-500 cursor-not-allowed opacity-50'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={(e) => {
                    if (item.disabled) e.preventDefault()
                  }}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                  
                  {/* Lock Indicator for disabled items */}
                  {item.disabled && !isSidebarCollapsed && (
                    <Lock className="h-3 w-3 ml-auto text-gray-500" />
                  )}
                </a>

                {/* Collapsed Hover Tooltip */}
                {isSidebarCollapsed && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs font-semibold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                    {item.name} {item.disabled ? '(Disabled)' : ''}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/5 space-y-1">
          {/* Profile Quick-view if collapsed */}
          {!isSidebarCollapsed && (
            <div className="bg-white/5 rounded-lg p-3 mb-2 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white truncate">{user?.full_name || 'System User'}</h4>
                <p className="text-[10px] text-muted-foreground truncate">{user?.role?.replace('_', ' ') || 'Driver'}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all active:scale-[0.98]"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR (Slide-in) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-72 bg-secondary text-secondary-foreground z-50 flex flex-col p-4 shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary text-white">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-white">FleetGuard</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Enterprise</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        item.active 
                          ? 'bg-primary text-white' 
                          : item.disabled
                            ? 'text-gray-500 opacity-50 cursor-not-allowed'
                            : 'text-gray-300 hover:bg-white/5'
                      }`}
                      onClick={(e) => {
                        if (item.disabled) e.preventDefault()
                        else setIsMobileOpen(false)
                      }}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.name}</span>
                      {item.disabled && <Lock className="h-3 w-3 ml-auto text-gray-500" />}
                    </a>
                  )
                })}
              </nav>

              <div className="pt-4 border-t border-white/5 mt-4 space-y-3">
                <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white truncate">{user?.full_name || 'System User'}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.role?.replace('_', ' ') || 'Driver'}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card text-card-foreground z-20 flex-shrink-0 shadow-sm relative">
          
          {/* Mobile Sidebar Toggle & Page Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Global Search box */}
            <div className="hidden md:flex items-center relative w-64">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Global telemetry search..."
                className="w-full pl-9 pr-4 py-1.5 bg-muted/60 border border-input rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-all"
              />
            </div>
          </div>

          {/* Right Header Operations */}
          <div className="flex items-center gap-3 select-none">
            
            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notifications Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowProfileMenu(false)
                }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all relative"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 rounded-xl border bg-card p-4 shadow-xl z-50 glass-panel"
                    >
                      <div className="flex justify-between items-center pb-2 border-b mb-2">
                        <span className="font-bold text-sm">Notifications</span>
                        <span className="text-[10px] bg-accent/25 text-accent-foreground px-2 py-0.5 rounded-full font-bold">1 New</span>
                      </div>
                      <div className="space-y-3 py-1">
                        <div className="text-xs flex gap-2.5 items-start bg-accent/5 p-2 rounded-lg">
                          <Truck className="h-4 w-4 text-accent mt-0.5" />
                          <div>
                            <p className="font-bold">Sprint 1 Configured</p>
                            <p className="text-muted-foreground text-[10px]">All base auth endpoints are active & running.</p>
                          </div>
                        </div>
                        <div className="text-xs flex gap-2.5 items-start p-2 hover:bg-muted rounded-lg opacity-70">
                          <Shield className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-semibold">Security Shield Active</p>
                            <p className="text-muted-foreground text-[10px]">SimpleJWT tokens rotating properly.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu)
                  setShowNotifications(false)
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-bold truncate max-w-[120px]">{user?.full_name || 'System User'}</span>
                  <span className="text-[9px] text-muted-foreground capitalize">{user?.role?.replace('_', ' ')?.toLowerCase() || 'driver'}</span>
                </div>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border bg-card p-2 shadow-xl z-50 glass-panel"
                    >
                      <div className="px-3 py-2 border-b mb-1.5 text-xs">
                        <p className="font-bold truncate">{user?.full_name}</p>
                        <p className="text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          setShowProfileMenu(false)
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-muted font-medium"
                      >
                        <UserIcon className="h-4 w-4" />
                        My Profile
                      </a>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 font-bold transition-all text-left mt-1.5 border-t pt-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* DASHBOARD PAGE CONTENT WRAPPER */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-6 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}
