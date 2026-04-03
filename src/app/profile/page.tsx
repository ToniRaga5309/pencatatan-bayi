"use client"

// Halaman Profil Pengguna (Shared untuk semua role)
// Enhanced with gradient banner, activity timeline, and theme toggle
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ArrowLeft, User, Loader2, Shield, LogOut, Lock, Calendar,
  Building, Baby, CheckCircle, Clock, HeartPulse, Pencil, Save, X,
  LogIn, PlusCircle, Edit, Download, XCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { formatDateIndonesia, formatDateTimeIndonesia } from "@/lib/utils-common"

interface ProfileData {
  id: string
  username: string
  namaLengkap: string
  role: string
  isActive: boolean
  puskesmasId: string | null
  puskesmas: {
    id: string
    nama: string
    kodeWilayah: string
    alamat: string | null
  } | null
  createdAt: string
  updatedAt: string
  totalRecords: number
  totalVerified: number
  lastLogin: string | null
}

interface ActivityEntry {
  id: string
  action: string
  entity: string
  details: string | null
  createdAt: string
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Baru saja"
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays === 1) return "Kemarin"
  if (diffDays < 7) return `${diffDays} hari lalu`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`
  return formatDateIndonesia(dateStr)
}

function getActionIcon(action: string) {
  switch (action) {
    case "LOGIN": return <LogIn className="w-4 h-4" />
    case "LOGOUT": return <LogOut className="w-4 h-4" />
    case "CREATE": return <PlusCircle className="w-4 h-4" />
    case "UPDATE": return <Edit className="w-4 h-4" />
    case "VERIFY": return <CheckCircle className="w-4 h-4" />
    case "REJECT": return <XCircle className="w-4 h-4" />
    case "EXPORT": return <Download className="w-4 h-4" />
    default: return <Clock className="w-4 h-4" />
  }
}

function getActionColor(action: string): string {
  switch (action) {
    case "VERIFY": return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "REJECT": return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
    case "CREATE": return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    case "UPDATE": return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
    case "LOGIN": return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "LOGOUT": return "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400"
    case "EXPORT": return "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
    default: return "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400"
  }
}

function getActionLabel(action: string, entity: string): string {
  const entityLabels: Record<string, string> = {
    "BirthRecord": "Data Kelahiran",
    "User": "Pengguna",
    "Auth": "Autentikasi",
  }
  const actionLabels: Record<string, string> = {
    "LOGIN": "Login ke sistem",
    "LOGOUT": "Logout dari sistem",
    "CREATE": `Membuat ${entityLabels[entity] || entity}`,
    "UPDATE": `Memperbarui ${entityLabels[entity] || entity}`,
    "VERIFY": `Memverifikasi ${entityLabels[entity] || entity}`,
    "REJECT": `Menolak ${entityLabels[entity] || entity}`,
    "EXPORT": `Mengekspor ${entityLabels[entity] || entity}`,
  }
  return actionLabels[action] || `${action} ${entityLabels[entity] || entity}`
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)

  // Edit name
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)

  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
      fetchActivity()
    }
  }, [session])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        toast.error("Gagal memuat profil")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActivity = async () => {
    setIsLoadingActivity(true)
    try {
      const response = await fetch("/api/auth/activity")
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch {
      // silently fail for activity
    } finally {
      setIsLoadingActivity(false)
    }
  }

  const handleSaveName = async () => {
    if (!editName || editName.length < 3) {
      toast.error("Nama lengkap minimal 3 karakter")
      return
    }

    setIsSavingName(true)
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaLengkap: editName }),
      })
      if (response.ok) {
        toast.success("Nama berhasil diperbarui")
        setIsEditingName(false)
        fetchProfile()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal memperbarui nama")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Semua field harus diisi")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok")
      return
    }
    setIsChangingPassword(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      if (response.ok) {
        toast.success("Password berhasil diubah")
        setShowPasswordDialog(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal mengubah password")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { label: "", color: "", width: "0%" }
    if (pw.length < 6) return { label: "Lemah", color: "bg-red-500", width: "25%" }
    if (pw.length < 8) return { label: "Cukup", color: "bg-amber-500", width: "50%" }
    if (pw.match(/[A-Z]/) && pw.match(/[0-9]/)) return { label: "Kuat", color: "bg-emerald-500", width: "85%" }
    return { label: "Baik", color: "bg-emerald-500", width: "70%" }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge className="bg-emerald-600 gap-1">
            <Shield className="w-3 h-3" />
            Admin Dukcapil
          </Badge>
        )
      case "OPERATOR":
        return (
          <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-teal-200 gap-1">
            <User className="w-3 h-3" />
            Operator Puskesmas
          </Badge>
        )
      case "BPJS":
        return (
          <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200 gap-1">
            <HeartPulse className="w-3 h-3" />
            BPJS Kesehatan
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getBackLink = () => {
    const role = session?.user?.role
    if (role === "ADMIN") return "/admin"
    if (role === "BPJS") return "/bpjs"
    return "/operator"
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Gradient Banner / Profile Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-32 sm:h-40 relative">
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />
      </div>

      {/* Header - overlaps gradient banner */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 -mt-8">
        {/* Gradient line */}
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={getBackLink()}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Profil Saya</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Informasi akun pengguna</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)}>
              <Lock className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Ubah Password</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1 max-w-3xl -mt-4">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : profile ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Profile Card - Avatar overlaps gradient banner */}
            <Card className="pt-16 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 card-hover">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 -mt-20">
                  {/* Avatar - overlapping the card with animated gradient */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-900 animate-breathe">
                    <span className="text-3xl font-bold text-white">
                      {profile.namaLengkap.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-xl font-bold max-w-xs"
                          autoFocus
                          onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={isSavingName}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setIsEditingName(false); setEditName(profile.namaLengkap) }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profile.namaLengkap}</h2>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                          onClick={() => { setEditName(profile.namaLengkap); setIsEditingName(true) }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-slate-500 dark:text-slate-400">@{profile.username}</p>
                    <div className="mt-2">
                      {getRoleBadge(profile.role)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card - with hover effects and visual separation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Info */}
              <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 card-hover card-action-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4 text-emerald-600" />
                    Informasi Akun
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <User className="w-4 h-4" />
                      Username
                    </div>
                    <span className="text-sm font-medium font-mono">{profile.username}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <User className="w-4 h-4" />
                      Nama Lengkap
                    </div>
                    <span className="text-sm font-medium">{profile.namaLengkap}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Shield className="w-4 h-4" />
                      Role
                    </div>
                    {getRoleBadge(profile.role)}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      Bergabung
                    </div>
                    <span className="text-sm">{formatDateIndonesia(profile.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 card-hover card-action-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Baby className="w-4 h-4 text-emerald-600" />
                    Ringkasan Aktivitas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.role === "OPERATOR" && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <FileIcon className="w-4 h-4" />
                          Total Input
                        </div>
                        <span className="text-sm font-bold text-emerald-600">{profile.totalRecords} data</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  {profile.role === "ADMIN" && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <CheckCircle className="w-4 h-4" />
                          Total Diverifikasi
                        </div>
                        <span className="text-sm font-bold text-emerald-600">{profile.totalVerified} data</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  {profile.puskesmas && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <Building className="w-4 h-4" />
                          Puskesmas
                        </div>
                        <span className="text-sm font-medium">{profile.puskesmas.nama}</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      Login Terakhir
                    </div>
                    <span className="text-sm">
                      {profile.lastLogin ? formatDateTimeIndonesia(profile.lastLogin) : "Tidak tersedia"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline Card - with enhanced connecting lines */}
            <Card className="rounded-xl shadow-sm card-action-hover">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Aktivitas Terakhir
                </CardTitle>
                <CardDescription>5 aktivitas terakhir Anda</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivity ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                    <Clock className="w-10 h-10 mb-3" />
                    <p className="text-sm">Belum ada aktivitas</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {activities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex gap-3 group"
                      >
                        {/* Timeline line and icon */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 hover:scale-110 ${getActionColor(activity.action)}`}>
                            {getActionIcon(activity.action)}
                          </div>
                          {index < activities.length - 1 && (
                            <div className="w-px flex-1 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 my-1 min-h-[16px]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pb-4 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {getActionLabel(activity.action, activity.entity)}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {getRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 card-hover card-action-hover">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Keamanan Akun
                </CardTitle>
                <CardDescription>Kelola keamanan akun Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setShowPasswordDialog(true)} className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 btn-hover">
                  <Lock className="w-4 h-4 mr-2" />
                  Ubah Password
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Gagal memuat profil
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sistem Pencatatan Nama Bayi Baru Lahir</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Puskesmas & Dukcapil Kabupaten Ngada</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">&copy; {new Date().getFullYear()} Kabupaten Ngada</p>
        </div>
      </footer>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Ubah Password
            </DialogTitle>
            <DialogDescription>Masukkan password lama dan password baru Anda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Password Lama</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password lama"
              />
            </div>
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
              />
              {newPassword && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${getPasswordStrength(newPassword).color}`} style={{ width: getPasswordStrength(newPassword).width }} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kekuatan: {getPasswordStrength(newPassword).label}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password Baru</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Password tidak cocok</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Batal</Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isChangingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Simple file icon component for inline use
function FileIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}
