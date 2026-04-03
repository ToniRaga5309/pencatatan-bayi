"use client"

// Halaman Riwayat Input Data Operator
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Loader2, Eye, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle, Shield, FileText, Menu, LogOut, Plus, Printer, Upload, Download, AlertTriangle, UserCircle, Edit, Save } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { toast } from "sonner"
import { formatDateIndonesia, getJenisKelaminLabel, getStatusLabel } from "@/lib/utils-common"

interface BirthRecord {
  id: string
  nikIbu: string
  namaIbu: string
  namaAyah: string
  namaBayi: string
  nikBayi: string | null
  tanggalLahir: string
  tempatLahir: string
  jenisKelamin: string
  beratBadan: number | null
  panjangBadan: number | null
  status: string
  createdAt: string
  updatedAt: string
  puskesmas: { nama: string }
}

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

// SortableHeader component
function SortableHeader({ label, sortField, currentSortField, sortOrder, onSort }: {
  label: string
  sortField: string
  currentSortField: string
  sortOrder: string
  onSort: (field: string) => void
}) {
  const isActive = sortField === currentSortField
  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${isActive ? "text-emerald-700 dark:text-emerald-300" : ""}`}
      onClick={() => onSort(sortField)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-xs font-normal opacity-50">
          {isActive ? (sortOrder === "asc" ? "↑" : "↓") : "↑↓"}
        </span>
      </span>
    </TableHead>
  )
}

export default function RiwayatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [records, setRecords] = useState<BirthRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<BirthRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sort state from URL
  const sortField = searchParams.get("sortField") || "createdAt"
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"

  // Import dialog
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null)

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editRecord, setEditRecord] = useState<BirthRecord | null>(null)
  const [editForm, setEditForm] = useState({
    namaBayi: "", namaIbu: "", namaAyah: "", tempatLahir: "",
    tanggalLahir: "", jenisKelamin: "LAKI_LAKI",
    beratBadan: "", panjangBadan: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Redirect jika belum login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch data
  useEffect(() => {
    if (session?.user) {
      fetchRecords()
    }
  }, [session, page, sortField, sortOrder])

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc"
    params.set("sortField", field)
    params.set("sortOrder", newOrder)
    params.set("page", "1")
    router.push(`/operator/riwayat?${params.toString()}`)
  }

  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      params.append("page", page.toString())
      params.append("limit", "10")
      params.append("sortField", sortField)
      params.append("sortOrder", sortOrder)

      const response = await fetch(`/api/operator/birth-records?${params}`)
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

  const openEditDialog = (record: BirthRecord) => {
    if (record.status !== "PENDING") return
    setEditRecord(record)
    setEditForm({
      namaBayi: record.namaBayi,
      namaIbu: record.namaIbu,
      namaAyah: record.namaAyah,
      tempatLahir: record.tempatLahir,
      tanggalLahir: record.tanggalLahir ? record.tanggalLahir.split("T")[0] : "",
      jenisKelamin: record.jenisKelamin,
      beratBadan: record.beratBadan ? String(record.beratBadan) : "",
      panjangBadan: record.panjangBadan ? String(record.panjangBadan) : "",
    })
    setShowEditDialog(true)
  }

  // Read-only fields from the record being edited
  const editNikIbu = editRecord?.nikIbu || ""
  const editNamaIbu = editRecord?.namaIbu || ""
  const editNamaAyah = editRecord?.namaAyah || ""
  const editTanggalLahir = editRecord?.tanggalLahir ? formatDateIndonesia(editRecord.tanggalLahir) : ""

  const handleSaveEdit = () => {
    if (!editRecord) return
    setShowEditDialog(false)
    setShowConfirmDialog(true)
  }

  const confirmEdit = async () => {
    if (!editRecord) return
    setIsSaving(true)
    setShowConfirmDialog(false)

    try {
      const body: Record<string, unknown> = {
        namaBayi: editForm.namaBayi,
        tempatLahir: editForm.tempatLahir,
        jenisKelamin: editForm.jenisKelamin,
        beratBadan: editForm.beratBadan ? parseFloat(editForm.beratBadan) : null,
        panjangBadan: editForm.panjangBadan ? parseFloat(editForm.panjangBadan) : null,
      }

      const response = await fetch(`/api/operator/birth-records/${editRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(`Data "${editForm.namaBayi}" berhasil diperbarui`)
        fetchRecords()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal memperbarui data")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsSaving(false)
      setEditRecord(null)
    }
  }

  const handleImport = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast.error("Pilih file Excel terlebih dahulu")
      return
    }
    setIsUploading(true)
    setUploadResult(null)
    try {
      const formData = new FormData()
      formData.append("file", fileInputRef.current.files[0])
      const response = await fetch("/api/operator/birth-records/import", {
        method: "POST",
        body: formData,
      })
      if (response.ok) {
        const data = await response.json()
        setUploadResult(data.data)
        toast.success(data.message)
        fetchRecords()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal mengimport data")
      }
    } catch {
      toast.error("Terjadi kesalahan saat import")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/operator/birth-records/import/template")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "template-import-kelahiran.xlsx"
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        toast.error("Gagal mengunduh template")
      }
    } catch {
      toast.error("Terjadi kesalahan")
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
      </table>
      <div class="footer">Dicetak pada: ${now}</div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleViewDetail = (record: BirthRecord) => {
    setSelectedRecord(record)
    setShowDetail(true)
  }

  // Check if record was edited (createdAt !== updatedAt)
  const wasEdited = (record: BirthRecord) => {
    const created = new Date(record.createdAt).getTime()
    const updated = new Date(record.updatedAt).getTime()
    return updated > created + 2000 // more than 2 seconds diff
  }

  const getRelativeTime = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Baru saja"
    if (diffMins < 60) return `${diffMins} menit lalu`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} jam lalu`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} hari lalu`
    return formatDateIndonesia(dateStr)
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col animate-fadeIn">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/operator">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Riwayat Input</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{session?.user?.puskesmasNama}</p>
            </div>
          </div>
          {/* Mobile menu */}
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
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/operator">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/operator/input">
                    <Plus className="w-4 h-4 mr-2" />
                    Input Data Baru
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/profile">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profil Saya
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
          <ThemeToggle />
        </div>
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Data Kelahiran</CardTitle>
            <CardDescription>
              Lihat data kelahiran yang sudah diinput
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Cari nama bayi, NIK ibu, atau nama ibu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} className="btn-hover">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => { setShowImportDialog(true); setUploadResult(null) }} className="btn-hover">
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Import Excel</span>
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <SortableHeader label="Nama Bayi" sortField="namaBayi" currentSortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                    <SortableHeader label="NIK Ibu" sortField="nikIbu" currentSortField={sortField} sortOrder={sortOrder} onSort={handleSort} className="hidden md:table-cell" />
                    <TableHead>NIK Bayi</TableHead>
                    <SortableHeader label="Nama Ibu" sortField="namaIbu" currentSortField={sortField} sortOrder={sortOrder} onSort={handleSort} className="hidden sm:table-cell" />
                    <SortableHeader label="Tgl Lahir" sortField="tanggalLahir" currentSortField={sortField} sortOrder={sortOrder} onSort={handleSort} className="hidden lg:table-cell" />
                    <SortableHeader label="Status" sortField="status" currentSortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
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
                      <TableRow key={record.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/20">
                        <TableCell>
                          <div>
                            <span className="font-medium">{record.namaBayi}</span>
                            {wasEdited(record) && (
                              <p className="text-xs text-slate-400 mt-0.5">Terakhir diedit: {getRelativeTime(record.updatedAt)}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm">{record.nikIbu}</TableCell>
                        <TableCell>
                          {record.nikBayi ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-mono">
                              <Shield className="w-3 h-3 mr-1" />
                              {record.nikBayi}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{record.namaIbu}</TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDateIndonesia(record.tanggalLahir)}</TableCell>
                        <TableCell>{renderStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetail(record)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {record.status === "PENDING" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={() => openEditDialog(record)} title="Edit">
                                <Edit className="w-4 h-4" />
                              </Button>
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
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="pagination-btn">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="pagination-btn">
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

      {/* Import Excel Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) setUploadResult(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              Import Data dari Excel
            </DialogTitle>
            <DialogDescription>Upload file Excel berisi data kelahiran</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h4 className="font-medium text-emerald-800 mb-2">Format Kolom Excel:</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• <strong>NIK Ibu</strong> - 16 digit angka (wajib)</li>
                <li>• <strong>Nama Ibu</strong> - Minimal 3 karakter (wajib)</li>
                <li>• <strong>Nama Ayah</strong> - Minimal 3 karakter (wajib)</li>
                <li>• <strong>Nama Bayi</strong> - Minimal 3 karakter (wajib)</li>
                <li>• <strong>Tanggal Lahir</strong> - Format DD/MM/YYYY (wajib)</li>
                <li>• <strong>Tempat Lahir</strong> - Minimal 2 karakter (wajib)</li>
                <li>• <strong>Jenis Kelamin</strong> - L/P (wajib)</li>
                <li>• <strong>Berat Badan (kg)</strong> - Angka (opsional)</li>
                <li>• <strong>Panjang Badan (cm)</strong> - Angka (opsional)</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full">
              <Download className="w-4 h-4 mr-2" />Download Template Excel
            </Button>
            {!uploadResult && (
              <div>
                <Label>Pilih File Excel (.xlsx, .xls)</Label>
                <Input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={() => setUploadResult(null)} className="mt-2" />
                <p className="text-xs text-slate-400 mt-1">Ukuran maksimal 5MB</p>
              </div>
            )}
            {uploadResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg text-center"><p className="text-2xl font-bold">{uploadResult.total}</p><p className="text-xs text-slate-500">Total Baris</p></div>
                  <div className="p-3 bg-emerald-50 rounded-lg text-center"><p className="text-2xl font-bold text-emerald-600">{uploadResult.success}</p><p className="text-xs text-emerald-600">Berhasil</p></div>
                  <div className="p-3 bg-red-50 rounded-lg text-center"><p className="text-2xl font-bold text-red-600">{uploadResult.failed}</p><p className="text-xs text-red-600">Gagal</p></div>
                </div>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <div className="p-2 bg-red-50 border-b"><p className="text-sm font-medium text-red-700 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Detail Error</p></div>
                    <div className="divide-y">{uploadResult.errors.map((err, i) => <div key={i} className="p-2 text-xs"><span className="text-red-600">{err}</span></div>)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>{uploadResult ? "Tutup" : "Batal"}</Button>
            {!uploadResult && (
              <Button onClick={handleImport} disabled={isUploading} className="bg-emerald-600 hover:bg-emerald-700">
                {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengimport...</> : <><Upload className="w-4 h-4 mr-2" />Import</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-600" />
              Edit Data Kelahiran
            </DialogTitle>
            <DialogDescription>Ubah data kelahiran yang masih menunggu verifikasi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Read-only info section */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Data Tidak Boleh Diubah</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400">NIK Ibu</p>
                  <p className="text-sm font-mono font-medium">{editNikIbu}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tanggal Lahir</p>
                  <p className="text-sm font-medium">{editTanggalLahir}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Nama Ibu</p>
                  <p className="text-sm font-medium">{editNamaIbu}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Nama Ayah</p>
                  <p className="text-sm font-medium">{editNamaAyah}</p>
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Bayi <span className="text-red-500">*</span></Label>
                <Input value={editForm.namaBayi} onChange={(e) => setEditForm({ ...editForm, namaBayi: e.target.value })} />
              </div>
              <div>
                <Label>Jenis Kelamin <span className="text-red-500">*</span></Label>
                <Select value={editForm.jenisKelamin} onValueChange={(v) => setEditForm({ ...editForm, jenisKelamin: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tempat Lahir <span className="text-red-500">*</span></Label>
              <Input value={editForm.tempatLahir} onChange={(e) => setEditForm({ ...editForm, tempatLahir: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Berat Badan (kg)</Label>
                <Input type="number" step="0.1" min="0" max="10" value={editForm.beratBadan} onChange={(e) => setEditForm({ ...editForm, beratBadan: e.target.value })} placeholder="Contoh: 3.2" />
              </div>
              <div>
                <Label>Panjang Badan (cm)</Label>
                <Input type="number" step="0.5" min="20" max="80" value={editForm.panjangBadan} onChange={(e) => setEditForm({ ...editForm, panjangBadan: e.target.value })} placeholder="Contoh: 50" />
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Hanya data dengan status &quot;Menunggu&quot; yang dapat diedit. NIK Ibu, Nama Ibu, Nama Ayah, dan Tanggal Lahir tidak dapat diubah.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700 btn-emerald-hover">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Konfirmasi Perubahan
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyimpan perubahan pada data &quot;{editForm.namaBayi}&quot;?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Batal</Button>
            <Button onClick={confirmEdit} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Ya, Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detail Data Kelahiran
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Informasi lengkap data kelahiran</span>
              <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
                <Printer className="w-3 h-3 mr-1" />Cetak
              </Button>
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-slate-500">Nama Bayi</Label><p className="font-medium">{selectedRecord.namaBayi}</p></div>
                <div><Label className="text-slate-500">Jenis Kelamin</Label><p className="font-medium">{getJenisKelaminLabel(selectedRecord.jenisKelamin)}</p></div>
                <div><Label className="text-slate-500">Tanggal Lahir</Label><p className="font-medium">{formatDateIndonesia(selectedRecord.tanggalLahir)}</p></div>
                <div><Label className="text-slate-500">Tempat Lahir</Label><p className="font-medium">{selectedRecord.tempatLahir}</p></div>
                <div><Label className="text-slate-500">NIK Ibu</Label><p className="font-medium font-mono">{selectedRecord.nikIbu}</p></div>
                <div><Label className="text-slate-500">Nama Ibu</Label><p className="font-medium">{selectedRecord.namaIbu}</p></div>
                <div><Label className="text-slate-500">Nama Ayah</Label><p className="font-medium">{selectedRecord.namaAyah}</p></div>
                <div>
                  <Label className="text-slate-500">NIK Bayi</Label>
                  {selectedRecord.nikBayi ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-mono"><Shield className="w-3 h-3 mr-1" />{selectedRecord.nikBayi}</Badge>
                  ) : (
                    <p className="text-sm text-slate-400">Belum tersedia</p>
                  )}
                </div>
                <div><Label className="text-slate-500">Status</Label><div>{renderStatusBadge(selectedRecord.status)}</div></div>
                <div><Label className="text-slate-500">Puskesmas</Label><p className="font-medium text-sm">{selectedRecord.puskesmas.nama}</p></div>
              </div>
              <div className="text-sm text-slate-500 pt-2 border-t space-y-1">
                <p>Diinput pada: {formatDateIndonesia(selectedRecord.createdAt)}</p>
                {wasEdited(selectedRecord) && (
                  <p className="text-amber-600 flex items-center gap-1">
                    <Edit className="w-3 h-3" />
                    Terakhir diedit: {getRelativeTime(selectedRecord.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
