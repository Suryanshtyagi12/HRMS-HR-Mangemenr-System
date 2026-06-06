// Shared TypeScript types for HRMS Frontend
// Auth types now come from JWT payload (FastAPI-issued tokens)

export type UserRole = "ADMIN" | "SENIOR_MANAGER" | "HR_RECRUITER" | "EMPLOYEE"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  employeeId?: string | null
}

export interface ApiError {
  detail: string
  status?: number
}
