"use client"

// Dashboard BPJS
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search, Loader2, LogOut, Eye, ChevronLeft, ChevronRight,
  Baby, CheckCircle, XCircle, Shield, FileText, Menu, Lock, Download, UserCircle, X
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"
import Link from "next/link"
import { formatDateIndonesia, getJenisKelaminLabel, getStatusLabel } from "@/lib/utils-common"

interface BirthRecord {
  id: string
  nikIbu: string
  namaIbu: string
  namaAyah: string
  namaBayi: string
  nikBayi: string
  nikBayiUpdatedAt: string | null
  tanggalLahir: string
  tempatLahir: string
  jenisKelamin: string
  status: string
  createdAt: string
  puskesmas: { nama: string }
}

interface BpjsStats {
  totalRecords: number
  totalWithNik: number
  totalWithoutNik: number
  puskesmasList: Array<{ id: string; nama: string }>
}

export default function BpjsDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<BpjsStats | null>(null)
  const [records, setRecords] = useState<BirthRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [puskesmasFilter, setPuskesmasFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<BirthRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "BPJS") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "BPJS") {
      fetchStats()
      fetchRecords()
    }
  }, [session, page, puskesmasFilter])

  // Debounce search - auto-trigger fetchRecords after 500ms
  useEffect(() => {
    if (session?.user?.role !== "BPJS") return
    const debounce = setTimeout(() => {
      setPage(1)
      fetchRecords()
    }, 500)
    return () => clearTimeout(debounce)
  }, [search, session])

  const fetchStats = async () => {
    setIsStatsLoading(true)
    try {
      const response = await fetch("/api/bpjs/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (puskesmasFilter && puskesmasFilter !== "all") params.append("puskesmasId", puskesmasFilter)
      params.append("page", page.toString())
      params.append("limit", "15")

      const response = await fetch(`/api/bpjs/records?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchRecords()
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/bpjs/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `data-bpjs-nik-bayi-${new Date().toISOString().split("T")[0]}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Data berhasil diekspor")
      } else {
        toast.error("Gagal mengekspor data")
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengekspor")
    } finally {
      setIsExporting(false)
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

  const handlePrint = () => {
    if (!selectedRecord) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    const now = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "medium" })
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Cetak Data Kelahiran</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#333}
      header{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #059669}
      h1{font-size:16pt;margin:0 0 4px} .subtitle{font-size:10pt;color:#666}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th,td{border:1px solid #ccc;padding:8px 12px;text-align:left;font-size:10pt}
      th{background:#f0fdf4;font-weight:600;width:40%}
      .footer{margin-top:32px;padding-top:12px;border-top:1px solid #ddd;font-size:9pt;color:#666;text-align:right}
      </style></head><body>
      <header><h1>SURAT KETERANGAN DATA KELAHIRAN</h1><p class="subtitle">Kabupaten Ngada, NTT</p></header>
      <table>
        <tr><th>Nama Bayi</th><td>${selectedRecord.namaBayi}</td></tr>
        <tr><th>NIK Bayi</th><td>${selectedRecord.nikBayi}</td></tr>
        <tr><th>Jenis Kelamin</th><td>${getJenisKelaminLabel(selectedRecord.jenisKelamin)}</td></tr>
        <tr><th>Tanggal Lahir</th><td>${formatDateIndonesia(selectedRecord.tanggalLahir)}</td></tr>
        <tr><th>Tempat Lahir</th><td>${selectedRecord.tempatLahir}</td></tr>
        <tr><th>NIK Ibu</th><td>${selectedRecord.nikIbu}</td></tr>
        <tr><th>Nama Ibu</th><td>${selectedRecord.namaIbu}</td></tr>
        <tr><th>Nama Ayah</th><td>${selectedRecord.namaAyah}</td></tr>
        <tr><th>Puskesmas</th><td>${selectedRecord.puskesmas.nama}</td></tr>
        <tr><th>Status</th><td>${getStatusLabel(selectedRecord.status)}</td></tr>
      </table>
      <div class="footer">Dicetak pada: ${now}</div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { label: "", color: "", width: "0%" }
    if (pw.length < 6) return { label: "Lemah", color: "bg-red-500", width: "25%" }
    if (pw.length < 8) return { label: "Cukup", color: "bg-amber-500", width: "50%" }
    if (pw.match(/[A-Z]/) && pw.match(/[0-9]/)) return { label: "Kuat", color: "bg-emerald-500", width: "85%" }
    return { label: "Baik", color: "bg-emerald-500", width: "70%" }
  }

  if (status === "loading" || isStatsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user || session.user.role !== "BPJS") {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col animate-fadeIn">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dashboard BPJS</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Data kelahiran dengan NIK Bayi</p>
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
                <SheetTitle>Menu BPJS</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <span className="text-sm text-slate-600 dark:text-slate-400 px-2 py-1">{session.user.namaLengkap}</span>
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
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="relative overflow-hidden card-hover animate-stagger-1 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Data</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold animate-countUp tabular-nums stat-number">{stats?.totalRecords ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Data tercatat</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover animate-stagger-2 rounded-xl bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-emerald-600" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Sudah Ada NIK</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 animate-countUp tabular-nums stat-number">{stats?.totalWithNik ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Data dengan NIK Bayi</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover animate-stagger-3 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Belum Ada NIK</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 animate-countUp tabular-nums stat-number">{stats?.totalWithoutNik ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Data belum ada NIK Bayi</p>
            </CardContent>
          </Card>
        </div>

        {/* NIK Progress Card - Enhanced with Progress Ring */}
        {stats && stats.totalRecords > 0 && (
          <Card className="mb-8 rounded-xl shadow-sm animate-stagger-4 card-action-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Progres NIK Bayi</span>
              </CardTitle>
              <CardDescription>Persentase data yang sudah memiliki NIK Bayi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Data dengan NIK</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.totalWithNik} dari {stats.totalRecords}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${stats.totalRecords > 0 ? (stats.totalWithNik / stats.totalRecords * 100) : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {stats.totalRecords > 0 ? Math.round((stats.totalWithNik / stats.totalRecords) * 100) : 0}% selesai
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Terakhir diperbarui: {new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              {/* Progress Ring visualization */}
              <div className="mt-4 flex items-center justify-center">
                <div className="relative">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke-width="6" fill="none" className="stroke-slate-200 dark:stroke-slate-700" />
                    <circle
                      cx="50" cy="50" r="42" stroke-width="6" fill="none"
                      className="stroke-emerald-500 progress-ring-circle"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      style={{ strokeDashoffset: 264 - (264 * (stats.totalRecords > 0 ? (stats.totalWithNik / stats.totalRecords) : 0)) }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.totalRecords > 0 ? Math.round((stats.totalWithNik / stats.totalRecords) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Data dengan NIK Bayi
                </CardTitle>
                <CardDescription>
                  Menampilkan data kelahiran yang sudah memiliki NIK Bayi (read-only)
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm btn-emerald-hover"
              >
                {isExporting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengekspor...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" />Export Excel</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Cari nama bayi, NIK ibu, NIK bayi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pr-9"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title="Hapus pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button onClick={handleSearch} className="btn-hover">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Menampilkan {records.length} data
              </p>
              <Select value={puskesmasFilter} onValueChange={(v) => { setPuskesmasFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Semua Puskesmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Puskesmas</SelectItem>
                  {stats?.puskesmasList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isLoading && records.length === 0 && search && (
              <p className="text-sm text-slate-400 dark:text-slate-500 -mt-4 mb-4">
                Tidak ditemukan hasil untuk &quot;{search}&quot;
              </p>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead>Nama Bayi</TableHead>
                    <TableHead>NIK Bayi</TableHead>
                    <TableHead>NIK Ibu</TableHead>
                    <TableHead>Nama Ibu</TableHead>
                    <TableHead>Puskesmas</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-bounce-subtle">
                            <Baby className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Tidak ada data yang memiliki NIK Bayi</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Data akan muncul setelah NIK Bayi ditambahkan oleh Dukcapil</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} className="table-row-hover hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/20">
                        <TableCell className="font-medium">{record.namaBayi}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-600 font-mono text-xs">
                            {record.nikBayi}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{record.nikIbu}</TableCell>
                        <TableCell>{record.namaIbu}</TableCell>
                        <TableCell className="text-sm">{record.puskesmas.nama}</TableCell>
                        <TableCell>{formatDateIndonesia(record.tanggalLahir)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedRecord(record); setShowDetail(true) }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="pagination-btn"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="pagination-btn"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-t-lg -mt-6 -mx-6 mb-0" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Detail Data Kelahiran
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Informasi lengkap data kelahiran</span>
              <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
                Cetak
              </Button>
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Nama Bayi</Label>
                  <p className="font-medium">{selectedRecord.namaBayi}</p>
                </div>
                <div>
                  <Label className="text-slate-500">NIK Bayi</Label>
                  <p className="font-medium font-mono text-emerald-700">{selectedRecord.nikBayi}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Jenis Kelamin</Label>
                  <p className="font-medium">{getJenisKelaminLabel(selectedRecord.jenisKelamin)}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Tanggal Lahir</Label>
                  <p className="font-medium">{formatDateIndonesia(selectedRecord.tanggalLahir)}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Tempat Lahir</Label>
                  <p className="font-medium">{selectedRecord.tempatLahir}</p>
                </div>
                <div>
                  <Label className="text-slate-500">NIK Ibu</Label>
                  <p className="font-medium font-mono">{selectedRecord.nikIbu}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Nama Ibu</Label>
                  <p className="font-medium">{selectedRecord.namaIbu}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Nama Ayah</Label>
                  <p className="font-medium">{selectedRecord.namaAyah}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Puskesmas</Label>
                  <p className="font-medium">{selectedRecord.puskesmas.nama}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Status</Label>
                  <Badge variant={
                    selectedRecord.status === "VERIFIED" ? "default" :
                    selectedRecord.status === "PENDING" ? "secondary" : "destructive"
                  } className={
                    selectedRecord.status === "VERIFIED" ? "bg-emerald-600" :
                    selectedRecord.status === "PENDING" ? "bg-amber-100 text-amber-700" : ""
                  }>
                    {getStatusLabel(selectedRecord.status)}
                  </Badge>
                </div>
              </div>
              {selectedRecord.nikBayiUpdatedAt && (
                <div className="text-sm text-slate-500 pt-2 border-t">
                  NIK Bayi diperbarui pada: {formatDateIndonesia(selectedRecord.nikBayiUpdatedAt)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
