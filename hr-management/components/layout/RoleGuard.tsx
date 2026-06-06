"use client"

import { useAuthStore } from "@/store/authStore"
import { ReactNode } from "react"
import { Loader2 } from "lucide-react"

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  if (!isHydrated) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    )
  }

  const role = user?.role

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 bg-card rounded-lg border shadow-sm p-8 max-w-md mx-auto mt-10">
        <h2 className="text-2xl font-bold text-red-600">403 — Access Denied</h2>
        <p className="text-gray-500 text-center">
          You do not have permission to view this page. Your role:{" "}
          <span className="font-semibold">{role || "Guest"}</span>
        </p>
      </div>
    )
  }

  return <>{children}</>
}
