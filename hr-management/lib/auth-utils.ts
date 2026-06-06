// auth-utils.ts — server-side auth helpers are REMOVED (FastAPI handles auth).
// Role checks are now done client-side via RoleGuard / middleware JWT cookie.
// This file is kept as a stub for any remaining imports.

export function hasPermission(role: string | undefined, action: string): boolean {
  if (!role) return false
  if (role === "ADMIN") return true
  return true
}
