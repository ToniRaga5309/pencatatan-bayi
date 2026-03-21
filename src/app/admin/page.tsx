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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Baby, Download, Users, Loader2, 
  Search, Eye, ChevronLeft, ChevronRight,
  FileText, LogOut, CheckCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { maskNIK, formatDateIndonesia, getJenisKelaminLabel } from "@/lib/utils-common"

interface BirthRecord {
  id: string
  nikIbu: string
  namaIbu: string
  namaAyah: string
  namaBayi: string
  tanggalLahir: Date
  tempatLahir: string
  jenisKelamin: string
  status: string
  downloadedAt: Date | null
  createdAt: Date
  puskesmas: { nama: string }
  creator: { namaLengkap: string }
}

interface DashboardStats {
  totalAll: number
  totalNew: number
  totalDownloaded: number
  puskesmasList: Array<{ id: string; nama: string }>
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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Dialog states
  const [selectedRecord, setSelectedRecord] = useState<BirthRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showNikMap, setShowNikMap] = useState<Record<string, boolean>>({})
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchStats()
      fetchRecords()
    }
  }, [session, page, puskesmasFilter])

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

  // Download semua data (Register)
  const handleDownloadRegister = async () => {
    setIsDownloading(true)
    try {
      toast.info("Mengunduh register...")
      const response = await fetch("/api/admin/register")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `register-kelahiran-${new Date().toISOString().split("T")[0]}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Register berhasil diunduh")
      } else {
        toast.error("Gagal mengunduh register")
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunduh")
    } finally {
      setIsDownloading(false)
    }
  }

  // Download data baru saja (Data Baru)
  const handleDownloadNew = async () => {
    setIsDownloading(true)
    try {
      toast.info("Mengunduh data baru...")
      const response = await fetch("/api/admin/download-new")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `data-baru-kelahiran-${new Date().toISOString().split("T")[0]}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Data baru berhasil diunduh")
        // Refresh data setelah download
        fetchStats()
        fetchRecords()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal mengunduh data baru")
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunduh")
    } finally {
      setIsDownloading(false)
    }
  }

  const toggleNikVisibility = (id: string) => {
    setShowNikMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (status === "loading" || isStatsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard Admin</h1>
            <p className="text-sm text-slate-500">Dukcapil - Data Kelahiran</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                Kelola User
              </Link>
            </Button>
            <span className="text-sm text-slate-600">Halo, {session.user.namaLengkap}</span>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Data</CardTitle>
              <Baby className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalAll ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Seluruh data kelahiran</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Data Baru</CardTitle>
              <Download className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.totalNew ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Belum pernah diunduh</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Sudah Diunduh</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.totalDownloaded ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Data sudah diunduh</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Data Kelahiran</CardTitle>
                <CardDescription>Data baru yang belum pernah diunduh</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleDownloadRegister}
                  disabled={isDownloading}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Register
                </Button>
                <Button 
                  onClick={handleDownloadNew}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Data Baru
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

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Bayi</TableHead>
                    <TableHead>NIK Ibu</TableHead>
                    <TableHead>Nama Ibu</TableHead>
                    <TableHead>Puskesmas</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Tidak ada data baru. Data yang sudah diunduh disembunyikan dari daftar ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.namaBayi}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleNikVisibility(record.id)}
                            className="font-mono text-sm hover:text-primary underline underline-offset-2"
                          >
                            {showNikMap[record.id] ? record.nikIbu : maskNIK(record.nikIbu)}
                          </button>
                        </TableCell>
                        <TableCell>{record.namaIbu}</TableCell>
                        <TableCell>{record.puskesmas.nama}</TableCell>
                        <TableCell>{formatDateIndonesia(record.tanggalLahir)}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />Terverifikasi
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { setSelectedRecord(record); setShowDetail(true) }}
                            title="Lihat Detail"
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
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detail Data Kelahiran
            </DialogTitle>
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
                <Label className="text-slate-500">Puskesmas</Label>
                <p className="font-medium">{selectedRecord.puskesmas.nama}</p>
              </div>
              <div>
                <Label className="text-slate-500">Diinput Oleh</Label>
                <p className="font-medium">{selectedRecord.creator.namaLengkap}</p>
              </div>
              <div>
                <Label className="text-slate-500">Status</Label>
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />Terverifikasi
                </Badge>
              </div>
              <div className="col-span-2">
                <Label className="text-slate-500">Diinput Pada</Label>
                <p className="font-medium">{formatDateIndonesia(selectedRecord.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
