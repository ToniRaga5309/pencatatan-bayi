"use client"

// Halaman Audit Log (Admin)
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  ArrowLeft, Search, Loader2, LogOut, ClipboardList,
  ChevronLeft, ChevronRight, Menu, IdCard, Users,
  Shield, FileText, Baby, UserCircle
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { formatDateTimeIndonesia } from "@/lib/utils-common"

interface AuditLogEntry {
  id: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
  user: {
    id: string
    username: string
    namaLengkap: string
    role: string
  }
}

export default function AuditLogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState("all")
  const [entityFilter, setEntityFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchLogs()
    }
  }, [session, page, actionFilter, entityFilter])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", "20")
      if (actionFilter && actionFilter !== "all") params.append("action", actionFilter)
      if (entityFilter && entityFilter !== "all") params.append("entity", entityFilter)
      if (dateFilter) params.append("startDate", dateFilter)

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">Login</Badge>
      case "LOGOUT":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">Logout</Badge>
      case "CREATE":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Buat</Badge>
      case "UPDATE":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">Update</Badge>
      case "VERIFY":
        return <Badge className="bg-emerald-600">Verifikasi</Badge>
      case "REJECT":
        return <Badge variant="destructive">Tolak</Badge>
      case "EXPORT":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">Export</Badge>
      case "VIEW":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700">Lihat</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "BirthRecord":
        return <Baby className="w-3.5 h-3.5 text-slate-400" />
      case "User":
        return <Users className="w-3.5 h-3.5 text-slate-400" />
      case "Auth":
        return <Shield className="w-3.5 h-3.5 text-slate-400" />
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />
    }
  }

  const parseDetails = (details: string | null) => {
    if (!details) return null
    try {
      return JSON.parse(details)
    } catch {
      return details
    }
  }

  const formatDetailSummary = (details: string | null) => {
    const parsed = parseDetails(details)
    if (!parsed) return "-"
    if (typeof parsed === "string") return parsed
    if (parsed.namaBayi) return `Bayi: ${parsed.namaBayi}`
    if (parsed.alasanPenolakan) return `Alasan: ${parsed.alasanPenolakan}`
    if (parsed.username) return `User: ${parsed.username}`
    return "-"
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
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Audit Log</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Riwayat aktivitas sistem</p>
            </div>
          </div>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2">
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
            <span className="text-sm text-slate-600 dark:text-slate-400">Halo, {session.user.namaLengkap}</span>
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
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Riwayat Aktivitas
                </CardTitle>
                <CardDescription>{total} aktivitas tercatat</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Semua Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE">Buat</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="VERIFY">Verifikasi</SelectItem>
                  <SelectItem value="REJECT">Tolak</SelectItem>
                  <SelectItem value="EXPORT">Export</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Semua Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Entity</SelectItem>
                  <SelectItem value="BirthRecord">Data Kelahiran</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Auth">Autentikasi</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
                className="w-full sm:w-48"
                placeholder="Tanggal mulai..."
              />
              {dateFilter && (
                <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>
                  Reset Tanggal
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead>Waktu</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead className="hidden md:table-cell">Entity</TableHead>
                    <TableHead className="hidden lg:table-cell">Detail</TableHead>
                    <TableHead className="hidden lg:table-cell">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      </TableRow>
                    ))
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <ClipboardList className="w-8 h-8 animate-bounce-subtle" />
                          <p>Belum ada aktivitas tercatat</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} className="table-row-hover hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/20">
                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                          {formatDateTimeIndonesia(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{log.user.namaLengkap}</p>
                            <p className="text-xs text-slate-400">@{log.user.username}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            {getEntityIcon(log.entity)}
                            <span className="text-sm">{log.entity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-600 max-w-xs truncate">
                          {formatDetailSummary(log.details)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-xs text-slate-400">
                          {log.ipAddress || "-"}
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
                  Halaman {page} dari {totalPages} ({total} total)
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
