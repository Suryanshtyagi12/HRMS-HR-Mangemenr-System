"use client"
import React, { useState, useEffect } from "react"
import { Search, Menu, LogOut, Settings, User as UserIcon, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"
import { useAuthStore } from "@/store/authStore"
import { logout } from "@/lib/auth-client"
import { usePathname } from "next/navigation"
import { NotificationBell } from "./NotificationBell"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

export function Topbar() {
  const user = useAuthStore((s) => s.user)
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<{employees: any[], jobs: any[]}>({employees: [], jobs: []})
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (searchTerm.length > 2) {
      Promise.all([
        api.get(`/employees?search=${searchTerm}&limit=5`),
        api.get(`/recruitment/jobs`)
      ]).then(([empRes, jobRes]) => {
        const emps = empRes.data.items || []
        const allJobs = jobRes.data.items || []
        const jobs = allJobs.filter((j: any) => j.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
        setSearchResults({ employees: emps, jobs })
      }).catch(console.error)
    } else {
      setSearchResults({ employees: [], jobs: [] })
    }
  }, [searchTerm])

  const breadcrumb = pathname
    .split("/")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "))
    .join(" / ")

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'Administrator';
      case 'SENIOR_MANAGER': return 'Manager';
      case 'HR_RECRUITER': return 'HR Recruiter';
      default: return 'Employee';
    }
  }

  return (
    <header className="flex h-16 items-center justify-between bg-card px-4 md:px-8 border-b border-border shadow-sm z-30 relative">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-card-foreground">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-[#0F172A] border-r border-white/5 w-[280px] text-white">
            <Sidebar onLinkClick={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Breadcrumbs */}
        <div className="flex flex-col">
          <div className="hidden md:flex text-[14px] font-semibold text-foreground font-headline">
            {breadcrumb || "Dashboard"}
          </div>
          <div className="md:hidden text-[16px] font-bold text-indigo-600 font-headline tracking-tight">
            HRMS Pro
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Bar */}
        <button 
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 h-[36px] bg-background border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-[240px]"
        >
          <Search size={16} />
          <span className="text-[13px] flex-1 text-left">Search anything...</span>
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <ThemeToggle />
        <NotificationBell />

        <div className="w-[1px] h-6 bg-border mx-1 hidden sm:block"></div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:bg-muted p-1 pr-2 rounded-full border border-transparent hover:border-border transition-all focus:outline-none">
              <Avatar className="h-[36px] w-[36px] border border-border shadow-sm">
                <AvatarImage src="" alt="Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() ?? <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start text-left">
                <span className="text-[13px] font-semibold text-foreground leading-tight">{user?.name || "User"}</span>
                <span className="text-[11px] font-medium text-muted-foreground leading-tight">{getRoleBadge(user?.role || '')}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px] rounded-[16px] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-border bg-card text-card-foreground animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 p-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-[14px] font-bold text-foreground leading-tight">{user?.name || "User"}</p>
                <p className="text-[12px] text-muted-foreground truncate max-w-[150px]">{user?.email || ""}</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-border mb-1" />
            <div className="p-1">
              <DropdownMenuItem className="flex items-center gap-2 rounded-[10px] text-[13px] font-medium text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-muted focus:bg-muted cursor-pointer p-2.5">
                <UserIcon size={16} /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 rounded-[10px] text-[13px] font-medium text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-muted focus:bg-muted cursor-pointer p-2.5">
                <Settings size={16} /> Settings
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-border my-1" />
            <div className="p-1">
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 rounded-[10px] text-[13px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 focus:bg-rose-50 cursor-pointer p-2.5"
              >
                <LogOut size={16} /> Logout
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Global Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-card text-card-foreground">
          <DialogTitle className="sr-only">Global Search</DialogTitle>
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search employees, jobs..."
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {searchTerm.length <= 2 && (
              <div className="p-4 text-center text-sm text-muted-foreground">Type at least 3 characters to search...</div>
            )}
            {searchTerm.length > 2 && searchResults.employees.length === 0 && searchResults.jobs.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>
            )}
            {searchResults.employees.length > 0 && (
              <div className="mb-4">
                <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground">Employees</h4>
                {searchResults.employees.map(emp => (
                  <div 
                    key={emp.id} 
                    onClick={() => { setSearchOpen(false); router.push(`/admin/employees/${emp.id}`) }}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
                  >
                    <UserIcon className="h-4 w-4 text-indigo-500" />
                    <span>{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</span>
                    <span className="text-xs text-muted-foreground">{emp.designation}</span>
                  </div>
                ))}
              </div>
            )}
            {searchResults.jobs.length > 0 && (
              <div>
                <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground">Jobs</h4>
                {searchResults.jobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => { setSearchOpen(false); router.push(`/hr/recruitment/pipeline?jobId=${job.id}`) }}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
                  >
                    <Briefcase className="h-4 w-4 text-purple-500" />
                    <span>{job.title}</span>
                    <span className="text-xs text-muted-foreground">{job.department}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
