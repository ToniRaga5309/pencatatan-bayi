"use client"

// Dashboard Admin Dukcapil
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  Baby, Download, Users, Loader2,
  Search, Eye, ChevronLeft, ChevronRight, ChevronFirst, ChevronLast, RefreshCw,
  FileText, LogOut, CheckCircle, Clock, XCircle,
  Shield, IdCard, Menu, ClipboardList, Lock, BarChart3, UserCircle, TrendingUp, Building, Calendar, AlertCircle, Printer, Settings
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { maskNIK, formatDateIndonesia, getJenisKelaminLabel, getStatusLabel } from "@/lib/utils-common"
import Link from "next/link"
import { toast } from "sonner"

interface BirthRecord {
  id: string
  nikIbu: string
  namaIbu: string
  namaAyah: string
  namaBayi: string
  nikBayi: string | null
  tanggalLahir: Date
  tempatLahir: string
  jenisKelamin: string
  status: string
  createdAt: Date
  puskesmas: { nama: string }
  creator: { namaLengkap: string }
}

interface DashboardStats {
  totalAll: number
  totalPending: number
  totalVerified: number
  totalRejected: number
  totalWithNik: number
  puskesmasList: Array<{ id: string; nama: string }>
}

interface ChartData {
  monthlyData: Array<{ month: string; jumlah: number }>
  distributionData: Array<{ nama: string; jumlah: number }>
}

// SmartPagination inline component - shows page numbers with ellipsis
function SmartPagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: (prev: number) => number) => void }) {
  const getPageNumbers = (current: number, total: number): (number | string)[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    const pages: (number | string)[] = [1]

    if (current > 3) pages.push("...")

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) pages.push(i)

    if (current < total - 2) pages.push("...")

    pages.push(total)
    return pages
  }

  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage((p: number) => 1)}
          disabled={page === 1}
          title="Halaman pertama"
        >
          <ChevronFirst className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage((p: number) => Math.max(1, p - 1))}
          disabled={page === 1}
          title="Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-0.5 mx-1">
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1.5 text-slate-400 text-sm">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 text-sm ${p === page ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                onClick={() => setPage((_: number) => p as number)}
              >
                {p}
              </Button>
            )
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          title="Selanjutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage((_: number) => totalPages)}
          disabled={page === totalPages}
          title="Halaman terakhir"
        >
          <ChevronLast className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// QuickStatsSummary inline component - quick summary card before stats grid
function QuickStatsSummary({ stats, pendingCount }: { stats: DashboardStats | null; pendingCount: number }) {
  const getIndonesianDate = () => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    const now = new Date()
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
  }

  return (
    <div className="relative mb-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500" />
      <div className="p-4 pl-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              {getIndonesianDate()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total {stats?.totalAll ?? 0} data <span className="mx-1">|</span> {stats?.totalPending ?? 0} menunggu verifikasi
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Ada {pendingCount} data menunggu verifikasi
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [records, setRecords] = useState<BirthRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [puskesmasFilter, setPuskesmasFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isChartLoading, setIsChartLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Dialog states
  const [selectedRecord, setSelectedRecord] = useState<BirthRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showNikMap, setShowNikMap] = useState<Record<string, boolean>>({})

  // Reject dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Report dialog state
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1)
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Auto-refresh
  const [lastRefresh, setLastRefresh] = useState("")
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchStats()
      fetchRecords()
      fetchChartData()
      fetchPendingCount()
    }
  }, [session, page, puskesmasFilter, statusFilter])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return
    const formatTime = () => {
      const now = new Date()
      return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
    const refreshAll = async () => {
      if (document.hidden) return
      setIsAutoRefreshing(true)
      await Promise.all([fetchStats(), fetchRecords(), fetchPendingCount()])
      setLastRefresh(formatTime())
      setIsAutoRefreshing(false)
    }
    setLastRefresh(formatTime())
    refreshAll()
    const interval = setInterval(refreshAll, 30000)
    const handleVisibility = () => { if (!document.hidden) refreshAll() }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVisibility) }
  }, [session])

  const fetchPendingCount = async () => {
    try {
      const response = await fetch("/api/admin/pending-count")
      if (response.ok) {
        const data = await response.json()
        setPendingCount(data.pendingCount)
      }
    } catch (error) {
      console.error("Error fetching pending count:", error)
    }
  }

  const fetchChartData = async () => {
    setIsChartLoading(true)
    try {
      const response = await fetch("/api/admin/charts")
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
        <tr><th>Jenis Kelamin</th><td>${getJenisKelaminLabel(selectedRecord.jenisKelamin)}</td></tr>
        <tr><th>Tanggal Lahir</th><td>${formatDateIndonesia(selectedRecord.tanggalLahir)}</td></tr>
        <tr><th>Tempat Lahir</th><td>${selectedRecord.tempatLahir}</td></tr>
        <tr><th>NIK Ibu</th><td>${selectedRecord.nikIbu}</td></tr>
        <tr><th>Nama Ibu</th><td>${selectedRecord.namaIbu}</td></tr>
        <tr><th>Nama Ayah</th><td>${selectedRecord.namaAyah}</td></tr>
        <tr><th>NIK Bayi</th><td>${selectedRecord.nikBayi || "Belum tersedia"}</td></tr>
        <tr><th>Puskesmas</th><td>${selectedRecord.puskesmas.nama}</td></tr>
        <tr><th>Status</th><td>${getStatusLabel(selectedRecord.status)}</td></tr>
        <tr><th>Diinput Oleh</th><td>${selectedRecord.creator.namaLengkap}</td></tr>
        <tr><th>Tanggal Input</th><td>${formatDateIndonesia(selectedRecord.createdAt)}</td></tr>
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

  const fetchStats = async () => {
    setIsStatsLoading(true)
    try {
      const response = await fetch("/api/admin/stats")
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
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
      params.append("page", page.toString())
      params.append("limit", "15")

      const response = await fetch(`/api/admin/birth-records?${params}`)
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

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      const response = await fetch(`/api/admin/reports/monthly?year=${reportYear}&month=${reportMonth}`)
      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Gagal mengambil data laporan")
        return
      }
      const data = await response.json()
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      const monthName = months[data.period.month - 1]
      const now = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "medium" })

      const statusLabel = (s: string) => {
        switch (s) {
          case "VERIFIED": return "Terverifikasi"
          case "PENDING": return "Menunggu"
          case "REJECTED": return "Ditolak"
          default: return s
        }
      }
      const jkLabel = (jk: string) => jk === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"
      const formatDate = (d: string) => {
        const date = new Date(d)
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
      }

      const tableRows = data.records.map((r: Record<string, unknown>, i: number) => `
        <tr>
          <td style="text-align:center;padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${i + 1}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${r.namaBayi}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${r.nikIbu}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${r.namaIbu}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${r.namaAyah}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${r.nikBayi || "-"}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${formatDate(r.tanggalLahir as string)}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${jkLabel(r.jenisKelamin as string)}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${r.puskesmas}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${statusLabel(r.status as string)}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${r.creator}</td>
        </tr>
      `).join("")

      const puskesmasRows = data.puskesmasStats.map((p: Record<string, unknown>) => `
        <tr>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${p.nama}</td>
          <td style="text-align:center;padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${p.jumlah}</td>
          <td style="text-align:center;padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${p.verified}</td>
          <td style="text-align:center;padding:6px 10px;border:1px solid #e2e8f0;font-size:10pt;">${p.pending}</td>
        </tr>
      `).join("")

      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        toast.error("Gagal membuka jendela cetak")
        return
      }
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Laporan Data Kelahiran Bulanan</title>
      <style>
        @page { size: A4 landscape; margin: 15mm; }
        body { font-family: Arial, sans-serif; color: #1e293b; padding: 0; margin: 0; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 3px solid #059669; }
        .header h1 { font-size: 16pt; margin: 0 0 4px; color: #059669; }
        .header .subtitle { font-size: 11pt; color: #475569; }
        .header .period { font-size: 12pt; font-weight: 600; margin-top: 8px; color: #334155; }
        .summary { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .summary-item { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 16px; text-align: center; min-width: 100px; }
        .summary-item .value { font-size: 18pt; font-weight: 700; color: #059669; }
        .summary-item .label { font-size: 9pt; color: #475569; margin-top: 2px; }
        .section-title { font-size: 12pt; font-weight: 600; margin: 20px 0 10px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
        th { background: #059669; color: white; padding: 8px 10px; text-align: left; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; }
        td { border: 1px solid #e2e8f0; padding: 6px 10px; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; display: flex; justify-content: space-between; }
        @media print { .no-print { display: none; } }
      </style></head><body>
      <div class="header">
        <h1>LAPORAN DATA KELAHIRAN BULANAN</h1>
        <div class="subtitle">Puskesmas & Dukcapil Kabupaten Ngada, NTT</div>
        <div class="period">Periode: ${monthName} ${data.period.year}</div>
      </div>

      <div class="summary">
        <div class="summary-item"><div class="value">${data.summary.totalRecords}</div><div class="label">Total Data</div></div>
        <div class="summary-item" style="background:#ecfdf5;border-color:#a7f3d0;"><div class="value" style="color:#059669;">${data.summary.totalVerified}</div><div class="label">Terverifikasi</div></div>
        <div class="summary-item" style="background:#fffbeb;border-color:#fde68a;"><div class="value" style="color:#d97706;">${data.summary.totalPending}</div><div class="label">Menunggu</div></div>
        <div class="summary-item" style="background:#fef2f2;border-color:#fecaca;"><div class="value" style="color:#dc2626;">${data.summary.totalRejected}</div><div class="label">Ditolak</div></div>
        <div class="summary-item"><div class="value">${data.summary.totalWithNik}</div><div class="label">Sudah NIK</div></div>
        <div class="summary-item"><div class="value">${data.summary.totalWithoutNik}</div><div class="label">Belum NIK</div></div>
        <div class="summary-item"><div class="value">${data.summary.totalLakiLaki}</div><div class="label">Laki-laki</div></div>
        <div class="summary-item"><div class="value">${data.summary.totalPerempuan}</div><div class="label">Perempuan</div></div>
      </div>

      <div class="section-title">Data Kelahiran (${data.summary.totalRecords} rekaman)</div>
      <table>
        <thead><tr>
          <th style="text-align:center;width:30px;">No</th>
          <th>Nama Bayi</th>
          <th>NIK Ibu</th>
          <th>Nama Ibu</th>
          <th>Nama Ayah</th>
          <th>NIK Bayi</th>
          <th>Tgl Lahir</th>
          <th>JK</th>
          <th>Puskesmas</th>
          <th>Status</th>
          <th>Diinput Oleh</th>
        </tr></thead>
        <tbody>${tableRows || '<tr><td colspan="11" style="text-align:center;padding:20px;color:#94a3b8;">Tidak ada data untuk periode ini</td></tr>'}</tbody>
      </table>

      <div class="section-title">Distribusi per Puskesmas</div>
      <table>
        <thead><tr>
          <th>Puskesmas</th>
          <th style="text-align:center;">Total</th>
          <th style="text-align:center;">Terverifikasi</th>
          <th style="text-align:center;">Menunggu</th>
        </tr></thead>
        <tbody>${puskesmasRows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#94a3b8;">Tidak ada data</td></tr>'}</tbody>
      </table>

      <div class="footer">
        <span>Laporan dicetak pada: ${now}</span>
        <span>Sistem Pencatatan Bayi Baru Lahir - Kabupaten Ngada, NTT</span>
      </div>

      <div class="no-print" style="margin-top:20px;text-align:center;">
        <button onclick="window.print()" style="padding:10px 24px;background:#059669;color:white;border:none;border-radius:6px;font-size:12pt;cursor:pointer;">Cetak Laporan</button>
        <button onclick="window.close()" style="padding:10px 24px;background:#e2e8f0;color:#334155;border:none;border-radius:6px;font-size:12pt;cursor:pointer;margin-left:8px;">Tutup</button>
      </div>
      </body></html>`)
      printWindow.document.close()
      setShowReportDialog(false)
      toast.success("Laporan berhasil dibuat")
    } catch {
      toast.error("Gagal membuat laporan")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const toggleNikVisibility = (id: string) => {
    setShowNikMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleVerify = async (record: BirthRecord) => {
    setIsVerifying(true)
    try {
      const response = await fetch(`/api/admin/birth-records/${record.id}/verify`, {
        method: "POST"
      })
      if (response.ok) {
        toast.success(`Data "${record.namaBayi}" berhasil diverifikasi`)
        fetchRecords()
        fetchStats()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal memverifikasi data")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsVerifying(false)
    }
  }

  const openRejectDialog = (record: BirthRecord) => {
    setSelectedRecord(record)
    setRejectReason("")
    setShowRejectDialog(true)
  }

  const handleReject = async () => {
    if (!selectedRecord || rejectReason.length < 5) {
      toast.error("Alasan penolakan minimal 5 karakter")
      return
    }
    setIsRejecting(true)
    try {
      const response = await fetch(`/api/admin/birth-records/${selectedRecord.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasanPenolakan: rejectReason })
      })
      if (response.ok) {
        toast.success(`Data "${selectedRecord.namaBayi}" berhasil ditolak`)
        setShowRejectDialog(false)
        fetchRecords()
        fetchStats()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal menolak data")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsRejecting(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge className="bg-emerald-600">
            <CheckCircle className="w-3 h-3 mr-1" />Terverifikasi
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 animate-pulse-soft">
            <Clock className="w-3 h-3 mr-1" />Menunggu
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />Ditolak
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (status === "loading" || isStatsLoading) {
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
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dashboard Admin</h1>
              {pendingCount > 0 && (
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex items-center justify-center h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-bold">
                    {pendingCount}
                  </span>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              Dukcapil - Data Kelahiran
              {lastRefresh && (
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  {isAutoRefreshing ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                  ) : (
                    <RefreshCw className="w-3 h-3 text-emerald-500/60" />
                  )}
                  Diperbarui {lastRefresh}
                </span>
              )}
            </p>
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
              <Link href="/admin/audit-log">
                <ClipboardList className="w-4 h-4 mr-2" />
                Audit Log
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
                Kelola User
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="btn-hover bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30" onClick={() => setShowReportDialog(true)}>
              <Printer className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Laporan</span>
            </Button>
            <Button variant="outline" size="icon" asChild className="btn-hover" title="Pengaturan Sistem">
              <Link href="/admin/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPasswordDialog(true)}
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
              <Button variant="outline" size="icon" asChild className="hidden sm:flex">
                <Link href="/profile" title="Profil Saya">
                  <UserCircle className="w-4 h-4" />
                </Link>
              </Button>
            </div>
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
                  <Link href="/admin/audit-log">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Audit Log
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
                <Button variant="ghost" size="sm" className="justify-start text-emerald-700 dark:text-emerald-300" onClick={() => setShowReportDialog(true)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Download Laporan
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Pengaturan Sistem
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
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Quick Stats Summary Card */}
        <QuickStatsSummary stats={stats} pendingCount={pendingCount} />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-stagger-1 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">Total</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold animate-countUp tabular-nums stat-number">{stats?.totalAll ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Seluruh data</p>
            </CardContent>
          </Card>

          <Card className={`relative overflow-hidden transition-all duration-300 animate-stagger-2 rounded-xl ${stats && stats.totalPending > 0 ? "animate-border-glow-amber hover:shadow-lg hover:-translate-y-0.5 shadow-amber-100/50 dark:shadow-amber-900/20" : "hover:shadow-lg hover:-translate-y-0.5"}`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500" />
            {stats && stats.totalPending > 0 && (
              <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">Pending</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 animate-countUp tabular-nums stat-number">{stats?.totalPending ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Menunggu verifikasi</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-stagger-3 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">Verified</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 animate-countUp tabular-nums stat-number">{stats?.totalVerified ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Terverifikasi</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-stagger-4 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">Rejected</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 animate-countUp tabular-nums stat-number">{stats?.totalRejected ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ditolak</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-1 relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-stagger-5 rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">NIK Bayi</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <IdCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 animate-countUp tabular-nums stat-number">{stats?.totalWithNik ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sudah ada NIK</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Monthly Births */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                </div>
                Tren Kelahiran Bulanan
              </CardTitle>
              <CardDescription>Jumlah data kelahiran per bulan ({new Date().getFullYear()})</CardDescription>
            </CardHeader>
            <CardContent>
              {isChartLoading ? (
                <div className="flex items-center justify-center h-[280px]">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : chartData && chartData.monthlyData.some(d => d.jumlah > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData.monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                      }}
                      formatter={(value: number) => [value, "Kelahiran"]}
                    />
                    <Bar dataKey="jumlah" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">
                  Belum ada data untuk tahun ini
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart - Distribution per Puskesmas */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                </div>
                Distribusi per Puskesmas
              </CardTitle>
              <CardDescription>Jumlah data kelahiran per puskesmas</CardDescription>
            </CardHeader>
            <CardContent>
              {isChartLoading ? (
                <div className="flex items-center justify-center h-[280px]">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : chartData && chartData.distributionData.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={220} className="max-w-[220px]">
                    <PieChart>
                      <Pie
                        data={chartData.distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="jumlah"
                      >
                        {chartData.distributionData.map((_, index) => {
                          const colors = ["#059669", "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#047857", "#065f46", "#99f6e4"]
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                        }}
                        formatter={(value: number) => [value, "Kelahiran"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 max-h-[220px] overflow-y-auto w-full">
                    {chartData.distributionData.slice(0, 10).map((item, index) => {
                      const colors = ["#059669", "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#047857"]
                      return (
                        <div key={item.nama} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                          <span className="truncate text-slate-600">{item.nama}</span>
                          <span className="ml-auto font-medium text-slate-800">{item.jumlah}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Data Kelahiran
                </CardTitle>
                <CardDescription>Semua data kelahiran yang tercatat</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/admin/export")
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `register-kelahiran-${new Date().toISOString().split("T")[0]}.xlsx`
                        a.click()
                        window.URL.revokeObjectURL(url)
                        toast.success("Data berhasil diunduh")
                      }
                    } catch {
                      toast.error("Gagal mengunduh data")
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Cari nama bayi, NIK, atau nama ibu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead>Nama Bayi</TableHead>
                    <TableHead className="hidden md:table-cell">NIK Ibu</TableHead>
                    <TableHead className="hidden lg:table-cell">NIK Bayi</TableHead>
                    <TableHead>Puskesmas</TableHead>
                    <TableHead className="hidden sm:table-cell">Tgl Lahir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <FileText className="w-8 h-8" />
                          <p>Tidak ada data ditemukan</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} className="table-row-hover hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/20">
                        <TableCell className="font-medium">{record.namaBayi}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <button
                            onClick={() => toggleNikVisibility(record.id)}
                            className="font-mono text-sm hover:text-primary underline underline-offset-2"
                          >
                            {showNikMap[record.id] ? record.nikIbu : maskNIK(record.nikIbu)}
                          </button>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {record.nikBayi ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-mono">
                              {record.nikBayi}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{record.puskesmas.nama}</TableCell>
                        <TableCell className="hidden sm:table-cell">{formatDateIndonesia(record.tanggalLahir)}</TableCell>
                        <TableCell>{renderStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {record.status === "PENDING" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => handleVerify(record)}
                                  disabled={isVerifying}
                                  title="Verifikasi"
                                >
                                  {isVerifying ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => openRejectDialog(record)}
                                  title="Tolak"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => { setSelectedRecord(record); setShowDetail(true) }}
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <SmartPagination page={page} totalPages={totalPages} setPage={setPage} />
            )}
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

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-500">Nama Bayi</Label>
                <p className="font-medium">{selectedRecord.namaBayi}</p>
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
                <Label className="text-slate-500">NIK Bayi</Label>
                {selectedRecord.nikBayi ? (
                  <p className="font-medium font-mono text-emerald-700">{selectedRecord.nikBayi}</p>
                ) : (
                  <p className="text-sm text-slate-400">Belum tersedia</p>
                )}
              </div>
              <div>
                <Label className="text-slate-500">Puskesmas</Label>
                <p className="font-medium">{selectedRecord.puskesmas.nama}</p>
              </div>
              <div>
                <Label className="text-slate-500">Diinput Oleh</Label>
                <p className="font-medium">{selectedRecord.creator.namaLengkap}</p>
              </div>
              <div>
                <Label className="text-slate-500">Status</Label>
                {renderStatusBadge(selectedRecord.status)}
              </div>
              <div className="col-span-2">
                <Label className="text-slate-500">Diinput Pada</Label>
                <p className="font-medium">{formatDateIndonesia(selectedRecord.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Tolak Data Kelahiran
            </DialogTitle>
            <DialogDescription>
              Menolak data akan mengubah status menjadi &quot;Ditolak&quot;. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <p className="text-sm"><span className="text-slate-500">Nama Bayi:</span> <span className="font-medium">{selectedRecord.namaBayi}</span></p>
                <p className="text-sm"><span className="text-slate-500">Puskesmas:</span> <span>{selectedRecord.puskesmas.nama}</span></p>
              </div>
              <div>
                <Label htmlFor="reject-reason">Alasan Penolakan <span className="text-red-500">*</span></Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Masukkan alasan penolakan (minimal 5 karakter)..."
                  rows={3}
                />
                <p className="text-xs text-slate-400 mt-1">{rejectReason.length}/5 karakter minimum</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || rejectReason.length < 5}
            >
              {isRejecting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</>
              ) : (
                <><XCircle className="w-4 h-4 mr-2" />Tolak Data</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-600" />
              Download Laporan Bulanan
            </DialogTitle>
            <DialogDescription>
              Pilih periode bulan dan tahun untuk laporan data kelahiran.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="report-year">Tahun</Label>
              <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
                <SelectTrigger id="report-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-month">Bulan</Label>
              <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
                <SelectTrigger id="report-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Batal</Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isGeneratingReport ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</>
              ) : (
                <><Printer className="w-4 h-4 mr-2" />Buat Laporan</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
