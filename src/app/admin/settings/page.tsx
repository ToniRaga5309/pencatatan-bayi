"use client"

// Halaman Pengaturan Sistem (Admin)
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  ArrowLeft, Settings, Database, RefreshCw, Trash2, Info,
  Shield, Server, Clock, Users, Baby, Building, HardDrive,
  LogOut, Menu, IdCard, ClipboardList, TrendingUp, UserCircle,
  Loader2, AlertTriangle, CheckCircle, Globe
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { toast } from "sonner"

interface SystemStats {
  totalRecords: number
  totalUsers: number
  totalPuskesmas: number
  totalAuditLogs: number
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Action states
  const [isResetting, setIsResetting] = useState(false)
  const [isClearingLogs, setIsClearingLogs] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showClearLogsDialog, setShowClearLogsDialog] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchSystemStats()
    }
  }, [session])

  const fetchSystemStats = async () => {
    setIsLoadingStats(true)
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        // Use stats from the existing endpoint
        setSystemStats({
          totalRecords: data.totalAll || 0,
          totalUsers: 0, // We'll compute this differently
          totalPuskesmas: data.puskesmasList?.length || 0,
          totalAuditLogs: 0 // We don't have this in the stats endpoint
        })
      }
    } catch (error) {
      console.error("Error fetching system stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleResetDatabase = async () => {
    setIsResetting(true)
    try {
      const response = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Database berhasil direset")
        setShowResetDialog(false)
        fetchSystemStats()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal mereset database")
      }
    } catch {
      toast.error("Terjadi kesalahan saat mereset database")
    } finally {
      setIsResetting(false)
    }
  }

  const handleClearAuditLogs = async () => {
    setIsClearingLogs(true)
    try {
      const response = await fetch("/api/admin/clear-audit-logs", {
        method: "POST"
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Audit log berhasil dihapus")
        setShowClearLogsDialog(false)
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal menghapus audit log")
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus audit log")
    } finally {
      setIsClearingLogs(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col animate-fadeIn">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                Pengaturan Sistem
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Konfigurasi dan informasi sistem</p>
            </div>
          </div>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/analytics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analitik
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/nik-bayi">
                <IdCard className="w-4 h-4 mr-2" />
                NIK Bayi
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                Kelola User
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/audit-log">
                <ClipboardList className="w-4 h-4 mr-2" />
                Audit Log
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link href="/profile" title="Profil Saya">
                <UserCircle className="w-4 h-4" />
              </Link>
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
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
                <SheetTitle>Menu Admin</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <span className="text-sm text-slate-600 dark:text-slate-400 px-2 py-1">{session.user.namaLengkap}</span>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin/analytics">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analitik
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin/nik-bayi">
                    <IdCard className="w-4 h-4 mr-2" />
                    NIK Bayi
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin/users">
                    <Users className="w-4 h-4 mr-2" />
                    Kelola User
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin/audit-log">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Audit Log
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/profile">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profil Saya
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start mt-4 text-red-600 hover:text-red-700" onClick={() => signOut({ callbackUrl: "/login" })}>
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
      <main className="container mx-auto px-4 py-6 flex-1 max-w-4xl">
        {/* Informasi Aplikasi */}
        <Card className="mb-6 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Informasi Aplikasi
            </CardTitle>
            <CardDescription>Detail sistem dan aplikasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Nama Aplikasi</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sistem Pencatatan Bayi Baru Lahir</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Versi</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">v1.0.0</p>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Stabil</Badge>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Framework</p>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Next.js 15 + TypeScript</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Database</p>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">PostgreSQL (Supabase)</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Session Timeout</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">15 Menit</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Wilayah</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Kabupaten Ngada, NTT</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistik Database */}
        <Card className="mb-6 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              Statistik Database
            </CardTitle>
            <CardDescription>Ringkasan data yang tersimpan dalam sistem</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="relative overflow-hidden p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                  <div className="pl-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Data Kelahiran</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{systemStats?.totalRecords ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">total rekaman</p>
                  </div>
                </div>
                <div className="relative overflow-hidden p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600" />
                  <div className="pl-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pengguna</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{systemStats?.totalPuskesmas ? systemStats.totalPuskesmas + 2 : 0}</p>
                    <p className="text-xs text-slate-400 mt-1">terdaftar</p>
                  </div>
                </div>
                <div className="relative overflow-hidden p-4 rounded-lg bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-teal-600" />
                  <div className="pl-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Puskesmas</p>
                    </div>
                    <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{systemStats?.totalPuskesmas ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">terdaftar</p>
                  </div>
                </div>
                <div className="relative overflow-hidden p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
                  <div className="pl-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Peran</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">3</p>
                    <p className="text-xs text-slate-400 mt-1">Admin, Operator, BPJS</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tindakan Cepat */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              Tindakan Sistem
            </CardTitle>
            <CardDescription>Tindakan administratif yang mempengaruhi data sistem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reset Database */}
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reset Database</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Menghapus semua data dan memuat ulang data awal (seed). Semua data kelahiran, pengguna, dan audit log akan dihapus dan diganti dengan data contoh.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 flex-shrink-0"
                  onClick={() => setShowResetDialog(true)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Database
                </Button>
              </div>
            </div>

            <Separator />

            {/* Clear Audit Logs */}
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Hapus Audit Log</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Menghapus seluruh riwayat audit log. Satu log akan disimpan sebagai catatan penghapusan. Tindakan ini tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 flex-shrink-0"
                  onClick={() => setShowClearLogsDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Log
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sistem Pencatatan Nama Bayi Baru Lahir</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Puskesmas & Dukcapil Kabupaten Ngada</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">&copy; {new Date().getFullYear()} Kabupaten Ngada &middot; v1.0.0</p>
        </div>
      </footer>

      {/* Reset Database Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Reset Database
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mereset database? Semua data akan dihapus dan diganti dengan data contoh. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Semua data kelahiran, pengguna, dan audit log akan dihapus. Data contoh (12 Puskesmas, akun Admin, Operator, BPJS, dan 5 data kelahiran) akan dimuat ulang.
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={handleResetDatabase}
              disabled={isResetting}
            >
              {isResetting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" />Ya, Reset Database</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Audit Logs Dialog */}
      <Dialog open={showClearLogsDialog} onOpenChange={setShowClearLogsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Hapus Semua Audit Log
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus seluruh riwayat audit log? Satu log akan disimpan sebagai catatan penghapusan.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Semua riwayat aktivitas pengguna (login, logout, perubahan data) akan dihapus permanen. Satu catatan log akan tetap tersimpan untuk mencatat tindakan ini.
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearLogsDialog(false)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={handleClearAuditLogs}
              disabled={isClearingLogs}
            >
              {isClearingLogs ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" />Ya, Hapus Semua Log</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
