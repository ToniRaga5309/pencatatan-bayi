"use client"

// Halaman Login - Sistem Pencatatan Nama Bayi Baru Lahir
// Enhanced with animated bg pattern, refined glassmorphism, input focus glow, remember me, loading spinner, breathing icon
import { Suspense, useState, useSyncExternalStore } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Baby, Loader2, AlertCircle, Shield, Stethoscope, HeartPulse, Eye, EyeOff, User, Lock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return "Selamat Pagi"
  if (hour >= 12 && hour < 15) return "Selamat Siang"
  if (hour >= 15 && hour < 18) return "Selamat Sore"
  return "Selamat Malam"
}

function getIndonesianDate(): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  const now = new Date()
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
}

// Animated moving dots background pattern
function AnimatedDotsBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid of moving dots */}
      <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.05]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.2" fill="currentColor" className="text-emerald-600" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-pattern)">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="40 40"
              dur="20s"
              repeatCount="indefinite"
            />
          </rect>
        </svg>
      </div>

      {/* Floating line accents */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.04] dark:opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0" />
            <stop offset="50%" stopColor="#059669" stopOpacity="1" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="url(#line-grad)" strokeWidth="1">
          <animate attributeName="y1" values="10%;30%;10%" dur="15s" repeatCount="indefinite" />
          <animate attributeName="y2" values="30%;10%;30%" dur="15s" repeatCount="indefinite" />
        </line>
        <line x1="0" y1="60%" x2="100%" y2="60%" stroke="url(#line-grad)" strokeWidth="1">
          <animate attributeName="y1" values="50%;70%;50%" dur="18s" repeatCount="indefinite" />
          <animate attributeName="y2" values="70%;50%;70%" dur="18s" repeatCount="indefinite" />
        </line>
        <line x1="0" y1="85%" x2="100%" y2="85%" stroke="url(#line-grad)" strokeWidth="1">
          <animate attributeName="y1" values="80%;90%;80%" dur="12s" repeatCount="indefinite" />
          <animate attributeName="y2" values="90%;80%;90%" dur="12s" repeatCount="indefinite" />
        </line>
      </svg>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl
      })

      if (result?.error) {
        setError("Username atau password salah")
      } else if (result?.ok) {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="destructive" className="animate-slideUp">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-medium">Username</Label>
        <div className="relative form-group rounded-lg" data-focused={focusedField === "username"}>
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
          <Input
            id="username"
            type="text"
            placeholder="Masukkan username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
            required
            disabled={isLoading}
            autoComplete="username"
            className={`pl-10 h-11 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 transition-all duration-300 input-glow ${focusedField === "username" ? "border-emerald-400 dark:border-emerald-500 ring-0" : ""}`}
          />
          {/* Animated underline */}
          {focusedField === "username" && (
            <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-slide-underline" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
        <div className="relative form-group rounded-lg" data-focused={focusedField === "password"}>
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            required
            disabled={isLoading}
            autoComplete={rememberMe ? "on" : "current-password"}
            className={`pl-10 pr-10 h-11 border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 transition-all duration-300 input-glow ${focusedField === "password" ? "border-emerald-400 dark:border-emerald-500 ring-0" : ""}`}
          />
          {/* Animated underline */}
          {focusedField === "password" && (
            <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-slide-underline" />
          )}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors z-10"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Remember me checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
        <label
          htmlFor="remember"
          className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none"
        >
          Ingat saya
        </label>
      </div>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30 transition-all duration-200 relative overflow-hidden group"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memproses...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>Masuk</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          )}
        </Button>
      </motion.div>

      {/* Role indicators */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default">
          <Shield className="w-3.5 h-3.5" />
          <span>Admin</span>
        </div>
        <div className="w-px h-3 bg-slate-200 dark:bg-slate-600" />
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Operator</span>
        </div>
        <div className="w-px h-3 bg-slate-200 dark:bg-slate-600" />
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>BPJS</span>
        </div>
      </div>
    </form>
  )
}

function LoginLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input disabled placeholder="Memuat..." className="pl-10 h-11" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input disabled placeholder="Memuat..." type="password" className="pl-10 h-11" />
        </div>
      </div>
      <Button disabled className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Memuat...
      </Button>
    </div>
  )
}

const emptySubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function LoginContent() {
  const mounted = useMounted()
  const greeting = mounted ? getGreeting() : "Selamat Datang"
  const indonesianDate = mounted ? getIndonesianDate() : ""

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-page-transition">
      {/* Left Panel - Branding (hidden on mobile, shown on lg) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -left-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 right-1/4 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-1/3 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute bottom-1/4 left-1/4 w-16 h-16 rounded-full bg-white/5" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* App Icon with breathing animation */}
          <div className="mb-8 flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-emerald-900/30 border border-white/20 animate-breathe">
              <Baby className="w-12 h-12 text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.4)]" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-3">
            Sistem Pencatatan<br />Bayi Baru Lahir
          </h1>
          <p className="text-emerald-100 text-lg mb-1">
            Kabupaten Ngada, NTT
          </p>
          <p className="text-emerald-200/70 text-sm mb-10">
            Puskesmas & Dinas Kependudukan dan Pencatatan Sipil
          </p>

          {/* Role Cards */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 hover:bg-white/15 transition-colors duration-200">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Admin Dukcapil</p>
                <p className="text-emerald-200/70 text-xs">Verifikasi dan kelola data kelahiran</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 hover:bg-white/15 transition-colors duration-200">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Operator Puskesmas</p>
                <p className="text-emerald-200/70 text-xs">Input data bayi baru lahir</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 hover:bg-white/15 transition-colors duration-200">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">BPJS Kesehatan</p>
                <p className="text-emerald-200/70 text-xs">Akses data NIK bayi terdaftar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Branding Header */}
      <div className="lg:hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white px-6 pt-10 pb-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20 shadow-lg animate-breathe">
            <Baby className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
          </div>
          <h1 className="text-xl font-bold mb-1">Sistem Pencatatan Bayi Baru Lahir</h1>
          <p className="text-emerald-200/80 text-sm">Kabupaten Ngada, NTT</p>
        </div>
      </div>

      {/* Right Panel - Login Form with Glassmorphism */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
        {/* Animated background pattern */}
        <AnimatedDotsBackground />

        {/* Animated blob decorations */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-100/20 dark:bg-emerald-800/10 rounded-full blur-2xl animate-[pulse_12s_ease-in-out_infinite_4s]" />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile: hide, Desktop: show logo */}
          <div className="hidden lg:flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Baby className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sistem Pencatatan Bayi Baru Lahir</span>
          </div>

          {/* Theme toggle */}
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          {/* Glassmorphism Card - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="glass-card-deep rounded-2xl p-6 sm:p-8"
          >
            {/* Time-based greeting */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {greeting || "Selamat Datang"}
              </h2>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                {indonesianDate}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Masuk ke sistem pencatatan data bayi baru lahir<br className="hidden sm:block" /> Kabupaten Ngada
              </p>
            </div>

            {/* Login Form */}
            <Suspense fallback={<LoginLoading />}>
              <LoginForm />
            </Suspense>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 text-center lg:absolute lg:bottom-0 lg:left-0 lg:right-0">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} Pemerintah Kabupaten Ngada &mdash; Dinas Kependudukan dan Pencatatan Sipil
        </p>
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return <LoginContent />
}
