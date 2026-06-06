import Cookies from "js-cookie"
import api from "./api"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "ADMIN" | "SENIOR_MANAGER" | "HR_RECRUITER" | "EMPLOYEE"
  employeeId?: string
}

export const login = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  // FastAPI OAuth2 form expects username field
  const formData = new URLSearchParams()
  formData.append("username", email)
  formData.append("password", password)

  const response = await api.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })

  const { access_token, user } = response.data
  Cookies.set("access_token", access_token, {
    expires: 1, // 1 day
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employee_id,
  }
}

export const logout = () => {
  Cookies.remove("access_token")
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

export const getStoredUser = (): AuthUser | null => {
  const token = Cookies.get("access_token")
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    // JWT exp is in seconds; Date.now() is in ms
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      Cookies.remove("access_token")
      return null
    }
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      employeeId: payload.employee_id,
    }
  } catch {
    return null
  }
}

export const isAuthenticated = (): boolean => {
  return getStoredUser() !== null
}
