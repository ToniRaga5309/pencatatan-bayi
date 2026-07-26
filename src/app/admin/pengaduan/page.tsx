"use client"

// Halaman Kelola Pengaduan (Admin)
import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  MessageSquare, Loader2, LogOut, Menu, Lock,
  UserCircle, ArrowLeft, Clock, CheckCircle, AlertCircle, RefreshCw,
  ChevronLeft, ChevronRight, Search, Inbox, Reply, Send, Building,
  Settings, TrendingUp, Users, ClipboardList, IdCard, Paperclip, Printer
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { toast } from "sonner"
import { formatDateTimeIndonesia } from "@/lib/utils-common"

interface Pengaduan {
  id: string
  userId: string
  subjek: string
  pesan: string
  kategori: string
  prioritas: string
  status: string
  balasan: string | null
  balasanOleh: string | null
  balasanPada: Date | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    namaLengkap: string
    username: string
    puskesmas: { nama: string } | null
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface StatusCounts {
  TERBUKA: number
  DIPROSES: number
  SELESAI: number
  DITUTUP: number
}

const KATEGORI_LABEL: Record<string, string> = {
  SISTEM: "Masalah Sistem",
  DATA: "Masalah Data",
  PROSES: "Proses Verifikasi",
  LAINNYA: "Lainnya",
}

const PRIORITAS_LABEL: Record<string, string> = {
  RENDAH: "Rendah",
  SEDANG: "Sedang",
  TINGGI: "Tinggi",
}

const STATUS_LABEL: Record<string, string> = {
  TERBUKA: "Terbuka",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITUTUP: "Ditutup",
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "TERBUKA":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
    case "DIPROSES":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
    case "SELESAI":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
    case "DITUTUP":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
    default:
      return "bg-slate-100 text-slate-600 border-slate-200"
  }
}

function getPrioritasBadgeClass(prioritas: string): string {
  switch (prioritas) {
    case "TINGGI":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
    case "SEDANG":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
    case "RENDAH":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
    default:
      return "bg-slate-100 text-slate-600 border-slate-200"
  }
}

export default function AdminPengaduanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pengaduanList, setPengaduanList] = useState<Pengaduan[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [statusCounts, setStatusCounts] = useState<StatusCounts | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("SEMUA")
  const [kategoriFilter, setKategoriFilter] = useState("SEMUA")
  const [prioritasFilter, setPrioritasFilter] = useState("SEMUA")

  // Reply dialog
  const [replyTarget, setReplyTarget] = useState<Pengaduan | null>(null)
  const [replyText, setReplyText] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const fetchPengaduan = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "15")
      if (search) params.set("search", search)
      if (statusFilter !== "SEMUA") params.set("status", statusFilter)
      if (kategoriFilter !== "SEMUA") params.set("kategori", kategoriFilter)
      if (prioritasFilter !== "SEMUA") params.set("prioritas", prioritasFilter)

      const res = await fetch(`/api/admin/pengaduan?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPengaduanList(data.records || [])
        setPagination(data.pagination || null)
        setStatusCounts(data.statusCounts || null)
      } else {
        toast.error("Gagal memuat data pengaduan")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan")
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter, kategoriFilter, prioritasFilter])

  useEffect(() => {
    if (session?.user) {
      fetchPengaduan()
    }
  }, [session, fetchPengaduan])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const openReplyDialog = (p: Pengaduan) => {
    setReplyTarget(p)
    setReplyText(p.balasan || "")
    setNewStatus(p.status === "TERBUKA" ? "DIPROSES" : p.status)
  }

  const handleReply = async () => {
    if (!replyTarget) return
    if (!replyText.trim()) {
      toast.error("Balasan tidak boleh kosong")
      return
    }
    setIsSubmitting(true)
    try {
      const body: Record<string, unknown> = { balasan: replyText.trim() }
      if (newStatus && newStatus !== replyTarget.status) {
        body.status = newStatus
      }
      const res = await fetch(`/api/admin/pengaduan/${replyTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Balasan berhasil dikirim")
        setReplyTarget(null)
        setReplyText("")
        fetchPengaduan()
      } else {
        toast.error(data.error || "Gagal mengirim balasan")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickStatus = async (p: Pengaduan, status: string) => {
    try {
      const res = await fetch(`/api/admin/pengaduan/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Status diubah ke ${STATUS_LABEL[status]}`)
        fetchPengaduan()
      } else {
        toast.error(data.error || "Gagal mengubah status")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/admin" title="Kembali ke Dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Pengaduan Operator
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Kelola pengaduan dari operator puskesmas</p>
            </div>
          </div>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="btn-hover">
              <Link href="/admin/analytics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analitik
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="btn-hover">
              <Link href="/admin/puskesmas">
                <Building className="w-4 h-4 mr-2" />
                Puskesmas
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="btn-hover">
              <Link href="/admin/nik-bayi">
                <IdCard className="w-4 h-4 mr-2" />
                NIK Bayi
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="btn-hover">
              <Link href="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                User
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild className="btn-hover" title="Pengaturan Sistem">
              <Link href="/admin/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {session.user.namaLengkap.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden md:inline">Halo, {session.user.namaLengkap}</span>
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
                <SheetTitle>Menu Admin</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <span className="text-sm text-slate-600 dark:text-slate-400 px-2 py-1">{session.user.namaLengkap}</span>
                <hr className="my-2" />
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
                  <Link href="/admin/puskesmas">
                    <Building className="w-4 h-4 mr-2" />
                    Puskesmas
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
                  <Link href="/admin/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Pengaturan
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-red-600 hover:text-red-700" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="rounded-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Terbuka</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{statusCounts?.TERBUKA ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Diproses</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{statusCounts?.DIPROSES ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Selesai</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{statusCounts?.SELESAI ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{pagination?.total ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari subjek, pesan, atau nama operator..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Status</SelectItem>
                <SelectItem value="TERBUKA">Terbuka</SelectItem>
                <SelectItem value="DIPROSES">Diproses</SelectItem>
                <SelectItem value="SELESAI">Selesai</SelectItem>
                <SelectItem value="DITUTUP">Ditutup</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kategoriFilter} onValueChange={(v) => { setKategoriFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Kategori</SelectItem>
                <SelectItem value="SISTEM">Masalah Sistem</SelectItem>
                <SelectItem value="DATA">Masalah Data</SelectItem>
                <SelectItem value="PROSES">Proses Verifikasi</SelectItem>
                <SelectItem value="LAINNYA">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioritasFilter} onValueChange={(v) => { setPrioritasFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Prioritas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua Prioritas</SelectItem>
                <SelectItem value="TINGGI">Tinggi</SelectItem>
                <SelectItem value="SEDANG">Sedang</SelectItem>
                <SelectItem value="RENDAH">Rendah</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchPengaduan} title="Muat ulang">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : pengaduanList.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tidak ada pengaduan
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Belum ada pengaduan yang masuk dengan filter saat ini.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1 pengaduan-scroll">
            {pengaduanList.map((p) => (
              <Card key={p.id} className="rounded-xl border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  {/* Top row: user info + badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            {p.user.namaLengkap.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {p.user.namaLengkap}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {p.user.puskesmas?.nama || "—"}
                          </p>
                        </div>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-snug mt-2">
                        {p.subjek}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className={getStatusBadgeClass(p.status)}>
                          {STATUS_LABEL[p.status] || p.status}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                          {KATEGORI_LABEL[p.kategori] || p.kategori}
                        </Badge>
                        <Badge variant="outline" className={getPrioritasBadgeClass(p.prioritas)}>
                          {PRIORITAS_LABEL[p.prioritas] || p.prioritas}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReplyDialog(p)}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                      >
                        <Reply className="w-3.5 h-3.5 mr-1.5" />
                        {p.balasan ? "Lihat/Edit" : "Balas"}
                      </Button>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 mb-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {p.pesan}
                    </p>
                  </div>

                  {/* Balasan (if exists) */}
                  {p.balasan && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-3 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Reply className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          Balasan Anda
                        </span>
                        {p.balasanPada && (
                          <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                            • {formatDateTimeIndonesia(p.balasanPada)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap line-clamp-3">
                        {p.balasan}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Dikirim: {formatDateTimeIndonesia(p.createdAt)}
                    </span>
                    {/* Quick status buttons */}
                    <div className="flex gap-1">
                      {p.status !== "DIPROSES" && p.status !== "SELESAI" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          onClick={() => handleQuickStatus(p, "DIPROSES")}
                        >
                          Tandai Diproses
                        </Button>
                      )}
                      {p.status !== "SELESAI" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          onClick={() => handleQuickStatus(p, "SELESAI")}
                        >
                          Tandai Selesai
                        </Button>
                      )}
                      {p.status !== "DITUTUP" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => handleQuickStatus(p, "DITUTUP")}
                        >
                          Tutup
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1 || isLoading}
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400 px-3">
              Hal {page} / {pagination.totalPages} ({pagination.total} data)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages || isLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.totalPages)}
              disabled={page === pagination.totalPages || isLoading}
            >
              »
            </Button>
          </div>
        )}
      </main>

      {/* Reply Dialog */}
      <Dialog open={!!replyTarget} onOpenChange={(o) => !o && setReplyTarget(null)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-emerald-600" />
              {replyTarget?.balasan ? "Edit Balasan" : "Balas Pengaduan"}
            </DialogTitle>
            <DialogDescription>
              Tanggapi pengaduan dari operator.
            </DialogDescription>
          </DialogHeader>
          {replyTarget && (
            <div className="space-y-4 py-2">
              {/* Original message */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {replyTarget.user.namaLengkap.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{replyTarget.user.namaLengkap}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {replyTarget.user.puskesmas?.nama} • {formatDateTimeIndonesia(replyTarget.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">{replyTarget.subjek}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge variant="outline" className={getStatusBadgeClass(replyTarget.status)}>
                    {STATUS_LABEL[replyTarget.status]}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    {KATEGORI_LABEL[replyTarget.kategori]}
                  </Badge>
                  <Badge variant="outline" className={getPrioritasBadgeClass(replyTarget.prioritas)}>
                    {PRIORITAS_LABEL[replyTarget.prioritas]}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {replyTarget.pesan}
                </p>
              </div>

              {/* Status update */}
              <div className="space-y-2">
                <Label htmlFor="status">Ubah Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TERBUKA">Terbuka</SelectItem>
                    <SelectItem value="DIPROSES">Diproses</SelectItem>
                    <SelectItem value="SELESAI">Selesai</SelectItem>
                    <SelectItem value="DITUTUP">Ditutup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reply text */}
              <div className="space-y-2">
                <Label htmlFor="balasan">
                  Balasan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="balasan"
                  placeholder="Tulis balasan untuk operator..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={5}
                  className="resize-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyTarget(null)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              onClick={handleReply}
              disabled={isSubmitting || !replyText.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kirim Balasan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
