"use client"

// Halaman Manajemen NIK Bayi (Admin)
import { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft, Search, Loader2, Upload, FileSpreadsheet,
  Edit, ChevronLeft, ChevronRight, LogOut, CheckCircle,
  XCircle, Baby, AlertTriangle, Download, Menu, UserCircle
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { toast } from "sonner"
import { formatDateIndonesia, getJenisKelaminLabel, getStatusLabel, maskNIK } from "@/lib/utils-common"
import * as XLSX from "xlsx"

interface BirthRecord {
  id: string
  nikIbu: string
  namaIbu: string
  namaAyah: string
  namaBayi: string
  nikBayi: string | null
  nikBayiUpdatedAt: string | null
  tanggalLahir: string
  tempatLahir: string
  jenisKelamin: string
  status: string
  createdAt: string
  puskesmas: { nama: string }
}

interface PuskesmasData {
  id: string
  nama: string
}

interface UploadResult {
  total: number
  updated: number
  failed: number
  errors?: Array<{ row: number; reason: string }>
}

export default function NikBayiManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [records, setRecords] = useState<BirthRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [nikStatus, setNikStatus] = useState("all")
  const [puskesmasFilter, setPuskesmasFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [puskesmasList, setPuskesmasList] = useState<PuskesmasData[]>([])

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<BirthRecord | null>(null)
  const [editNikBayi, setEditNikBayi] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showNikMap, setShowNikMap] = useState<Record<string, boolean>>({})
  const [withoutNikCount, setWithoutNikCount] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchPuskesmas()
      fetchRecords()
      fetchWithoutNikCount()
    }
  }, [session, page, nikStatus, puskesmasFilter])

  const fetchPuskesmas = async () => {
    try {
      const response = await fetch("/api/admin/puskesmas")
      if (response.ok) {
        const data = await response.json()
        setPuskesmasList(data)
      }
    } catch (error) {
      console.error("Error fetching puskesmas:", error)
    }
  }

  const fetchWithoutNikCount = async () => {
    try {
      const response = await fetch("/api/admin/pending-count")
      if (response.ok) {
        const data = await response.json()
        setWithoutNikCount(data.withoutNikCount)
      }
    } catch (error) {
      console.error("Error fetching without NIK count:", error)
    }
  }

  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (nikStatus && nikStatus !== "all") params.append("nikStatus", nikStatus)
      if (puskesmasFilter && puskesmasFilter !== "all") params.append("puskesmasId", puskesmasFilter)
      params.append("page", page.toString())
      params.append("limit", "15")

      const response = await fetch(`/api/admin/nik-bayi?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records)
        setTotalPages(data.pagination.totalPages)
        setTotalRecords(data.pagination.total)
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

  const handleFilterChange = (value: string) => {
    setNikStatus(value)
    setPage(1)
  }

  const handlePuskesmasChange = (value: string) => {
    setPuskesmasFilter(value)
    setPage(1)
  }

  const openEditDialog = (record: BirthRecord) => {
    setSelectedRecord(record)
    setEditNikBayi(record.nikBayi || "")
    setShowEditDialog(true)
  }

  const handleSaveNik = async () => {
    if (!selectedRecord) return

    if (!editNikBayi || editNikBayi.length !== 16 || !/^\d{16}$/.test(editNikBayi)) {
      toast.error("NIK Bayi harus 16 digit angka")
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/nik-bayi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: selectedRecord.id,
          nikBayi: editNikBayi
        })
      })

      if (response.ok) {
        toast.success("NIK Bayi berhasil diperbarui")
        setShowEditDialog(false)
        fetchRecords()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal memperbarui NIK Bayi")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast.error("Pilih file Excel terlebih dahulu")
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append("file", fileInputRef.current.files[0])

      const response = await fetch("/api/admin/nik-bayi/upload", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setUploadResult(data.data)
        toast.success(data.message)
        fetchRecords()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal mengupload file")
      }
    } catch {
      toast.error("Terjadi kesalahan saat upload")
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Create a template Excel file
    const templateData = [
      { "nikIbu": "5306014567890001", "namaBayi": "FRANSISKUS SERAN", "nikBayi": "5306010101010001" },
      { "nikIbu": "5306025678900002", "namaBayi": "THERESIA BEO", "nikBayi": "" }
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "NIK Bayi")
    XLSX.writeFile(wb, "template-nik-bayi.xlsx")
  }

  const toggleNikVisibility = (id: string) => {
    setShowNikMap(prev => ({ ...prev, [id]: !prev[id] }))
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
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Manajemen NIK Bayi</h1>
                {withoutNikCount > 0 && (
                  <Badge className="bg-emerald-600 animate-pulse">
                    {withoutNikCount} belum NIK
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Kelola NIK bayi untuk data kelahiran</p>
            </div>
          </div>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-slate-600">Halo, {session.user.namaLengkap}</span>
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
                <span className="text-sm text-slate-600 px-2 py-1">{session.user.namaLengkap}</span>
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
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="relative overflow-hidden hover:shadow-md transition-shadow animate-stagger-1 card-hover">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Data</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Baby className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold animate-countUp stat-number">{totalRecords}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Seluruh data kelahiran</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-md transition-shadow animate-stagger-2 card-hover">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Sudah Ada NIK</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 animate-countUp">
                {records.filter(r => r.nikBayi).length}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Halaman ini saja</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-md transition-shadow animate-stagger-3 card-hover">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Belum Ada NIK</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="pl-4">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 animate-countUp">
                {records.filter(r => !r.nikBayi).length}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Halaman ini saja</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button onClick={() => setShowUploadDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 btn-emerald-hover">
            <Upload className="w-4 h-4 mr-2" />
            Upload Excel NIK Bayi
          </Button>
          <Button variant="outline" onClick={downloadTemplate} className="btn-hover">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Kelahiran - NIK Bayi</CardTitle>
            <CardDescription>
              Kelola NIK bayi untuk setiap data kelahiran
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Cari nama bayi, NIK ibu, NIK bayi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Select value={nikStatus} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Status NIK" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status NIK</SelectItem>
                    <SelectItem value="with_nik">Sudah Ada NIK</SelectItem>
                    <SelectItem value="without_nik">Belum Ada NIK</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={puskesmasFilter} onValueChange={handlePuskesmasChange}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Semua Puskesmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Puskesmas</SelectItem>
                    {puskesmasList.map((p) => (
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
                    <TableHead>NIK Ibu</TableHead>
                    <TableHead>NIK Bayi</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead>Puskesmas</TableHead>
                    <TableHead>Status</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Tidak ada data ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} className="table-row-hover hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/20">
                        <TableCell className="font-medium">{record.namaBayi}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleNikVisibility(record.id)}
                            className="font-mono text-sm hover:text-primary underline underline-offset-2"
                          >
                            {showNikMap[record.id] ? record.nikIbu : maskNIK(record.nikIbu)}
                          </button>
                        </TableCell>
                        <TableCell>
                          {record.nikBayi ? (
                            <div>
                              <Badge className="bg-emerald-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {record.nikBayi}
                              </Badge>
                              {record.nikBayiUpdatedAt && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {formatDateIndonesia(record.nikBayiUpdatedAt)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="w-3 h-3 mr-1" />
                              Belum ada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDateIndonesia(record.tanggalLahir)}</TableCell>
                        <TableCell className="text-sm">{record.puskesmas.nama}</TableCell>
                        <TableCell>
                          <Badge variant={
                            record.status === "VERIFIED" ? "default" :
                            record.status === "PENDING" ? "secondary" : "destructive"
                          } className={
                            record.status === "VERIFIED" ? "bg-emerald-600" :
                            record.status === "PENDING" ? "bg-amber-100 text-amber-700" : ""
                          }>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(record)}
                          >
                            <Edit className="w-4 h-4" />
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
                  Halaman {page} dari {totalPages} ({totalRecords} total)
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

      {/* Edit NIK Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit NIK Bayi
            </DialogTitle>
            <DialogDescription>
              Masukkan NIK Bayi 16 digit
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <p className="text-sm"><span className="text-slate-500">Nama Bayi:</span> <span className="font-medium">{selectedRecord.namaBayi}</span></p>
                <p className="text-sm"><span className="text-slate-500">NIK Ibu:</span> <span className="font-mono">{selectedRecord.nikIbu}</span></p>
                <p className="text-sm"><span className="text-slate-500">Puskesmas:</span> <span>{selectedRecord.puskesmas.nama}</span></p>
                {selectedRecord.nikBayi && (
                  <p className="text-sm"><span className="text-slate-500">NIK Bayi saat ini:</span> <span className="font-mono">{selectedRecord.nikBayi}</span></p>
                )}
              </div>
              <div>
                <Label htmlFor="nikBayi">NIK Bayi (16 digit)</Label>
                <Input
                  id="nikBayi"
                  value={editNikBayi}
                  onChange={(e) => setEditNikBayi(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="Masukkan 16 digit NIK Bayi"
                  maxLength={16}
                  className="font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {editNikBayi.length}/16 digit
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button
              onClick={handleSaveNik}
              disabled={isProcessing || editNikBayi.length !== 16}
              className="bg-emerald-600 hover:bg-emerald-700 btn-emerald-hover"
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open)
        if (!open) setUploadResult(null)
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Upload Excel NIK Bayi
            </DialogTitle>
            <DialogDescription>
              Upload file Excel (.xlsx) berisi data NIK Bayi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <h4 className="font-medium text-emerald-800 dark:text-emerald-300 mb-2">Format Kolom Excel:</h4>
              <ul className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
                <li>• <strong>nikIbu</strong> - NIK Ibu (identifier)</li>
                <li>• <strong>namaBayi</strong> - Nama Bayi (identifier)</li>
                <li>• <strong>nikBayi</strong> - NIK Bayi yang akan diupdate</li>
              </ul>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2">
                Minimal isi salah satu identifier (nikIbu atau namaBayi) bersama nikBayi
              </p>
            </div>

            {!uploadResult && (
              <div>
                <Label>Pilih File Excel</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={() => setUploadResult(null)}
                />
              </div>
            )}

            {uploadResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{uploadResult.total}</p>
                    <p className="text-xs text-slate-500">Total Baris</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-emerald-600">{uploadResult.updated}</p>
                    <p className="text-xs text-emerald-600">Berhasil</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{uploadResult.failed}</p>
                    <p className="text-xs text-red-600">Gagal</p>
                  </div>
                </div>

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <div className="p-2 bg-red-50 border-b">
                      <p className="text-sm font-medium text-red-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Detail Error
                      </p>
                    </div>
                    <div className="divide-y">
                      {uploadResult.errors.map((err, i) => (
                        <div key={i} className="p-2 text-xs">
                          <span className="text-slate-500">Baris {err.row}:</span>{" "}
                          <span className="text-red-600">{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              {uploadResult ? "Tutup" : "Batal"}
            </Button>
            {!uploadResult && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-emerald-600 hover:bg-emerald-700 btn-emerald-hover"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengupload...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />Upload</>
                )}
              </Button>
            )}
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
