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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Baby, Clock, CheckCircle, XCircle, Download, Users, Loader2, 
  Search, Eye, CheckSquare, XSquare, ChevronLeft, ChevronRight,
  Shield, FileText, LogOut
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
  alasanPenolakan: string | null
  createdAt: Date
  puskesmas: { nama: string }
  creator: { namaLengkap: string }
}

interface DashboardStats {
  totalAll: number
  totalPending: number
  totalVerified: number
  totalRejected: number
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
  const [statusFilter, setStatusFilter] = useState("")
  const [puskesmasFilter, setPuskesmasFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Dialog states
  const [selectedRecord, setSelectedRecord] = useState<BirthRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showNikMap, setShowNikMap] = useState<Record<string, boolean>>({})

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
  }, [session, page, statusFilter, puskesmasFilter])

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
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
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

  const handleVerify = async (record: BirthRecord) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/birth-records/${record.id}/verify`, {
        method: "POST"
      })
      if (response.ok) {
        toast.success("Data berhasil diverifikasi")
        fetchRecords()
        fetchStats()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal memverifikasi")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRecord || !rejectReason.trim()) {
      toast.error("Mohon isi alasan penolakan")
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/birth-records/${selectedRecord.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasanPenolakan: rejectReason })
      })
      if (response.ok) {
        toast.success("Data berhasil ditolak")
        setShowReject(false)
        setRejectReason("")
        setSelectedRecord(null)
        fetchRecords()
        fetchStats()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal menolak data")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = async () => {
    try {
      toast.info("Mengunduh data...")
      const response = await fetch("/api/admin/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `data-kelahiran-${new Date().toISOString().split("T")[0]}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Data berhasil diunduh")
      } else {
        toast.error("Gagal mengekspor data")
      }
    } catch {
      toast.error("Terjadi kesalahan saat ekspor")
    }
  }

  const toggleNikVisibility = (id: string) => {
    setShowNikMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>
      case "VERIFIED":
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Terverifikasi</Badge>
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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
            <p className="text-sm text-slate-500">Dukcapil - Verifikasi Data Kelahiran</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <CardTitle className="text-sm font-medium text-slate-600">Menunggu Verifikasi</CardTitle>
              <Clock className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats?.totalPending ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Perlu ditinjau</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Terverifikasi</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.totalVerified ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Data valid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Ditolak</CardTitle>
              <XCircle className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.totalRejected ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Data ditolak</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Data Kelahiran</CardTitle>
                <CardDescription>Seluruh data dari semua Puskesmas</CardDescription>
              </div>
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
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
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
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
                        Tidak ada data ditemukan
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
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => { setSelectedRecord(record); setShowDetail(true) }}
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {record.status === "PENDING" && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleVerify(record)}
                                  disabled={isProcessing}
                                  title="Verifikasi"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => { setSelectedRecord(record); setShowReject(true) }}
                                  title="Tolak"
                                >
                                  <XSquare className="w-4 h-4" />
                                </Button>
                              </>
                            )}
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
                {getStatusBadge(selectedRecord.status)}
              </div>
              <div className="col-span-2">
                <Label className="text-slate-500">Diinput Pada</Label>
                <p className="font-medium">{formatDateIndonesia(selectedRecord.createdAt)}</p>
              </div>
              {selectedRecord.status === "REJECTED" && selectedRecord.alasanPenolakan && (
                <div className="col-span-2 bg-red-50 p-4 rounded-lg">
                  <Label className="text-red-600">Alasan Penolakan</Label>
                  <p className="text-red-700">{selectedRecord.alasanPenolakan}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Tolak Data Kelahiran
            </DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk data bayi: <strong>{selectedRecord?.namaBayi}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alasan Penolakan <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Contoh: NIK ibu tidak valid, data tidak lengkap..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowReject(false); setRejectReason("") }}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Tolak Data"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
