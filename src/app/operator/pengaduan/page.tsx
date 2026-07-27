"use client"

// Halaman Pengaduan Operator
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
  MessageSquare, Plus, Trash2, Send, Loader2, LogOut, Menu, Lock,
  UserCircle, ArrowLeft, Clock, CheckCircle, AlertCircle, RefreshCw,
  ChevronLeft, ChevronRight, Inbox, MessageCircle, Reply
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
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
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

export default function OperatorPengaduanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pengaduanList, setPengaduanList] = useState<Pengaduan[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("SEMUA")
  const [kategoriFilter, setKategoriFilter] = useState("SEMUA")

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    subjek: "",
    pesan: "",
    kategori: "SISTEM",
    prioritas: "SEDANG",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Pengaduan | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Expanded cards
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

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
      params.set("limit", "20")
      if (statusFilter !== "SEMUA") params.set("status", statusFilter)
      if (kategoriFilter !== "SEMUA") params.set("kategori", kategoriFilter)

      const res = await fetch(`/api/operator/pengaduan?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPengaduanList(data.records || [])
        setPagination(data.pagination || null)
      } else {
        toast.error("Gagal memuat data pengaduan")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan")
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, kategoriFilter])

  useEffect(() => {
    if (session?.user) {
      fetchPengaduan()
    }
  }, [session, fetchPengaduan])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.subjek.trim() || formData.subjek.trim().length < 5) {
      errs.subjek = "Subjek minimal 5 karakter"
    }
    if (formData.subjek.length > 200) {
      errs.subjek = "Subjek maksimal 200 karakter"
    }
    if (!formData.pesan.trim() || formData.pesan.trim().length < 10) {
      errs.pesan = "Pesan minimal 10 karakter"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/operator/pengaduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Pengaduan berhasil dikirim")
        setShowCreateDialog(false)
        setFormData({ subjek: "", pesan: "", kategori: "SISTEM", prioritas: "SEDANG" })
        setErrors({})
        setPage(1)
        fetchPengaduan()
      } else {
        toast.error(data.error || "Gagal mengirim pengaduan")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/operator/pengaduan/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Pengaduan berhasil dihapus")
        setDeleteTarget(null)
        fetchPengaduan()
      } else {
        const data = await res.json()
        toast.error(data.error || "Gagal menghapus pengaduan")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Stats
  const stats = {
    total: pagination?.total ?? 0,
    terbuka: pengaduanList.filter((p) => p.status === "TERBUKA").length,
    diproses: pengaduanList.filter((p) => p.status === "DIPROSES").length,
    selesai: pengaduanList.filter((p) => p.status === "SELESAI" || p.status === "DITUTUP").length,
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/operator" title="Kembali ke Dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Pengaduan
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{session.user.puskesmasNama}</p>
            </div>
          </div>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
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
                <SheetTitle>Menu Operator</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <span className="text-sm text-slate-600 dark:text-slate-400 px-2 py-1">{session.user.namaLengkap}</span>
                <p className="text-xs text-slate-400 px-2">{session.user.puskesmasNama}</p>
                <hr className="my-2" />
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/operator">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
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
        </div>
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="rounded-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Terbuka</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{stats.terbuka}</p>
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
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats.diproses}</p>
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
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.selesai}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-1">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px]">
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
              <SelectTrigger className="w-full sm:w-[180px]">
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
            <Button variant="outline" size="icon" onClick={fetchPengaduan} title="Muat ulang">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Pengaduan
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : pengaduanList.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Belum ada pengaduan
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                Anda belum membuat pengaduan apapun. Jika ada kendala atau pertanyaan, silakan buat pengaduan baru.
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Pengaduan Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-1 pengaduan-scroll">
            {pengaduanList.map((p) => {
              const isExpanded = expandedIds.has(p.id)
              const isLongPesan = p.pesan.length > 200
              return (
                <Card key={p.id} className="rounded-xl border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-snug">
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
                            Prioritas {PRIORITAS_LABEL[p.prioritas] || p.prioritas}
                          </Badge>
                        </div>
                      </div>
                      {p.status === "TERBUKA" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                          onClick={() => setDeleteTarget(p)}
                          title="Hapus pengaduan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Message */}
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p className={isExpanded ? "" : "line-clamp-3 whitespace-pre-wrap"}>
                        {p.pesan}
                      </p>
                      {isLongPesan && (
                        <button
                          onClick={() => toggleExpand(p.id)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-medium mt-1"
                        >
                          {isExpanded ? "Sembunyikan" : "Baca selengkapnya"}
                        </button>
                      )}
                    </div>

                    {/* Balasan */}
                    {p.balasan && (
                      <div className="mt-4 p-3 sm:p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Reply className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            Balasan Admin
                          </span>
                          {p.balasanPada && (
                            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                              • {formatDateTimeIndonesia(p.balasanPada)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {p.balasan}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTimeIndonesia(p.createdAt)}
                      </span>
                      {p.status === "TERBUKA" && (
                        <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Menunggu tanggapan
                        </span>
                      )}
                      {p.status === "DIPROSES" && (
                        <span className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3" />
                          Sedang ditinjau
                        </span>
                      )}
                      {(p.status === "SELESAI" || p.status === "DITUTUP") && p.balasan && (
                        <span className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Sudah ditanggapi
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
              Hal {page} / {pagination.totalPages}
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              Buat Pengaduan Baru
            </DialogTitle>
            <DialogDescription>
              Sampaikan kendala atau pertanyaan Anda kepada admin Dukcapil.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="subjek">
                Subjek <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subjek"
                placeholder="Contoh: Data bayi tertolak tanpa alasan jelas"
                value={formData.subjek}
                onChange={(e) => setFormData({ ...formData, subjek: e.target.value })}
                maxLength={200}
                className={errors.subjek ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-emerald-500 focus-visible:border-emerald-500"}
              />
              <div className="flex items-center justify-between">
                {errors.subjek ? (
                  <p className="text-xs text-red-500">{errors.subjek}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-slate-400">{formData.subjek.length}/200</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori</Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(v) => setFormData({ ...formData, kategori: v })}
                >
                  <SelectTrigger id="kategori">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SISTEM">Masalah Sistem</SelectItem>
                    <SelectItem value="DATA">Masalah Data</SelectItem>
                    <SelectItem value="PROSES">Proses Verifikasi</SelectItem>
                    <SelectItem value="LAINNYA">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prioritas">Prioritas</Label>
                <Select
                  value={formData.prioritas}
                  onValueChange={(v) => setFormData({ ...formData, prioritas: v })}
                >
                  <SelectTrigger id="prioritas">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RENDAH">Rendah</SelectItem>
                    <SelectItem value="SEDANG">Sedang</SelectItem>
                    <SelectItem value="TINGGI">Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pesan">
                Pesan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="pesan"
                placeholder="Jelaskan secara detail pengaduan atau pertanyaan Anda..."
                value={formData.pesan}
                onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                rows={5}
                className={errors.pesan ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-emerald-500 focus-visible:border-emerald-500 resize-none"}
              />
              {errors.pesan && <p className="text-xs text-red-500">{errors.pesan}</p>}
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Pengaduan akan dikirim ke admin Dukcapil. Anda akan mendapat balasan melalui halaman ini. Pengaduan yang sudah diproses tidak dapat dihapus.</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
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
                  Kirim Pengaduan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
              Hapus Pengaduan
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengaduan ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 my-2">
              <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{deleteTarget.subjek}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{deleteTarget.pesan}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
