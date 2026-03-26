"use client"

// Halaman Riwayat Input Data Operator dengan fitur Edit dan Hapus
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Loader2, Eye, ChevronLeft, ChevronRight, CheckCircle, Pencil, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { formatDateIndonesia, getJenisKelaminLabel } from "@/lib/utils-common"
import { toast } from "sonner"

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
}

export default function RiwayatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<BirthRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<BirthRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form edit
  const [editForm, setEditForm] = useState({
    namaBayi: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "",
    nikIbu: "",
    namaIbu: "",
    namaAyah: ""
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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
  }, [session, page])

  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      params.append("page", page.toString())
      params.append("limit", "10")

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

  const handleViewDetail = (record: BirthRecord) => {
    setSelectedRecord(record)
    setShowDetail(true)
  }

  const handleEdit = (record: BirthRecord) => {
    setSelectedRecord(record)
    setEditForm({
      namaBayi: record.namaBayi,
      tempatLahir: record.tempatLahir,
      tanggalLahir: new Date(record.tanggalLahir).toISOString().split("T")[0],
      jenisKelamin: record.jenisKelamin,
      nikIbu: record.nikIbu,
      namaIbu: record.namaIbu,
      namaAyah: record.namaAyah
    })
    setFormErrors({})
    setShowEdit(true)
  }

  const handleDelete = (record: BirthRecord) => {
    setSelectedRecord(record)
    setShowDelete(true)
  }

  const validateEditForm = () => {
    const errors: Record<string, string> = {}
    
    if (!editForm.namaBayi || editForm.namaBayi.length < 2) {
      errors.namaBayi = "Nama bayi minimal 2 karakter"
    }
    if (!editForm.tempatLahir || editForm.tempatLahir.length < 2) {
      errors.tempatLahir = "Tempat lahir minimal 2 karakter"
    }
    if (!editForm.tanggalLahir) {
      errors.tanggalLahir = "Tanggal lahir wajib diisi"
    }
    if (!editForm.jenisKelamin) {
      errors.jenisKelamin = "Pilih jenis kelamin"
    }
    if (!editForm.nikIbu || !/^\d{16}$/.test(editForm.nikIbu)) {
      errors.nikIbu = "NIK harus 16 digit angka"
    }
    if (!editForm.namaIbu || editForm.namaIbu.length < 3) {
      errors.namaIbu = "Nama ibu minimal 3 karakter"
    }
    if (!editForm.namaAyah || editForm.namaAyah.length < 3) {
      errors.namaAyah = "Nama ayah minimal 3 karakter"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveEdit = async () => {
    if (!selectedRecord || !validateEditForm()) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/operator/birth-records/${selectedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Data berhasil diperbarui")
        setShowEdit(false)
        fetchRecords()
      } else {
        toast.error(result.error || "Gagal memperbarui data")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedRecord) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/operator/birth-records/${selectedRecord.id}`, {
        method: "DELETE"
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Data berhasil dihapus")
        setShowDelete(false)
        fetchRecords()
      } else {
        toast.error(result.error || "Gagal menghapus data")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleNIKChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 16)
    setEditForm(prev => ({ ...prev, nikIbu: numericValue }))
    if (formErrors.nikIbu) {
      setFormErrors(prev => { const e = { ...prev }; delete e.nikIbu; return e })
    }
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => { const e = { ...prev }; delete e[field]; return e })
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/operator">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Riwayat Input</h1>
            <p className="text-sm text-slate-500">{session?.user?.puskesmasNama}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Kelahiran</CardTitle>
            <CardDescription>
              Kelola data kelahiran yang sudah diinput
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
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Bayi</TableHead>
                    <TableHead>NIK Ibu</TableHead>
                    <TableHead>Nama Ibu</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Tidak ada data ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.namaBayi}</TableCell>
                        <TableCell className="font-mono text-sm">{record.nikIbu}</TableCell>
                        <TableCell>{record.namaIbu}</TableCell>
                        <TableCell>{formatDateIndonesia(record.tanggalLahir)}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />Terverifikasi
                          </Badge>
                          {record.downloadedAt && (
                            <Badge variant="outline" className="ml-1 text-xs">
                              Diunduh
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewDetail(record)}
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(record)}
                              disabled={!!record.downloadedAt}
                              title={record.downloadedAt ? "Data sudah diunduh" : "Edit"}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(record)}
                              disabled={!!record.downloadedAt}
                              title={record.downloadedAt ? "Data sudah diunduh" : "Hapus"}
                            >
                              <Trash2 className="w-4 h-4" />
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

            {/* Info */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
              <p><strong>Catatan:</strong> Data yang sudah diunduh oleh Admin Dukcapil tidak dapat diedit atau dihapus.</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Data Kelahiran</DialogTitle>
            <DialogDescription>
              Informasi lengkap data kelahiran
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
                  <Label className="text-slate-500">Status</Label>
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />Terverifikasi
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                Diinput pada: {formatDateIndonesia(selectedRecord.createdAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Kelahiran</DialogTitle>
            <DialogDescription>
              Perbarui data kelahiran
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Nama Bayi */}
            <div className="space-y-2">
              <Label>Nama Bayi <span className="text-red-500">*</span></Label>
              <Input
                value={editForm.namaBayi}
                onChange={(e) => handleEditInputChange("namaBayi", e.target.value)}
                className={formErrors.namaBayi ? "border-red-500" : ""}
              />
              {formErrors.namaBayi && <p className="text-sm text-red-500">{formErrors.namaBayi}</p>}
            </div>

            {/* Tempat Lahir */}
            <div className="space-y-2">
              <Label>Tempat Lahir <span className="text-red-500">*</span></Label>
              <Input
                value={editForm.tempatLahir}
                onChange={(e) => handleEditInputChange("tempatLahir", e.target.value)}
                className={formErrors.tempatLahir ? "border-red-500" : ""}
              />
              {formErrors.tempatLahir && <p className="text-sm text-red-500">{formErrors.tempatLahir}</p>}
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-2">
              <Label>Tanggal Lahir <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={editForm.tanggalLahir}
                onChange={(e) => handleEditInputChange("tanggalLahir", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={formErrors.tanggalLahir ? "border-red-500" : ""}
              />
              {formErrors.tanggalLahir && <p className="text-sm text-red-500">{formErrors.tanggalLahir}</p>}
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-2">
              <Label>Jenis Kelamin <span className="text-red-500">*</span></Label>
              <Select value={editForm.jenisKelamin} onValueChange={(v) => handleEditInputChange("jenisKelamin", v)}>
                <SelectTrigger className={formErrors.jenisKelamin ? "border-red-500" : ""}>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                  <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.jenisKelamin && <p className="text-sm text-red-500">{formErrors.jenisKelamin}</p>}
            </div>

            {/* NIK Ibu */}
            <div className="space-y-2">
              <Label>NIK Ibu <span className="text-red-500">*</span></Label>
              <Input
                inputMode="numeric"
                maxLength={16}
                value={editForm.nikIbu}
                onChange={(e) => handleNIKChange(e.target.value)}
                className={`font-mono tracking-wider ${formErrors.nikIbu ? "border-red-500" : ""}`}
              />
              {formErrors.nikIbu ? (
                <p className="text-sm text-red-500">{formErrors.nikIbu}</p>
              ) : (
                <p className="text-xs text-slate-500">{editForm.nikIbu.length}/16 digit</p>
              )}
            </div>

            {/* Nama Ibu */}
            <div className="space-y-2">
              <Label>Nama Ibu <span className="text-red-500">*</span></Label>
              <Input
                value={editForm.namaIbu}
                onChange={(e) => handleEditInputChange("namaIbu", e.target.value)}
                className={formErrors.namaIbu ? "border-red-500" : ""}
              />
              {formErrors.namaIbu && <p className="text-sm text-red-500">{formErrors.namaIbu}</p>}
            </div>

            {/* Nama Ayah */}
            <div className="space-y-2">
              <Label>Nama Ayah <span className="text-red-500">*</span></Label>
              <Input
                value={editForm.namaAyah}
                onChange={(e) => handleEditInputChange("namaAyah", e.target.value)}
                className={formErrors.namaAyah ? "border-red-500" : ""}
              />
              {formErrors.namaAyah && <p className="text-sm text-red-500">{formErrors.namaAyah}</p>}
            </div>

            {/* Puskesmas */}
            <div className="space-y-2">
              <Label>Puskesmas</Label>
              <Input value={session?.user?.puskesmasNama || ""} disabled className="bg-slate-100" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Hapus Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data kelahiran <strong>{selectedRecord?.namaBayi}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
