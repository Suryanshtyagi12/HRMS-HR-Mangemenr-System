"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getStoredUser } from "@/lib/auth-client"

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  SENIOR_MANAGER: "/manager/dashboard",
  HR_RECRUITER: "/hr/dashboard",
  EMPLOYEE: "/employee/dashboard",
}

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      router.push("/login")
      return
    }
    const destination = ROLE_ROUTES[user.role] || "/login"
    router.replace(destination)
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen bg-muted">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        <p className="text-sm text-muted-foreground font-medium">Redirecting to your dashboard…</p>
      </div>
    </div>
  )
}
