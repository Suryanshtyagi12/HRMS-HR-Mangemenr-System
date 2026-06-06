"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Eye, EyeOff, Mail, Lock, Users, ShieldCheck, BarChart3, KeyRound, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/auth-client"
import { useAuthStore } from "@/store/authStore"
import { motion } from "framer-motion"
import NumberFlow from "@number-flow/react"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

const demoRoles = [
  { role: "ADMIN", label: "Admin", email: "admin@hrmspro.com", password: "admin123" },
  { role: "SENIOR_MANAGER", label: "Manager", email: "manager@hrmspro.com", password: "manager123" },
  { role: "HR_RECRUITER", label: "HR", email: "hr@hrmspro.com", password: "hr123" },
  { role: "EMPLOYEE", label: "Employee", email: "employee@hrmspro.com", password: "employee123" },
]

const features = [
  { icon: Users, title: "Team Management", desc: "Manage your entire workforce in one place" },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Live insights across your organisation" },
  { icon: ShieldCheck, title: "Enterprise Security", desc: "SOC2 compliant, GDPR ready" },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const handleLogin = async (email: string, password: string) => {
    const user = await login(email, password)
    setUser(user)
    router.push("/dashboard")
  }

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)
    try { await handleLogin(data.email, data.password) }
    catch { setError("Invalid email or password. Please try again.") }
    finally { setIsLoading(false) }
  }

  const handleDemoLogin = async (role: (typeof demoRoles)[0]) => {
    setLoadingRole(role.role)
    setError(null)
    setValue("email", role.email)
    setValue("password", role.password)
    try { await handleLogin(role.email, role.password) }
    catch { setError("Demo login failed. Please ensure the backend is running.") }
    finally { setLoadingRole(null) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-body bg-[#0F172A] relative overflow-hidden">
      {/* Animated Background blobs */}
      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-15px,25px) scale(0.97)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,20px) scale(1.04)} 66%{transform:translate(20px,-30px) scale(0.98)} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,-15px) scale(1.06)} }
        @keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .blob1 { animation: blob1 12s ease-in-out infinite; }
        .blob2 { animation: blob2 15s ease-in-out infinite; }
        .blob3 { animation: blob3 10s ease-in-out infinite; }
        .float-card { animation: floatCard 4s ease-in-out infinite; }
      `}</style>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="blob1 absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" />
        <div className="blob2 absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px]" />
        <div className="blob3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px]" />
        {/* Geometric accents */}
        <div className="absolute top-[15%] right-[20%] w-3 h-3 rotate-45 border border-indigo-500/30" />
        <div className="absolute top-[70%] left-[15%] w-2 h-2 rotate-45 bg-violet-500/40" />
        <div className="absolute top-[35%] left-[8%] w-1.5 h-1.5 rounded-full bg-indigo-400/40" />
        <div className="absolute bottom-[25%] right-[12%] w-2 h-2 rounded-full bg-violet-400/30" />
        {/* Dot grid */}
        <div className="absolute top-[20%] right-[8%] grid grid-cols-4 gap-1.5 opacity-20">
          {Array(16).fill(0).map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-indigo-400" />)}
        </div>
        <div className="absolute bottom-[20%] left-[8%] grid grid-cols-4 gap-1.5 opacity-20">
          {Array(16).fill(0).map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-violet-400" />)}
        </div>
      </div>

      {/* Central Card — inspired by the design.md card layout */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[960px] mx-4 rounded-[28px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col lg:flex-row min-h-[580px]"
      >
        {/* ── LEFT PANEL: Illustration + branding ─────────────────── */}
        <div className="relative lg:w-[48%] bg-gradient-to-br from-[#312E81] via-[#1E1B4B] to-[#0F172A] flex flex-col justify-between p-8 lg:p-10 text-white overflow-hidden">
          {/* Decorative key illustration using CSS shapes */}
          <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none overflow-hidden">
            {/* Large circle accent */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/5" />
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-indigo-500/20" />
            {/* Bottom shape */}
            <div className="absolute -bottom-24 -left-12 w-56 h-56 rounded-full bg-indigo-600/10 blur-2xl" />
          </div>

          {/* Top: Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
              <KeyRound size={20} className="text-white" />
            </div>
            <div>
              <div className="text-[16px] font-bold tracking-tight font-headline">HRMS Pro</div>
              <div className="text-[11px] text-indigo-300 font-medium">Enterprise Edition</div>
            </div>
          </div>

          {/* Center: Headline + illustration */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-6">
            <p className="text-[12px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Welcome to the portal</p>
            <h1 className="text-[30px] lg:text-[34px] font-bold font-headline leading-[1.2] mb-6 tracking-tight">
              Your People.<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Your Platform.</span>
            </h1>

            {/* Floating feature pills - inspired by the collaborative access design */}
            <div className="float-card space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 bg-white/5 border border-white/8 backdrop-blur-sm rounded-xl px-4 py-3"
                >
                  <div className="w-8 h-8 bg-indigo-500/20 border border-indigo-500/30 rounded-lg flex items-center justify-center shrink-0">
                    <f.icon size={15} className="text-indigo-300" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-white leading-tight">{f.title}</div>
                    <div className="text-[11px] text-indigo-200/70 leading-tight mt-0.5">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between">
            {[
              { value: 50, label: "Employees", suffix: "+" },
              { value: 4, label: "Roles", suffix: "" },
              { value: 99, label: "Uptime %", suffix: "%" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-[20px] font-bold font-headline flex items-center justify-center gap-0.5 text-white">
                  <NumberFlow value={s.value} />{s.suffix}
                </div>
                <div className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL: Login form — the "angled form box" from design.md ── */}
        <div className="relative lg:w-[52%] flex flex-col bg-[#0D1117]">
          {/* Angled top edge for the form container — CSS clip-path approach */}
          <div
            className="hidden lg:block absolute top-0 -left-6 w-12 h-full bg-[#0D1117] z-10"
            style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%, 40% 0)" }}
          />

          <div className="relative z-20 flex flex-col justify-center flex-1 px-8 lg:px-10 py-10">
            {/* Form header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Secure Sign In</span>
              </div>
              <h2 className="text-[26px] font-bold font-headline text-white mb-1 tracking-tight">Welcome Back</h2>
              <p className="text-[14px] text-slate-400">Sign in to your HRMS Pro account</p>
            </div>

            {/* Quick access demo roles */}
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Access</p>
              <div className="grid grid-cols-2 gap-2">
                {demoRoles.map((role) => (
                  <motion.button
                    key={role.role}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDemoLogin(role)}
                    disabled={!!loadingRole}
                    className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-white/8 bg-white/4 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-slate-300 hover:text-white transition-all duration-150 text-left group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:bg-indigo-400 shrink-0" />
                    <span className="text-[12px] font-medium flex-1">{role.label}</span>
                    {loadingRole === role.role && <Loader2 size={12} className="animate-spin text-indigo-400" />}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[11px] text-slate-600 font-medium">or enter credentials</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-[13px] font-medium text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="you@company.com"
                    className="block w-full pl-10 pr-4 h-[46px] border border-white/10 rounded-[12px] text-[14px] bg-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                  />
                </div>
                {errors.email && <p className="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-11 h-[46px] border border-white/10 rounded-[12px] text-[14px] bg-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-rose-400 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0" />
                  <span className="text-[12px] text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-[12px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(99,102,241,0.35)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center h-[48px] rounded-[12px] text-[15px] font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-[0_4px_24px_rgba(99,102,241,0.3)]"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin mr-2" size={18} />Signing in…</>
                ) : "Sign In"}
              </motion.button>
            </form>

            {/* Trust bar */}
            <div className="mt-8 flex items-center justify-center gap-5 text-[11px] text-slate-600 font-medium">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> SSL Secured</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> SOC2</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> GDPR</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
