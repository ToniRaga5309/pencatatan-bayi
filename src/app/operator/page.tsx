"use client"

// Dashboard Operator Puskesmas
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Baby, CheckCircle, Plus, FileText, Loader2, LogOut, Database,
  Clock, IdCard, Menu, XCircle, ChevronRight, Lock, BarChart3, UserCircle
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import { formatDateIndonesia } from "@/lib/utils-common"

interface DashboardStats {
  totalBulanIni: number
  totalVerified: number
  totalAllTime: number
  totalWithNik: number
  totalPending: number
}

interface MonthlyChartData {
  month: string
  jumlah: number
}

export default function OperatorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chartData, setChartData] = useState<MonthlyChartData[]>([])
  const [isChartLoading, setIsChartLoading] = useState(true)

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
      fetchStats()
      fetchChartData()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/operator/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChartData = async () => {
    setIsChartLoading(true)
    try {
      const response = await fetch("/api/operator/chart")
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setIsChartLoading(false)
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

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user || session.user.role !== "OPERATOR") {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col animate-fadeIn">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dashboard Operator</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{session.user.puskesmasNama}</p>
          </div>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-emerald-700">
                  {session.user.namaLengkap.charAt(0).toUpperCase()}
                </span>
              </div>
              <span>Halo, {session.user.namaLengkap}</span>
              <Lock className="w-3 h-3" />
            </button>
            <Button variant="outline" size="icon" asChild>
              <Link href="/profile" title="Profil Saya">
                <UserCircle className="w-4 h-4" />
              </Link>
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
          {/* Mobile Nav */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu Operator</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <span className="text-sm text-slate-600 px-2 py-1">{session.user.namaLengkap}</span>
                <p className="text-xs text-slate-400 px-2">{session.user.puskesmasNama}</p>
                <hr className="my-2" />
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/profile">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profil Saya
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-red-600 hover:text-red-700" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Welcome Section */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/30">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <Baby className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Selamat Datang, {session.user.namaLengkap}!
              </h2>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                {session.user.puskesmasNama}
              </p>
              {stats && stats.totalBulanIni > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  🎉 {stats.totalBulanIni} data tercatat bulan ini. Terus semangat mencatat data kelahiran!
                </p>
              )}
              {stats && stats.totalBulanIni === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  📋 Mulai catat data kelahiran baru untuk bulan ini.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="relative overflow-hidden card-hover animate-stagger-1 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Bulan Ini
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold animate-countUp tabular-nums stat-number">{stats?.totalBulanIni ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Bayi tercatat</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover animate-stagger-2 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Terverifikasi
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 animate-countUp tabular-nums stat-number">{stats?.totalVerified ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Data aktif</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover animate-stagger-3 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Menunggu
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 animate-countUp tabular-nums stat-number">{stats?.totalPending ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Belum verifikasi</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover animate-stagger-4 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                NIK Bayi
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <IdCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 animate-countUp tabular-nums stat-number">{stats?.totalWithNik ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sudah ada NIK</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-1 relative overflow-hidden card-hover animate-stagger-5 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Total
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold animate-countUp tabular-nums stat-number">{stats?.totalAllTime ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Semua data</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/operator/input" className="block">
            <Card className="card-hover card-action-hover cursor-pointer h-full border-2 border-transparent hover:border-emerald-300 dark:hover:border-emerald-600 rounded-xl group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Input Data Baru</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tambahkan data bayi baru lahir</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/operator/riwayat" className="block">
            <Card className="card-hover card-action-hover cursor-pointer h-full border-2 border-transparent hover:border-teal-300 dark:hover:border-teal-600 rounded-xl group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">Riwayat Input</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Lihat data yang sudah diinput</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-teal-500 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Monthly Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Statistik Bulanan
              </CardTitle>
              <CardDescription>Data kelahiran per bulan di {session.user.puskesmasNama}</CardDescription>
            </CardHeader>
            <CardContent>
              {isChartLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                      formatter={(value: number) => [value, "Kelahiran"]}
                    />
                    <Bar dataKey="jumlah" fill="#059669" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* NIK Bayi Status Section - Progress Ring */}
        {(stats && stats.totalAllTime > 0) && (
          <Card className="mb-8 rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="w-5 h-5" />
                Status NIK Bayi
              </CardTitle>
              <CardDescription>
                Proses NIK Bayi untuk data kelahiran di {session.user.puskesmasNama}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Progress Ring */}
                <div className="relative flex-shrink-0">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke-width="8" fill="none" className="stroke-slate-200 dark:stroke-slate-700" />
                    <circle
                      cx="50" cy="50" r="45" stroke-width="8" fill="none"
                      className="stroke-emerald-500 progress-ring-circle"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      style={{ strokeDashoffset: 283 - (283 * (stats.totalAllTime > 0 ? (stats.totalWithNik / stats.totalAllTime) : 0)) }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.totalAllTime > 0 ? Math.round((stats.totalWithNik / stats.totalAllTime) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Data dengan NIK Bayi</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {stats.totalWithNik} dari {stats.totalAllTime}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${stats.totalAllTime > 0 ? (stats.totalWithNik / stats.totalAllTime * 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Data sudah memiliki NIK Bayi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <span className="text-gradient">Aktivitas Terakhir</span>
            </CardTitle>
            <CardDescription>Data yang baru saja diinput</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentRecords />
          </CardContent>
        </Card>
      </main>

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
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${getPasswordStrength(newPassword).color}`} style={{ width: getPasswordStrength(newPassword).width }} />
                  </div>
                  <p className="text-xs text-slate-500">Kekuatan: {getPasswordStrength(newPassword).label}</p>
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

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sistem Pencatatan Nama Bayi Baru Lahir</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Puskesmas & Dukcapil Kabupaten Ngada</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">&copy; {new Date().getFullYear()} Kabupaten Ngada &middot; v1.0.0</p>
        </div>
      </footer>
    </div>
  )
}

// Komponen untuk menampilkan data terbaru
function RecentRecords() {
  const [records, setRecords] = useState<Array<{
    id: string
    namaBayi: string
    namaIbu: string
    tanggalLahir: string
    createdAt: string
    status: string
    nikBayi: string | null
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentRecords()
  }, [])

  const fetchRecentRecords = async () => {
    try {
      const response = await fetch("/api/operator/recent-records")
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      }
    } catch (error) {
      console.error("Error fetching recent records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />Terverifikasi
          </Badge>
        )
      case "PENDING":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs animate-pulse-soft">
            <Clock className="w-3 h-3 mr-1" />Menunggu
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="w-3 h-3 mr-1" />Ditolak
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-bounce-subtle">
          <Baby className="w-7 h-7 text-slate-300 dark:text-slate-600" />
        </div>
        <p>Belum ada data. Klik &quot;Input Data Baru&quot; untuk memulai.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div 
          key={record.id} 
          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{record.namaBayi}</p>
            <p className="text-sm text-slate-500">Ibu: {record.namaIbu}</p>
            {record.nikBayi && (
              <p className="text-xs text-emerald-600 font-mono mt-0.5">
                NIK Bayi: {record.nikBayi}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 ml-3">
            {getStatusBadge(record.status)}
            <p className="text-xs text-slate-400">
              {formatDateIndonesia(record.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
